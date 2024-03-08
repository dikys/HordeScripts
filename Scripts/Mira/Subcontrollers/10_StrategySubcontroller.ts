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
        let requiredOffensiveStrength = Math.max(this.calcSettlementStrength(this.currentEnemy, true), 100);
        requiredOffensiveStrength *= 1.5;
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
        let economyComposition = this.parentController.GetCurrentEconomyComposition();
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
        let settlementCenter = this.parentController.GetSettlementCenter();

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

class TacticalSubcontroller extends MiraSubcontroller {
    private readonly SQUAD_COMBATIVITY_THRESHOLD = 0.25;
    private readonly SQUAD_STRENGTH_THRESHOLD = 100;

    private offensiveSquads: Array<MiraControllableSquad> = [];
    private defensiveSquads: Array<MiraControllableSquad> = [];
    private initialOffensiveSquadCount: number;
    private unitsInSquads: Map<string, any> = new Map<string, any>();

    private currentTarget: any; //but actually Unit

    constructor (parent: MiraSettlementController) {
        super(parent);
    }

    public get Player(): any {
        return this.parentController.Player;
    }

    public get Settlement(): any {
        return this.parentController.Settlement;
    }

    public get OffenseCombativityIndex(): number {
        var combativityIndex = 0;

        for (var squad of this.offensiveSquads) {
            combativityIndex += squad.CombativityIndex;
        }

        return combativityIndex / this.initialOffensiveSquadCount;
    }

    public get EnemySettlements(): Array<any> {
        return this.parentController.StrategyController.EnemySettlements;
    }

    public get AllSquads(): Array<MiraControllableSquad> {
        return [...this.offensiveSquads, ...this.defensiveSquads];
    }

    Tick(tickNumber: number): void {
        if (tickNumber % 10 !== 0) {
            return;
        }

        this.updateSquads();

        if (this.currentTarget != null) { //we are attacking
            var pullbackLocation = this.getPullbackCell();

            for (var squad of this.offensiveSquads) {
                if (pullbackLocation) {
                    if (squad.CombativityIndex < this.SQUAD_COMBATIVITY_THRESHOLD) {
                        if (squad.MovementTargetCell !== pullbackLocation) {
                            squad.Move(pullbackLocation);
                        }
                    }
                }

                if (squad.IsIdle() && squad.CombativityIndex >= 1) {
                    squad.Attack(this.currentTarget.Cell);
                }
            }
        }
        else if (this.parentController.HostileAttackingSquads.length > 0) { //we are under attack
            this.updateDefenseTargets();
        }
        else { //building up or something
            let retreatCell = this.getRetreatCell();

            if (retreatCell) {
                for (let squad of this.defensiveSquads) {
                    if (squad.IsIdle()) {
                        squad.Move(retreatCell);
                    }
                }
            }
        }

        for (let squad of this.parentController.HostileAttackingSquads) {
            squad.Tick(tickNumber);
        }

        for (let squad of this.AllSquads) {
            squad.Tick(tickNumber);
        }
    }

    Attack(target): void {
        this.currentTarget = target;
        this.parentController.Log(MiraLogLevel.Debug, `Selected '${this.currentTarget.Name}' as attack target`);
        this.issueAttackCommand();
    }

    Defend(): void {
        this.parentController.Log(MiraLogLevel.Debug, `Proceeding to defend`);
        this.currentTarget = null;

        if (
            this.offensiveSquads.length == 0 &&
            this.defensiveSquads.length == 0
        ) {
            this.ComposeSquads();
        }
        
        let defensiveStrength = 0;
        this.defensiveSquads.forEach((squad) => {defensiveStrength += squad.Strength});

        let enemyStrength = 0;
        this.parentController.HostileAttackingSquads.forEach((squad) => {enemyStrength += squad.Strength});

        if (defensiveStrength < enemyStrength) {
            this.parentController.Log(MiraLogLevel.Debug, `Current defense strength ${defensiveStrength} is not enough to counter attack srength ${enemyStrength}`);
            this.Retreat();
        }

        this.updateDefenseTargets();
    }

    Retreat(): void {
        this.parentController.Log(MiraLogLevel.Debug, `Retreating`);
        var retreatLocation = this.getRetreatCell();

        if (retreatLocation) {
            for (var squad of this.offensiveSquads) {
                squad.Move(retreatLocation, this.parentController.SETTLEMENT_RADIUS);
            }
        }
    }

    ComposeSquads(): void {
        this.parentController.Log(MiraLogLevel.Debug, `Composing squads`);
        
        this.offensiveSquads = [];
        this.defensiveSquads = [];
        this.unitsInSquads = new Map<string, any>();

        let units = enumerate(this.parentController.Settlement.Units);
        let unit;
        let combatUnits: Array<any> = [];
        
        while ((unit = eNext(units)) !== undefined) {
            if (this.isCombatUnit(unit)) {
                combatUnits.push(unit);
            }
        }

        if (combatUnits.length == 0) {
            return;
        }

        let requiredDefensiveStrength = 0.15 * this.calcTotalUnitsStrength(combatUnits);
        let unitIndex = 0;
        let defensiveUnits = [];
        let defensiveStrength = 0;
        
        for (unitIndex = 0; unitIndex < combatUnits.length; unitIndex++) {
            if (defensiveStrength >= requiredDefensiveStrength) {
                //unitIndex here will be equal to the index of a last defensive unit plus one
                break;
            }
            
            let unit = combatUnits[unitIndex];

            if (!this.isBuilding(unit)) {
                defensiveUnits.push(unit);
            }

            defensiveStrength += MiraUtils.GetUnitStrength(unit);
        }

        this.defensiveSquads = this.createSquadsFromUnits(defensiveUnits);
        this.parentController.Log(MiraLogLevel.Debug, `${this.defensiveSquads.length} defensive squads composed`);
        
        combatUnits.splice(0, unitIndex);
        combatUnits.filter((value, index, array) => {return !this.isBuilding(value)});
        this.offensiveSquads = this.createSquadsFromUnits(combatUnits);
        this.initialOffensiveSquadCount = this.offensiveSquads.length;

        this.parentController.Log(MiraLogLevel.Debug, `${this.initialOffensiveSquadCount} offensive squads composed`);
    }

    ReinforceSquads(): void {
        let units = enumerate(this.parentController.Settlement.Units);
        let unit;
        let freeUnits = [];
        
        while ((unit = eNext(units)) !== undefined) {
            if (this.isCombatUnit(unit) && !this.isBuilding(unit) && !this.unitsInSquads.has(unit.Id)) {
                freeUnits.push(unit);
                this.parentController.Log(MiraLogLevel.Debug, `Unit ${unit.ToString()} is marked for reinforcements`);
            }
        }

        if (freeUnits.length == 0) {
            return;
        }

        let weakestSquad: MiraControllableSquad = null;

        for (let squad of this.AllSquads) {
            if (squad.CombativityIndex >= 1) {
                continue;
            }
            
            if (weakestSquad == null) {
                weakestSquad = squad;
            }

            if (squad.Strength < weakestSquad.Strength) {
                weakestSquad = squad;
            }
        }

        if (weakestSquad != null) {
            weakestSquad.AddUnits(freeUnits);
        
            for (let unit of freeUnits) {
                this.unitsInSquads.set(unit.Id, unit);
            }
        }
        else {
            let newSquad = this.createSquad(freeUnits);
            this.offensiveSquads.push(newSquad);
        }
    }

    private calcTotalUnitsStrength(units: Array<any>): number {
        let totalStrength = 0;
        units.forEach((value, index, array) => {totalStrength += MiraUtils.GetUnitStrength(value)});
        
        return totalStrength;
    }

    private createSquadsFromUnits(units: Array<any>): Array<MiraControllableSquad> {
        let squadUnits = [];
        let squads = [];
        let currentSquadStrength = 0;

        for (let unit of units) {
            currentSquadStrength += MiraUtils.GetUnitStrength(unit);
            squadUnits.push(unit);
            this.parentController.Log(MiraLogLevel.Debug, `Added unit ${unit.ToString()} into squad`);

            if (currentSquadStrength >= this.SQUAD_STRENGTH_THRESHOLD) {
                let squad = this.createSquad(squadUnits);
                
                squads.push(squad);
                currentSquadStrength = 0;
                squadUnits = [];
            }
        }

        if (squadUnits.length > 0) {
            let squad = this.createSquad(squadUnits);    
            squads.push(squad);
        }
        
        return squads;
    }

    private createSquad(units: Array<any>): MiraControllableSquad {
        let squad = new MiraControllableSquad(units, this);
        
        for (let unit of units) {
            this.unitsInSquads.set(unit.Id, unit);
        }

        return squad;
    }

    private issueAttackCommand(): void {
        this.parentController.Log(MiraLogLevel.Debug, `Issuing attack command`);

        for (var squad of this.offensiveSquads) {
            this.parentController.Log(MiraLogLevel.Debug, `Squad attacking`);
            squad.Attack(this.currentTarget.Cell);
        }
    }

    private updateSquads(): void {
        this.offensiveSquads = this.offensiveSquads.filter((squad) => {return squad.Units.length > 0});
        this.defensiveSquads = this.defensiveSquads.filter((squad) => {return squad.Units.length > 0});
        this.parentController.HostileAttackingSquads = this.parentController.HostileAttackingSquads.filter((squad) => {return squad.Units.length > 0});

        if (this.unitsInSquads != null) {
            let filteredUnits = new Map<string, any>();
            
            this.unitsInSquads.forEach(
                (value, key, map) => {
                    if (value.IsAlive) {
                        filteredUnits.set(key, value)
                    }
                }
            );

            this.unitsInSquads = filteredUnits;
        }
    }

    private isCombatUnit(unit: any): boolean {
        return MiraUtils.IsCombatConfig(unit.Cfg);
    }

    private isBuilding(unit: any): boolean {
        let config = unit.Cfg;

        return config.BuildingConfig != null;
    }

    private getPullbackCell(): any {
        return this.parentController.GetSettlementCenter();
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

        let settlementCenter = this.parentController.GetSettlementCenter();

        if (!settlementCenter) { //everything is lost :(
            return;
        }
        
        for (let squad of this.AllSquads) {
            let distanceToSettlement = MiraUtils.ChebyshevDistance(
                squad.GetLocation().Point,
                settlementCenter
            );

            if (distanceToSettlement > this.parentController.SETTLEMENT_RADIUS) {
                continue;
            }
            
            squad.Attack(attackerLocation.Point);
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