
/* 
    Class that controls the entire life of a single settlement
*/

import { Mira, MiraLogLevel } from "./Mira";
import { RebuildState } from "./SettlementControllerStates/RebuildState";
import { DevelopingState } from "./SettlementControllerStates/DevelopingState";
import { MiraSettlementControllerState } from "./SettlementControllerStates/MiraSettlementControllerState";
import { MiningSubcontroller } from "./Subcontrollers/MiningSubontroller";
import { MiraSubcontroller } from "./Subcontrollers/MiraSubcontroller";
import { ProductionSubcontroller } from "./Subcontrollers/ProductionSubcontroller";
import { MiraSquad } from "./Subcontrollers/Squads/MiraSquad";
import { StrategySubcontroller } from "./Subcontrollers/StrategySubcontroller";
import { TacticalSubcontroller } from "./Subcontrollers/TacticalSubcontroller";
import { eNext, enumerate } from "./Utils/Common";
import { MiraUtils, UnitComposition } from "./Utils/MiraUtils";

class SettlementLocation {
    Center: any;
    Radius: number;

    constructor(center: any, radius: number) {
        this.Center = center;
        this.Radius = radius;
    }
}

export class MiraSettlementController {
    public Settlement: any;
    public MasterMind: any;
    public Player: any;

    public MiningController: MiningSubcontroller;
    public ProductionController: ProductionSubcontroller;
    public StrategyController: StrategySubcontroller;
    public TacticalController: TacticalSubcontroller;
    
    public HostileAttackingSquads: Array<MiraSquad> = [];
    public TargetUnitsComposition: UnitComposition | null = null;
    
    private subcontrollers: Array<MiraSubcontroller> = [];
    private state: MiraSettlementControllerState;
    private nextState: MiraSettlementControllerState | null;
    private currentUnitComposition: UnitComposition | null;
    private currentDevelopedUnitComposition: UnitComposition | null;

    constructor (controlledSettlement, settlementMM, controlledPlayer) {
        this.Settlement = controlledSettlement;
        this.Player = controlledPlayer;
        this.MasterMind = settlementMM;

        if (!this.MasterMind.IsWorkMode) {
            this.Log(MiraLogLevel.Debug, "Engaging MasterMind");
            this.MasterMind.IsWorkMode = true;
        }

        this.subcontrollers = [];

        this.MiningController = new MiningSubcontroller(this);
        this.subcontrollers.push(this.MiningController);

        this.ProductionController = new ProductionSubcontroller(this);
        this.subcontrollers.push(this.ProductionController);

        this.StrategyController = new StrategySubcontroller(this);
        this.subcontrollers.push(this.StrategyController);

        this.TacticalController = new TacticalSubcontroller(this);
        this.subcontrollers.push(this.TacticalController);

        //!! temporary solution
        //!! black magic that fixes mysterious import errors which are not even logged
        //!! TODO: DEAL WITH THIS SHIT SOMEHOW!
        new RebuildState(this);

        this.State = new DevelopingState(this);
    }

    public get State(): MiraSettlementControllerState {
        return this.State;
    }
    
    public set State(value: MiraSettlementControllerState) {
        this.nextState = value;
    }
    
    Tick(tickNumber: number): void {
        this.currentUnitComposition = null;
        this.currentDevelopedUnitComposition = null;

        for (var subcontroller of this.subcontrollers) {
            subcontroller.Tick(tickNumber);
        }
        
        if (this.nextState) {
            if (this.state) {
                this.Log(MiraLogLevel.Debug, "Leaving state " + this.state.constructor.name);
                this.state.OnExit();
            }
            
            this.state = this.nextState;
            this.nextState = null;
            this.Log(MiraLogLevel.Debug, "Entering state " + this.state.constructor.name);
            this.state.OnEntry();
        }

        this.state.Tick(tickNumber);
    }

    Log(level: MiraLogLevel, message: string): void {
        var logMessage = `[${this.Player.Nickname}] ${message}`;
        Mira.Log(level, logMessage);
    }

    GetCurrentEconomyComposition(): UnitComposition {
        if (!this.currentUnitComposition) {
            this.currentUnitComposition = new Map<string, number>();
        
            var units = enumerate(this.Settlement.Units);
            var unit;
            
            while ((unit = eNext(units)) !== undefined) {
                MiraUtils.IncrementMapItem(this.currentUnitComposition, unit.Cfg.Uid);
            }
        }

        return new Map(this.currentUnitComposition);
    }

    GetCurrentDevelopedEconomyComposition(): UnitComposition {
        if (!this.currentDevelopedUnitComposition) {
            this.currentDevelopedUnitComposition = new Map<string, number>();
        
            var units = enumerate(this.Settlement.Units);
            var unit;
            
            while ((unit = eNext(units)) !== undefined) {
                if (unit.EffectsMind.BuildingInProgress || unit.IsNearDeath) {
                    continue;
                }
                
                MiraUtils.IncrementMapItem(this.currentDevelopedUnitComposition, unit.Cfg.Uid);
            }
        }

        return new Map(this.currentDevelopedUnitComposition);
    }

    IsUnderAttack(): boolean {
        //TODO: add enemy detection around expands
        let settlementLocation = this.GetSettlementLocation();

        if (!settlementLocation) {
            return false;
        }

        let enemies = MiraUtils.GetSettlementUnitsInArea(
            settlementLocation.Center, 
            settlementLocation.Radius, 
            this.StrategyController.EnemySettlements
        );
        
        return enemies.length > 0;
    }

    GetEnemiesInArea(cell: any, radius: number): Array<any> {
        return MiraUtils.GetSettlementUnitsInArea(cell, radius, this.StrategyController.EnemySettlements);
    }

    GetSettlementLocation(): SettlementLocation | null {
        let buildings: Array<any> = [];

        var units = enumerate(this.Settlement.Units);
        var unit;
        
        while ((unit = eNext(units)) !== undefined) {
            if (unit.Cfg.BuildingConfig != null) {
                buildings.push(unit);
            }
        }

        if (buildings.length == 0) {
            return null;
        }

        let squad = new MiraSquad(buildings);
        let location = squad.GetLocation();
        let radius = Math.round((location.Spread / 2)) + 10;
        
        return new SettlementLocation(location.Point, radius);
    }
}