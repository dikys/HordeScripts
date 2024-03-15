//TODO: add unit types analysis and listing from game configs

import { MiraLogLevel } from "Mira/Mira";
import { MiraSettlementController } from "Mira/MiraSettlementController";
import { eNext, enumerate } from "Mira/Utils/Common";
import { UnitComposition, MiraUtils } from "Mira/Utils/MiraUtils";
import { MiraSubcontroller } from "./MiraSubcontroller";
import { MiraSquad } from "./Squads/MiraSquad";

export class StrategySubcontroller extends MiraSubcontroller {
    private currentEnemy: any; //but actually Settlement
    EnemySettlements: Array<any> = []; //but actually Settlement
    
    constructor (parent: MiraSettlementController) {
        super(parent);
        this.buildEnemyList();
    }

    public get Player(): any {
        return this.parentController.Player;
    }

    public get CurrentEnemy(): any {
        return this.currentEnemy;
    }
    
    Tick(tickNumber: number): void {
        if (tickNumber % 10 !== 0) {
            return;
        }

        if (!this.currentEnemy) {
            return;
        }

        if (this.currentEnemy.Existence.IsTotalDefeat) {
            this.parentController.Log(MiraLogLevel.Debug, "Enemy defeated");
            this.ResetEnemy();
            return;
        }
    }

    GetArmyComposition(): UnitComposition {
        if (!this.currentEnemy) {
            this.SelectEnemy();
        }
        
        let requiredOffensiveStrength = this.calcSettlementStrength(this.currentEnemy, true);
        requiredOffensiveStrength = 1.5 * requiredOffensiveStrength;
        requiredOffensiveStrength = Math.ceil(Math.max(requiredOffensiveStrength / 100, 1)) * 100;
        this.parentController.Log(MiraLogLevel.Debug, `Calculated required offensive strength: ${requiredOffensiveStrength}`);

        let currentStrength = this.calcSettlementStrength(this.parentController.Settlement, false);
        this.parentController.Log(MiraLogLevel.Debug, `Current offensive strength: ${currentStrength}`);

        requiredOffensiveStrength -= currentStrength;
        requiredOffensiveStrength = Math.max(requiredOffensiveStrength, 0);
        this.parentController.Log(MiraLogLevel.Debug, `Offensive strength to produce: ${requiredOffensiveStrength}`);

        let produceableCfgIds = this.parentController.ProductionController.GetProduceableCfgIds();
        
        let offensiveCfgIds = produceableCfgIds.filter(
            (value, index, array) => {
                let config = MiraUtils.GetUnitConfig(value)
                return MiraUtils.IsCombatConfig(config) &&
                    config.BuildingConfig == null;
            }
        );
        this.parentController.Log(MiraLogLevel.Debug, `Offensive Cfg IDs: ${offensiveCfgIds}`);

        let unitList = this.makeCombatUnitComposition(offensiveCfgIds, requiredOffensiveStrength);
        
        let unitListStr: string = "";
        unitList.forEach((value, key, map) => {unitListStr += `${key}: ${value}, `});
        this.parentController.Log(MiraLogLevel.Debug, `Offensive unit composition: ${unitListStr}`);

        let requiredDefensiveStrength = 0.15 * requiredOffensiveStrength; //add a bit more for defense purposes
        this.parentController.Log(MiraLogLevel.Debug, `Calculated required defensive strength: ${requiredDefensiveStrength}`);
        
        let defensiveCfgIds = produceableCfgIds.filter(
            (value, index, array) => {
                let config = MiraUtils.GetUnitConfig(value)
                return MiraUtils.IsCombatConfig(config);
            }
        );
        this.parentController.Log(MiraLogLevel.Debug, `Defensive Cfg IDs: ${defensiveCfgIds}`);
        
        let defensiveUnitList = this.makeCombatUnitComposition(defensiveCfgIds, requiredDefensiveStrength);
        unitListStr = "";
        defensiveUnitList.forEach((value, key, map) => {unitListStr += `${key}: ${value}, `});
        this.parentController.Log(MiraLogLevel.Debug, `Defensive unit composition: ${unitListStr}`);

        defensiveUnitList.forEach((value, key, map) => MiraUtils.AddToMapItem(unitList, key, value));
        
        return unitList;
    }

    GetReinforcementCfgIds(): Array<string> {
        let economyComposition = this.parentController.GetCurrentDevelopedEconomyComposition();
        let combatUnitCfgIds = new Array<string>();

        economyComposition.forEach(
            (val, key, map) => {
                let config = MiraUtils.GetUnitConfig(key);
                
                if (
                    MiraUtils.IsCombatConfig(config) &&
                    config.BuildingConfig == null
                ) {
                    combatUnitCfgIds.push(key);
                }
            }
        );

        if (combatUnitCfgIds.length == 0) {
            combatUnitCfgIds.push("#UnitConfig_Slavyane_Swordmen"); //maybe calculate this dynamically based on current configs
        }
        
        return combatUnitCfgIds;
    }

    SelectEnemy(): any { //but actually Settlement
        this.currentEnemy = null;

        let undefeatedEnemies: any[] = [];
        
        for (let enemy of this.EnemySettlements) {
            if (!enemy.Existence.IsTotalDefeat) {
                undefeatedEnemies.push(enemy);
            }
        }

        if (undefeatedEnemies.length > 0) {
            let index = MiraUtils.Random(undefeatedEnemies.length - 1);
            this.currentEnemy = undefeatedEnemies[index];
        }

        return this.currentEnemy;
    }

    ResetEnemy(): void {
        this.currentEnemy = null;
    }

    // Returns one of enemy's production buildings
    //TODO: rework target selection based on current map rules
    GetOffensiveTarget(
        enemySettlement: any //but actually Settlement
    ): any { //but actually Point2D
        if (!enemySettlement.Existence.IsTotalDefeat) {
            var professionCenter = enemySettlement.Units.Professions;
            var productionBuilding = professionCenter.ProducingBuildings.First();
            
            if (productionBuilding) {
                return productionBuilding;
            }
        }

        return null;
    }

    OrderAttackersByDangerLevel(): Array<MiraSquad> {
        let settlementLocation = this.parentController.GetSettlementLocation();
        let settlementCenter = settlementLocation?.Center;

        if (settlementCenter) {
            return this.parentController.HostileAttackingSquads.sort(
                (a, b) => {
                    let aLoc = a.GetLocation();
                    let bLoc = b.GetLocation();

                    return MiraUtils.ChebyshevDistance(settlementCenter, aLoc.Point) - 
                    MiraUtils.ChebyshevDistance(settlementCenter, bLoc.Point)
                }
            );
        }
        else {
            return this.parentController.HostileAttackingSquads;
        }
    }

    private buildEnemyList(): void {
        this.EnemySettlements = [];
        var diplomacy = this.parentController.Settlement.Diplomacy;
        
        var settlements = MiraUtils.GetAllSettlements();
        
        for (var item of settlements) {
            if (diplomacy.IsWarStatus(item)) {
                this.EnemySettlements.push(item);
            }
        }
    }

    private getConfigStrength(unitConfig: any): number {
        if (MiraUtils.IsCombatConfig(unitConfig)) {
            return unitConfig.MaxHealth;
        }
        else {
            return 0;
        }
    }

    private calcSettlementStrength(settlement: any, includeBuildings: boolean): number {
        let units = enumerate(settlement.Units);
        let unit;
        let settlementStrength = 0;
        
        while ((unit = eNext(units)) !== undefined) {
            if (unit.Cfg.BuildingConfig == null || includeBuildings) {
                settlementStrength += MiraUtils.GetUnitStrength(unit);
            }
        }

        return settlementStrength;
    }

    private makeCombatUnitComposition(allowedConfigs: Array<string>, requiredStrength: any): UnitComposition {
        let unitComposition: UnitComposition = new Map<string, number>();

        if (allowedConfigs.length == 0) {
            return unitComposition;
        }

        let currentStrength = 0;

        while (currentStrength < requiredStrength) {
            let index = MiraUtils.Random(allowedConfigs.length - 1);
            let configId = allowedConfigs[index];

            MiraUtils.IncrementMapItem(unitComposition, configId);
            currentStrength += this.getConfigStrength(MiraUtils.GetUnitConfig(configId));
        }

        return unitComposition;
    }
}