//TODO: add unit types analysis and listing from game configs

class StrategySubcontroller extends MiraSubcontroller {
    private readonly SQUAD_COMBATIVITY_THRESHOLD = 0.25;
    private currentEnemy: any; //but actually Settlement
    private enemySettlements: Array<any> = []; //but actually settlement
    private squads: Array<MiraSquad> = [];
    private initialSquadCount: number;
    private currentTarget: any; //but actually Unit
    
    constructor (parent: MiraSettlementController) {
        super(parent);
        this.buildEnemyList();
    }

    public get Player(): any {
        return this.parentController.Player;
    }

    public get CurrentCombativityIndex(): number {
        var combativityIndex = 0;

        for (var squad of this.squads) {
            combativityIndex += squad.CombativityIndex / this.initialSquadCount;
        }

        return combativityIndex;
    }

    public get CurrentEnemy(): any {
        return this.currentEnemy;
    }
    
    Tick(tickNumber: number): void {
        if (tickNumber % 10 !== 0) {
            return;
        }

        this.updateSquads();
        
        var pullbackLocation = this.getPullbackCell();

        if (pullbackLocation) {
            for (var squad of this.squads) {
                if (squad.CombativityIndex < this.SQUAD_COMBATIVITY_THRESHOLD) {
                    squad.Pullback(pullbackLocation);
                }
            }
        }

        if (!this.currentEnemy) {
            return;
        }

        if (this.currentEnemy.TotalDefeat) {
            this.parentController.Log(MiraLogLevel.Debug, "Enemy defeated");
            return;
        }
        
        if (!this.currentTarget?.IsAlive) {
            this.currentTarget = this.getTarget(this.currentEnemy);

            if (this.currentTarget) {
                this.issueAttackCommand();
            }
            else {
                this.parentController.Log(MiraLogLevel.Debug, "No valid targets left to attack");
                this.currentEnemy = null;
            }
        }
    }

    GetArmyComposition(): Array<MiraUnitCompositionItem> {
        //TODO: calculate army composition properly based on (discovered) enemy forces
        var unitList: Array<MiraUnitCompositionItem> = [];

        unitList.push(new MiraUnitCompositionItem("#UnitConfig_Slavyane_Swordmen", 5));
        unitList.push(new MiraUnitCompositionItem("#UnitConfig_Slavyane_Archer", 5));

        //!!DEBUG
        //unitList.push(new MiraUnitCompositionItem("#UnitConfig_Slavyane_Swordmen", 1));
        
        return unitList;
    }

    SelectEnemy(): any { //but actually Settlement
        this.currentEnemy = null;
        
        for (var enemy of this.enemySettlements) {
            if (!enemy.Existence.TotalDefeat) {
                this.currentEnemy = enemy;
                break;
            }
        }

        return this.currentEnemy;
    }

    ResetEnemy(): void {
        this.currentEnemy = null;
    }

    AttackEnemy(): void {
        if (!this.currentEnemy) {
            this.parentController.Log(MiraLogLevel.Warning, "Unable to attack enemy: enemy not selected");
            return;
        }

        if (!this.currentTarget) {
            this.currentTarget = this.getTarget(this.currentEnemy);
            this.parentController.Log(MiraLogLevel.Debug, `Selected '${this.currentTarget.Name}' as attack target`);
        }

        this.composeSquads();
        this.issueAttackCommand();
    }

    Pullback(): void {
        var pullbackLocation = this.getPullbackCell();

        if (pullbackLocation) {
            for (var squad of this.squads) {
                squad.Pullback(pullbackLocation);
            }
        }
    }

    private getPullbackCell(): any {
        var castle = this.parentController.Settlement.Units.Professions.MainBuildings.First();

        if (castle) {
            return castle.Cell;
        }

        return null;
    }

    private issueAttackCommand(): void {
        this.parentController.Log(MiraLogLevel.Debug, `Issuing attack command`);
        var nearestPoint = MiraUtils.FindFreeCell(this.currentTarget.Cell);
        this.parentController.Log(MiraLogLevel.Debug, `Nearest point selected: (${nearestPoint.X}, ${nearestPoint.Y})`);

        for (var squad of this.squads) {
            this.parentController.Log(MiraLogLevel.Debug, `Squad attacking`);
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

        this.squads = this.squads.filter((squad) => {return squad.Units.length > 0});
    }

    private composeSquads(): void {
        this.parentController.Log(MiraLogLevel.Debug, `Composing squads`);
        
        this.squads.length = 0;
        //TODO: compose more than one squad

        var units = enumerate(this.parentController.Settlement.Units);
        var unit;
        var combatUnits: Array<any> = [];
        
        while ((unit = eNext(units)) !== undefined) {
            if (this.isCombatUnit(unit)) {
                combatUnits.push(unit);
                this.parentController.Log(MiraLogLevel.Debug, `Added unit ${unit.Name} into squad`);
            }
        }

        var squad = new MiraSquad(combatUnits, this);
        this.squads.push(squad);
        this.initialSquadCount = this.squads.length;

        this.parentController.Log(MiraLogLevel.Debug, `${this.initialSquadCount} squads composed`);
    }

    //TODO: use more generic approach to detecting whether unit is combat or not
    private isCombatUnit(unit: any): boolean {
        return ["#UnitConfig_Slavyane_Swordmen", "#UnitConfig_Slavyane_Archer"].indexOf(unit.Cfg.Uid) > -1
    }

    // Returns one of enemy's production buildings
    //TODO: rework target selection based on current map rules
    private getTarget(
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