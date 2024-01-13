//TODO: add unit types analysis and listing from game configs

class StrategySubcontroller extends MiraSubcontroller {
    CurrentEnemy: any; //but actually Settlement

    private enemySettlements: Array<any>; //but actually settlement
    private squads: Array<MiraSquad>;
    private currentTarget: any; //but actually Unit
    
    constructor (parent: MiraSettlementController) {
        super(parent);
        this.buildEnemyList();
    }
    
    Tick(tickNumber: number): void {
        if (tickNumber % 10 !== 0) {
            return;
        }

        this.updateSquads();

        if (!this.CurrentEnemy) {
            return;
        }

        if (this.CurrentEnemy.TotalDefeat) {
            this.parentController.Log(MiraLogLevel.Debug, "enemy defeated");
            return;
        }
        
        if (!this.currentTarget.IsAlive) {
            this.currentTarget = this.getTarget(this.CurrentEnemy);

            if (this.currentTarget) {
                this.issueAttackCommand();
            }
            else {
                //TODO: do something about it
                this.parentController.Log(MiraLogLevel.Debug, "no valid targets left to attack");
            }
        }

        //TODO: detect squad losses and report it
    }

    GetArmyComposition(): Array<MiraUnitCompositionItem> {
        //TODO: calculate army composition properly based on (discovered) enemy forces
        var unitList: Array<MiraUnitCompositionItem> = [];

        unitList.push(new MiraUnitCompositionItem("#UnitConfig_Slavyane_Swordmen", 10));
        unitList.push(new MiraUnitCompositionItem("#UnitConfig_Slavyane_Archer", 10));
        
        return unitList;
    }

    SelectEnemy(): any { //but actually Settlement
        this.CurrentEnemy = null;
        
        for (var enemy of this.enemySettlements) {
            if (!enemy.Existence.TotalDefeat) {
                this.CurrentEnemy = enemy;
                break;
            }
        }

        return this.CurrentEnemy;
    }

    ResetEnemy() {
        this.CurrentEnemy = null;
    }

    AttackEnemy(): void {
        if (!this.CurrentEnemy) {
            this.parentController.Log(MiraLogLevel.Warning, "unable to attack enemy: enemy not selected");
            return;
        }

        if (!this.currentTarget) {
            this.currentTarget = this.getTarget(this.CurrentEnemy);
        }

        this.composeSquads();
        this.issueAttackCommand();
    }

    private issueAttackCommand(): void {
        var nearestPoint = MiraUtils.FindFreeCell(this.currentTarget.Position);
        for (var squad of this.squads) {
            squad.Attack(nearestPoint);
        }
    }

    private buildEnemyList(): void {
        this.enemySettlements = [];
        var diplomacy = this.parentController.Settlement.Diplomacy;
        
        var settlements = MiraUtils.GetAllSettlements();
        
        for (var item of settlements) {
            if (diplomacy.IsWarStatus(item)) {
                this.enemySettlements.push(item);
            }
        }
    }

    private updateSquads(): void {
        for (var squad of this.squads) {
            squad.Cleanup();
        }
    }

    private composeSquads(): void {
        this.squads.length = 0;
        //TODO: compose more than one squad
        var squad = new MiraSquad();
        this.squads.push(squad);

        var units = enumerate(this.parentController.Settlement.Units);
        var unit;
        
        while ((unit = eNext(units)) !== undefined) {
            if (this.isCombatUnit(unit)) {
                squad.Units.push(unit);
            }
        }
    }

    //TODO: use more generic approach to detecting whether unit is combat or not
    private isCombatUnit(unit: any): boolean {
        return ["UnitConfig_Slavyane_Swordmen", "UnitConfig_Slavyane_Archer"].indexOf(unit.Cfg.Uid) > -1
    }

    // Returns one of enemy's production buildings
    //TODO: rework target selection based on current map rules
    getTarget(
        enemySettlement: any //but actually Settlement
    ): any { //but actually Point2D
        if (!enemySettlement.Existence.TotalDefeat) {
            var professionCenter = enemySettlement.Units.Professions;
            var productionBuilding = professionCenter.ProducingBuildings.First();
            
            if (productionBuilding) {
                return productionBuilding;
            }
        }

        return null;
    }
}

class MiraSquad {
    Units: Array<any>; //but actually Unit

    Cleanup(): void {
        this.Units = this.Units.filter((unit) => {return !unit.IsAlive});
    }

    Attack(targetLocation: any): void {

    }
}