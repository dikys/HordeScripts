//TODO: add unit types analysis and listing from game configs

class StrategySubcontroller extends MiraSubcontroller {
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

        if (this.currentEnemy.TotalDefeat) {
            this.parentController.Log(MiraLogLevel.Debug, "Enemy defeated");
            this.ResetEnemy();
            return;
        }
    }

    GetArmyComposition(): UnitComposition {
        //TODO: calculate army composition properly based on (discovered) enemy forces
        var unitList: UnitComposition = new Map<string, number>();

        unitList.set("#UnitConfig_Slavyane_Swordmen", 5);
        unitList.set("#UnitConfig_Slavyane_Archer", 5);
        
        return unitList;
    }

    SelectEnemy(): any { //but actually Settlement
        this.currentEnemy = null;
        
        for (var enemy of this.EnemySettlements) {
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

    // Returns one of enemy's production buildings
    //TODO: rework target selection based on current map rules
    GetOffensiveTarget(
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

    OrderAttackersByDangerLevel(): Array<MiraSquad> {
        let castle = this.parentController.Settlement.Units.Professions.MainBuildings.First();

        if (!castle) {
            castle = this.parentController.Settlement.Units.Professions.ProducingBuildings.First();
        }
        
        if (castle) {
            return this.parentController.AttackingSquads.sort(
                (a, b) => {
                    let aLoc = a.GetLocation();
                    let bLoc = b.GetLocation();

                    return MiraUtils.ChebyshevDistance(castle.Cell, {X: aLoc.X, Y: aLoc.Y}) - 
                    MiraUtils.ChebyshevDistance(castle.Cell, {X: bLoc.X, Y: bLoc.Y})
                }
            );
        }
        else {
            return this.parentController.AttackingSquads;
        }
    }
}

//TODO: add reinforcements processing
class TacticalSubcontroller extends MiraSubcontroller {
    private readonly SQUAD_COMBATIVITY_THRESHOLD = 0.25;
    private offensiveSquads: Array<MiraControllableSquad> = [];
    private defensiveSquads: Array<MiraControllableSquad> = [];
    private initialOffensiveSquadCount: number;
    private currentTarget: any; //but actually Unit

    constructor (parent: MiraSettlementController) {
        super(parent);
    }

    public get Player(): any {
        return this.parentController.Player;
    }

    public get OffenseCombativityIndex(): number {
        var combativityIndex = 0;

        for (var squad of this.offensiveSquads) {
            combativityIndex += squad.CombativityIndex;
        }

        return combativityIndex / this.initialOffensiveSquadCount;
    }

    Tick(tickNumber: number): void {
        if (tickNumber % 10 !== 0) {
            return;
        }

        this.updateSquads();

        if (this.currentTarget !== null) { //we are attacking
            var pullbackLocation = this.getPullbackCell();

            if (pullbackLocation) {
                for (var squad of this.offensiveSquads) {
                    if (squad.CombativityIndex < this.SQUAD_COMBATIVITY_THRESHOLD) {
                        if (squad.TargetCell !== pullbackLocation) {
                            squad.Move(pullbackLocation);
                        }
                    }
                }
            }
        }
        else { //we are under attack
            this.updateDefenseTargets();
        }

        for (let squad of this.offensiveSquads) {
            squad.Tick(tickNumber);
        }

        for (let squad of this.defensiveSquads) {
            squad.Tick(tickNumber);
        }
    }

    Attack(target): void {
        this.currentTarget = target;
        this.parentController.Log(MiraLogLevel.Debug, `Selected '${this.currentTarget.Name}' as attack target`);
        this.issueAttackCommand();
    }

    Defend(): void {
        this.currentTarget = null;
        
        let defensiveStrength = 0;
        this.defensiveSquads.forEach((squad) => {defensiveStrength += squad.Strength});

        let enemyStrength = 0;
        this.parentController.AttackingSquads.forEach((squad) => {enemyStrength += squad.Strength});

        if (defensiveStrength < enemyStrength) {
            this.Retreat();
            this.defensiveSquads = [...this.defensiveSquads, ...this.offensiveSquads];
            this.offensiveSquads = [];
        }
    }

    Retreat(): void {
        this.parentController.Log(MiraLogLevel.Debug, `Retreating`);
        var retreatLocation = this.getRetreatCell();

        if (retreatLocation) {
            for (var squad of this.offensiveSquads) {
                squad.Move(retreatLocation);
            }
        }
    }

    ComposeSquads(): void {
        this.parentController.Log(MiraLogLevel.Debug, `Composing squads`);
        
        this.offensiveSquads = [];
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

        var squad = new MiraControllableSquad(combatUnits, this);
        this.offensiveSquads.push(squad);
        this.initialOffensiveSquadCount = this.offensiveSquads.length;

        this.parentController.Log(MiraLogLevel.Debug, `${this.initialOffensiveSquadCount} squads composed`);
    }

    private issueAttackCommand(): void {
        this.parentController.Log(MiraLogLevel.Debug, `Issuing attack command`);
        var nearestPoint = MiraUtils.FindFreeCell(this.currentTarget.Cell);
        this.parentController.Log(MiraLogLevel.Debug, `Nearest point selected: (${nearestPoint.X}, ${nearestPoint.Y})`);

        for (var squad of this.offensiveSquads) {
            this.parentController.Log(MiraLogLevel.Debug, `Squad attacking`);
            squad.Attack(nearestPoint);
        }
    }

    private updateSquads(): void {
        this.offensiveSquads = this.offensiveSquads.filter((squad) => {return squad.Units.length > 0});
        this.defensiveSquads = this.defensiveSquads.filter((squad) => {return squad.Units.length > 0});
    }

    //TODO: use more generic approach to detecting whether unit is combat or not
    private isCombatUnit(unit: any): boolean {
        return ["#UnitConfig_Slavyane_Swordmen", "#UnitConfig_Slavyane_Archer"].indexOf(unit.Cfg.Uid) > -1
    }

    private getPullbackCell(): any {
        var castle = this.parentController.Settlement.Units.Professions.MainBuildings.First();

        if (castle) {
            return castle.Cell;
        }

        return null;
    }

    private getRetreatCell(): any {
        return this.getPullbackCell();
    }

    private updateDefenseTargets(): void {
        let attackers = this.parentController.StrategyController.OrderAttackersByDangerLevel();
        
        let attackerIndex = 0;
        let attackerLocation = attackers[attackerIndex].GetLocation();
        let attackerStrength = attackers[attackerIndex].Strength;
        let accumulatedStrength = 0;
        
        for (let squad of this.defensiveSquads) {
            if (!squad.IsIdle()) {
                continue;
            }
            
            squad.Attack({X: attackerLocation.X, Y: attackerLocation.Y});
            accumulatedStrength += squad.Strength;

            if (accumulatedStrength > attackerStrength) {
                attackerIndex++;

                if (attackerIndex == attackers.length) {
                    return;
                }

                attackerLocation = attackers[attackerIndex].GetLocation();
                attackerStrength = attackers[attackerIndex].Strength;
                accumulatedStrength = 0;
            }
        }
    }
}