//TODO: add unit types analysis and listing from game configs

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
        if (tickNumber % 10 != 0) {
            return;
        }

        if (!this.currentEnemy) {
            return;
        }

        if (MiraUtils.IsSettlementDefeated(this.currentEnemy)) {
            this.parentController.Debug(`Enemy defeated`);
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
        this.parentController.Debug(`Calculated required offensive strength: ${requiredOffensiveStrength}`);

        let currentStrength = this.calcSettlementStrength(this.parentController.Settlement, false);
        this.parentController.Debug(`Current offensive strength: ${currentStrength}`);

        requiredOffensiveStrength -= currentStrength;
        requiredOffensiveStrength = Math.max(requiredOffensiveStrength, 0);
        this.parentController.Debug(`Offensive strength to produce: ${requiredOffensiveStrength}`);

        let produceableCfgIds = this.parentController.ProductionController.GetProduceableCfgIds();
        
        let offensiveCfgIds = produceableCfgIds.filter(
            (value, index, array) => {
                let config = MiraUtils.GetUnitConfig(value)
                
                return MiraUtils.IsCombatConfig(config) &&
                    config.BuildingConfig == null;
            }
        );
        this.parentController.Debug(`Offensive Cfg IDs: ${offensiveCfgIds}`);

        let unitList = this.makeCombatUnitComposition(offensiveCfgIds, requiredOffensiveStrength);
        this.parentController.Debug(`Offensive unit composition:`);
        MiraUtils.PrintMap(unitList);

        let requiredDefensiveStrength = 0.15 * requiredOffensiveStrength; //add a bit more for defense purposes
        this.parentController.Debug(`Calculated required defensive strength: ${requiredDefensiveStrength}`);
        
        let defensiveCfgIds = produceableCfgIds.filter(
            (value, index, array) => {
                let config = MiraUtils.GetUnitConfig(value)
                
                return MiraUtils.IsCombatConfig(config);
            }
        );
        this.parentController.Debug(`Defensive Cfg IDs: ${defensiveCfgIds}`);
        
        let defensiveUnitList = this.makeCombatUnitComposition(defensiveCfgIds, requiredDefensiveStrength);
        this.parentController.Debug(`Defensive unit composition:`);
        MiraUtils.PrintMap(defensiveUnitList);

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
            combatUnitCfgIds.push("#UnitConfig_Slavyane_Swordmen"); //TODO: calculate this dynamically based on current configs
        }
        
        return combatUnitCfgIds;
    }

    SelectEnemy(): any { //but actually Settlement
        this.currentEnemy = null;

        let undefeatedEnemies: any[] = this.EnemySettlements.filter((value) => {return !MiraUtils.IsSettlementDefeated(value)});
        
        if (undefeatedEnemies.length > 0) {
            let index = MiraUtils.Random(this.parentController.MasterMind, undefeatedEnemies.length - 1);
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
        if (!MiraUtils.IsSettlementDefeated(enemySettlement)) {
            let professionCenter = enemySettlement.Units.Professions;
            let productionBuilding = professionCenter.ProducingBuildings.First();
            
            return productionBuilding;
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
                        MiraUtils.ChebyshevDistance(settlementCenter, bLoc.Point);
                }
            );
        }
        else {
            return this.parentController.HostileAttackingSquads;
        }
    }

    IsUnderAttack(): boolean {
        //TODO: add enemy detection around expands
        let settlementLocation = this.parentController.GetSettlementLocation();

        if (!settlementLocation) {
            return false;
        }

        let enemies = MiraUtils.GetSettlementUnitsInArea(
            settlementLocation.Center, 
            settlementLocation.Radius, 
            this.EnemySettlements
        );
        
        return enemies.length > 0;
    }

    GetEnemiesInArea(cell: any, radius: number): Array<any> {
        return MiraUtils.GetSettlementUnitsInArea(cell, radius, this.EnemySettlements);
    }

    private buildEnemyList(): void {
        let diplomacy = this.parentController.Settlement.Diplomacy;
        let settlements = MiraUtils.GetAllSettlements();
        this.EnemySettlements = settlements.filter((value) => {return diplomacy.IsWarStatus(value)})
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
            let index = MiraUtils.Random(this.parentController.MasterMind, allowedConfigs.length - 1);
            let configId = allowedConfigs[index];

            MiraUtils.IncrementMapItem(unitComposition, configId);
            currentStrength += MiraUtils.GetConfigStrength(MiraUtils.GetUnitConfig(configId));
        }

        return unitComposition;
    }
}