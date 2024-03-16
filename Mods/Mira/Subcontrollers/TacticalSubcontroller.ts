import { MiraLogLevel } from "Mira/Mira";
import { MiraSettlementController, SettlementLocation } from "Mira/MiraSettlementController";
import { eNext, enumerate } from "Mira/Utils/Common";
import { MiraUtils } from "Mira/Utils/MiraUtils";
import { MiraSubcontroller } from "./MiraSubcontroller";
import { MiraControllableSquad } from "./Squads/MiraControllableSquad";

export class TacticalSubcontroller extends MiraSubcontroller {
    private readonly SQUAD_COMBATIVITY_THRESHOLD = 0.25;
    private readonly SQUAD_STRENGTH_THRESHOLD = 100;

    private offensiveSquads: Array<MiraControllableSquad> = [];
    private defensiveSquads: Array<MiraControllableSquad> = [];
    private reinforcementSquads: Array<MiraControllableSquad> = [];
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
        return [...this.offensiveSquads, ...this.defensiveSquads, ...this.reinforcementSquads];
    }

    Tick(tickNumber: number): void {
        if (tickNumber % 10 !== 0) {
            return;
        }

        this.updateSquads();

        if (this.currentTarget) { //we are attacking
            if (this.currentTarget.IsAlive) {
                let pullbackLocation = this.getPullbackLocation();

                for (var squad of this.offensiveSquads) {
                    if (pullbackLocation) {
                        if (squad.CombativityIndex < this.SQUAD_COMBATIVITY_THRESHOLD) {
                            if (!MiraUtils.IsPointsEqual(squad.CurrentTargetCell, pullbackLocation.Center)) {
                                let squadLocation = squad.GetLocation();

                                if (MiraUtils.ChebyshevDistance(squadLocation.Point, pullbackLocation.Center) > pullbackLocation.Radius) {
                                    squad.Move(pullbackLocation.Center, pullbackLocation.Radius);
                                }
                            }
                        }
                    }

                    if (squad.IsIdle() && squad.CombativityIndex >= 1) {
                        squad.Attack(this.currentTarget.Cell);
                    }
                }
            }
        }
        else if (this.parentController.HostileAttackingSquads.length > 0) { //we are under attack
            this.updateDefenseTargets();
        }
        else { //building up or something
            let retreatLocation = this.getRetreatLocation();

            if (retreatLocation) {
                for (let squad of this.AllSquads) {
                    if (squad.IsIdle()) {
                        squad.Move(retreatLocation.Center, retreatLocation.Radius);
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
            this.AllSquads.length == 0
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
        var retreatLocation = this.getRetreatLocation();

        if (retreatLocation) {
            for (var squad of this.offensiveSquads) {
                squad.Move(retreatLocation.Center, retreatLocation.Radius);
            }
        }
    }

    ComposeSquads(): void {
        this.parentController.Log(MiraLogLevel.Debug, `Composing squads`);
        
        this.offensiveSquads = [];
        this.defensiveSquads = [];
        this.reinforcementSquads = [];
        this.unitsInSquads = new Map<string, any>();

        let units = enumerate(this.parentController.Settlement.Units);
        let unit;
        let combatUnits: Array<any> = [];
        
        while ((unit = eNext(units)) !== undefined) {
            if (this.isCombatUnit(unit) && unit.IsAlive) {
                combatUnits.push(unit);
            }
        }

        if (combatUnits.length == 0) {
            return;
        }

        let requiredDefensiveStrength = 0.15 * this.calcTotalUnitsStrength(combatUnits);
        let unitIndex = 0;
        let defensiveUnits: any[] = [];
        let defensiveStrength = 0;
        
        for (unitIndex = 0; unitIndex < combatUnits.length; unitIndex++) {
            if (defensiveStrength >= requiredDefensiveStrength) {
                //unitIndex here will be equal to an index of the last defensive unit plus one
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
        combatUnits = combatUnits.filter((value, index, array) => {return !this.isBuilding(value)});
        this.offensiveSquads = this.createSquadsFromUnits(combatUnits);
        this.initialOffensiveSquadCount = this.offensiveSquads.length;

        this.parentController.Log(MiraLogLevel.Debug, `${this.initialOffensiveSquadCount} offensive squads composed`);
    }

    ReinforceSquads(): void {
        this.reinforceSquadsByFreeUnits();

        this.reinforceSquadsByReinforcementSquads();

        let reinforcements = this.reinforcementSquads.filter((value, index, array) => {return value.CombativityIndex >= 1});
        this.offensiveSquads.push(...reinforcements);

        this.reinforcementSquads = this.reinforcementSquads.filter((value, index, array) => {return value.CombativityIndex < 1});
    }

    private getWeakestReinforceableSquad(checkReinforcements: boolean): MiraControllableSquad | null {
        let weakestSquad = this.findWeakestReinforceableSquad(this.defensiveSquads);

        if (weakestSquad == null) {
            weakestSquad = this.findWeakestReinforceableSquad(this.offensiveSquads, (s) => s.IsIdle());
        }

        if (weakestSquad == null && checkReinforcements) {
            weakestSquad = this.findWeakestReinforceableSquad(this.reinforcementSquads);
        }

        return weakestSquad;
    }

    private findWeakestReinforceableSquad(
        squads: Array<MiraControllableSquad>, 
        squadFilter: ((squad: MiraControllableSquad) => boolean) | null = null
    ): MiraControllableSquad | null {
        let weakestSquad: MiraControllableSquad | null = null;

        for (let squad of squads) {
            if (squadFilter) {
                if (!squadFilter(squad)) {
                    continue;
                }
            }

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

        return weakestSquad;
    }

    private reinforceSquadsByFreeUnits(): void {
        let units = enumerate(this.parentController.Settlement.Units);
        let unit;
        let freeUnits: any[] = [];
        
        while ((unit = eNext(units)) !== undefined) {
            if (
                !this.unitsInSquads.has(unit.Id) &&
                this.isCombatUnit(unit) && 
                !this.isBuilding(unit) && 
                unit.IsAlive
            ) {
                freeUnits.push(unit);
                this.parentController.Log(MiraLogLevel.Debug, `Unit ${unit.ToString()} is marked for reinforcements`);
            }
        }

        if (freeUnits.length == 0) {
            return;
        }

        let weakestSquad = this.getWeakestReinforceableSquad(true);

        if (weakestSquad != null) {
            weakestSquad.AddUnits(freeUnits);
        
            for (let unit of freeUnits) {
                this.unitsInSquads.set(unit.Id, unit);
            }
        }
        else {
            let newSquad = this.createSquad(freeUnits);
            this.reinforcementSquads.push(newSquad);
        }
    }

    private reinforceSquadsByReinforcementSquads(): void {
        let weakestSquad = this.getWeakestReinforceableSquad(false);

        if (!weakestSquad) {
            return;
        }

        let strongestReinforcementIndex: number | null = null;
        let maxStrength = 0;

        for (let i = 0; i < this.reinforcementSquads.length; i++) {
            if (strongestReinforcementIndex == null) {
                strongestReinforcementIndex = i;
                maxStrength = this.reinforcementSquads[i].Strength;
            }

            if (this.reinforcementSquads[i].Strength > maxStrength) {
                strongestReinforcementIndex = i;
                maxStrength = this.reinforcementSquads[i].Strength;
            }
        }

        if (strongestReinforcementIndex != null) {
            let reinforcementSquad = this.reinforcementSquads[strongestReinforcementIndex];
            weakestSquad.AddUnits(reinforcementSquad.Units);
            this.reinforcementSquads.splice(strongestReinforcementIndex, 1);
        }
    }

    private calcTotalUnitsStrength(units: Array<any>): number {
        let totalStrength = 0;
        units.forEach((value, index, array) => {totalStrength += MiraUtils.GetUnitStrength(value)});
        
        return totalStrength;
    }

    private createSquadsFromUnits(units: Array<any>): Array<MiraControllableSquad> {
        let squadUnits: any[] = [];
        let squads: Array<MiraControllableSquad> = [];
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
        this.reinforcementSquads = this.reinforcementSquads.filter((squad) => {return squad.Units.length > 0});
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

    private getPullbackLocation(): SettlementLocation | null {
        return this.parentController.GetSettlementLocation();
    }

    private getRetreatLocation(): SettlementLocation | null {
        return this.getPullbackLocation();
    }

    private updateDefenseTargets(): void {
        let attackers = this.parentController.StrategyController.OrderAttackersByDangerLevel();
        
        let attackerIndex = 0;
        let attackerLocation = attackers[attackerIndex].GetLocation();
        let attackerStrength = attackers[attackerIndex].Strength;
        let accumulatedStrength = 0;

        let settlementLocation = this.parentController.GetSettlementLocation();

        if (!settlementLocation) { //everything is lost :(
            return;
        }

        let settlementCenter = settlementLocation.Center;
        
        for (let squad of this.AllSquads) {
            let distanceToSettlement = MiraUtils.ChebyshevDistance(
                squad.GetLocation().Point,
                settlementCenter
            );

            if (distanceToSettlement > settlementLocation.Radius) {
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