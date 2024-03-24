import { printObjectItems } from "library/common/introspection";
import { log } from "library/common/logging";
import { createGameMessageWithNoSound } from "library/common/messages";
import { generateCellInSpiral } from "library/common/position-tools";
import { createPoint, createHordeColor, createResourcesAmount } from "library/common/primitives";
import { mergeFlags } from "library/dotnet/dotnet-utils";
import { spawnDecoration } from "library/game-logic/decoration-spawn";
import { isReplayMode } from "library/game-logic/game-tools";
import { UnitCommand, TileType, UnitFlags, UnitSpecification, UnitDeathType, UnitDirection, PointCommandArgs, Scena } from "library/game-logic/horde-types";
import { unitCanBePlacedByRealMap } from "library/game-logic/unit-and-map";
import { getUnitProfessionParams, UnitProfession, UnitProducerProfessionParams } from "library/game-logic/unit-professions";
import { spawnUnit, spawnUnits } from "library/game-logic/unit-spawn";
import { AssignOrderMode } from "library/mastermind/virtual-input";
import HordePluginBase from "plugins/base-plugin";

const PeopleIncomeLevelT = HCL.HordeClassLibrary.World.Settlements.Modules.Misc.PeopleIncomeLevel;

// оборачиваем все в пространство имен
//namespace CastleFight {
    /////////////////////////////////////////////////////////////////
    // вспомогательные функции
    /////////////////////////////////////////////////////////////////

    /** запретить управление юнитом */
    function DisallowedCommandsForUnit(unit: any) {
        var commandsMind       = unit.CommandsMind;
        var disallowedCommands = ScriptUtils.GetValue(commandsMind, "DisallowedCommands");
        disallowedCommands.Add(UnitCommand.MoveToPoint, 1);
        disallowedCommands.Add(UnitCommand.HoldPosition, 1);
        disallowedCommands.Add(UnitCommand.Attack, 1);
        disallowedCommands.Add(UnitCommand.Capture, 1);
        disallowedCommands.Add(UnitCommand.StepAway, 1);
        disallowedCommands.Add(UnitCommand.Cancel, 1);
    }
    /** разрешить управление юнитом */
    function AllowedCommandsForUnit(unit: any) {
        var commandsMind       = unit.CommandsMind;
        var disallowedCommands = ScriptUtils.GetValue(commandsMind, "DisallowedCommands");
        if (disallowedCommands.ContainsKey(UnitCommand.MoveToPoint)) disallowedCommands.Remove(UnitCommand.MoveToPoint);
        if (disallowedCommands.ContainsKey(UnitCommand.HoldPosition)) disallowedCommands.Remove(UnitCommand.HoldPosition);
        if (disallowedCommands.ContainsKey(UnitCommand.Attack)) disallowedCommands.Remove(UnitCommand.Attack);
        if (disallowedCommands.ContainsKey(UnitCommand.Capture)) disallowedCommands.Remove(UnitCommand.Capture);
        if (disallowedCommands.ContainsKey(UnitCommand.StepAway)) disallowedCommands.Remove(UnitCommand.StepAway);
        if (disallowedCommands.ContainsKey(UnitCommand.Cancel)) disallowedCommands.Remove(UnitCommand.Cancel);
    }
    /** расстояние L1 между 2 точками */ 
    function distanceBetweenPoints (x1:number, y1:number, x2:number, y2:number) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
    /** получить текущее время в миллисекундах */
    function getCurrentTime () {
        return new Date().getTime();
    }
    /** добавить профессию найма юнитов */
    function CfgAddUnitProducer(Cfg: any) {
        // даем профессию найм войнов при отсутствии
        if (!getUnitProfessionParams(Cfg, UnitProfession.UnitProducer)) {
            var donorCfg = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Barrack"));
            var prof_unitProducer = getUnitProfessionParams(donorCfg, UnitProfession.UnitProducer);
            Cfg.ProfessionParams.Item.set(UnitProfession.UnitProducer, prof_unitProducer);
            
            if (Cfg.BuildingConfig.EmergePoint == null) {
                ScriptUtils.SetValue(Cfg.BuildingConfig, "EmergePoint", createPoint(0, 0));
            }
            if (Cfg.BuildingConfig.EmergePoint2 == null) {
                ScriptUtils.SetValue(Cfg.BuildingConfig, "EmergePoint2", createPoint(0, 0));
            }
            HordeContentApi.RemoveConfig(donorCfg);
        }
    }
    /** отправить юнита в точку */
    function UnitGiveOrder (unitComponent: UnitComponent, point: Point, unitCommant: any, assignOrderMode: any) {
        AllowedCommandsForUnit(unitComponent.unit);
        // позиция для атаки цели
        var goalPosition;
        {
            var generator = generateCellInSpiral(point.X, point.Y);
            for (goalPosition = generator.next(); !goalPosition.done; goalPosition = generator.next()) {
                if (unitCanBePlacedByRealMap(world.configs[unitComponent.cfgId], goalPosition.value.X, goalPosition.value.Y)) {
                    break;
                }
            }
        }
        var pointCommandArgs = new PointCommandArgs(createPoint(goalPosition.value.X, goalPosition.value.Y), unitCommant, assignOrderMode);
        // отдаем приказ
        unitComponent.unit.Cfg.GetOrderDelegate(unitComponent.unit, pointCommandArgs);
        DisallowedCommandsForUnit(unitComponent.unit);
    }

    /////////////////////////////////////////////////////////////////
    // абстракции
    /////////////////////////////////////////////////////////////////

    class Point {
        X:number;
        Y:number;

        public constructor(X:number, Y:number) {
            this.X = X;
            this.Y = Y;
        };
    }

    /** полигон из точек по часовой стрелке! */
    class Polygon {
        // набор точек задающие полигон
        points: Array<Point>;

        public constructor(points:Array<Point>) {
            this.points = points;
        }

        /** флаг, что точка лежит внутри полигона */
        public IsPointInside(px:number, py:number) {
            if (this.points.length < 3) {
                return false;
            }

            var inside = true;
            for (var pointNum = 0, prevPointNum = this.points.length - 1;
                pointNum < this.points.length;
                prevPointNum = pointNum, pointNum++) {
                var vectorProduct = (this.points[pointNum].X - this.points[prevPointNum].X) * (py - this.points[prevPointNum].Y)
                    - (this.points[pointNum].Y - this.points[prevPointNum].Y) * (px - this.points[prevPointNum].X);

                if (vectorProduct < 0) {
                    inside = false;
                    break;
                }
            }

            return inside;
        }
    };

    class World {
        /** количество поселений */
        settlementsCount: number;
        /** ссылки на поселения, если не в игре, то будет null */
        settlements: Array<any>;
        /** для каждого поселения хранит список сущностей */
        settlements_entities: Array<Array<Entity>>;
        /** для каждого поселения хранится ссылка на главного замка */
        settlements_castleUnit: Array<any>;
        /** для каждого поселения хранится область вокруг главного замка, которую нужно охранять */
        settlements_field: Array<Polygon>;
        /** для каждого поселения хранится точка спавна рабочих */
        settlements_workers_revivePositions: Array<Array<Point>>;
        /** для каждого поселения хранится точка замка */
        settlements_castle_position: Array<Point>;
        /** таблица войны */
        settlements_settlements_warFlag: Array<Array<boolean>>;
        /** для каждого поселения хранится набор путей атаки */
        settlements_attack_paths: Array<Array<Array<Point>>>;
        
        /** флаг, что игра проинициализирована */
        gameInit: boolean;
        /** флаг, что игра закончена */
        gameEnd: boolean;

        /** массив конфигов */
        configs: any;
        /** для каждого Uid конфига хранит готовую ESC сущность */
        cfgUid_entity: Map<string, Entity>;

        /** для каждой системы хранит функцию */
        systems_func: Array<(gameTickNum: number)=>void>;
        /** для каждой системы хранит имя */
        systems_name: Array<string>;
        /** для каждой системы хранит время выполнения */
        systems_executionTime: Array<number>;

        /** реальная сцена */
        realScena: any;

        /** для каждого поселения хранит обработчик построенных юнитов */
        unitProducedCallbacks: Array<any>;

        /** параметры */
        castle_health_coeff: number;
        
        public constructor (
            )
        {
            this.gameInit      = false;
            this.gameEnd       = false;

            this.configs       = {};
            this.cfgUid_entity = new Map<string, Entity>();

            this.systems_func          = new Array<any>();
            this.systems_name          = new Array<string>();
            this.systems_executionTime = new Array<number>();

            this.castle_health_coeff = 1;
        }

        public Init(
            settlementsCount: number,
            settlements_field: Array<Polygon>,
            settlements_workers_revivePositions: Array<Array<Point>>,
            settlements_castle_position: Array<Point>,
            settlements_attack_paths: Array<Array<Array<Point>>>) {
            this.realScena                = ActiveScena.GetRealScena();

            this.settlementsCount         = settlementsCount;
            this.settlements              = new Array<any>(this.settlementsCount);
            this.settlements_entities     = new Array<Array<Entity>>(this.settlementsCount);
            this.settlements_castleUnit   = new Array<any>(this.settlementsCount);
            this.settlements_field        = settlements_field;
            this.settlements_workers_revivePositions = settlements_workers_revivePositions;
            this.settlements_castle_position         = settlements_castle_position;
            this.settlements_settlements_warFlag = new Array<Array<boolean>>(settlementsCount);
            this.settlements_attack_paths        = settlements_attack_paths;

            this.unitProducedCallbacks = new Array<any>(this.settlementsCount);

            for (var i = 0; i < this.settlementsCount; i++) {
                this.settlements[i] = null;
                this.settlements_entities[i] = new Array<Entity>();
                this.unitProducedCallbacks[i] = null;
                this.settlements_settlements_warFlag[i] = new Array<boolean>(settlementsCount);
            }

            this._InitConfigs();
            this._InitSettlements();
            this._PlaceCastle();

            //logi("сюда бы длину пути реальную RegisterUnitEntity");
        }

        private _InitConfigs() {
            ////////////////////
            // замок
            ////////////////////
    
            this.configs["castle"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_StoneCastle"));
            // запрещаем самоуничтожение
            this.configs["castle"].AllowedCommands.Remove(UnitCommand.DestroySelf);
            // убираем строительство
            this.configs["castle"].ProfessionParams.Remove(UnitProfession.UnitProducer);
            // убираем починку
            this.configs["castle"].ProfessionParams.Remove(UnitProfession.Reparable);
            // убираем ЗП
            ScriptUtils.SetValue(this.configs["castle"], "SalarySlots", 0);
            // здоровье
            ScriptUtils.SetValue(this.configs["castle"], "MaxHealth", 200000*this.castle_health_coeff);
            // броня
            ScriptUtils.SetValue(this.configs["castle"], "Shield", 200);

            ////////////////////
            // Стрельбище (лучник)
            ////////////////////
            
            // юнит
    
            this.configs["unit_1"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Archer"));
            // здоровье
            ScriptUtils.SetValue(this.configs["unit_1"], "MaxHealth", 1000);
            // броня
            ScriptUtils.SetValue(this.configs["unit_1"], "Shield", 0);
            // урон
            ScriptUtils.SetValue(this.configs["unit_1"].MainArmament.BulletCombatParams, "Damage", 400);
            // убираем стоимость
            ScriptUtils.SetValue(this.configs["unit_1"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["unit_1"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["unit_1"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["unit_1"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "unit_1"));
                entity.components.set(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT, new AttackingAlongPathComponent());
                entity.components.set(COMPONENT_TYPE.BUFFABLE_COMPONENT, new BuffableComponent());
                this.cfgUid_entity.set(this.configs["unit_1"].Uid, entity);
            }
    
            // баррак
            this.configs["barrack_1"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Sawmill"));
            // имя
            ScriptUtils.SetValue(this.configs["barrack_1"], "Name", "Стрельбище");
            // описание
            ScriptUtils.SetValue(this.configs["barrack_1"], "Description", "");
            // стоимость
            ScriptUtils.SetValue(this.configs["barrack_1"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["barrack_1"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["barrack_1"].CostResources, "Lumber", 100);
            ScriptUtils.SetValue(this.configs["barrack_1"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "barrack_1"));
                entity.components.set(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT, new SpawnBuildingComponent("unit_1", -1, 1500));
                entity.components.set(COMPONENT_TYPE.UPGRADABLE_BUILDING_COMPONENT,
                    new UpgradableBuildingComponent(
                        ["barrack_1_1", "barrack_1_2"],
                        ["#UnitConfig_Slavyane_Archer_2", "#UnitConfig_Slavyane_Crossbowman"]));
                this.cfgUid_entity.set(this.configs["barrack_1"].Uid, entity);
            }
    
            ////////////////////
            // Стрельбище -> Стрельбище огня (поджигатель)
            ////////////////////
            
            // юнит
    
            this.configs["unit_1_1"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Archer_2"));
            // здоровье
            ScriptUtils.SetValue(this.configs["unit_1_1"], "MaxHealth", 1000);
            // броня
            ScriptUtils.SetValue(this.configs["unit_1_1"], "Shield", 0);
            // урон
            ScriptUtils.SetValue(this.configs["unit_1_1"].MainArmament.BulletCombatParams, "Damage", 400);
            // убираем стоимость
            ScriptUtils.SetValue(this.configs["unit_1_1"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["unit_1_1"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["unit_1_1"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["unit_1_1"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "unit_1_1"));
                entity.components.set(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT, new AttackingAlongPathComponent());
                entity.components.set(COMPONENT_TYPE.BUFFABLE_COMPONENT, new BuffableComponent());
                this.cfgUid_entity.set(this.configs["unit_1_1"].Uid, entity);
            }
    
            // баррак
    
            this.configs["barrack_1_1"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Sawmill"));
            // имя
            ScriptUtils.SetValue(this.configs["barrack_1_1"], "Name", "Стрельбище огня");
            // описание
            ScriptUtils.SetValue(this.configs["barrack_1_1"], "Description", "");
            // стоимость
            ScriptUtils.SetValue(this.configs["barrack_1_1"].CostResources, "Gold",   100);
            ScriptUtils.SetValue(this.configs["barrack_1_1"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["barrack_1_1"].CostResources, "Lumber", 100);
            ScriptUtils.SetValue(this.configs["barrack_1_1"].CostResources, "People", 0);
            // меняем цвет
            ScriptUtils.SetValue(this.configs["barrack_1_1"], "TintColor", createHordeColor(255, 200, 0, 0));
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "barrack_1_1"));
                entity.components.set(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT, new SpawnBuildingComponent("unit_1_1", -1, 1500));
                entity.components.set(COMPONENT_TYPE.UPGRADABLE_BUILDING_COMPONENT,
                    new UpgradableBuildingComponent(
                        ["barrack_1_1_1", "barrack_1_1_2"],
                        ["#UnitConfig_Mage_Mag_2", "#UnitConfig_Slavyane_Balista"]));
                this.cfgUid_entity.set(this.configs["barrack_1_1"].Uid, entity);
            }
    
            ////////////////////
            // Стрельбище -> Стрельбище огня -> Лаборатория огня (фантом)
            ////////////////////
            
            // юнит
    
            this.configs["unit_1_1_1"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Mage_Mag_2"));
            // здоровье
            ScriptUtils.SetValue(this.configs["unit_1_1_1"], "MaxHealth", 500);
            // броня
            ScriptUtils.SetValue(this.configs["unit_1_1_1"], "Shield", 0);
            // урон
            ScriptUtils.SetValue(this.configs["unit_1_1_1"].MainArmament.BulletCombatParams, "Damage", 1000);
            // убираем стоимость
            ScriptUtils.SetValue(this.configs["unit_1_1_1"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["unit_1_1_1"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["unit_1_1_1"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["unit_1_1_1"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "unit_1_1_1"));
                entity.components.set(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT, new AttackingAlongPathComponent());
                entity.components.set(COMPONENT_TYPE.BUFFABLE_COMPONENT, new BuffableComponent());
                this.cfgUid_entity.set(this.configs["unit_1_1_1"].Uid, entity);
            }
    
            // здание
    
            this.configs["barrack_1_1_1"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Labor"));
            // имя
            ScriptUtils.SetValue(this.configs["barrack_1_1_1"], "Name", "Лаборатория огня");
            // описание
            ScriptUtils.SetValue(this.configs["barrack_1_1_1"], "Description", "");
            // стоимость
            ScriptUtils.SetValue(this.configs["barrack_1_1_1"].CostResources, "Gold",   100);
            ScriptUtils.SetValue(this.configs["barrack_1_1_1"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["barrack_1_1_1"].CostResources, "Lumber", 100);
            ScriptUtils.SetValue(this.configs["barrack_1_1_1"].CostResources, "People", 0);
            // меняем цвет
            ScriptUtils.SetValue(this.configs["barrack_1_1_1"], "TintColor", createHordeColor(255, 200, 0, 0));
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "barrack_1_1_1"));
                entity.components.set(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT, new SpawnBuildingComponent("unit_1_1_1", -1, 1500));
                entity.components.set(COMPONENT_TYPE.UPGRADABLE_BUILDING_COMPONENT,
                    new UpgradableBuildingComponent(
                        ["barrack_1_1_1_1", "barrack_1_1_1_2"],
                        ["#UnitConfig_Mage_Mag_16", "#UnitConfig_Mage_Olga"]));
                this.cfgUid_entity.set(this.configs["barrack_1_1_1"].Uid, entity);
            }
    
            ////////////////////
            // Стрельбище -> Стрельбище огня -> Лаборатория огня -> Приют мага огня (Икон)
            ////////////////////
            
            // юнит
    
            this.configs["unit_1_1_1_1"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Mage_Mag_16"));
            // здоровье
            ScriptUtils.SetValue(this.configs["unit_1_1_1_1"], "MaxHealth", 1000);
            // броня
            ScriptUtils.SetValue(this.configs["unit_1_1_1_1"], "Shield", 0);
            // урон
            ScriptUtils.SetValue(this.configs["unit_1_1_1_1"].MainArmament.BulletCombatParams, "Damage", 1000);
            // убираем стоимость
            ScriptUtils.SetValue(this.configs["unit_1_1_1_1"].CostResources, "Gold",   100);
            ScriptUtils.SetValue(this.configs["unit_1_1_1_1"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["unit_1_1_1_1"].CostResources, "Lumber", 100);
            ScriptUtils.SetValue(this.configs["unit_1_1_1_1"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "unit_1_1_1_1"));
                entity.components.set(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT, new AttackingAlongPathComponent());
                entity.components.set(COMPONENT_TYPE.BUFFABLE_COMPONENT, new BuffableComponent());
                this.cfgUid_entity.set(this.configs["unit_1_1_1_1"].Uid, entity);
            }
    
            // здание
    
            this.configs["barrack_1_1_1_1"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Mage_MageHouse"));
            // имя
            ScriptUtils.SetValue(this.configs["barrack_1_1_1_1"], "Name", "Приют мага огня");
            // описание
            ScriptUtils.SetValue(this.configs["barrack_1_1_1_1"], "Description", "");
            // стоимость
            ScriptUtils.SetValue(this.configs["barrack_1_1_1_1"].CostResources, "Gold",   100);
            ScriptUtils.SetValue(this.configs["barrack_1_1_1_1"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["barrack_1_1_1_1"].CostResources, "Lumber", 100);
            ScriptUtils.SetValue(this.configs["barrack_1_1_1_1"].CostResources, "People", 0);
            // меняем цвет
            ScriptUtils.SetValue(this.configs["barrack_1_1_1_1"], "TintColor", createHordeColor(255, 200, 0, 0));
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "barrack_1_1_1_1"));
                entity.components.set(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT, new SpawnBuildingComponent("unit_1_1_1_1", -1, 1500));
                this.cfgUid_entity.set(this.configs["barrack_1_1_1_1"].Uid, entity);
            }
    
            ////////////////////
            // Стрельбище -> Стрельбище огня -> Лаборатория огня -> Приют мага молний (Ольга)
            ////////////////////
            
            // юнит
    
            this.configs["unit_1_1_1_2"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Mage_Olga"));
            // здоровье
            ScriptUtils.SetValue(this.configs["unit_1_1_1_1"], "MaxHealth", 1000);
            // броня
            ScriptUtils.SetValue(this.configs["unit_1_1_1_1"], "Shield", 0);
            // урон
            ScriptUtils.SetValue(this.configs["unit_1_1_1_1"].MainArmament.BulletCombatParams, "Damage", 1000);
            // убираем стоимость
            ScriptUtils.SetValue(this.configs["unit_1_1_1_2"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["unit_1_1_1_2"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["unit_1_1_1_2"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["unit_1_1_1_2"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "unit_1_1_1_2"));
                entity.components.set(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT, new AttackingAlongPathComponent());
                entity.components.set(COMPONENT_TYPE.BUFFABLE_COMPONENT, new BuffableComponent());
                this.cfgUid_entity.set(this.configs["unit_1_1_1_2"].Uid, entity);
            }
    
            // здание
    
            this.configs["barrack_1_1_1_2"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Mage_MageHouse"));
            // имя
            ScriptUtils.SetValue(this.configs["barrack_1_1_1_2"], "Name", "Приют мага молний");
            // описание
            ScriptUtils.SetValue(this.configs["barrack_1_1_1_2"], "Description", "");
            // стоимость
            ScriptUtils.SetValue(this.configs["barrack_1_1_1_2"].CostResources, "Gold",   100);
            ScriptUtils.SetValue(this.configs["barrack_1_1_1_2"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["barrack_1_1_1_2"].CostResources, "Lumber", 100);
            ScriptUtils.SetValue(this.configs["barrack_1_1_1_2"].CostResources, "People", 0);
            // меняем цвет
            ScriptUtils.SetValue(this.configs["barrack_1_1_1_2"], "TintColor", createHordeColor(255, 27, 42, 207));
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "barrack_1_1_1_2"));
                entity.components.set(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT, new SpawnBuildingComponent("unit_1_1_1_2", -1, 1500));
                this.cfgUid_entity.set(this.configs["barrack_1_1_1_2"].Uid, entity);
            }
    
            ////////////////////
            // Стрельбище -> Стрельбище огня -> Завод огня (баллиста)
            ////////////////////
            
            // юнит
    
            this.configs["unit_1_1_2"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Balista"));
            // здоровье
            ScriptUtils.SetValue(this.configs["unit_1_1_2"], "MaxHealth", 2000);
            // броня
            ScriptUtils.SetValue(this.configs["unit_1_1_2"], "Shield", 300);
            // урон
            ScriptUtils.SetValue(this.configs["unit_1_1_2"].MainArmament.BulletCombatParams, "Damage", 1000);
            // убираем стоимость
            ScriptUtils.SetValue(this.configs["unit_1_1_2"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["unit_1_1_2"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["unit_1_1_2"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["unit_1_1_2"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "unit_1_1_2"));
                entity.components.set(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT, new AttackingAlongPathComponent());
                entity.components.set(COMPONENT_TYPE.BUFFABLE_COMPONENT, new BuffableComponent());
                this.cfgUid_entity.set(this.configs["unit_1_1_2"].Uid, entity);
            }
    
            // здание
    
            this.configs["barrack_1_1_2"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Factory"));
            // имя
            ScriptUtils.SetValue(this.configs["barrack_1_1_2"], "Name", "Завод огня");
            // описание
            ScriptUtils.SetValue(this.configs["barrack_1_1_2"], "Description", "");
            // стоимость
            ScriptUtils.SetValue(this.configs["barrack_1_1_2"].CostResources, "Gold",   100);
            ScriptUtils.SetValue(this.configs["barrack_1_1_2"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["barrack_1_1_2"].CostResources, "Lumber", 100);
            ScriptUtils.SetValue(this.configs["barrack_1_1_2"].CostResources, "People", 0);
            // меняем цвет
            ScriptUtils.SetValue(this.configs["barrack_1_1_2"], "TintColor", createHordeColor(255, 200, 0, 0));
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "barrack_1_1_2"));
                entity.components.set(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT, new SpawnBuildingComponent("unit_1_1_2", -1, 1500));
                this.cfgUid_entity.set(this.configs["barrack_1_1_2"].Uid, entity);
            }
    
            ////////////////////
            // Стрельбище -> Стрельбище металла (самостельщик)
            ////////////////////
            
            // юнит
    
            this.configs["unit_1_2"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Crossbowman"));
            // здоровье
            ScriptUtils.SetValue(this.configs["unit_1_2"], "MaxHealth", 1000);
            // броня
            ScriptUtils.SetValue(this.configs["unit_1_2"], "Shield", 100);
            // урон
            ScriptUtils.SetValue(this.configs["unit_1_2"].MainArmament.BulletCombatParams, "Damage", 500);
            // убираем стоимость
            ScriptUtils.SetValue(this.configs["unit_1_2"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["unit_1_2"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["unit_1_2"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["unit_1_2"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "unit_1_2"));
                entity.components.set(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT, new AttackingAlongPathComponent());
                entity.components.set(COMPONENT_TYPE.BUFFABLE_COMPONENT, new BuffableComponent());
                this.cfgUid_entity.set(this.configs["unit_1_2"].Uid, entity);
            }
    
            // баррак
    
            this.configs["barrack_1_2"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Sawmill"));
            // имя
            ScriptUtils.SetValue(this.configs["barrack_1_2"], "Name", "Стрельбище металла");
            // описание
            ScriptUtils.SetValue(this.configs["barrack_1_2"], "Description", "");
            // стоимость
            ScriptUtils.SetValue(this.configs["barrack_1_2"].CostResources, "Gold",   100);
            ScriptUtils.SetValue(this.configs["barrack_1_2"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["barrack_1_2"].CostResources, "Lumber", 100);
            ScriptUtils.SetValue(this.configs["barrack_1_2"].CostResources, "People", 0);
            // меняем цвет
            ScriptUtils.SetValue(this.configs["barrack_1_2"], "TintColor", createHordeColor(255, 170, 169, 173));
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "barrack_1_2"));
                entity.components.set(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT, new SpawnBuildingComponent("unit_1_2", -1, 1500));
                entity.components.set(COMPONENT_TYPE.UPGRADABLE_BUILDING_COMPONENT,
                    new UpgradableBuildingComponent(
                        ["barrack_1_2_1"],
                        ["#UnitConfig_Slavyane_Catapult"]));
                this.cfgUid_entity.set(this.configs["barrack_1_2"].Uid, entity);
            }
    
            ////////////////////
            // Стрельбище -> Стрельбище металла -> Завод металла (катапульта)
            ////////////////////
            
            // юнит
    
            this.configs["unit_1_2_1"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Catapult"));
            // здоровье
            ScriptUtils.SetValue(this.configs["unit_1_2_1"], "MaxHealth", 2000);
            // броня
            ScriptUtils.SetValue(this.configs["unit_1_2_1"], "Shield", 300);
            // урон
            ScriptUtils.SetValue(this.configs["unit_1_2_1"].MainArmament.BulletCombatParams, "Damage", 700);
            // убираем стоимость
            ScriptUtils.SetValue(this.configs["unit_1_2_1"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["unit_1_2_1"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["unit_1_2_1"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["unit_1_2_1"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "unit_1_2_1"));
                entity.components.set(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT, new AttackingAlongPathComponent());
                entity.components.set(COMPONENT_TYPE.BUFFABLE_COMPONENT, new BuffableComponent());
                this.cfgUid_entity.set(this.configs["unit_1_2_1"].Uid, entity);
            }
    
            // баррак
    
            this.configs["barrack_1_2_1"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Factory"));
            // имя
            ScriptUtils.SetValue(this.configs["barrack_1_2_1"], "Name", "Завод металла");
            // описание
            ScriptUtils.SetValue(this.configs["barrack_1_2_1"], "Description", "");
            // стоимость
            ScriptUtils.SetValue(this.configs["barrack_1_2_1"].CostResources, "Gold",   100);
            ScriptUtils.SetValue(this.configs["barrack_1_2_1"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["barrack_1_2_1"].CostResources, "Lumber", 100);
            ScriptUtils.SetValue(this.configs["barrack_1_2_1"].CostResources, "People", 0);
            // меняем цвет
            ScriptUtils.SetValue(this.configs["barrack_1_2_1"], "TintColor", createHordeColor(255, 170, 169, 173));
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "barrack_1_2_1"));
                entity.components.set(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT, new SpawnBuildingComponent("unit_1_2_1", -1, 1500));
                this.cfgUid_entity.set(this.configs["barrack_1_2_1"].Uid, entity);
            }
    
            ////////////////////
            // Казарма ополчения (рыцарь)
            ////////////////////
            
            // юнит
    
            this.configs["unit_2"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Swordmen"));
            // здоровье
            ScriptUtils.SetValue(this.configs["unit_2"], "MaxHealth", 1000);
            // броня
            ScriptUtils.SetValue(this.configs["unit_2"], "Shield", 0);
            // урон
            ScriptUtils.SetValue(this.configs["unit_2"].MainArmament.BulletCombatParams, "Damage", 500);
            // убираем стоимость
            ScriptUtils.SetValue(this.configs["unit_2"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["unit_2"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["unit_2"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["unit_2"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "unit_2"));
                entity.components.set(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT, new AttackingAlongPathComponent());
                entity.components.set(COMPONENT_TYPE.BUFFABLE_COMPONENT, new BuffableComponent());
                this.cfgUid_entity.set(this.configs["unit_2"].Uid, entity);
            }
    
            // баррак
    
            this.configs["barrack_2"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Farm"));
            // имя
            ScriptUtils.SetValue(this.configs["barrack_2"], "Name", "Казарма ополчения");
            // описание
            ScriptUtils.SetValue(this.configs["barrack_2"], "Description", "");
            // стоимость
            ScriptUtils.SetValue(this.configs["barrack_2"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["barrack_2"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["barrack_2"].CostResources, "Lumber", 100);
            ScriptUtils.SetValue(this.configs["barrack_2"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "barrack_2"));
                entity.components.set(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT, new SpawnBuildingComponent("unit_2", -1, 1500));
                entity.components.set(COMPONENT_TYPE.UPGRADABLE_BUILDING_COMPONENT,
                    new UpgradableBuildingComponent(
                        ["barrack_2_1", "barrack_2_2", "barrack_2_3"],
                        ["#UnitConfig_Slavyane_Heavymen", "#UnitConfig_Slavyane_Raider", "#UnitConfig_Mage_Skeleton"]));
                this.cfgUid_entity.set(this.configs["barrack_2"].Uid, entity);
            }
    
            ////////////////////
            // Казарма ополчения -> Казарма (тяжелый рыцарь)
            ////////////////////
            
            // юнит
    
            this.configs["unit_2_1"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Heavymen"));
            // здоровье
            ScriptUtils.SetValue(this.configs["unit_2_1"], "MaxHealth", 1500);
            // броня
            ScriptUtils.SetValue(this.configs["unit_2_1"], "Shield", 200);
            // урон
            ScriptUtils.SetValue(this.configs["unit_2_1"].MainArmament.BulletCombatParams, "Damage", 500);
            // убираем стоимость
            ScriptUtils.SetValue(this.configs["unit_2_1"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["unit_2_1"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["unit_2_1"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["unit_2_1"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "unit_2_1"));
                entity.components.set(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT, new AttackingAlongPathComponent());
                entity.components.set(COMPONENT_TYPE.BUFFABLE_COMPONENT, new BuffableComponent());
                this.cfgUid_entity.set(this.configs["unit_2_1"].Uid, entity);
            }
    
            // баррак
    
            this.configs["barrack_2_1"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Barrack"));
            // имя
            ScriptUtils.SetValue(this.configs["barrack_2_1"], "Name", "Казарма");
            // описание
            ScriptUtils.SetValue(this.configs["barrack_2_1"], "Description", "");
            // стоимость
            ScriptUtils.SetValue(this.configs["barrack_2_1"].CostResources, "Gold",   100);
            ScriptUtils.SetValue(this.configs["barrack_2_1"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["barrack_2_1"].CostResources, "Lumber", 100);
            ScriptUtils.SetValue(this.configs["barrack_2_1"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "barrack_2_1"));
                entity.components.set(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT, new SpawnBuildingComponent("unit_2_1", -1, 1500));
                entity.components.set(COMPONENT_TYPE.UPGRADABLE_BUILDING_COMPONENT,
                    new UpgradableBuildingComponent(
                        ["barrack_2_1_1", "barrack_2_1_2"],
                        ["#UnitConfig_Slavyane_FireforgedWarrior", "#UnitConfig_Slavyane_Beamman"]));
                this.cfgUid_entity.set(this.configs["barrack_2_1"].Uid, entity);
            }
    
            ////////////////////
            // Казарма ополчения -> Казарма -> Академия меча (паладин)
            ////////////////////
            
            // юнит
    
            this.configs["unit_2_1_1"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_FireforgedWarrior"));
            // здоровье
            ScriptUtils.SetValue(this.configs["unit_2_1_1"], "MaxHealth", 3000);
            // броня
            ScriptUtils.SetValue(this.configs["unit_2_1_1"], "Shield", 300);
            // урон
            ScriptUtils.SetValue(this.configs["unit_2_1_1"].MainArmament.BulletCombatParams, "Damage", 500);
            // убираем стоимость
            ScriptUtils.SetValue(this.configs["unit_2_1_1"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["unit_2_1_1"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["unit_2_1_1"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["unit_2_1_1"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "unit_2_1_1"));
                entity.components.set(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT, new AttackingAlongPathComponent());
                entity.components.set(COMPONENT_TYPE.BUFFABLE_COMPONENT, new BuffableComponent());
                this.cfgUid_entity.set(this.configs["unit_2_1_1"].Uid, entity);
            }
    
            // баррак
    
            this.configs["barrack_2_1_1"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_StoneBarrack"));
            // имя
            ScriptUtils.SetValue(this.configs["barrack_2_1_1"], "Name", "Академия меча");
            // описание
            ScriptUtils.SetValue(this.configs["barrack_2_1_1"], "Description", "");
            // стоимость
            ScriptUtils.SetValue(this.configs["barrack_2_1_1"].CostResources, "Gold",   100);
            ScriptUtils.SetValue(this.configs["barrack_2_1_1"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["barrack_2_1_1"].CostResources, "Lumber", 100);
            ScriptUtils.SetValue(this.configs["barrack_2_1_1"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "barrack_2_1_1"));
                entity.components.set(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT, new SpawnBuildingComponent("unit_2_1_1", -1, 1500));
                this.cfgUid_entity.set(this.configs["barrack_2_1_1"].Uid, entity);
            }
    
            ////////////////////
            // Казарма ополчения -> Казарма -> Аккадемия дубины (воин с дубиной)
            ////////////////////
            
            // юнит
    
            this.configs["unit_2_1_2"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Beamman"));
            // здоровье
            ScriptUtils.SetValue(this.configs["unit_2_1_2"], "MaxHealth", 3000);
            // броня
            ScriptUtils.SetValue(this.configs["unit_2_1_2"], "Shield", 100);
            // урон
            ScriptUtils.SetValue(this.configs["unit_2_1_2"].MainArmament.BulletCombatParams, "Damage", 600);
            // убираем стоимость
            ScriptUtils.SetValue(this.configs["unit_2_1_2"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["unit_2_1_2"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["unit_2_1_2"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["unit_2_1_2"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "unit_2_1_2"));
                entity.components.set(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT, new AttackingAlongPathComponent());
                entity.components.set(COMPONENT_TYPE.BUFFABLE_COMPONENT, new BuffableComponent());
                this.cfgUid_entity.set(this.configs["unit_2_1_2"].Uid, entity);
            }
    
            // баррак
    
            this.configs["barrack_2_1_2"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_StoneBarrack"));
            // имя
            ScriptUtils.SetValue(this.configs["barrack_2_1_2"], "Name", "Академия дубины");
            // описание
            ScriptUtils.SetValue(this.configs["barrack_2_1_2"], "Description", "");
            // стоимость
            ScriptUtils.SetValue(this.configs["barrack_2_1_2"].CostResources, "Gold",   100);
            ScriptUtils.SetValue(this.configs["barrack_2_1_2"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["barrack_2_1_2"].CostResources, "Lumber", 100);
            ScriptUtils.SetValue(this.configs["barrack_2_1_2"].CostResources, "People", 0);
            // меняем цвет
            ScriptUtils.SetValue(this.configs["barrack_2_1_2"], "TintColor", createHordeColor(255, 170, 107, 0));
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "barrack_2_1_2"));
                entity.components.set(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT, new SpawnBuildingComponent("unit_2_1_2", -1, 1500));
                this.cfgUid_entity.set(this.configs["barrack_2_1_2"].Uid, entity);
            }
    
            ////////////////////
            // Казарма ополчения -> Конюшня (всадник)
            ////////////////////
            
            // юнит
    
            this.configs["unit_2_2"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Raider"));
            // здоровье
            ScriptUtils.SetValue(this.configs["unit_2_2"], "MaxHealth", 2000);
            // броня
            ScriptUtils.SetValue(this.configs["unit_2_2"], "Shield", 0);
            // урон
            ScriptUtils.SetValue(this.configs["unit_2_2"].MainArmament.BulletCombatParams, "Damage", 500);
            // убираем стоимость
            ScriptUtils.SetValue(this.configs["unit_2_2"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["unit_2_2"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["unit_2_2"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["unit_2_2"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "unit_2_2"));
                entity.components.set(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT, new AttackingAlongPathComponent());
                entity.components.set(COMPONENT_TYPE.BUFFABLE_COMPONENT, new BuffableComponent());
                this.cfgUid_entity.set(this.configs["unit_2_2"].Uid, entity);
            }
    
            // баррак
    
            this.configs["barrack_2_2"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Stables"));
            // имя
            ScriptUtils.SetValue(this.configs["barrack_2_2"], "Name", "Конюшня");
            // описание
            ScriptUtils.SetValue(this.configs["barrack_2_2"], "Description", "");
            // стоимость
            ScriptUtils.SetValue(this.configs["barrack_2_2"].CostResources, "Gold",   100);
            ScriptUtils.SetValue(this.configs["barrack_2_2"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["barrack_2_2"].CostResources, "Lumber", 100);
            ScriptUtils.SetValue(this.configs["barrack_2_2"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "barrack_2_2"));
                entity.components.set(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT, new SpawnBuildingComponent("unit_2_2", -1, 1500));
                this.cfgUid_entity.set(this.configs["barrack_2_2"].Uid, entity);
            }
    
            ////////////////////
            // Казарма ополчения -> Казарма нежити (скелет)
            ////////////////////
            
            // юнит
    
            this.configs["unit_2_3"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Mage_Skeleton"));
            // здоровье
            ScriptUtils.SetValue(this.configs["unit_2_3"], "MaxHealth", 1500);
            // броня
            ScriptUtils.SetValue(this.configs["unit_2_3"], "Shield", 0);
            // урон
            ScriptUtils.SetValue(this.configs["unit_2_3"].MainArmament.BulletCombatParams, "Damage", 500);
            // убираем стоимость
            ScriptUtils.SetValue(this.configs["unit_2_3"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["unit_2_3"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["unit_2_3"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["unit_2_3"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "unit_2_3"));
                entity.components.set(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT, new AttackingAlongPathComponent());
                entity.components.set(COMPONENT_TYPE.BUFFABLE_COMPONENT, new BuffableComponent());
                this.cfgUid_entity.set(this.configs["unit_2_3"].Uid, entity);
            }
    
            // баррак
    
            this.configs["barrack_2_3"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Barrack"));
            // имя
            ScriptUtils.SetValue(this.configs["barrack_2_3"], "Name", "Казарма нежити");
            // описание
            ScriptUtils.SetValue(this.configs["barrack_2_3"], "Description", "");
            // стоимость
            ScriptUtils.SetValue(this.configs["barrack_2_3"].CostResources, "Gold",   100);
            ScriptUtils.SetValue(this.configs["barrack_2_3"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["barrack_2_3"].CostResources, "Lumber", 100);
            ScriptUtils.SetValue(this.configs["barrack_2_3"].CostResources, "People", 0);
            // меняем цвет
            ScriptUtils.SetValue(this.configs["barrack_2_3"], "TintColor", createHordeColor(255, 203, 3, 247));
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "barrack_2_3"));
                entity.components.set(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT, new SpawnBuildingComponent("unit_2_3", -1, 1500));
                entity.components.set(COMPONENT_TYPE.UPGRADABLE_BUILDING_COMPONENT,
                    new UpgradableBuildingComponent(
                        ["barrack_2_3_1"],
                        ["#UnitConfig_Mage_Minotaur"]));
                this.cfgUid_entity.set(this.configs["barrack_2_3"].Uid, entity);
            }
    
            ////////////////////
            // Казарма ополчения -> Казарма нежити -> Кузница нежити (Минотавр)
            ////////////////////
            
            // юнит
    
            this.configs["unit_2_3_1"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Mage_Minotaur"));
            // здоровье
            ScriptUtils.SetValue(this.configs["unit_2_3_1"], "MaxHealth", 4000);
            // броня
            ScriptUtils.SetValue(this.configs["unit_2_3_1"], "Shield", 0);
            // урон
            ScriptUtils.SetValue(this.configs["unit_2_3_1"].MainArmament.BulletCombatParams, "Damage", 500);
            // убираем стоимость
            ScriptUtils.SetValue(this.configs["unit_2_3_1"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["unit_2_3_1"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["unit_2_3_1"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["unit_2_3_1"].CostResources, "People", 0);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "unit_2_3_1"));
                entity.components.set(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT, new AttackingAlongPathComponent());
                entity.components.set(COMPONENT_TYPE.BUFFABLE_COMPONENT, new BuffableComponent());
                this.cfgUid_entity.set(this.configs["unit_2_3_1"].Uid, entity);
            }
    
            // баррак
    
            this.configs["barrack_2_3_1"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_StoneBarrack"));
            // имя
            ScriptUtils.SetValue(this.configs["barrack_2_3_1"], "Name", "Кузница нежити");
            // описание
            ScriptUtils.SetValue(this.configs["barrack_2_3_1"], "Description", "");
            // стоимость
            ScriptUtils.SetValue(this.configs["barrack_2_3_1"].CostResources, "Gold",   100);
            ScriptUtils.SetValue(this.configs["barrack_2_3_1"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["barrack_2_3_1"].CostResources, "Lumber", 100);
            ScriptUtils.SetValue(this.configs["barrack_2_3_1"].CostResources, "People", 0);
            // меняем цвет
            ScriptUtils.SetValue(this.configs["barrack_2_3_1"], "TintColor", createHordeColor(255, 203, 3, 247));
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "barrack_2_3_1"));
                entity.components.set(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT, new SpawnBuildingComponent("unit_2_3_1", -1, 1500));
                this.cfgUid_entity.set(this.configs["barrack_2_3_1"].Uid, entity);
            }
    
            ////////////////////
            // башня
            ////////////////////
    
            // this.configs["tower_1"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Tower"));
            // // имя
            // ScriptUtils.SetValue(this.configs["tower_1"], "Name", "Башня");
            // // описание
            // ScriptUtils.SetValue(this.configs["tower_1"], "Description", "Просто бьет врагов.");
            // // здоровье
            // ScriptUtils.SetValue(this.configs["tower_1"], "MaxHealth", 60000);
            // // броня
            // ScriptUtils.SetValue(this.configs["tower_1"], "Shield", 300);
            // // делаем урон = 0
            // ScriptUtils.SetValue(this.configs["tower_1"].MainArmament.BulletCombatParams, "Damage", 600);
            // // стоимость
            // ScriptUtils.SetValue(this.configs["tower_1"].CostResources, "Gold",   400);
            // ScriptUtils.SetValue(this.configs["tower_1"].CostResources, "Metal",  0);
            // ScriptUtils.SetValue(this.configs["tower_1"].CostResources, "Lumber", 400);
            // ScriptUtils.SetValue(this.configs["tower_1"].CostResources, "People", 0);
            // {
            //     var entity : Entity = new Entity();
            //     entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "tower_1"));
            //     entity.components.set(COMPONENT_TYPE.BUFFABLE_COMPONENT, new BuffableComponent());
            //     this.cfgUid_entity.set(this.configs["tower_1"].Uid, entity);
            // }
    
            ////////////////////
            // мельница - сундук сокровищ
            ////////////////////
    
            // this.configs["treasure_chest"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Mill"));
            // // имя
            // ScriptUtils.SetValue(this.configs["treasure_chest"], "Name", "Мельница сокровищ");
            // // описание
            // ScriptUtils.SetValue(this.configs["treasure_chest"], "Description", "Увеличивает инком. Первая на 25%, вторая на 21.25%, третья на 18.06%");
            // // стоимость
            // ScriptUtils.SetValue(this.configs["treasure_chest"].CostResources, "Gold",   350);
            // ScriptUtils.SetValue(this.configs["treasure_chest"].CostResources, "Metal",  0);
            // ScriptUtils.SetValue(this.configs["treasure_chest"].CostResources, "Lumber", 500);
            // ScriptUtils.SetValue(this.configs["treasure_chest"].CostResources, "People", 0);
            // {
            //     var entity : Entity = new Entity();
            //     entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "treasure_chest"));
            //     entity.components.set(COMPONENT_TYPE.INCOME_INCREASE_COMPONENT, new IncomeIncreaseComponent());
            //     this.cfgUid_entity.set(this.configs["treasure_chest"].Uid, entity);
            // }
    
            ////////////////////
            // церковь - место для заклинаний и баффов
            ////////////////////
            
            // святой дух - атаки
    
            this.configs["holy_spirit_attack"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Raider"));
            // имя
            ScriptUtils.SetValue(this.configs["holy_spirit_attack"], "Name", "Святой дух атаки");
            // описание
            ScriptUtils.SetValue(this.configs["holy_spirit_attack"], "Description", "Тот кого ударит данный дух, получит его силу.");
            // здоровье
            ScriptUtils.SetValue(this.configs["holy_spirit_attack"], "MaxHealth", 1);
            // ставим стоимость
            ScriptUtils.SetValue(this.configs["holy_spirit_attack"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["holy_spirit_attack"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["holy_spirit_attack"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["holy_spirit_attack"].CostResources, "People", 0);
            // делаем урон = 0
            ScriptUtils.SetValue(this.configs["holy_spirit_attack"].MainArmament.BulletCombatParams, "Damage", 0);
            // меняем цвет
            ScriptUtils.SetValue(this.configs["holy_spirit_attack"], "TintColor", createHordeColor(150, 150, 0, 0));
            // время постройки
            ScriptUtils.SetValue(this.configs["holy_spirit_attack"], "ProductionTime", 1500);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "holy_spirit_attack"));
                entity.components.set(COMPONENT_TYPE.BUFF_COMPONENT, new BuffComponent(BUFF_TYPE.ATTACK));
                this.cfgUid_entity.set(this.configs["holy_spirit_attack"].Uid, entity);
            }
    
            // святой дух - здоровья
    
            this.configs["holy_spirit_health"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Raider"));
            // имя
            ScriptUtils.SetValue(this.configs["holy_spirit_health"], "Name", "Святой дух здоровья");
            // описание
            ScriptUtils.SetValue(this.configs["holy_spirit_health"], "Description", "Тот кого ударит данный дух, получит его силу.");
            // здоровье
            ScriptUtils.SetValue(this.configs["holy_spirit_health"], "MaxHealth", 1);
            // ставим стоимость
            ScriptUtils.SetValue(this.configs["holy_spirit_health"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["holy_spirit_health"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["holy_spirit_health"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["holy_spirit_health"].CostResources, "People", 0);
            // делаем урон = 0
            ScriptUtils.SetValue(this.configs["holy_spirit_health"].MainArmament.BulletCombatParams, "Damage", 0);
            // меняем цвет
            ScriptUtils.SetValue(this.configs["holy_spirit_health"], "TintColor", createHordeColor(150, 0, 150, 0));
            // время постройки
            ScriptUtils.SetValue(this.configs["holy_spirit_health"], "ProductionTime", 1500);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "holy_spirit_health"));
                entity.components.set(COMPONENT_TYPE.BUFF_COMPONENT, new BuffComponent(BUFF_TYPE.HEALTH));
                this.cfgUid_entity.set(this.configs["holy_spirit_health"].Uid, entity);
            }
    
            // святой дух - защиты
    
            this.configs["holy_spirit_defense"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Raider"));
            // имя
            ScriptUtils.SetValue(this.configs["holy_spirit_defense"], "Name", "Святой дух защиты");
            // описание
            ScriptUtils.SetValue(this.configs["holy_spirit_defense"], "Description", "Тот кого ударит данный дух, получит его силу.");
            // здоровье
            ScriptUtils.SetValue(this.configs["holy_spirit_defense"], "MaxHealth", 1);
            // ставим стоимость
            ScriptUtils.SetValue(this.configs["holy_spirit_defense"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["holy_spirit_defense"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["holy_spirit_defense"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["holy_spirit_defense"].CostResources, "People", 0);
            // делаем урон = 0
            ScriptUtils.SetValue(this.configs["holy_spirit_defense"].MainArmament.BulletCombatParams, "Damage", 0);
            // меняем цвет
            ScriptUtils.SetValue(this.configs["holy_spirit_defense"], "TintColor", createHordeColor(150, 255, 215, 0));
            // время постройки
            ScriptUtils.SetValue(this.configs["holy_spirit_defense"], "ProductionTime", 1500);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "holy_spirit_defense"));
                entity.components.set(COMPONENT_TYPE.BUFF_COMPONENT, new BuffComponent(BUFF_TYPE.DEFFENSE));
                this.cfgUid_entity.set(this.configs["holy_spirit_defense"].Uid, entity);
            }
    
            // святой дух - клонирования
    
            this.configs["holy_spirit_cloning"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Raider"));
            // имя
            ScriptUtils.SetValue(this.configs["holy_spirit_cloning"], "Name", "Святой дух клонирования");
            // описание
            ScriptUtils.SetValue(this.configs["holy_spirit_cloning"], "Description", "Тот кого ударит данный дух, получит его силу.");
            // здоровье
            ScriptUtils.SetValue(this.configs["holy_spirit_cloning"], "MaxHealth", 1);
            // ставим стоимость
            ScriptUtils.SetValue(this.configs["holy_spirit_cloning"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["holy_spirit_cloning"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["holy_spirit_cloning"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["holy_spirit_cloning"].CostResources, "People", 0);
            // делаем урон = 0
            ScriptUtils.SetValue(this.configs["holy_spirit_cloning"].MainArmament.BulletCombatParams, "Damage", 0);
            // меняем цвет
            ScriptUtils.SetValue(this.configs["holy_spirit_cloning"], "TintColor", createHordeColor(150, 255, 255, 255));
            // время постройки
            ScriptUtils.SetValue(this.configs["holy_spirit_cloning"], "ProductionTime", 1500);
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "holy_spirit_cloning"));
                entity.components.set(COMPONENT_TYPE.BUFF_COMPONENT, new BuffComponent(BUFF_TYPE.CLONING));
                this.cfgUid_entity.set(this.configs["holy_spirit_cloning"].Uid, entity);
            }
    
            // здание
    
            this.configs["church"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Church"));
            // имя
            ScriptUtils.SetValue(this.configs["church"], "Name", "Церковь");
            // описание
            ScriptUtils.SetValue(this.configs["church"], "Description", "Святое место, позволяющее заполучить силу святого духа.");
            // стоимость
            ScriptUtils.SetValue(this.configs["church"].CostResources, "Gold",   500);
            ScriptUtils.SetValue(this.configs["church"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["church"].CostResources, "Lumber", 500);
            ScriptUtils.SetValue(this.configs["church"].CostResources, "People", 0);
            {
                // даем профессию найма юнитов
                CfgAddUnitProducer(this.configs["church"]);
    
                // очищаем список тренировки
                var producerParams = this.configs["church"].GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
                var produceList    = producerParams.CanProduceList;
                produceList.Clear();
    
                // добавляем святые духи
                produceList.Add(this.configs["holy_spirit_attack"]);
                produceList.Add(this.configs["holy_spirit_health"]);
                produceList.Add(this.configs["holy_spirit_defense"]);
                produceList.Add(this.configs["holy_spirit_cloning"]);
            }
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "church"));
                this.cfgUid_entity.set(this.configs["church"].Uid, entity);
            }

            ////////////////////
            // Алтарь героя
            ////////////////////
            
            // герой - лучник - unit_1
            // this.configs["hero_unit_1"] = HordeContentApi.CloneConfig(world.configs["unit_1"]);
            // {
            //     var entity : Entity = new Entity();
            //     entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "hero_altar"));
            //     entity.components.set(COMPONENT_TYPE.HERO_ALTAR_COMPONENT,
            //         new HeroAltarComponent(["unit_1", "unit_2"]));
            //     this.cfgUid_entity.set(this.configs["hero_altar"].Uid, entity);
            // }

            // // алтарь

            // // на UnitConfig_Slavyane_HeroAltar есть ограничение в 1 штуку, поэтому клонировать нельзя
            // this.configs["hero_altar"] = HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_HeroAltar");
            // // имя
            // ScriptUtils.SetValue(this.configs["hero_altar"], "Name", "Алтарь героя");
            // // описание
            // ScriptUtils.SetValue(this.configs["hero_altar"], "Description", "Место, где можно создать уникального героя. Герой прокачивается за убийства. Героем можно управлять с помощью места сбора алтаря героя.");
            // // стоимость
            // ScriptUtils.SetValue(this.configs["hero_altar"].CostResources, "Gold",   300);
            // ScriptUtils.SetValue(this.configs["hero_altar"].CostResources, "Metal",  0);
            // ScriptUtils.SetValue(this.configs["hero_altar"].CostResources, "Lumber", 300);
            // ScriptUtils.SetValue(this.configs["hero_altar"].CostResources, "People", 0);
            // {
            //     var entity : Entity = new Entity();
            //     entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "hero_altar"));
            //     entity.components.set(COMPONENT_TYPE.HERO_ALTAR_COMPONENT,
            //         new HeroAltarComponent(["unit_1", "unit_2"]));
            //     this.cfgUid_entity.set(this.configs["hero_altar"].Uid, entity);
            // }

            ////////////////////
            // юнит для сброса таймера спавна
            ////////////////////
    
            // юнит-сброс таймера спавна
            this.configs["reset_spawn"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Swordmen"));
            // имя
            ScriptUtils.SetValue(this.configs["reset_spawn"], "Name", "Перезапустить найм");
            // описание
            ScriptUtils.SetValue(this.configs["reset_spawn"], "Description", "Перезапустить найм юнитов. Юниты будут наняты через обычное время с перезапуска.");
            // стоимость
            ScriptUtils.SetValue(this.configs["reset_spawn"].CostResources, "Gold",   0);
            ScriptUtils.SetValue(this.configs["reset_spawn"].CostResources, "Metal",  0);
            ScriptUtils.SetValue(this.configs["reset_spawn"].CostResources, "Lumber", 0);
            ScriptUtils.SetValue(this.configs["reset_spawn"].CostResources, "People", 0);
            // время постройки
            ScriptUtils.SetValue(this.configs["reset_spawn"], "ProductionTime", 5000);
    
            ////////////////////
            // рабочий
            ////////////////////
    
            this.configs["worker"] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Worker1"));
            // устанавливаем имя
            ScriptUtils.SetValue(this.configs["worker"], "Name", "Работяга");
            // удаляем команду атаки
            this.configs["worker"].AllowedCommands.Remove(UnitCommand.Attack);
            // убираем ЗП
            ScriptUtils.SetValue(this.configs["worker"], "SalarySlots", 0);
            // число людей
            //ScriptUtils.SetValue(this.configs["worker"].CostResources, "People", 10000);
            ScriptUtils.SetValue(this.configs["worker"].CostResources, "People", 0);
            // убираем профессию добычу
            if (this.configs["worker"].ProfessionParams.ContainsKey(UnitProfession.Harvester)) {
                this.configs["worker"].ProfessionParams.Remove(UnitProfession.Harvester);
            }
            
            // добавляем постройки
            {
                var producerParams = this.configs["worker"].GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
                var produceList    = producerParams.CanProduceList;
                produceList.Clear();
                produceList.Add(this.configs["barrack_1"]);
                produceList.Add(this.configs["barrack_2"]);
    
                produceList.Add(this.configs["church"]);

                //produceList.Add(this.configs["hero_altar"]);
            }
            {
                var entity : Entity = new Entity();
                entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "worker"));
                entity.components.set(COMPONENT_TYPE.REVIVE_COMPONENT, new ReviveComponent(new Point(0,0), 500, -1));
                this.cfgUid_entity.set(this.configs["worker"].Uid, entity);
            }

            ////////////////////
            // убираем дружественный огонь
            ////////////////////

            for (var cfgId in this.configs) {
                if (this.configs[cfgId].MainArmament) {
                    //log.info(this.configs[cfgId].Name, " friend fire off, bullet = ", this.configs[cfgId].MainArmament.BulletConfig.Uid);
                    var bulletCfg = HordeContentApi.GetBulletConfig(this.configs[cfgId].MainArmament.BulletConfig.Uid);
                    ScriptUtils.SetValue(bulletCfg, "CanDamageAllied", false);
                }
            }

            ////////////////////
            // устанавливаем скорость юнитов
            ////////////////////
    
            /** скорость бега пехоты */
            var infantrySpeed = new Map<TileType, number>();
            infantrySpeed.set(TileType.Grass, 10);
            infantrySpeed.set(TileType.Forest, 6);
            infantrySpeed.set(TileType.Water, 0);
            infantrySpeed.set(TileType.Marsh, 7);
            infantrySpeed.set(TileType.Sand, 8);
            infantrySpeed.set(TileType.Mounts, 0);
            infantrySpeed.set(TileType.Road, 13);
            infantrySpeed.set(TileType.Ice, 10);
    
            var machineSpeed = new Map<TileType, number>();
            machineSpeed.set(TileType.Grass, 10);
            machineSpeed.set(TileType.Water, 0);
            machineSpeed.set(TileType.Marsh, 7);
            machineSpeed.set(TileType.Sand, 8);
            machineSpeed.set(TileType.Mounts, 0);
            machineSpeed.set(TileType.Road, 13);
            machineSpeed.set(TileType.Ice, 10);
            const setSpeedForCfg = (cfg: any, speeds: Map<TileType, number>) => {
                var tileTypes = speeds.keys();
                for (var tileType = tileTypes.next(); !tileType.done; tileType = tileTypes.next()) {
                    cfg.Speeds.Item.set(tileType.value, speeds.get(tileType.value));
                }
            };
            for (var cfgId in this.configs) {
                if (!this.configs[cfgId].Flags.HasFlag(UnitFlags.Building) &&
                    !this.configs[cfgId].Specification.HasFlag(UnitSpecification.Rider)) {
                    if (this.configs[cfgId].Specification.HasFlag(UnitSpecification.Machine)) {
                        setSpeedForCfg(this.configs[cfgId], machineSpeed);
                    } else {
                        setSpeedForCfg(this.configs[cfgId], infantrySpeed);
                    }
                }
            }
    
            ////////////////////
            // общие параметры для всех зданий
            ////////////////////
            
            for (var cfgId in this.configs) {
                // убираем захват
                if (this.configs[cfgId].ProfessionParams.ContainsKey(UnitProfession.Capturable)) {
                    this.configs[cfgId].ProfessionParams.Remove(UnitProfession.Capturable);
                }
                
                // убираем требования
                this.configs[cfgId].TechConfig.Requirements.Clear();
                // убираем производство людей
                ScriptUtils.SetValue(this.configs[cfgId], "ProducedPeople", 0);
                // убираем налоги
                ScriptUtils.SetValue(this.configs[cfgId], "SalarySlots", 0);
                // если это здание, то даем имунн
                if (this.configs[cfgId].Flags.HasFlag(UnitFlags.Building)) {
                    ScriptUtils.SetValue(this.configs[cfgId], "Flags", mergeFlags(UnitFlags, this.configs[cfgId].Flags, UnitFlags.FireResistant, UnitFlags.MagicResistant));
                    if (cfgId != "castle" && cfgId != "tower_1") {
                        // здоровье
                        ScriptUtils.SetValue(this.configs[cfgId], "MaxHealth", 30000);
                        // броня
                        ScriptUtils.SetValue(this.configs[cfgId], "Shield", 0);
                    }
                }
    
                // проверяем наличие ECS сущности для конфига
                if (this.cfgUid_entity.has(this.configs[cfgId].Uid)) {
                    var entity = this.cfgUid_entity.get(this.configs[cfgId].Uid) as Entity;
    
                    // проверка, что нужно добавить профессию найма и сбросить список
                    if (entity.components.has(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT) ||
                        entity.components.has(COMPONENT_TYPE.UPGRADABLE_BUILDING_COMPONENT) ||
                        entity.components.has(COMPONENT_TYPE.HERO_ALTAR_COMPONENT)) {
                        
                        // даем профессию найма юнитов
                        CfgAddUnitProducer(this.configs[cfgId]);
    
                        // очищаем список тренировки
                        var producerParams = this.configs[cfgId].GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
                        var produceList    = producerParams.CanProduceList;
                        produceList.Clear();
                    }
    
                    // проверка, что это здание, которое спавнит мобов
                    if (entity.components.has(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT)) {
                        var spawnBuildingComponent = entity.components.get(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT) as SpawnBuildingComponent;
    
                        // добавляем сброс таймера
                        var producerParams = this.configs[cfgId].GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
                        var produceList    = producerParams.CanProduceList;
                        produceList.Add(this.configs["reset_spawn"]);
    
                        // время постройки
                        ScriptUtils.SetValue(this.configs[cfgId], "ProductionTime", 500);
    
                        // Добавляем в описание здание информацию о юните
                        var spawnUnitCfg = this.configs[spawnBuildingComponent.spawnUnitConfigId];
                        ScriptUtils.SetValue(this.configs[cfgId], "Description", this.configs[cfgId].Description + "Тренирует: " + 
                            spawnUnitCfg.Name + "\n" +
                            "  здоровье " + spawnUnitCfg.MaxHealth + "\n" +
                            "  броня " + spawnUnitCfg.Shield + "\n" +
                            "  атака " + spawnUnitCfg.MainArmament.BulletCombatParams.Damage + "\n" +
                            "  радиус атаки " + spawnUnitCfg.MainArmament.Range + "\n" +
                            "  скорость бега " + spawnUnitCfg.Speeds.Item(TileType.Grass) + "\n"
                            + (spawnUnitCfg.Flags.HasFlag(UnitFlags.FireResistant) || spawnUnitCfg.Flags.HasFlag(UnitFlags.MagicResistant)
                                ? "  иммунитет к " + (spawnUnitCfg.Flags.HasFlag(UnitFlags.FireResistant) ? "огню " : "") + 
                                    (spawnUnitCfg.Flags.HasFlag(UnitFlags.MagicResistant) ? "магии " : "") + "\n"
                                : ""));
                    }

                    // проверка, что здание это алтарь героя
                    if (entity.components.has(COMPONENT_TYPE.HERO_ALTAR_COMPONENT)) {
                        var heroAltarComponent = entity.components.get(COMPONENT_TYPE.HERO_ALTAR_COMPONENT) as HeroAltarComponent;

                        // добавляем героев на выбор
                        var producerParams = this.configs[cfgId].GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
                        var produceList    = producerParams.CanProduceList;

                        for (var heroCfgId of heroAltarComponent.heroesCfgIdxs) {
                            produceList.Add(this.configs[heroCfgId]);
                        }
                    }
    
                    // проверка, что здание разово приносит доход
                    if (entity.components.has(COMPONENT_TYPE.INCOME_EVENT)) {
                        var incomeComponent = entity.components.get(COMPONENT_TYPE.INCOME_EVENT) as IncomeEvent;
                        
                        ScriptUtils.SetValue(this.configs[cfgId], "Description", this.configs[cfgId].Description + "Разово дает " +
                            (incomeComponent.metal > 0 ? incomeComponent.metal + " железа" : "") +
                            (incomeComponent.gold > 0 ? incomeComponent.gold + " золота" : "") +
                            (incomeComponent.lumber > 0 ? incomeComponent.lumber + " дерева" : "") +
                            (incomeComponent.people > 0 ? incomeComponent.people + " людей" : "") + "\n");
                    }
    
                    // проверка, что здание увеличивает инком
                    if (entity.components.has(COMPONENT_TYPE.INCOME_INCREASE_EVENT)) {
                        var incomeComponent = entity.components.get(COMPONENT_TYPE.INCOME_INCREASE_EVENT) as IncomeIncreaseEvent;
                        
                        ScriptUtils.SetValue(this.configs[cfgId], "Description", this.configs[cfgId].Description + "Увеличивает доход на " +
                            (incomeComponent.metal > 0 ? incomeComponent.metal + " железа" : "") +
                            (incomeComponent.gold > 0 ? incomeComponent.gold + " золота" : "") +
                            (incomeComponent.lumber > 0 ? incomeComponent.lumber + " дерева" : "") + "\n");
                    }
                }
            }
    
            // рекурсивно создаем дерево исследования
            var recurciveUpgradeInfoFlag : Map<string, boolean> = new Map<string, boolean>();
            const recurciveUpgradeInfoStr = (cfgId: string, shiftStr: string) => {
                if (recurciveUpgradeInfoFlag.has(cfgId)) {
                    return "";
                } else {
                    recurciveUpgradeInfoFlag.set(cfgId, true);
                }
    
                var resStr = "";
                if (this.cfgUid_entity.has(this.configs[cfgId].Uid)) {
                    var entity = this.cfgUid_entity.get(this.configs[cfgId].Uid) as Entity;
                    if (entity.components.has(COMPONENT_TYPE.UPGRADABLE_BUILDING_COMPONENT)) {
                        var upgradableBuildingComponent = entity.components.get(COMPONENT_TYPE.UPGRADABLE_BUILDING_COMPONENT) as UpgradableBuildingComponent;    
                        for (var num = 0; num < upgradableBuildingComponent.upgradeCfgIds.length; num++) {
                            var upgradeCfgId     = upgradableBuildingComponent.upgradeCfgIds[num];
                            var upgradeUnitCfgId = upgradableBuildingComponent.upgradeUnitCfgIds[num];     
    
                            resStr += shiftStr + this.configs[upgradeCfgId].Name + "\n";
                            var res2Str = recurciveUpgradeInfoStr(upgradeCfgId, shiftStr + "    ");
                            if (res2Str != "") {
                                resStr += res2Str;
                            }
    
                            // на основе переданного конфига в компоненте создаем новый
                            // и заменяем старый на новый
                            var newUpgradeUnitCfgId = cfgId + "_to_" + upgradeCfgId;
                            this.configs[newUpgradeUnitCfgId] = HordeContentApi.CloneConfig(HordeContentApi.GetUnitConfig(upgradeUnitCfgId));
                            upgradeUnitCfgId = newUpgradeUnitCfgId;
                            upgradableBuildingComponent.upgradeUnitCfgIds[num] = newUpgradeUnitCfgId;
                            // имя
                            ScriptUtils.SetValue(this.configs[upgradeUnitCfgId], "Name", "Улучшить до " + this.configs[upgradeCfgId].Name);
                            // описание
                            ScriptUtils.SetValue(this.configs[upgradeUnitCfgId], "Description", this.configs[upgradeCfgId].Description);
                            // стоимость
                            ScriptUtils.SetValue(this.configs[upgradeUnitCfgId].CostResources, "Gold",   this.configs[upgradeCfgId].CostResources.Gold);
                            ScriptUtils.SetValue(this.configs[upgradeUnitCfgId].CostResources, "Metal",  this.configs[upgradeCfgId].CostResources.Metal);
                            ScriptUtils.SetValue(this.configs[upgradeUnitCfgId].CostResources, "Lumber", this.configs[upgradeCfgId].CostResources.Lumber);
                            ScriptUtils.SetValue(this.configs[upgradeUnitCfgId].CostResources, "People", this.configs[upgradeCfgId].CostResources.People);
                            // убираем требования
                            this.configs[upgradeUnitCfgId].TechConfig.Requirements.Clear();
                            // ставим долгую постройку
                            ScriptUtils.SetValue(this.configs[upgradeUnitCfgId], "ProductionTime", 500);
                            
                            // добавляем конфиг улучшения
                            var producerParams = this.configs[cfgId].GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
                            var produceList    = producerParams.CanProduceList;
                            produceList.Add(this.configs[upgradeUnitCfgId]);
                        }
                        ScriptUtils.SetValue(this.configs[cfgId], "Description", this.configs[cfgId].Description + "\nМожно улучшить до " + resStr);
                    }
                }
                return resStr;
            };
            for (var cfgId in this.configs) {
                recurciveUpgradeInfoStr(cfgId, "");
            }
        }

        private _InitSettlements () {
            for (var playerId = 0; playerId < Players.length; playerId++) {
                var realPlayer    = Players[playerId].GetRealPlayer();
                var settlement    = realPlayer.GetRealSettlement();
                var settlementId  = settlement.Uid;
    
                if (isReplayMode() && !realPlayer.IsReplay) {
                    continue;
                }
    
                // проверяем, что это игрок
                if (settlementId >= this.settlementsCount) {
                    continue;
                }
    
                // если поселение неинициализировано, то инициализируем
                if (this.settlements[settlementId] == null) {
                    this.settlements[settlementId] = settlement;
    
                    // создаем сущность для поселения
                    {
                        // полное количество дерева на игрока
                        var totalLumberPerPlayer = 4800;
                        // время за которое будет выдано все дерево
                        var totalLumberTime      = 50*60*20;
    
                        // полное количество золото которое должно быть выдано к определенному моменту времени
                        var goldPerPlayer   = 3600;
                        // время к которому должно быть выдано столько золота
                        var goldTime        = totalLumberTime * 1.5;
    
                        var entity = new Entity();
                        entity.components.set(COMPONENT_TYPE.SETTLEMENT_COMPONENT, new SettlementComponent(0, 100, 0, goldTime / goldPerPlayer * 100, 0));
                        entity.components.set(COMPONENT_TYPE.INCOME_EVENT, new IncomeEvent(0, 0, 200, 1));
                        entity.components.set(COMPONENT_TYPE.INCOME_LIMITED_PERIODICAL_COMPONENT,
                            new IncomeLimitedPeriodicalComponent(0, 0, totalLumberPerPlayer, 0, 0, 100, totalLumberTime / totalLumberPerPlayer * 100, 0))
                        this.settlements_entities[settlementId].push(entity);
                    }

                    // Отключить прирост населения
                    let censusModel = ScriptUtils.GetValue(settlement.Census, "Model");
                    censusModel.PeopleIncomeLevels.Clear();
                    censusModel.PeopleIncomeLevels.Add(new PeopleIncomeLevelT(0, 0, -1));
                    censusModel.LastPeopleIncomeLevel = 0;
                }

                // создаем сущность для рабочего для каждого игрока
                for (var workerNum = 0; workerNum < this.settlements_workers_revivePositions[settlementId].length; workerNum++) 
                {
                    var baseEntity = this.cfgUid_entity.get(this.configs["worker"].Uid) as Entity;
                    var entity     = baseEntity.Clone();
                    var reviveComponent   = entity.components.get(COMPONENT_TYPE.REVIVE_COMPONENT) as ReviveComponent;
                    reviveComponent.point = this.settlements_workers_revivePositions[settlementId][workerNum];
                    reviveComponent.waitingToRevive = true;
                    this.settlements_entities[settlementId].push(entity);
                }
            }
    
            for (var settlementId = 0; settlementId < this.settlementsCount; settlementId++) {
                if (this.settlements[settlementId] == null) {
                    continue;
                }

                var that = this;
                // добавляем обработчик создания юнитов
                this.unitProducedCallbacks[settlementId] =
                    this.settlements[settlementId].Units.UnitProduced.connect(function (sender, UnitProducedEventArgs) {
                        try {
                            // создаем событие - постройку юнита
                            var event_entity = new Entity();
                            event_entity.components.set(COMPONENT_TYPE.UNIT_PRODUCED_EVENT, new UnitProducedEvent(UnitProducedEventArgs.ProducerUnit, UnitProducedEventArgs.Unit));
                            that.settlements_entities[UnitProducedEventArgs.ProducerUnit.Owner.Uid].push(event_entity);
                        } catch (ex) {
                            log.exception(ex);
                        }
                    });
    
                // удаляем лишних юнитов на карте
                var units = this.settlements[settlementId].Units;
                var enumerator = units.GetEnumerator();
                while(enumerator.MoveNext()) {
                    var battleMind = enumerator.Current.BattleMind;
                    battleMind.InstantDeath(null, UnitDeathType.Mele);
                    break;
                }
                enumerator.Dispose();

                // заполняем таблицу альянсов
                for (var other_settlementId = 0; other_settlementId < this.settlementsCount; other_settlementId++) {
                    if (other_settlementId == settlementId) {
                        this.settlements_settlements_warFlag[settlementId][other_settlementId] = false;
                    } else {
                        this.settlements_settlements_warFlag[settlementId][other_settlementId]
                            = this.settlements[settlementId].Diplomacy.IsWarStatus(this.settlements[other_settlementId]);
                    }
                }

                // убираем налоги
                var censusModel = ScriptUtils.GetValue(this.settlements[settlementId].Census, "Model");
                // Установить период сбора налогов и выплаты жалования (чтобы отключить сбор, необходимо установить 0)
                censusModel.TaxAndSalaryUpdatePeriod = 0;
            }

            // for (var settlementId = 0; settlementId < this.settlementsCount; settlementId++) {
            //     logi(settlementId);
            //     for (var other_settlementId = 0; other_settlementId < this.settlementsCount; other_settlementId++) {
            //         logi(other_settlementId, " ", this.settlements_settlements_warFlag[settlementId][other_settlementId]);
            //     }
            //     logi("\n");
            // }
        }
    
        private _PlaceCastle() {
            var unitsMap        = this.realScena.UnitsMap;

            for (var settlementId = 0; settlementId < this.settlementsCount; settlementId++) {
                // проверяем, что поселение в игре
                if (!this.settlements[settlementId]) {
                    continue;
                }

                var castleUnit = unitsMap.GetUpperUnit(this.settlements_castle_position[settlementId].X, this.settlements_castle_position[settlementId].Y);
                if (castleUnit) {
                    this.settlements_castleUnit[settlementId] = castleUnit;                    
                } else {
                    this.settlements_castleUnit[settlementId] = spawnUnit(
                        this.settlements[settlementId],
                        this.configs["castle"],
                        createPoint(this.settlements_castle_position[settlementId].X, this.settlements_castle_position[settlementId].Y),
                        UnitDirection.Down
                    );
                }
            }
        }

        public IsSettlementInGame (settlementId: number) {
            return this.settlements[settlementId] &&
                this.settlements_castleUnit[settlementId] &&
                !this.settlements_castleUnit[settlementId].IsDead;
        }

        /** загеристрировать систему */
        public RegisterSystem(system_func: (gameTickNum: number)=>void, system_name: string) {
            this.systems_func.push(system_func);
            this.systems_name.push(system_name);
            this.systems_executionTime.push(0.0);
        }

        /** запустить следующую систему */
        public RunSystems(gameTickNum: number) {
            var systemId = gameTickNum % Math.max(50, this.systems_func.length);
            if (this.systems_func.length <= systemId) {
                return;
            }

            var time : number = getCurrentTime();

            this.systems_func[systemId](gameTickNum);
            
            time = getCurrentTime() - time;
            this.systems_executionTime[systemId] += time;
        }

        /** вывести статистику времени выполнения */
        public PrintTimeStat() {
            var statStr : string = "";
            for (var settlementId = 0; settlementId < this.settlementsCount; settlementId++) {
                statStr += "settlement " + settlementId + ", entities " + this.settlements_entities[settlementId].length + "\n";
            }
            for (var systemId = 0; systemId < this.systems_func.length; systemId++) {
                statStr += systemId + " " + this.systems_name[systemId] + " : " + this.systems_executionTime[systemId] + " milliseconds\n";
            }
            log.info(statStr);
        }

        /**
         * зарегистрировать в мире сущность для юнита, также идет автозаполнение компонентов в зависимости от поселения
         * @param unit юнит для которого нужно зарегистрировать сущность
         * @param baseEntity базовая сущность, на основе которого будет создана новая (если нет, то берется по умолчанию)
         * @returns вернет ссылку на сущность юнита
         */
        public RegisterUnitEntity(unit: any, baseEntity?: Entity) {
            var settlementId = unit.Owner.Uid;

            // создаем сущность
            var newEntity : Entity;

            if (baseEntity == undefined) {
                baseEntity = world.cfgUid_entity.get(unit.Cfg.Uid) as Entity;
            }
            newEntity = baseEntity.Clone();

            // настройка
            if (newEntity.components.has(COMPONENT_TYPE.UNIT_COMPONENT)) {
                var newEntity_unitComponent = newEntity.components.get(COMPONENT_TYPE.UNIT_COMPONENT) as UnitComponent;
                newEntity_unitComponent.unit = unit;
            }

            // если это здание, то запрещаем самоуничтожение
            if (unit.Cfg.IsBuilding) {
                var commandsMind       = unit.CommandsMind;
                var disallowedCommands = ScriptUtils.GetValue(commandsMind, "DisallowedCommands");
                disallowedCommands.Add(UnitCommand.DestroySelf, 1);
            }
            
            // регистрируем сущность
            world.settlements_entities[settlementId].push(newEntity);

            return newEntity;
        }
    }

    class Entity {
        /** компоненты */
        components: Map<COMPONENT_TYPE, IComponent>;

        public constructor() {
            this.components = new Map<COMPONENT_TYPE, IComponent>();
        }
        
        /** клонировать сущность */
        public Clone() : Entity {
            var entity = new Entity();
            for (var componentNum = 0; componentNum < COMPONENT_TYPE.SIZE; componentNum++) {
                var componentType : COMPONENT_TYPE = componentNum;
                var component = this.components.get(componentType);
                if (!component) {
                    continue;
                }
                entity.components.set(componentType, component.Clone());
            }

            return entity;
        }

        public Print(depth: number) {
            if (depth < 0) {
                return;
            }
            for (var componentNum = 0; componentNum < COMPONENT_TYPE.SIZE; componentNum++) {
                var componentType : COMPONENT_TYPE = componentNum;
                if (!this.components.has(componentType)) {
                    continue;
                }
                log.info("имеется компонент ", componentType.toString());
                if (depth > 0) {
                    printObjectItems(this.components.get(componentType), depth - 1);
                }
            }
        }
    };

    enum COMPONENT_TYPE {
        UNIT_COMPONENT = 0,
        SPAWN_BUILDING_COMPONENT,
        ATTACKING_ALONG_PATH_COMPONENT,
        SETTLEMENT_COMPONENT,
        REVIVE_COMPONENT,
        UPGRADABLE_BUILDING_COMPONENT,
        BUFFABLE_COMPONENT,
        BUFF_COMPONENT,

        HERO_COMPONENT,
        HERO_ALTAR_COMPONENT,

        INCOME_INCREASE_COMPONENT,
        INCOME_LIMITED_PERIODICAL_COMPONENT,
        /**
         * событие разового дохода
         */ 
        INCOME_EVENT,
        INCOME_INCREASE_EVENT,
        UPGRADABLE_BUILDING_EVENT,
        BUFF_EVENT,
        UNIT_PRODUCED_EVENT,

        SIZE
    }; 

    class IComponent {
        /** ид компонента */
        id: COMPONENT_TYPE;

        public constructor(id:COMPONENT_TYPE) {
            this.id = id;
        }

        public Clone() : IComponent {
            return new IComponent(this.id);
        }
    };

    class UnitComponent extends IComponent {
        /** ссылка на юнита */
        unit: any;
        /** ссылка на конфиг */
        cfgId: string;

        public constructor(unit:any, cfgId: string) {
            super(COMPONENT_TYPE.UNIT_COMPONENT);
            this.unit = unit;
            this.cfgId = cfgId;
        }

        public Clone(): UnitComponent {
            return new UnitComponent(this.unit, this.cfgId);
        }
    };

    class SpawnBuildingComponent extends IComponent {
        /** ид конфига юнита */
        spawnUnitConfigId: string;
        /** такт с которого нужно спавнить юнитов */
        spawnTact: number;
        /** частота спавна в тактах */
        spawnPeriodTact: number

        public constructor(spawnUnitConfigId: string, spawnTact: number, spawnPeriodTact: number) {
            super(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT);

            this.spawnUnitConfigId = spawnUnitConfigId;
            this.spawnTact         = spawnTact;
            this.spawnPeriodTact   = spawnPeriodTact;
        }

        public Clone(): SpawnBuildingComponent {
            return new SpawnBuildingComponent(this.spawnUnitConfigId, this.spawnTact, this.spawnPeriodTact);
        }
    }

    class AttackingAlongPathComponent extends IComponent {
        /** путь атаки */
        attackPath: Array<Point>;
        /** номер точки в которую нужно сейчас идти */
        currentPathPointNum: number;

        public constructor(attackPath?: Array<Point>, currentPathPointNum?: number) {
            super(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT);

            if (attackPath) {
                this.attackPath = attackPath;
            }
            if (currentPathPointNum) {
                this.currentPathPointNum = currentPathPointNum;
            } else {
                this.currentPathPointNum = 0;
            }
        }

        public Clone(): AttackingAlongPathComponent {
            return new AttackingAlongPathComponent(this.attackPath, this.currentPathPointNum);
        }
    }

    /**
     * событие разового дохода
     */ 
    class IncomeEvent extends IComponent {
        /** доход железа */
        metal: number;
        /** доход золота */
        gold: number;
        /** доход дерева */
        lumber: number;
        /** доход населения */
        people: number;

        public constructor(metal:number, gold:number, lumber:number, people: number) {
            super(COMPONENT_TYPE.INCOME_EVENT);

            this.metal  = metal;
            this.gold   = gold;
            this.lumber = lumber;
            this.people = people;
        }

        public Clone(): IncomeEvent {
            return new IncomeEvent(this.metal, this.gold, this.lumber, this.people);
        }
    }

    /** событие разового увеличение пассивного дохода поселения */
    class IncomeIncreaseEvent extends IComponent {
        /** увеличение дохода железа */
        metal: number;
        /** увеличение дохода золота */
        gold: number;
        /** увеличение дохода дерева */
        lumber: number;

        public constructor(metal:number, gold:number, lumber:number) {
            super(COMPONENT_TYPE.INCOME_INCREASE_EVENT);

            this.metal = metal;
            this.gold = gold;
            this.lumber = lumber;
        }

        public Clone(): IncomeIncreaseEvent {
            return new IncomeIncreaseEvent(this.metal, this.gold, this.lumber);
        }
    }

    /** компонент увеличивающий в процентах пассивный доход поселения */
    class IncomeIncreaseComponent extends IComponent {
        public constructor() {
            super(COMPONENT_TYPE.INCOME_INCREASE_COMPONENT);
        }

        public Clone(): IncomeIncreaseComponent {
            return new IncomeIncreaseComponent();
        }
    }

    /** компонент ограниченного дохода */
    class IncomeLimitedPeriodicalComponent extends IComponent {
        /** всего железа */
        totalMetal: number;
        /** всего золота */
        totalGold: number;
        /** всего дерева */
        totalLumber: number;

        /** железа в период */
        metal: number;
        /** золота в период */
        gold: number;
        /** дерева в период */
        lumber: number;

        /** период прихода инкома */
        periodTacts: number;
        /** такт получения следующего инкома */
        tact: number;

        public constructor(totalMetal: number, totalGold: number, totalLumber: number, metal: number, gold: number,
                           lumber: number, periodTacts: number, tact: number) {
            super(COMPONENT_TYPE.INCOME_LIMITED_PERIODICAL_COMPONENT);

            this.totalMetal  = totalMetal;
            this.totalGold   = totalGold;
            this.totalLumber = totalLumber;
            this.metal       = metal;
            this.gold        = gold;
            this.lumber      = lumber;
            this.periodTacts = periodTacts;
            this.tact        = tact;
        }

        public Clone() : IncomeLimitedPeriodicalComponent {
            return new IncomeLimitedPeriodicalComponent(this.totalMetal,
                this.totalGold,
                this.totalLumber,
                this.metal,
                this.gold,
                this.lumber,
                this.periodTacts,
                this.tact);
        }
    };

    class SettlementComponent extends IComponent {        
        /** пассивный доход железа */
        incomeMetal: number;
        /** пассивный доход золота */
        incomeGold: number;
        /** пассивный доход дерева */
        incomeLumber: number;
        /** сколько ждать тактов для начисления пассивного дохода */
        incomeWaitTacts: number;
        /** такт пассивного дохода */
        incomeTact: number;

        public constructor(
            incomeMetal:number,
            incomeGold:number,
            incomeLumber:number,
            incomeWaitTacts: number,
            incomeTact:number) {
            super(COMPONENT_TYPE.SETTLEMENT_COMPONENT);

            this.incomeMetal  = incomeMetal;
            this.incomeGold   = incomeGold;
            this.incomeLumber = incomeLumber;
            this.incomeWaitTacts = incomeWaitTacts;
            this.incomeTact   = incomeTact;
        }

        public Clone() : SettlementComponent {
            throw "Cant Clone SettlementComponent";
        }
    }

    class ReviveComponent extends IComponent {
        /** точка - места респа рабочего */
        point: Point;
        /** время возрождения */
        reviveTicks: number;
        /** время когда рабочего нужно реснуть */
        tick: number;
        /** флаг, что юнит ждет респа */
        waitingToRevive: boolean;
        
        public constructor(point: Point, reviveTicks: number, tick: number) {
            super(COMPONENT_TYPE.REVIVE_COMPONENT);

            this.point           = point;
            this.reviveTicks     = reviveTicks;
            this.tick            = tick;
            this.waitingToRevive = false;
        }

        public Clone() : ReviveComponent {
            return new ReviveComponent(this.point, this.reviveTicks, this.tick);
        }
    }

    class UpgradableBuildingComponent extends IComponent {
        /** список ид конфигов, в которые здание можно улучшить */
        upgradeCfgIds: Array<string>;
        /** список ид конфигов, которые нужно построить чтобы получить соответствующие улучшение */
        upgradeUnitCfgIds: Array<string>;

        public constructor(upgradeCfgIds: Array<string>, upgradeUnitCfgIds: Array<string>) {
            super(COMPONENT_TYPE.UPGRADABLE_BUILDING_COMPONENT);

            this.upgradeCfgIds = upgradeCfgIds;
            this.upgradeUnitCfgIds = upgradeUnitCfgIds;
        }

        public Clone(): UpgradableBuildingComponent {
            return new UpgradableBuildingComponent(this.upgradeCfgIds, this.upgradeUnitCfgIds);
        }
    }

    class UpgradableBuildingEvent extends IComponent {
        /** ид конфига нового здания */
        upgradeCfgId: string;
        /** место спавна */
        spawnPoint: Point;

        public constructor(upgradeCfgId: string, spawnPoint: Point) {
            super(COMPONENT_TYPE.UPGRADABLE_BUILDING_EVENT);

            this.upgradeCfgId = upgradeCfgId;
            this.spawnPoint   = spawnPoint;
        }

        public Clone(): UpgradableBuildingEvent {
            return new UpgradableBuildingEvent(this.upgradeCfgId, this.spawnPoint);
        }
    }

    /** тип баффа */
    enum BUFF_TYPE {
        ATTACK = 0,
        HEALTH,
        DEFFENSE,
        CLONING,
        EMPTY
    };

    /** Компонент с информацией о текущем бафе, его наличие означает, что юнита можно баффать */
    class BuffableComponent extends IComponent {
        /** тип наложенного баффа на юнита */
        buffType: BUFF_TYPE;
        /** баффнутый Cfg */
        buffCfg: any;

        public constructor(buffType?: BUFF_TYPE, buffCfg?: any) {
            super(COMPONENT_TYPE.BUFFABLE_COMPONENT);

            if (buffType) {
                this.buffType = buffType;
            } else {
                this.buffType = BUFF_TYPE.EMPTY;
            }
            if (buffCfg) {
                this.buffCfg = buffCfg;
            } else {
                this.buffCfg = null;
            }
        }

        public Clone() : BuffableComponent {
            return new BuffableComponent(this.buffType, this.buffCfg);
        }
    }

    /** Компонент, что юнит может баффать BuffableComponent */
    class BuffComponent extends IComponent {
        /** тип баффа */
        buffType: BUFF_TYPE;

        public constructor(buffType: BUFF_TYPE) {
            super(COMPONENT_TYPE.BUFF_COMPONENT);

            this.buffType = buffType;
        }

        public Clone() : BuffComponent {
            return new BuffComponent(this.buffType);
        }
    }

    /** компонент героя */
    class HeroComponent extends IComponent {
        /** ссылка на алтарь */
        heroAltarEntity: Entity;
        /** количество убийств */
        kills: number;
        /** текущий уровень */
        level: number;

        public constructor (heroAltarEntity?: Entity) {
            super(COMPONENT_TYPE.HERO_COMPONENT);

            if (heroAltarEntity) {
                this.heroAltarEntity = heroAltarEntity;
            }
        }

        public Clone() : HeroComponent {
            return new HeroComponent(this.heroAltarEntity);
        }
    };

    /** Компонент для алтаря героя */
    class HeroAltarComponent extends IComponent {
        /** список ид всех героев */
        heroesCfgIdxs: Array<string>;
        /** номер выбранного героя */
        selectedHeroNum: number;
        /** ссылка на героя */
        heroEntity: Entity;

        public constructor (heroesCfgIdxs: Array<string>, selectedHeroNum?: number, heroEntity?: Entity) {
            super(COMPONENT_TYPE.HERO_ALTAR_COMPONENT);

            this.heroesCfgIdxs = heroesCfgIdxs;
            if (selectedHeroNum) {
                this.selectedHeroNum = selectedHeroNum;
            } else {
                this.selectedHeroNum = -1;
            }
            if (heroEntity) {
                this.heroEntity = heroEntity;
            }
        }

        public Clone() : HeroAltarComponent {
            return new HeroAltarComponent(this.heroesCfgIdxs, this.selectedHeroNum, this.heroEntity);
        }
    };

    class BuffEvent extends IComponent {
        /** тип баффа */
        buffType: BUFF_TYPE;
        /** позиция баффнутого юнита */
        pos: Point;
        /** конфиг баффнутого юнита */
        cfgId: string;
        /** ид поселения */
        settlementId: number;
        /** копия сущности баффнутого юнита */
        entity: Entity;

        public constructor(buffType: BUFF_TYPE, pos: Point, cfgId: string, settlementId: number, entity: Entity) {
            super(COMPONENT_TYPE.BUFF_EVENT);

            this.buffType     = buffType;
            this.pos          = pos;
            this.cfgId        = cfgId;
            this.settlementId = settlementId;
            this.entity       = entity;
        }

        public Clone() : BuffEvent {
            return new BuffEvent(this.buffType, this.pos, this.cfgId, this.settlementId, this.entity);
        }
    }

    class UnitProducedEvent extends IComponent {
        /** ссылка на юнита-строителя */
        producerUnit: any;
        /** ссылка на построенного юнита */
        producedUnit: any;

        public constructor(producerUnit: any, producedUnit: any) {
            super(COMPONENT_TYPE.UNIT_PRODUCED_EVENT);

            this.producerUnit = producerUnit;
            this.producedUnit = producedUnit;
        }

        public Clone() : UnitProducedEvent {
            return new UnitProducedEvent(this.producerUnit, this.producedUnit);
        }
    }

    /////////////////////////////////////////////////////////////////
    // данные игры
    /////////////////////////////////////////////////////////////////

    var world = new World();

    /////////////////////////////////////////////////////////////////
    // системы
    /////////////////////////////////////////////////////////////////

    function CheckGameEndSystem(gameTickNum: number) {
        if (!world.gameInit || world.gameEnd || gameTickNum % 49 != 0) {
            return world.gameEnd;
        }

        // присуждаем поражение альянсам
        for (var settlementId = 0; settlementId < world.settlementsCount; settlementId++) {
            // проверка, что замок есть и поселение в игре
            if (!world.settlements[settlementId] ||
                !world.settlements_castleUnit[settlementId]) {
                continue;
            }

            // проверяем, что у всего альянса замки уничтожены
            var isDefeat = true;
            for (var other_settlementId = 0; other_settlementId < world.settlementsCount; other_settlementId++) {
                // проверка, что есть мир
                if (world.settlements_settlements_warFlag[settlementId][other_settlementId]) {
                    continue;
                }
                
                // проверка, что замок стоит
                if (!world.settlements[other_settlementId] ||
                    !world.settlements_castleUnit[other_settlementId] ||
                    world.settlements_castleUnit[other_settlementId].IsDead) {
                    continue;
                }

                // нашелся союзник с целым замком
                isDefeat = false;
                break;
            }

            if (!isDefeat) {
                continue;
            }

            // присуждаем поражение всему альянсу
            for (var other_settlementId = 0; other_settlementId < world.settlementsCount; other_settlementId++) {
                // проверка, что есть мир
                if (world.settlements_settlements_warFlag[settlementId][other_settlementId]) {
                    continue;
                }
                // проверка, что поселение в игре
                if (!world.settlements[other_settlementId]) {
                    continue;
                }

                // объявляем альянс всем врагам для видимости
                for (var _settlementId = 0; _settlementId < world.settlementsCount; _settlementId++) {
                    if (!world.settlements[_settlementId] || 
                        !world.settlements_settlements_warFlag[other_settlementId][_settlementId]) {
                        continue;
                    }
                    world.settlements[other_settlementId].Diplomacy.DeclareAlliance(world.settlements[_settlementId]);
                    world.settlements[_settlementId].Diplomacy.DeclareAlliance(world.settlements[other_settlementId]);
                }

                // убиваем всех юнитов
                // for (var i = 0; i < world.settlements_entities[other_settlementId].length; i++) {
                //     var entity = world.settlements_entities[other_settlementId][i];
                //     if (!entity.components.has(COMPONENT_TYPE.UNIT_COMPONENT)) {
                //         continue;
                //     }
                //     var unitComponent = entity.components.get(COMPONENT_TYPE.UNIT_COMPONENT) as UnitComponent;

                //     if (!unitComponent.unit || unitComponent.unit.IsDead) {
                //         continue;
                //     }

                //     var battleMind = unitComponent.unit.BattleMind;
                //     battleMind.InstantDeath(null, UnitDeathType.Mele);
                // }
                // // удаляем замок
                // world.settlements_castleUnit[other_settlementId] = null;
                // присуждаем поражение
                world.settlements[other_settlementId].Existence.ForceTotalDefeat();
            }
        }

        // присуждаем победу последнему альянсу
        for (var settlementId = 0; settlementId < world.settlementsCount; settlementId++) {
            // проверка, что замок есть и поселение в игре
            if (!world.settlements[settlementId] ||
                !world.settlements_castleUnit[settlementId]) {
                continue;
            }

            var isVictory = true;
            for (var other_settlementId = 0; other_settlementId < world.settlementsCount; other_settlementId++) {
                // проверка, что есть война
                if (!world.settlements_settlements_warFlag[settlementId][other_settlementId]) {
                    continue;
                }
                // проверка, что замок стоит
                if (!world.settlements[other_settlementId] ||
                    !world.settlements_castleUnit[other_settlementId] ||
                    world.settlements_castleUnit[other_settlementId].IsDead) {
                    continue;
                }

                // нашелся враг с целым замком
                isVictory = false;
                break;
            }

            if (!isVictory) {
                continue;
            }

            // присуждаем победу всему альянсу
            for (var other_settlementId = 0; other_settlementId < world.settlementsCount; other_settlementId++) {
                // проверка, что есть мир
                if (world.settlements_settlements_warFlag[settlementId][other_settlementId]) {
                    continue;
                }
                // проверка, что поселение в игре
                if (!world.settlements[other_settlementId]) {
                    continue;
                }
                
                // удаляем замок
                world.settlements_castleUnit[other_settlementId] = null;
                // присуждаем победу
                world.settlements[other_settlementId].Existence.ForceVictory();
            }

            world.gameEnd = true;
            break;
        }

        // если игра закончилась, то удаляем все конфиги
        if (world.gameEnd) {
            for (var cfgId in world.configs) {
                HordeContentApi.RemoveConfig(world.configs[cfgId]);
            }
        }

        return world.gameEnd;
    }

    function WordClearSystem(gameTickNum: number) {
        for (var settlementId = 0; settlementId < world.settlementsCount; settlementId++) {
            // проверяем уничтожение замка
            if (world.settlements[settlementId] &&
                world.settlements_castleUnit[settlementId] &&
                world.settlements_castleUnit[settlementId].IsDead) {
                // убиваем всех юнитов
                for (var i = 0; i < world.settlements_entities[settlementId].length; i++) {
                    var entity = world.settlements_entities[settlementId][i];
                    if (!entity.components.has(COMPONENT_TYPE.UNIT_COMPONENT)) {
                        continue;
                    }
                    var unitComponent = entity.components.get(COMPONENT_TYPE.UNIT_COMPONENT) as UnitComponent;

                    if (!unitComponent.unit || unitComponent.unit.IsDead) {
                        continue;
                    }

                    var battleMind = unitComponent.unit.BattleMind;
                    battleMind.InstantDeath(null, UnitDeathType.Mele);
                }
                world.settlements_castleUnit[settlementId] = null;
            }

            if (!world.IsSettlementInGame(settlementId)) {
                continue;
            }

            for (var i = 0; i < world.settlements_entities[settlementId].length; i++) {
                var entity = world.settlements_entities[settlementId][i];

                var needDelete : boolean = false;

                if (entity.components.has(COMPONENT_TYPE.UNIT_COMPONENT) &&
                    !entity.components.has(COMPONENT_TYPE.REVIVE_COMPONENT)) {
                    var unitComponent = entity.components.get(COMPONENT_TYPE.UNIT_COMPONENT) as UnitComponent;
                
                    // проверка, что юнит мертвый, тогда нужно удалить
                    needDelete = !unitComponent.unit || unitComponent.unit.IsDead;
                } else if (entity.components.size == 0) {
                    needDelete = true;
                }

                if (needDelete) {
                    // если юнит был баффнут, то нужно удалить клонированный конфиг
                    if (entity.components.has(COMPONENT_TYPE.BUFFABLE_COMPONENT)) {
                        var buffableComponent = entity.components.get(COMPONENT_TYPE.BUFFABLE_COMPONENT) as BuffableComponent;
                        if (buffableComponent.buffType != BUFF_TYPE.EMPTY) {
                            HordeContentApi.RemoveConfig(buffableComponent.buffCfg);
                        }
                    }

                    world.settlements_entities[settlementId].splice(i--, 1);
                }
            }
        }
    }

    function IncomeSystem(gameTickNum: number) {
        // учитываем события увеличения инкома
        for (var settlementId = 0; settlementId < world.settlementsCount; settlementId++) {
            if (!world.IsSettlementInGame(settlementId)) {
                continue;
            }

            // ищем сущность с settlement
            var settlement_entity;
            for (var i = 0; i < world.settlements_entities[settlementId].length; i++) {
                var entity = world.settlements_entities[settlementId][i];
                if (entity.components.has(COMPONENT_TYPE.SETTLEMENT_COMPONENT)) {
                    settlement_entity = entity;
                    break;
                }
            }
            var settlementComponent = settlement_entity.components.get(COMPONENT_TYPE.SETTLEMENT_COMPONENT) as SettlementComponent;

            // вычисляем итоговый инком
            var incomeGold     : number   = 0;
            var incomeLumber   : number   = 0;
            var incomeMetal    : number   = 0;
            var incomePeople   : number   = 0;
            // добыто из ограниченного источника
            var minedGold      : number   = 0;
            var minedLumber    : number   = 0;
            var minedMetal     : number   = 0;
            // осталось в ограниченном источнике
            var goldReserves   : number   = 0;
            var lumberReserves : number   = 0;
            var metalReserves  : number   = 0;

            // проверяем тик инкома
            if (settlementComponent.incomeTact < gameTickNum) {
                // ищем события увеличивающие инком
                for (var i = 0; i < world.settlements_entities[settlementId].length; i++) {
                    var entity = world.settlements_entities[settlementId][i];
                    if (entity.components.has(COMPONENT_TYPE.INCOME_INCREASE_EVENT)) {
                        var income_increase_event = entity.components.get(COMPONENT_TYPE.INCOME_INCREASE_EVENT) as IncomeIncreaseEvent;

                        settlementComponent.incomeGold   += income_increase_event.gold;
                        settlementComponent.incomeLumber += income_increase_event.lumber;
                        settlementComponent.incomeMetal  += income_increase_event.metal;

                        entity.components.delete(COMPONENT_TYPE.INCOME_INCREASE_EVENT);
                    }
                }

                // ищем компоненты увеличивающие инком, которые приходит пассивно
                var increaseCoeff = 1.0;
                var increaseCount = 0;
                for (var i = 0; i < world.settlements_entities[settlementId].length; i++) {
                    var entity = world.settlements_entities[settlementId][i];
                    if (entity.components.has(COMPONENT_TYPE.INCOME_INCREASE_COMPONENT)) {
                        var incomeIncreaseComponent = entity.components.get(COMPONENT_TYPE.INCOME_INCREASE_COMPONENT) as IncomeIncreaseComponent;
                        increaseCount++;
                        if (increaseCount == 1) {
                            increaseCoeff += 0.25;
                        } else if (increaseCount == 2) {
                            increaseCoeff += 0.2125;
                        } else if (increaseCount == 3) {
                            increaseCoeff += 0.1806;
                        }
                    }
                }

                settlementComponent.incomeTact = gameTickNum + settlementComponent.incomeWaitTacts;
                incomeGold   += Math.round(settlementComponent.incomeGold * increaseCoeff);
                incomeLumber += Math.round(settlementComponent.incomeLumber * increaseCoeff);
                incomeMetal  += Math.round(settlementComponent.incomeMetal * increaseCoeff);
            }

            // ищем события дающие инком
            for (var i = 0; i < world.settlements_entities[settlementId].length; i++) {
                var entity = world.settlements_entities[settlementId][i];
                if (entity.components.has(COMPONENT_TYPE.INCOME_EVENT)) {
                    var income_event = entity.components.get(COMPONENT_TYPE.INCOME_EVENT) as IncomeEvent;
                    incomeGold   += income_event.gold;
                    incomeLumber += income_event.lumber;
                    incomeMetal  += income_event.metal;
                    incomePeople += income_event.people;

                    entity.components.delete(COMPONENT_TYPE.INCOME_EVENT);
                }
            }

            // ищем переодический инком
            for (var i = 0; i < world.settlements_entities[settlementId].length; i++) {
                var entity        = world.settlements_entities[settlementId][i];
                if (entity.components.has(COMPONENT_TYPE.INCOME_LIMITED_PERIODICAL_COMPONENT)) {
                    var incomeComponent = entity.components.get(COMPONENT_TYPE.INCOME_LIMITED_PERIODICAL_COMPONENT) as IncomeLimitedPeriodicalComponent;
                    
                    // проверяем время
                    if (incomeComponent.tact < 0) {
                        incomeComponent.tact = gameTickNum + incomeComponent.periodTacts;
                        continue;
                    } else if (incomeComponent.tact > gameTickNum) {
                        continue;
                    }
                    incomeComponent.tact += incomeComponent.periodTacts;

                    var isEmpty : boolean = true;
                    if (incomeComponent.totalGold > 0) {
                        isEmpty                    = false;
                        minedGold                 += Math.min(incomeComponent.gold, incomeComponent.totalGold);
                        incomeComponent.totalGold -= incomeComponent.gold;
                        goldReserves              += incomeComponent.totalGold;
                    }
                    if (incomeComponent.totalMetal > 0) {
                        isEmpty                     = false;
                        minedMetal                 += Math.min(incomeComponent.metal, incomeComponent.totalMetal);
                        incomeComponent.totalMetal -= incomeComponent.metal;
                        metalReserves              += incomeComponent.totalMetal;
                    }
                    if (incomeComponent.totalLumber > 0) {
                        isEmpty                      = false;
                        minedLumber                 += Math.min(incomeComponent.lumber, incomeComponent.totalLumber);
                        incomeComponent.totalLumber -= incomeComponent.lumber;
                        lumberReserves              += incomeComponent.totalLumber;
                    }
                    
                    if (isEmpty) {
                        entity.components.delete(COMPONENT_TYPE.INCOME_LIMITED_PERIODICAL_COMPONENT);
                    }
                }
            }

            // начисляем инком
            var emptyIncome : boolean = true;
            // оповещаем
            if (incomeMetal + minedMetal > 0) {
                emptyIncome = false;
                var msg = createGameMessageWithNoSound("Доход железа:" +
                    (incomeMetal > 0 ? " пассивно " + incomeMetal + " " : "") +
                    (minedMetal > 0 ? " добыто " + minedMetal + " осталось " + metalReserves : ""),
                    createHordeColor(255, 170, 169, 173));
                world.settlements[settlementId].Messages.AddMessage(msg);
            }
            if (incomeGold + minedGold > 0) {
                emptyIncome = false;
                var msg = createGameMessageWithNoSound("Доход золота:" +
                    (incomeGold > 0 ? " пассивно " + incomeGold + " " : "") +
                    (minedGold > 0 ? " добыто " + minedGold + " осталось " + goldReserves : ""),
                    createHordeColor(255, 255, 215, 0));
                world.settlements[settlementId].Messages.AddMessage(msg);
            }
            if (incomeLumber + minedLumber > 0) {
                emptyIncome = false;
                var msg = createGameMessageWithNoSound("Доход дерева:" +
                    (incomeLumber > 0 ? " пассивно " + incomeLumber + " " : "") +
                    (minedLumber > 0 ? " добыто " + minedLumber + " осталось " + lumberReserves : ""),
                    createHordeColor(255, 170, 107, 0));
                world.settlements[settlementId].Messages.AddMessage(msg);
            }
            if (incomePeople > 0) {
                emptyIncome = false;
                var msg = createGameMessageWithNoSound("Выращено людей: " + incomePeople,
                    createHordeColor(255, 204, 204, 0));
                world.settlements[settlementId].Messages.AddMessage(msg);
            }

            if (!emptyIncome) {
                world.settlements[settlementId].Resources.AddResources(createResourcesAmount(incomeGold + minedGold, incomeMetal + minedMetal, incomeLumber + minedLumber, incomePeople));
            }

            // если у поселения есть люди отбираем их
            //if (world.settlements[settlementId].Resources.FreePeople > 0) {
            //    world.settlements[settlementId].Resources.TakeResources(createResourcesAmount(0, 0, 0, world.settlements[settlementId].Resources.FreePeople));
            //}
        }
    }

    function AttackingAlongPathSystem(gameTickNum: number) {
        /** радиус реагирования на текущую точку пути атаки, если <= то отправляем в следующую точку */
        const pathNodeReactionRadius = 5;

        var unitsMap = world.realScena.UnitsMap;

        /** позиции вражеских юнитов на нашей базе */
        var settlements_enemyPositionOnBase = new Array<Array<Point>>(world.settlementsCount);
        for (var settlementId = 0; settlementId < world.settlementsCount; settlementId++) {
            settlements_enemyPositionOnBase[settlementId] = new Array<Point>();
        }
        for (var settlementId = 0; settlementId < world.settlementsCount; settlementId++) {
            if (!world.IsSettlementInGame(settlementId)) {
                continue;
            }
            
            for (var i = 0; i < world.settlements_entities[settlementId].length; i++) {
                var entity = world.settlements_entities[settlementId][i] as Entity;
                if (!entity.components.has(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT) ||
                    !entity.components.has(COMPONENT_TYPE.UNIT_COMPONENT)) {
                    continue;
                }

                var unitComponent = entity.components.get(COMPONENT_TYPE.UNIT_COMPONENT) as UnitComponent;

                if (!unitComponent.unit || unitComponent.unit.IsDead) {
                    continue;
                }

                for (var other_settlementId = 0; other_settlementId < world.settlementsCount; other_settlementId++) {
                    if (!world.IsSettlementInGame(other_settlementId)) {
                        continue;
                    }
                    // проверка войны
                    if (!world.settlements_settlements_warFlag[settlementId][other_settlementId]) {
                        continue;
                    }
                    // проверка, что данный юнит на базе врага
                    if (!world.settlements_field[other_settlementId].IsPointInside(unitComponent.unit.Cell.X, unitComponent.unit.Cell.Y)) {
                        continue;
                    }
                    // заносим данного юнита в список
                    settlements_enemyPositionOnBase[other_settlementId].push(new Point(unitComponent.unit.Cell.X, unitComponent.unit.Cell.Y));
                }
            }
        }
        
        // отдаем приказы
        for (var settlementId = 0; settlementId < world.settlementsCount; settlementId++) {
            if (!world.IsSettlementInGame(settlementId)) {
                continue;
            }

            for (var i = 0; i < world.settlements_entities[settlementId].length; i++) {
                var entity = world.settlements_entities[settlementId][i] as Entity;
                if (!entity.components.has(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT) ||
                    !entity.components.has(COMPONENT_TYPE.UNIT_COMPONENT)) {
                    continue;
                }

                var unitComponent               = entity.components.get(COMPONENT_TYPE.UNIT_COMPONENT) as UnitComponent;
                var attackingAlongPathComponent = entity.components.get(COMPONENT_TYPE.ATTACKING_ALONG_PATH_COMPONENT) as AttackingAlongPathComponent;

                if (!unitComponent.unit || unitComponent.unit.IsDead) {
                    continue;
                }

                var isAttackPathNull = !attackingAlongPathComponent.attackPath;

                // если юнит вообще не знает куда идти, то выбираем путь атаки
                if (isAttackPathNull) {
                    var selected_path_num = -1;
                    var selected_path_distance = 10000;
                    // выбираем нужный путь, первая точка которого ближе к позиции юнита
                    for (var pathNum = 0; pathNum < world.settlements_attack_paths[settlementId].length; pathNum++) {
                        var distance_to_fisrt_point = distanceBetweenPoints(
                            unitComponent.unit.Cell.X,
                            unitComponent.unit.Cell.Y,
                            world.settlements_attack_paths[settlementId][pathNum][0].X,
                            world.settlements_attack_paths[settlementId][pathNum][0].Y);

                        if (selected_path_distance > distance_to_fisrt_point) {
                            selected_path_distance = distance_to_fisrt_point;
                            selected_path_num      = pathNum;
                        }
                    }

                    attackingAlongPathComponent.attackPath          = world.settlements_attack_paths[settlementId][selected_path_num];
                    attackingAlongPathComponent.currentPathPointNum = 0;
                }

                // юнит дошел то точки
                if (distanceBetweenPoints(unitComponent.unit.Cell.X, unitComponent.unit.Cell.Y,
                    attackingAlongPathComponent.attackPath[attackingAlongPathComponent.currentPathPointNum].X,
                    attackingAlongPathComponent.attackPath[attackingAlongPathComponent.currentPathPointNum].Y) <= pathNodeReactionRadius) {
                    
                    // проверка, что в ячейке нету вражеского замка
                    var unitInPoint = unitsMap.GetUpperUnit(attackingAlongPathComponent.attackPath[attackingAlongPathComponent.currentPathPointNum].X, attackingAlongPathComponent.attackPath[attackingAlongPathComponent.currentPathPointNum].Y);
                    if (unitInPoint &&
                        unitInPoint.Cfg.Uid == world.configs["castle"].Uid &&
                        unitInPoint.Owner.Uid < world.settlementsCount &&
                        world.settlements_settlements_warFlag[settlementId][unitInPoint.Owner.Uid]) {
                        continue;
                    }

                    attackingAlongPathComponent.currentPathPointNum++;

                    // проверяем, что точка последняя
                    if (attackingAlongPathComponent.currentPathPointNum == attackingAlongPathComponent.attackPath.length) {
                        // то зацикливаем, ставим 0-ую
                        attackingAlongPathComponent.currentPathPointNum = 0;
                    }

                    UnitGiveOrder(unitComponent,
                        attackingAlongPathComponent.attackPath[attackingAlongPathComponent.currentPathPointNum],
                        UnitCommand.Attack,
                        AssignOrderMode.Replace);
                    
                    continue;
                }

                // защита базы
                if (settlements_enemyPositionOnBase[settlementId].length > 0 &&
                    world.settlements_field[settlementId].IsPointInside(unitComponent.unit.Cell.X, unitComponent.unit.Cell.Y)) {
                    // ищем ближайшего врага
                    // который в направлении атаки
                    var attackVector     = new Point(
                        attackingAlongPathComponent.attackPath[attackingAlongPathComponent.currentPathPointNum].X - unitComponent.unit.Cell.X,
                        attackingAlongPathComponent.attackPath[attackingAlongPathComponent.currentPathPointNum].Y - unitComponent.unit.Cell.Y);
                    var nearPos_num      = -1;
                    var nearPos_distance = 10000;
                    for (var posNum = 0; posNum < settlements_enemyPositionOnBase[settlementId].length; posNum++) {
                        // проверяем, что враг на пути атаки
                        if (attackVector.X*(settlements_enemyPositionOnBase[settlementId][posNum].X - unitComponent.unit.Cell.X)
                            + attackVector.Y*(settlements_enemyPositionOnBase[settlementId][posNum].Y - unitComponent.unit.Cell.Y) < 0) {
                            continue;
                        }
                        var posDistance = distanceBetweenPoints(unitComponent.unit.Cell.X, unitComponent.unit.Cell.Y, settlements_enemyPositionOnBase[settlementId][posNum].X, settlements_enemyPositionOnBase[settlementId][posNum].Y);
                        if (posDistance < nearPos_distance) {
                            nearPos_num      = posNum;
                            nearPos_distance = posDistance;
                        }
                    }

                    // нашелся юнит по пути атаки идем его атаковать
                    if (nearPos_num != -1) {
                        UnitGiveOrder(unitComponent,
                            settlements_enemyPositionOnBase[settlementId][nearPos_num],
                            UnitCommand.Attack,
                            AssignOrderMode.Replace);
                    }
                    // если юнит только появился
                    else if (isAttackPathNull) {
                        // сначала идем на базу
                        UnitGiveOrder(unitComponent,
                            world.settlements_castle_position[settlementId],
                            UnitCommand.Attack,
                            AssignOrderMode.Replace);
                        // потом на следующую точку
                        UnitGiveOrder(unitComponent,
                            attackingAlongPathComponent.attackPath[attackingAlongPathComponent.currentPathPointNum],
                            UnitCommand.Attack,
                            AssignOrderMode.Queue);
                    } else {
                        // идем на следующую точку
                        UnitGiveOrder(unitComponent,
                            attackingAlongPathComponent.attackPath[attackingAlongPathComponent.currentPathPointNum],
                            UnitCommand.Attack,
                            AssignOrderMode.Queue);
                    }
                }
                else {
                    // если юнит бездействует
                    if (unitComponent.unit.OrdersMind.IsIdle()) {
                        // идем на следующую точку
                        UnitGiveOrder(unitComponent,
                            attackingAlongPathComponent.attackPath[attackingAlongPathComponent.currentPathPointNum],
                            UnitCommand.Attack,
                            AssignOrderMode.Queue);
                    }
                }
            }
        }
    }

    function SpawnBuildingSystem(gameTickNum: number) {
        for (var settlementId = 0; settlementId < world.settlementsCount; settlementId++) {
            if (!world.IsSettlementInGame(settlementId)) {
                continue;
            }

            for (var i = 0; i < world.settlements_entities[settlementId].length; i++) {
                var entity = world.settlements_entities[settlementId][i] as Entity;
                if (entity.components.has(COMPONENT_TYPE.UNIT_COMPONENT) && entity.components.has(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT)) {
                    var unitComponent          = entity.components.get(COMPONENT_TYPE.UNIT_COMPONENT) as UnitComponent;
                    // проверка, что юнит жив
                    if (!unitComponent.unit || unitComponent.unit.IsDead) {
                        continue;
                    }

                    var spawnBuildingComponent = entity.components.get(COMPONENT_TYPE.SPAWN_BUILDING_COMPONENT) as SpawnBuildingComponent;

                    // проверяем, что здание что-то строит
                    if (unitComponent.unit.OrdersMind.ActiveAct.GetType().Name == "ActProduce") {
                        var buildingCfg = unitComponent.unit.OrdersMind.ActiveOrder.ProductUnitConfig;
                        // проверяем, если здание хочет сбросить таймер спавна
                        if (buildingCfg.Uid == world.configs["reset_spawn"].Uid) {
                            // отменяем постройку
                            unitComponent.unit.OrdersMind.CancelOrders(true);
                            // сбрасываем спавн
                            spawnBuildingComponent.spawnTact = gameTickNum + spawnBuildingComponent.spawnPeriodTact;
                        }
                    }
                    // проверяем, что зданию нужно задать таймер спавна
                    if (spawnBuildingComponent.spawnTact < 0) {
                        spawnBuildingComponent.spawnTact = gameTickNum + spawnBuildingComponent.spawnPeriodTact;
                    }
                    // проверяем, что пора спавнить юнитов
                    else if (spawnBuildingComponent.spawnTact < gameTickNum) {
                        spawnBuildingComponent.spawnTact += spawnBuildingComponent.spawnPeriodTact;
                        
                        var emergePoint = world.configs[unitComponent.cfgId].BuildingConfig.EmergePoint;

                        // спавним юнитов
                        var generator     = generateCellInSpiral(unitComponent.unit.Cell.X + emergePoint.X, unitComponent.unit.Cell.Y + emergePoint.Y);
                        var spawnedUnits  = spawnUnits(world.settlements[settlementId], world.configs[spawnBuildingComponent.spawnUnitConfigId], 1, UnitDirection.Down, generator);
                        for (var spawnedUnit of spawnedUnits) {
                            world.RegisterUnitEntity(spawnedUnit);
                        }
                    }
                }
            }
        }
    }

    function ReviveSystem(gameTickNum: number) {
        for (var settlementId = 0; settlementId < world.settlementsCount; settlementId++) {
            if (!world.IsSettlementInGame(settlementId)) {
                continue;
            }

            // обрабатываем сущности с ReviveComponent и UnitComponent
            for (var i = 0; i < world.settlements_entities[settlementId].length; i++) {
                var entity = world.settlements_entities[settlementId][i] as Entity;
                if (entity.components.has(COMPONENT_TYPE.REVIVE_COMPONENT) && entity.components.has(COMPONENT_TYPE.UNIT_COMPONENT)) {
                    var unitComponent = entity.components.get(COMPONENT_TYPE.UNIT_COMPONENT) as UnitComponent;
                    var reviveComponent = entity.components.get(COMPONENT_TYPE.REVIVE_COMPONENT) as ReviveComponent;

                    // проверяем, что юнит умер
                    if (unitComponent.unit && !unitComponent.unit.IsDead) {
                        continue;
                    }

                    // юнит ждет воскрешения
                    if (reviveComponent.waitingToRevive) {
                        // проверяем, что пришло время воксрешать
                        if (reviveComponent.tick < gameTickNum) {
                            reviveComponent.waitingToRevive = false;
                            var generator      = generateCellInSpiral(reviveComponent.point.X, reviveComponent.point.Y);
                            unitComponent.unit = spawnUnits(world.settlements[settlementId], world.configs[unitComponent.cfgId], 1, UnitDirection.Down, generator)[0];
                        }
                    }
                    // регистрируем смерть и запускаем обратный отсчет до воскрешения
                    else {
                        reviveComponent.waitingToRevive = true;
                        reviveComponent.tick = gameTickNum + reviveComponent.reviveTicks;
                    }
                }
            }
        }
    }

    function UpgradableBuildingSystem_Stage1(gameTickNum: number) {
        for (var settlementId = 0; settlementId < world.settlementsCount; settlementId++) {
            if (!world.IsSettlementInGame(settlementId)) {
                continue;
            }

            // проверяем активацию улучшений
            for (var i = 0; i < world.settlements_entities[settlementId].length; i++) {
                var entity = world.settlements_entities[settlementId][i] as Entity;
                if (entity.components.has(COMPONENT_TYPE.UNIT_COMPONENT) && entity.components.has(COMPONENT_TYPE.UPGRADABLE_BUILDING_COMPONENT)) {
                    var unitComponent          = entity.components.get(COMPONENT_TYPE.UNIT_COMPONENT) as UnitComponent;
                    if (!unitComponent.unit || unitComponent.unit.IsDead) {
                        continue;
                    }
                    var upgradableBuildingComponent = entity.components.get(COMPONENT_TYPE.UPGRADABLE_BUILDING_COMPONENT) as UpgradableBuildingComponent;

                    // проверяем, что здание что-то строит
                    if (unitComponent.unit.OrdersMind.ActiveAct.GetType().Name == "ActProduce" &&
                        unitComponent.unit.OrdersMind.ActiveAct.ActiveMotion.LeftTime < 100) {
                        var buildingCfg = unitComponent.unit.OrdersMind.ActiveOrder.ProductUnitConfig;
                        
                        // проверяем, что здание строит улучшение
                        for (var upgradeId = 0; upgradeId < upgradableBuildingComponent.upgradeUnitCfgIds.length; upgradeId++) {
                            var upgradeUnitCfgId = upgradableBuildingComponent.upgradeUnitCfgIds[upgradeId];
                            
                            if (buildingCfg.Uid != world.configs[upgradeUnitCfgId].Uid) {
                                continue;
                            }

                            // создаем событие об улучшении
                            var upgrade_entity = new Entity();
                            upgrade_entity.components.set(COMPONENT_TYPE.UPGRADABLE_BUILDING_EVENT,
                                new UpgradableBuildingEvent(upgradableBuildingComponent.upgradeCfgIds[upgradeId],
                                    new Point(unitComponent.unit.Cell.X, unitComponent.unit.Cell.Y)));
                            world.settlements_entities[settlementId].push(upgrade_entity);

                            // отменяем постройку
                            unitComponent.unit.OrdersMind.CancelOrders(true);

                            // забираем деньги
                            var CostResources = world.configs[upgradableBuildingComponent.upgradeCfgIds[upgradeId]].CostResources;
                            world.settlements[settlementId].Resources.TakeResources(createResourcesAmount(
                                CostResources.Gold,
                                CostResources.Metal,
                                CostResources.Lumber, 0));

                            // уничтожаем исходного юнита
                            var battleMind = unitComponent.unit.BattleMind;
                            battleMind.InstantDeath(null, UnitDeathType.Mele);
                            break;
                        }
                    }
                }
            }
        }
    }

    function UpgradableBuildingSystem_Stage2(gameTickNum: number) {
        for (var settlementId = 0; settlementId < world.settlementsCount; settlementId++) {
            if (!world.IsSettlementInGame(settlementId)) {
                continue;
            }

            // обрабатываем события улучшений
            for (var i = 0; i < world.settlements_entities[settlementId].length; i++) {
                var entity = world.settlements_entities[settlementId][i] as Entity;
                if (!entity.components.has(COMPONENT_TYPE.UPGRADABLE_BUILDING_EVENT)) {
                    continue;
                }

                var upgradableBuildingEvent = entity.components.get(COMPONENT_TYPE.UPGRADABLE_BUILDING_EVENT) as UpgradableBuildingEvent;

                // создаем улучшенное здание
                var upgradeCfgId = upgradableBuildingEvent.upgradeCfgId;

                // проверяем, что можно создать здание в том же месте
                if (!unitCanBePlacedByRealMap(world.configs[upgradeCfgId], upgradableBuildingEvent.spawnPoint.X, upgradableBuildingEvent.spawnPoint.Y)) {
                    continue;
                }

                // создаем здание в том же месте
                var upgradedUnit;
                {
                    var csType = ScriptUtils.GetTypeByName("HordeClassLibrary.World.Objects.Units.SpawnUnitParameters, HordeClassLibrary");
                    var spawnParams = ScriptUtils.CreateInstance(csType);
                    ScriptUtils.SetValue(spawnParams, "ProductUnitConfig", world.configs[upgradeCfgId]);
                    ScriptUtils.SetValue(spawnParams, "Direction", UnitDirection.Down);
                    ScriptUtils.SetValue(spawnParams, "Cell", createPoint(upgradableBuildingEvent.spawnPoint.X, upgradableBuildingEvent.spawnPoint.Y));
                    upgradedUnit = world.settlements[settlementId].Units.SpawnUnit(spawnParams);
                }
                world.RegisterUnitEntity(upgradedUnit);
                spawnDecoration(world.realScena, HordeContentApi.GetVisualEffectConfig("#VisualEffectConfig_BigDust"), upgradedUnit.Position);

                // удаляем компонент
                entity.components.delete(COMPONENT_TYPE.UPGRADABLE_BUILDING_EVENT);
            }
        }
    }

    function BuffSystem(gameTickNum: number) {
        // обработка событий баффов
        for (var settlementId = 0; settlementId < world.settlementsCount; settlementId++) {
            if (!world.IsSettlementInGame(settlementId)) {
                continue;
            }

            for (var i = 0; i < world.settlements_entities[settlementId].length; i++) {
                var entity = world.settlements_entities[settlementId][i] as Entity;
                if (!entity.components.has(COMPONENT_TYPE.BUFF_EVENT)) {
                    continue;
                }
                var buffEvent = entity.components.get(COMPONENT_TYPE.BUFF_EVENT) as BuffEvent;
                
                {
                    // обновляем конфиг баффнутого юнита
                    var cloneCFG  = HordeContentApi.CloneConfig(world.configs[buffEvent.cfgId]);
                    var spawnCount = 1;
                    switch (buffEvent.buffType) {
                        case BUFF_TYPE.ATTACK:
                            ScriptUtils.SetValue(cloneCFG, "TintColor", createHordeColor(150, 150, 0, 0));
                            ScriptUtils.SetValue(cloneCFG.MainArmament.BulletCombatParams, "Damage", 5*cloneCFG.MainArmament.BulletCombatParams.Damage);
                            ScriptUtils.SetValue(cloneCFG, "Sight", 14);
                            if (cloneCFG.MainArmament.Range > 1) {
                                ScriptUtils.SetValue(cloneCFG.MainArmament, "EmitBulletsCountMin", 10);
                                ScriptUtils.SetValue(cloneCFG.MainArmament, "EmitBulletsCountMax", 10);
                                ScriptUtils.SetValue(cloneCFG.MainArmament, "Range", Math.max(11, cloneCFG.MainArmament.Range + 2));
                                ScriptUtils.SetValue(cloneCFG.MainArmament, "BaseAccuracy", 0);
                                ScriptUtils.SetValue(cloneCFG.MainArmament, "MaxDistanceDispersion", 300);
                            }
                            break;
                        case BUFF_TYPE.HEALTH:
                            ScriptUtils.SetValue(cloneCFG, "TintColor", createHordeColor(150, 0, 150, 0));
                            ScriptUtils.SetValue(cloneCFG, "MaxHealth", 10*cloneCFG.MaxHealth);
                            break;
                        case BUFF_TYPE.DEFFENSE:
                            ScriptUtils.SetValue(cloneCFG, "TintColor", createHordeColor(150, 255, 215, 0));
                            ScriptUtils.SetValue(cloneCFG, "MaxHealth", 2*cloneCFG.MaxHealth);
                            ScriptUtils.SetValue(cloneCFG, "Shield", Math.max(cloneCFG.Shield, 400));
                            ScriptUtils.SetValue(cloneCFG, "Flags", mergeFlags(UnitFlags, cloneCFG.Flags, UnitFlags.FireResistant, UnitFlags.MagicResistant));
                            break;
                        case BUFF_TYPE.CLONING:
                            ScriptUtils.SetValue(cloneCFG, "TintColor", createHordeColor(150, 255, 255, 255));
                            spawnCount = 4;
                            break;
                    }

                    // создаем баффнутого юнита
                    var generator    = generateCellInSpiral(buffEvent.pos.X, buffEvent.pos.Y);
                    var spawnedUnits = spawnUnits(world.settlements[buffEvent.settlementId], cloneCFG, spawnCount, UnitDirection.Down, generator);
                    for (var spawnedUnit of spawnedUnits) {
                        var newEntity              = world.RegisterUnitEntity(spawnedUnit, buffEvent.entity);
                        // устанавливаем информацию о баффе и о бафнутом конфиге
                        var buffableComponent      = newEntity.components.get(COMPONENT_TYPE.BUFFABLE_COMPONENT) as BuffableComponent;
                        buffableComponent.buffType = buffEvent.buffType;
                        buffableComponent.buffCfg  = cloneCFG;
                        // запрещаем команды
                        DisallowedCommandsForUnit(spawnedUnit);
                        // создаем эффект появления
                        spawnDecoration(world.realScena, HordeContentApi.GetVisualEffectConfig("#VisualEffectConfig_LittleDust"), spawnedUnit.Position);
                    }
                }
                entity.components.delete(COMPONENT_TYPE.BUFF_EVENT);
            }
        }

        // создание события баффа
        for (var settlementId = 0; settlementId < world.settlementsCount; settlementId++) {
            if (!world.IsSettlementInGame(settlementId)) {
                continue;
            }

            for (var i = 0; i < world.settlements_entities[settlementId].length; i++) {
                var entity = world.settlements_entities[settlementId][i] as Entity;
                if (!entity.components.has(COMPONENT_TYPE.BUFF_COMPONENT) ||
                    !entity.components.has(COMPONENT_TYPE.UNIT_COMPONENT)) {
                    continue;
                }

                var unitComponent = entity.components.get(COMPONENT_TYPE.UNIT_COMPONENT) as UnitComponent;
                var buffComponent = entity.components.get(COMPONENT_TYPE.BUFF_COMPONENT) as BuffComponent;
                
                // проверяем, что юнит кого-то бьет
                if (!unitComponent.unit.OrdersMind.ActiveOrder.Target) {
                    continue;
                }

                var target_CfgUid = unitComponent.unit.OrdersMind.ActiveOrder.Target.Cfg.Uid;

                // проверяем, что цель можно баффать
                if (!world.cfgUid_entity.has(target_CfgUid)) {
                    continue;
                }
                var targetBaseEntity = world.cfgUid_entity.get(target_CfgUid) as Entity;
                if (!targetBaseEntity.components.has(COMPONENT_TYPE.BUFFABLE_COMPONENT)) {
                    continue;
                }
                var targetBuffComponent = targetBaseEntity.components.get(COMPONENT_TYPE.BUFFABLE_COMPONENT) as BuffComponent;
                if (targetBuffComponent.buffType != BUFF_TYPE.EMPTY) {
                    continue;
                }

                var target_settlementId = unitComponent.unit.OrdersMind.ActiveOrder.Target.Owner.Uid;

                // ищем сущность цели
                var target_entityId : number = -1;
                for (var k = 0; k < world.settlements_entities[target_settlementId].length; k++) {
                    var tentity = world.settlements_entities[target_settlementId][k] as Entity;
                    if (tentity.components.has(COMPONENT_TYPE.UNIT_COMPONENT) &&
                        tentity.components.has(COMPONENT_TYPE.BUFFABLE_COMPONENT)) {
                        var tunitComponent = tentity.components.get(COMPONENT_TYPE.UNIT_COMPONENT) as UnitComponent;
                        if (tunitComponent.unit.Id == unitComponent.unit.OrdersMind.ActiveOrder.Target.Id) {
                            target_entityId = k;
                            break;
                        }
                    }
                }
                if (target_entityId == -1) {
                    continue;
                }

                var target_entity = world.settlements_entities[target_settlementId][target_entityId] as Entity;
                var target_unitComponent = target_entity.components.get(COMPONENT_TYPE.UNIT_COMPONENT) as UnitComponent;

                // создаем событие баффа
                var buff_entity = new Entity();
                buff_entity.components.set(COMPONENT_TYPE.BUFF_EVENT,
                    new BuffEvent(buffComponent.buffType,
                        new Point(unitComponent.unit.OrdersMind.ActiveOrder.Target.Cell.X, unitComponent.unit.OrdersMind.ActiveOrder.Target.Cell.Y),
                        target_unitComponent.cfgId,
                        target_settlementId,
                        target_entity.Clone()));
                world.settlements_entities[target_settlementId].push(buff_entity);

                // убиваем юнита
                {
                    var battleMind = unitComponent.unit.OrdersMind.ActiveOrder.Target.BattleMind;
                    battleMind.InstantDeath(null, UnitDeathType.Mele);
                }

                // убиваем духа
                {
                    var battleMind = unitComponent.unit.BattleMind;
                    battleMind.InstantDeath(null, UnitDeathType.Mele);
                }

                // удаляем компонент, что юнита можно баффать
                target_entity.components.delete(COMPONENT_TYPE.BUFFABLE_COMPONENT);
            }
        }
    }

    function UnitProducedSystem(gameTickNum: number) {
        for (var settlementId = 0; settlementId < world.settlementsCount; settlementId++) {
            if (!world.IsSettlementInGame(settlementId)) {
                continue;
            }

            for (var i = 0; i < world.settlements_entities[settlementId].length; i++) {
                var entity = world.settlements_entities[settlementId][i] as Entity;
                if (!entity.components.has(COMPONENT_TYPE.UNIT_PRODUCED_EVENT)) {
                    continue;
                }

                var unitProducedEvent = entity.components.get(COMPONENT_TYPE.UNIT_PRODUCED_EVENT) as UnitProducedEvent;

                // дожидаемся полной постройки юнита
                if (unitProducedEvent.producedUnit.EffectsMind.BuildingInProgress) {
                    continue;
                }

                // проверяем, что у нового юнита есть сущность
                if (world.cfgUid_entity.has(unitProducedEvent.producedUnit.Cfg.Uid)) {
                    world.RegisterUnitEntity(unitProducedEvent.producedUnit);
                }

                // удаляем событие
                entity.components.delete(COMPONENT_TYPE.UNIT_PRODUCED_EVENT);
            }
        }
    }

    function HeroAltarSystem(gameTickNum: number) {
        for (var settlementId = 0; settlementId < world.settlementsCount; settlementId++) {
            if (!world.IsSettlementInGame(settlementId)) {
                continue;
            }

            for (var i = 0; i < world.settlements_entities[settlementId].length; i++) {
                var entity = world.settlements_entities[settlementId][i] as Entity;
                if (!entity.components.has(COMPONENT_TYPE.HERO_ALTAR_COMPONENT)) {
                    continue;
                }
                var heroAltarComponent = entity.components.get(COMPONENT_TYPE.HERO_ALTAR_COMPONENT) as HeroAltarComponent;
                var unitComponent      = entity.components.get(COMPONENT_TYPE.UNIT_COMPONENT) as UnitComponent;

                // если герой не выбран
                if (heroAltarComponent.selectedHeroNum < 0) {
                    // проверяем, что алтарь что-то строит
                    if (unitComponent.unit.OrdersMind.ActiveAct.GetType().Name == "ActProduce") {
                        // выбираем героя
                        var productUnitCfg = unitComponent.unit.OrdersMind.ActiveOrder.ProductUnitConfig;
                        
                        for (var heroNum = 0; heroNum < heroAltarComponent.heroesCfgIdxs.length; heroNum++) {
                            if (world.configs[heroAltarComponent.heroesCfgIdxs[heroNum]].Uid == productUnitCfg.Uid) {
                                heroAltarComponent.selectedHeroNum = heroNum;
                                break;
                            }
                        }
                        
                        // отменяем постройку
                        unitComponent.unit.OrdersMind.CancelOrders(true);

                        // запрещаем постройку
                        var commandsMind       = unitComponent.unit.CommandsMind;
                        var disallowedCommands = ScriptUtils.GetValue(commandsMind, "DisallowedCommands");
                        if (disallowedCommands.ContainsKey(UnitCommand.Produce)) disallowedCommands.Remove(UnitCommand.Produce);
                        disallowedCommands.Add(UnitCommand.Produce, 1);
                        //log.info(disallowedCommands.Item.get(UnitCommand.Produce));
                        ScriptUtils.GetValue(unitComponent.unit, "Model").ProfessionsData.Remove(UnitProfession.UnitProducer)

                        // регистрируем героя
                        world.configs["hero_" + settlementId] = HordeContentApi.CloneConfig(world.configs[heroAltarComponent.heroesCfgIdxs[heroAltarComponent.selectedHeroNum]]);
                        // делаем подходящий цвет
                        log.info("делаем подходящий цвет героя");
                        
                        // точка спавна относительно юнита
                        var emergePoint = world.configs[unitComponent.cfgId].BuildingConfig.EmergePoint;

                        // регистрируем героя
                        var heroEntity = new Entity();
                        heroEntity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, "hero_" + settlementId));
                        heroEntity.components.set(COMPONENT_TYPE.HERO_COMPONENT, new HeroComponent(entity));
                        heroEntity.components.set(COMPONENT_TYPE.REVIVE_COMPONENT,
                            new ReviveComponent(new Point(unitComponent.unit.Cell.X + emergePoint.X, unitComponent.unit.Cell.Y + emergePoint.Y),
                            50*60, gameTickNum));
                        world.settlements_entities[settlementId].push(heroEntity);

                        // делаем ссылку
                        heroAltarComponent.heroEntity = heroEntity;
                    }
                } else {

                }
            }
        }
    }

    /////////////////////////////////////////////////////////////////
    // игровой цикл
    /////////////////////////////////////////////////////////////////

    export class CastleFightPlugin extends HordePluginBase {
        /**
         * Конструктор.
         */
        public constructor() {
            super("Битва замков");
        }

        public onFirstRun() {
        }
    
        public onEveryTick(gameTickNum: number) {
            if (CheckGameEndSystem(gameTickNum)) {
                return;
            }
    
            if (!world.gameInit) {
                var settlementsCount: number;
                var settlements_field: Array<Polygon>;
                var settlements_workers_revivePositions: Array<Array<Point>>;
                var settlements_castle_position: Array<Point>;
                var settlements_attack_paths: Array<Array<Array<Point>>>;

                var scenaName = ActiveScena.GetRealScena().ScenaName;
                if (scenaName == "Битва замков - лесная тропа с мостами (3х3)") {
                    settlementsCount                    = 6;
                    settlements_field                   = [
                        new Polygon([new Point(0, 0), new Point(45, 0), new Point(45, 63), new Point(0, 63)]),
                        new Polygon([new Point(0, 0), new Point(45, 0), new Point(45, 63), new Point(0, 63)]),
                        new Polygon([new Point(0, 0), new Point(45, 0), new Point(45, 63), new Point(0, 63)]),
                        new Polygon([new Point(162, 0), new Point(207, 0), new Point(207, 63), new Point(162, 63)]),
                        new Polygon([new Point(162, 0), new Point(207, 0), new Point(207, 63), new Point(162, 63)]),
                        new Polygon([new Point(162, 0), new Point(207, 0), new Point(207, 63), new Point(162, 63)])
                    ];
                    settlements_workers_revivePositions = [
                        [new Point(0, 31)],
                        [new Point(0, 31)],
                        [new Point(0, 31)],
                        [new Point(207, 31)],
                        [new Point(207, 31)],
                        [new Point(207, 31)]];
                    settlements_castle_position         = [
                        new Point(21, 30),
                        new Point(21, 30),
                        new Point(21, 30),
                        new Point(182, 30),
                        new Point(182, 30),
                        new Point(182, 30)];
                    settlements_attack_paths            = [
                        [[new Point(182, 30)]],
                        [[new Point(182, 30)]],
                        [[new Point(182, 30)]],
                        [[new Point(21, 30)]],
                        [[new Point(21, 30)]],
                        [[new Point(21, 30)]]
                    ];
                } else if (scenaName == "Битва замков - лесная тропа (3х3)") {
                    settlementsCount                    = 6;
                    settlements_field                   = [
                        new Polygon([new Point(0, 0), new Point(45, 0), new Point(45, 63), new Point(0, 63)]),
                        new Polygon([new Point(0, 0), new Point(45, 0), new Point(45, 63), new Point(0, 63)]),
                        new Polygon([new Point(0, 0), new Point(45, 0), new Point(45, 63), new Point(0, 63)]),
                        new Polygon([new Point(162, 0), new Point(207, 0), new Point(207, 63), new Point(162, 63)]),
                        new Polygon([new Point(162, 0), new Point(207, 0), new Point(207, 63), new Point(162, 63)]),
                        new Polygon([new Point(162, 0), new Point(207, 0), new Point(207, 63), new Point(162, 63)])
                    ];
                    settlements_workers_revivePositions = [
                        [new Point(0, 31)],
                        [new Point(0, 31)],
                        [new Point(0, 31)],
                        [new Point(207, 31)],
                        [new Point(207, 31)],
                        [new Point(207, 31)]];
                    settlements_castle_position         = [
                        new Point(21, 30),
                        new Point(21, 30),
                        new Point(21, 30),
                        new Point(182, 30),
                        new Point(182, 30),
                        new Point(182, 30)];
                    settlements_attack_paths            = [
                        [[new Point(182, 30)]],
                        [[new Point(182, 30)]],
                        [[new Point(182, 30)]],
                        [[new Point(21, 30)]],
                        [[new Point(21, 30)]],
                        [[new Point(21, 30)]]
                    ];
                } else if (scenaName == "Битва замков - две тропы (3х3)") {
                    settlementsCount                    = 6;
                    settlements_field                   = [
                        new Polygon([new Point(0, 0), new Point(48, 0), new Point(48, 95), new Point(0, 95)]),
                        new Polygon([new Point(0, 0), new Point(48, 0), new Point(48, 95), new Point(0, 95)]),
                        new Polygon([new Point(0, 0), new Point(48, 0), new Point(48, 95), new Point(0, 95)]),
                        new Polygon([new Point(207, 0), new Point(255, 0), new Point(255, 95), new Point(207, 95)]),
                        new Polygon([new Point(207, 0), new Point(255, 0), new Point(255, 95), new Point(207, 95)]),
                        new Polygon([new Point(207, 0), new Point(255, 0), new Point(255, 95), new Point(207, 95)])
                    ];
                    settlements_workers_revivePositions = [
                        [new Point(0, 47)],
                        [new Point(0, 47)],
                        [new Point(0, 47)],
                        [new Point(255, 47)],
                        [new Point(255, 47)],
                        [new Point(255, 47)]];
                    settlements_castle_position         = [
                        new Point(44, 46),
                        new Point(44, 46),
                        new Point(44, 46),
                        new Point(207, 46),
                        new Point(207, 46),
                        new Point(207, 46)];
                    settlements_attack_paths            = [
                        [
                            [new Point(60, 12), new Point(76, 27), new Point(99, 27), new Point(115, 12), new Point(140, 12), new Point(155, 27), new Point(180, 27), new Point(195, 12), new Point(207, 46)],
                            [new Point(60, 83), new Point(76, 68), new Point(99, 68), new Point(115, 83), new Point(140, 83), new Point(155, 68), new Point(180, 68), new Point(195, 83), new Point(207, 46)]
                        ],
                        [
                            [new Point(60, 12), new Point(76, 27), new Point(99, 27), new Point(115, 12), new Point(140, 12), new Point(155, 27), new Point(180, 27), new Point(195, 12), new Point(207, 46)],
                            [new Point(60, 83), new Point(76, 68), new Point(99, 68), new Point(115, 83), new Point(140, 83), new Point(155, 68), new Point(180, 68), new Point(195, 83), new Point(207, 46)]
                        ],
                        [
                            [new Point(60, 12), new Point(76, 27), new Point(99, 27), new Point(115, 12), new Point(140, 12), new Point(155, 27), new Point(180, 27), new Point(195, 12), new Point(207, 46)],
                            [new Point(60, 83), new Point(76, 68), new Point(99, 68), new Point(115, 83), new Point(140, 83), new Point(155, 68), new Point(180, 68), new Point(195, 83), new Point(207, 46)]
                        ],
                        [
                            [new Point(44, 46), new Point(60, 12), new Point(76, 27), new Point(99, 27), new Point(115, 12), new Point(140, 12), new Point(155, 27), new Point(180, 27), new Point(195, 12)].reverse(),
                            [new Point(44, 46), new Point(60, 83), new Point(76, 68), new Point(99, 68), new Point(115, 83), new Point(140, 83), new Point(155, 68), new Point(180, 68), new Point(195, 83)].reverse()
                        ],
                        [
                            [new Point(44, 46), new Point(60, 12), new Point(76, 27), new Point(99, 27), new Point(115, 12), new Point(140, 12), new Point(155, 27), new Point(180, 27), new Point(195, 12)].reverse(),
                            [new Point(44, 46), new Point(60, 83), new Point(76, 68), new Point(99, 68), new Point(115, 83), new Point(140, 83), new Point(155, 68), new Point(180, 68), new Point(195, 83)].reverse()
                        ],
                        [
                            [new Point(44, 46), new Point(60, 12), new Point(76, 27), new Point(99, 27), new Point(115, 12), new Point(140, 12), new Point(155, 27), new Point(180, 27), new Point(195, 12)].reverse(),
                            [new Point(44, 46), new Point(60, 83), new Point(76, 68), new Point(99, 68), new Point(115, 83), new Point(140, 83), new Point(155, 68), new Point(180, 68), new Point(195, 83)].reverse()
                        ]
                    ];
                } else if (scenaName == "Битва замков - царь горы (2x2x2)") {
                    settlementsCount                    = 6;
                    settlements_field                   = [
                        new Polygon([new Point(68, 147), new Point(122, 148), new Point(135, 177), new Point(95, 187), new Point(55, 177)].reverse()),
                        new Polygon([new Point(68, 147), new Point(122, 148), new Point(135, 177), new Point(95, 187), new Point(55, 177)].reverse()),
                        new Polygon([new Point(63, 91), new Point(3, 89), new Point(16, 19), new Point(44, 19), new Point(64, 46)].reverse()),
                        new Polygon([new Point(63, 91), new Point(3, 89), new Point(16, 19), new Point(44, 19), new Point(64, 46)].reverse()),
                        new Polygon([new Point(126, 44), new Point(145, 19), new Point(174, 49), new Point(186, 89), new Point(154, 92)].reverse()),
                        new Polygon([new Point(126, 44), new Point(145, 19), new Point(174, 49), new Point(186, 89), new Point(154, 92)].reverse())
                    ];
                    settlements_workers_revivePositions = [
                        [new Point(95, 185)],
                        [new Point(95, 185)],
                        [new Point(17, 50)],
                        [new Point(17, 50)],
                        [new Point(172, 50)],
                        [new Point(172, 50)]];
                    settlements_castle_position         = [
                        new Point(93, 155),
                        new Point(93, 155),
                        new Point(40, 62),
                        new Point(40, 62),
                        new Point(148, 63),
                        new Point(148, 63)];
                    settlements_attack_paths            = [
                        [[new Point(42, 63),  new Point(150, 64)],
                         [new Point(150, 64), new Point(42, 63)]],
                        [[new Point(42, 63),  new Point(150, 64)],
                         [new Point(150, 64), new Point(42, 63)]],

                        [[new Point(150, 64), new Point(95, 156)],
                         [new Point(95, 156), new Point(150, 64)]],
                        [[new Point(150, 64), new Point(95, 156)],
                         [new Point(95, 156), new Point(150, 64)]],

                        [[new Point(95, 156), new Point(42, 63)],
                         [new Point(42, 63),  new Point(95, 156)]],
                        [[new Point(95, 156), new Point(42, 63)],
                         [new Point(42, 63),  new Point(95, 156)]]
                    ];
                } else if (scenaName == "Битва замков - царь горы (1x1x1x1)") {
                    settlementsCount                    = 4;
                    settlements_field                   = [
                        new Polygon([new Point(73, 0), new Point(120, 0), new Point(120, 45), new Point(73, 45)]),
                        new Polygon([new Point(148, 72), new Point(194, 72), new Point(194, 120), new Point(148, 120)]),
                        new Polygon([new Point(72, 148), new Point(120, 148), new Point(120, 194), new Point(72, 194)]),
                        new Polygon([new Point(0, 72), new Point(45, 72), new Point(45, 120), new Point(0, 120)])
                    ];
                    settlements_workers_revivePositions = [
                        [new Point(96, 0)],
                        [new Point(194, 96)],
                        [new Point(97, 194)],
                        [new Point(0, 96)]];
                    settlements_castle_position         = [
                        new Point(95, 19),
                        new Point(171, 95),
                        new Point(95, 171),
                        new Point(19, 95)];
                    settlements_attack_paths            = [
                        [[new Point(173, 97), new Point(97, 173), new Point(21, 97)],
                         [new Point(21, 97),  new Point(97, 173), new Point(173, 97)]],

                        [[new Point(97, 173), new Point(21, 97),  new Point(97, 21)],
                         [new Point(97, 21),  new Point(21, 97),  new Point(97, 173)]],

                        [[new Point(21, 97),  new Point(97, 21),  new Point(173, 97)],
                         [new Point(173, 97), new Point(97, 21),  new Point(21, 97)]],

                        [[new Point(97, 21),  new Point(173, 97), new Point(97, 173)],
                         [new Point(97, 173), new Point(173, 97), new Point(97, 21)]]
                    ];
                } else if (scenaName == "Битва замков - союзник в тылу врага (2x2x2)") {
                    settlementsCount                    = 6;
                    settlements_field                   = [
                        new Polygon([new Point(0, 135), new Point(63, 135), new Point(63, 72), new Point(0, 72)].reverse()),
                        new Polygon([new Point(288, 135), new Point(351, 135), new Point(351, 72), new Point(288, 72)].reverse()),
                        new Polygon([new Point(72, 63), new Point(135, 63), new Point(135, 0), new Point(72, 0)].reverse()),
                        new Polygon([new Point(216, 207), new Point(279, 207), new Point(280, 144), new Point(216, 144)].reverse()),
                        new Polygon([new Point(216, 63), new Point(279, 63), new Point(279, 0), new Point(216, 0)].reverse()),
                        new Polygon([new Point(72, 207), new Point(135, 207), new Point(135, 144), new Point(72, 144)].reverse())
                    ];
                    settlements_workers_revivePositions = [
                        [new Point(1, 103)],
                        [new Point(350, 103)],
                        [new Point(103, 1)],
                        [new Point(247, 206)],
                        [new Point(247, 1)],
                        [new Point(103, 206)]];
                    settlements_castle_position         = [
                        new Point(30, 102),
                        new Point(318, 102),
                        new Point(102, 30),
                        new Point(246, 174),
                        new Point(246, 30),
                        new Point(102, 174)];
                    settlements_attack_paths            = [
                        [[new Point(32, 32), new Point(102, 30), new Point(246, 30), new Point(318, 102), new Point(246, 174), new Point(102, 174)],
                         [new Point(102, 30), new Point(246, 30), new Point(318, 102), new Point(246, 174), new Point(102, 174), new Point(32, 175)].reverse()],

                        [[new Point(319, 32), new Point(246, 30), new Point(102, 30), new Point(30, 102), new Point(102, 174), new Point(246, 174)],
                         [new Point(246, 30), new Point(102, 30), new Point(30, 102), new Point(102, 174), new Point(246, 174), new Point(319, 175)].reverse()],

                        [[new Point(175, 32), new Point(246, 30), new Point(318, 102), new Point(246, 174), new Point(102, 174), new Point(30, 102)],
                         [new Point(246, 30), new Point(318, 102), new Point(246, 174), new Point(102, 174), new Point(30, 102), new Point(32, 32)].reverse()],

                        [[new Point(176, 175), new Point(102, 174), new Point(30, 102), new Point(102, 30), new Point(246, 30), new Point(318, 102)],
                         [new Point(102, 174), new Point(30, 102), new Point(102, 30), new Point(246, 30), new Point(318, 102), new Point(319, 175)].reverse()],

                        [[new Point(319, 32), new Point(318, 102), new Point(246, 174), new Point(102, 174), new Point(30, 102), new Point(102, 30)],
                         [new Point(318, 102), new Point(246, 174), new Point(102, 174), new Point(30, 102), new Point(102, 30), new Point(176, 32)].reverse()],

                        [[new Point(32, 175), new Point(30, 102), new Point(102, 30), new Point(246, 30), new Point(318, 102), new Point(246, 174)],
                         [new Point(30, 102), new Point(102, 30), new Point(246, 30), new Point(318, 102), new Point(246, 174), new Point(175, 175)].reverse()]
                    ];
                } else if (scenaName == "Битва замков - царь горы (2-6)") {
                    settlementsCount                    = 6;
                    settlements_field                   = [
                        new Polygon([new Point(156, 157), new Point(156, 162), new Point(140, 164), new Point(140, 155)]),
                        new Polygon([new Point(159, 151), new Point(159, 156), new Point(153, 156), new Point(144, 145), new Point(155, 139)]),
                        new Polygon([new Point(166, 156), new Point(160, 156), new Point(160, 151), new Point(164, 139), new Point(175, 145)]),
                        new Polygon([new Point(163, 157), new Point(179, 155), new Point(179, 164), new Point(163, 162)]),
                        new Polygon([new Point(160, 163), new Point(166, 163), new Point(175, 174), new Point(165, 180), new Point(160, 168)]),
                        new Polygon([new Point(153, 163), new Point(159, 163), new Point(159, 168), new Point(155, 180), new Point(144, 173)])
                    ];
                    settlements_workers_revivePositions = [
                        [new Point(74, 160)],
                        [new Point(118, 88)],
                        [new Point(203, 85)],
                        [new Point(244, 160)],
                        [new Point(201, 231)],
                        [new Point(118, 229)]];
                    settlements_castle_position         = [
                        new Point(151, 158),
                        new Point(154, 152),
                        new Point(161, 152),
                        new Point(164, 158),
                        new Point(161, 164),
                        new Point(154, 164)];
                    settlements_attack_paths            = [
                        [[new Point(162, 167)], [new Point(162, 162)]],
                        [[new Point(156, 163)], [new Point(163, 156)]],
                        [[new Point(156, 157)], [new Point(163, 162)]],
                        [[new Point(157, 157)], [new Point(156, 162)]],
                        [[new Point(156, 162)], [new Point(162, 156)]],
                        [[new Point(156, 157)], [new Point(163, 162)]]
                    ];

                    world.castle_health_coeff = 5;
                } else {
                    return;
                }

                this.log.info("Скрипты для битвы замков активированы");

                world.Init(
                    settlementsCount,
                    settlements_field,
                    settlements_workers_revivePositions,
                    settlements_castle_position,
                    settlements_attack_paths);

                world.RegisterSystem(WordClearSystem, "WordClearSystem");
                world.RegisterSystem(IncomeSystem, "IncomeSystem");
                world.RegisterSystem(SpawnBuildingSystem, "SpawnBuildingSystem");
                world.RegisterSystem(AttackingAlongPathSystem, "AttackingAlongPathSystem");
                world.RegisterSystem(ReviveSystem, "ReviveSystem");
                world.RegisterSystem(UpgradableBuildingSystem_Stage1, "UpgradableBuildingSystem_Stage1");
                world.RegisterSystem(BuffSystem, "BuffSystem");
                world.RegisterSystem(UpgradableBuildingSystem_Stage2, "UpgradableBuildingSystem_Stage2");
                //world.RegisterSystem(HeroAltarSystem, "HeroAltarSystem");
                world.RegisterSystem(UnitProducedSystem, "UnitProducedSystem");
    
                world.gameInit = true;
            }
            
            world.RunSystems(gameTickNum);
    
            if (gameTickNum % 15000 == 0) {
                world.PrintTimeStat();
            }
        }
    };
//};