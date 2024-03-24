import { MaraUtils } from "Mara/Utils/MaraUtils";
import { TacticalSubcontroller } from "../TacticalSubcontroller";
import { MaraSquad, MIN_INITIAL_SQUAD_STRENGTH } from "./MaraSquad";
import { MaraSquadIdleState } from "./SquadStates/MaraSquadIdleState";
import { MaraSquadState, ENEMY_SEARCH_RADIUS } from "./SquadStates/MaraSquadState";

export class MaraControllableSquad extends MaraSquad {
    private controller: TacticalSubcontroller;
    private initialStrength: number;
    private state: MaraSquadState;
    private minSpread: number;

    public get MinSpread(): number {
        return this.minSpread;
    }

    public get Controller(): TacticalSubcontroller {
        return this.controller;
    }

    public get CombativityIndex(): number {
        return this.Strength / this.initialStrength;
    }

    AttackTargetCell: any; //but actually cell
    MovementTargetCell: any; //but actually cell
    CurrentTargetCell: any; //but actually cell
    MovementPrecision: number;
    public readonly DEFAULT_MOVEMENT_PRECISION = 3;

    constructor(units:Array<any>, controller: TacticalSubcontroller){
        super(units);
        this.controller = controller;
        this.initialStrength = Math.max(this.Strength, MIN_INITIAL_SQUAD_STRENGTH);
        this.recalcMinSpread();

        this.SetState(new MaraSquadIdleState(this));
    }

    Tick(tickNumber: number): void {
        if (tickNumber % 10 != 0) {
            return;
        }
        
        this.location = null;
        this.cleanup();
        this.state.Tick(tickNumber);
    }

    Attack(targetLocation: any, precision?: number): void {
        this.AttackTargetCell = targetLocation;
        this.MovementTargetCell = null;
        this.MovementPrecision = precision ? precision : this.DEFAULT_MOVEMENT_PRECISION;
    }

    Move(location: any, precision?: number): void {
        this.MovementTargetCell = location;
        this.AttackTargetCell = null;
        this.MovementPrecision = precision ? precision : this.DEFAULT_MOVEMENT_PRECISION;
    }

    SetState(newState: MaraSquadState): void {
        if (this.state) {
            this.state.OnExit();
        }

        this.state = newState;
        this.state.OnEntry();
    }

    IsIdle(): boolean {
        return this.state.IsIdle();
    }

    IsEnemyNearby(): boolean {
        let enemies = MaraUtils.GetSettlementUnitsInArea(
            this.GetLocation().Point, 
            ENEMY_SEARCH_RADIUS, 
            this.Controller.EnemySettlements
        );

        return enemies.length > 0;
    }

    private recalcMinSpread(): void {
        this.minSpread = Math.round(Math.sqrt(this.Units.length));
    }

    protected cleanup(): void {
        let unitCount = this.Units.length;
        this.Units = this.Units.filter((unit) => {return unit != null && unit.IsAlive});
        
        if (this.Units.length !== unitCount) {
            this.recalcMinSpread();
        }
    }

    protected onUnitsAdded(): void {
        this.recalcMinSpread();
    }
}