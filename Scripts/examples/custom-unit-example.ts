import { createPF, createPoint, createResourcesAmount, Point2D } from "library/common/primitives";
import { DictionaryT } from "library/dotnet/dotnet-types";
import { mergeFlags } from "library/dotnet/dotnet-utils";
import { UnitArmament, UnitDirection, UnitQueryFlag, UnitState } from "library/game-logic/horde-types";
import { UnitProducerProfessionParams, UnitProfession } from "library/game-logic/unit-professions";
import { setUnitStateWorker } from "library/game-logic/workers-tools";
import HordeExampleBase from "./base-example";

/**
 * Пример создания юнита со скриптовым обработчиком движения.
 * Здесь запрограммирован конный арбалетчик, который на ходу стреляет стрелами.
 */
export class Example_CustomUnit extends HordeExampleBase {
    private armament: any;
    private baseMoveWorker: any;

    public constructor() {
        super("Custom unit (арбалетчик)");

        this.armament = createArmamament();
        this.baseMoveWorker = createBaseMoveWorker();
    }


    /**
     * Здесь выполняется создание кастомного юнита (конного арбалетчика) и установка обработчика удара.
     */
    public onFirstRun() {
        this.logMessageOnRun();
        
        // Создание конфига воина
        let unitCfg = this.getOrCreateUnitConfig();

        // Создание и установка обработчика удара
        setUnitStateWorker(this, unitCfg, UnitState.Move, this.moveWorker);

        this.log.info('Настройка воина завершена!');
    }


    /**
     * Создание конфига воина
     */
    private getOrCreateUnitConfig() {
        let exampleCfgUid = "#UnitConfig_Slavyane_Araider_EXAMPLE";
        let unitCfg;
        if (HordeContent.HasUnitConfig(exampleCfgUid)) {
            // Конфиг уже был создан, берем предыдущий
            unitCfg = HordeContent.GetUnitConfig(exampleCfgUid);
            this.log.info('Конфиг воина для теста:', unitCfg);
        } else {
            // Создание нового конфига
            let unitCfgOrig = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Araider");
            unitCfg = HordeContent.CloneConfig(unitCfgOrig, exampleCfgUid);

            // Добавление юнита в конюшню
            let producerCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Stables");
            let producerParams = producerCfg.GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
            let produceList = producerParams.CanProduceList;
            produceList.Add(unitCfg);

            this.log.info('Создан новый конфиг воина для теста:', unitCfg);
        }

        // Настройка
        HordeUtils.setValue(unitCfg, "ProductionTime", 50); // Быстрое производство для теста
        HordeUtils.setValue(unitCfg, "CostResources", createResourcesAmount(150, 200, 50 ,1));

        return unitCfg;
    }


    /**
     * Обработчик состояния Move
     */
    private moveWorker(u: Unit) {
        // Запуск обычного обработчика движения
        this.baseMoveWorker.Work(u);

        // В ScriptData можно хранить произвольные переменные для скрипта, но сначала их туда нужно поместить
        if (u.ScriptData.araiderShoot === undefined) {
            u.ScriptData.araiderShoot = new AraiderShootData();
        }

        // Выстрелить как только пришло время
        if (u.ScriptData.araiderShoot.checkCharge()) {
            const success = this.oneHit(u);
            if (success) {
                u.ScriptData.araiderShoot.setReloadTime(this.armament.ReloadTime);
            }
        }
    }


    /**
     * Выполняет один удар.
     */
    private oneHit(u: Unit) {
        // Временно устанавливаем другое вооружение, для корректного поиска врага
        let prevArmament = u.BattleMind.SelectedArmament;
        HordeUtils.setValue(u.BattleMind, "SelectedArmament", this.armament);

        // Поиск ближайшего врага
        let allowedQueryFlags = mergeFlags(UnitQueryFlag, UnitQueryFlag.CanAttackTarget, UnitQueryFlag.Harmless, UnitQueryFlag.NearDeathUnits);
        let nearestEnemy = u.CommunicationMind.GetNearestEnemy(allowedQueryFlags, this.armament.Range);

        // Был ли найден враг?
        if (!nearestEnemy) {
            // Возвращаем вооружение юнита
            HordeUtils.setValue(u.BattleMind, "SelectedArmament", prevArmament);

            return false;
        }

        // В большинстве случаев для создания снаряда удобно использовать метод "Shot"
        u.BattleMind.SelectedArmament.Shot(u, nearestEnemy, nearestEnemy.Position, nearestEnemy.MapLayer);

        // В некоторых требуется более детальный контроль при создании снаряда, тогда следует использовать следующую функцию:
        //spawnBullet(u, nearestEnemy, araiderArmament, araiderArmament.BulletConfig, araiderArmament.BulletCombatParams, launchPos, targetPos, nearestEnemy.MapLayer);

        // Возвращаем вооружение юнита
        HordeUtils.setValue(u.BattleMind, "SelectedArmament", prevArmament);

        return true;
    }
}



/**
 * Создаёт базовый обработчик движения.
 */
function createBaseMoveWorker() {
    return host.newObj(HCL.HordeClassLibrary.UnitComponents.Workers.BaseUnit.BaseUnitMove);
}


/**
 * Создание дополнительного вооружения для юнита.
 */
function createArmamament() {

    // Смещение арбалета по направлениям
    let gunCoord = host.newObj(DictionaryT(UnitDirection, Point2D));
    gunCoord.Add(UnitDirection.Up, createPoint(3,-10));
    gunCoord.Add(UnitDirection.RightUp, createPoint(5, -5));
    gunCoord.Add(UnitDirection.Right, createPoint(8, -4));
    gunCoord.Add(UnitDirection.RightDown, createPoint(0, 0));
    gunCoord.Add(UnitDirection.Down, createPoint(0, 0));
    gunCoord.Add(UnitDirection.LeftDown, createPoint(0, 0));
    gunCoord.Add(UnitDirection.Left, createPoint(-8, -4));
    gunCoord.Add(UnitDirection.LeftUp, createPoint(-10, -10));

    // Снаряд
    let arrowCfg = HordeContent.GetBulletConfig("#BulletConfig_Arrow");

    // Вооружение
    let armament = UnitArmament.CreateArmament(arrowCfg);
    HordeUtils.setValue(armament.BulletCombatParams, "Damage", 4);
    HordeUtils.setValue(armament.BulletCombatParams, "AdditiveBulletSpeed", createPF(0, 0));
    HordeUtils.setValue(armament, "Range", 7);
    HordeUtils.setValue(armament, "ForestRange", 1);
    HordeUtils.setValue(armament, "RangeMin", 0);
    HordeUtils.setValue(armament, "Levels", 6);
    HordeUtils.setValue(armament, "ReloadTime", 15);
    HordeUtils.setValue(armament, "BaseAccuracy", 8);
    HordeUtils.setValue(armament, "MaxDistanceDispersion", 63);
    HordeUtils.setValue(armament, "DisableDispersion", false);
    HordeUtils.setValue(armament, "GunCoord", gunCoord);
    HordeUtils.setValue(armament, "EmitBulletsCountMin", 1);
    HordeUtils.setValue(armament, "EmitBulletsCountMax", 1);

    return armament;
}

/**
 * Данные стрельбы конного арбалетчика.
 */
class AraiderShootData {
    public reloadTime: number;

    public constructor() {
        this.reloadTime = 0;
    }

    public checkCharge() {
        this.reloadTime--;
        return this.reloadTime <= 0;
    }

    public setReloadTime(ticks: number) {
        this.reloadTime = ticks;
    }
}
