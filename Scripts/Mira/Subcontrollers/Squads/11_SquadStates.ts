
const MAX_SPREAD_THRESHOLD_MULTIPLIER = 2.8;
const MIN_SPREAD_THRESHOLD_MULTIPLIER = 2;
const ENEMY_SEARCH_RADIUS = 10; //TODO: maybe calculate this by adding some fixed number to a range of a longest range unit in game

abstract class MiraSquadState extends FsmState {
    protected squad: MiraControllableSquad;
    
    constructor(squad: MiraControllableSquad) {
        super();
        this.squad = squad;
    }

    IsIdle(): boolean {
        return false;
    }
}

class MiraSquadIdleState extends MiraSquadState {
    OnEntry(): void {
        this.squad.TargetCell = this.squad.GetLocation().Point;
        this.distributeUnits();

        // this.squad.IsAttackMode = false;
    }
    
    OnExit(): void {}
    
    //TODO: this needs better processing of too large spread, implement different gathering up state
    Tick(tickNumber: number): void {
        if (
            this.squad.IsAllUnitsIdle() &&
            this.squad.GetLocation().Spread > this.squad.MinSpread * MIN_SPREAD_THRESHOLD_MULTIPLIER
        ) {
            this.distributeUnits();
        }
    }

    IsIdle(): boolean {
        return true;
    }

    private distributeUnits(): void {
        let unitsToDistribute = [];

        for (let unit of this.squad.Units) {
            let tileType = MiraUtils.GetTileType(unit.Cell);
            
            if (tileType !== TileType.Forest) { //run, Forest, run!!
                unitsToDistribute.push(unit);
            }
        }

        if (unitsToDistribute.length == 0) {
            return;
        }

        let searchRadius = this.squad.MinSpread * (MAX_SPREAD_THRESHOLD_MULTIPLIER + MIN_SPREAD_THRESHOLD_MULTIPLIER) / 2;
        let forestCells = MiraUtils.FindCells(this.squad.TargetCell, searchRadius, MiraUtils.ForestCellFilter);
        let cellIndex = 0;

        for (let unit of unitsToDistribute) {
            if (cellIndex >= forestCells.length) {
                MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, this.squad.TargetCell);
            }
            else {
                MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, forestCells[cellIndex]);
                cellIndex++;
            }
        }
    }
}

class MiraSquadMoveState extends MiraSquadState {
    private timeoutTick: number;
    
    OnEntry(): void {
        for (let unit of this.squad.Units) {
            MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, this.squad.TargetCell);
        }
    }
    
    OnExit(): void {}
    
    Tick(tickNumber: number): void {
        let location = this.squad.GetLocation();
        let distance = MiraUtils.ChebyshevDistance(
            this.squad.TargetCell, 
            location.Point
        );
        
        if (!this.timeoutTick) {
            this.timeoutTick = tickNumber + distance * 1000 * 3; // given that the speed will be 1 cell/s
        }

        if (this.squad.IsAllUnitsIdle() || tickNumber > this.timeoutTick) { // не шмогли...
            this.squad.SetState(new MiraSquadIdleState(this.squad));
            return;
        }

        if (distance <= this.squad.MovementPrecision) {
            this.squad.SetState(new MiraSquadIdleState(this.squad));
            return;
        }
    }
}

class MiraSquadAttackState extends MiraSquadState {
    OnEntry(): void {
        for (let unit of this.squad.Units) {
            MiraUtils.IssueAttackCommand(unit, this.squad.Controller.Player, this.squad.TargetCell);
        }
    }

    OnExit(): void {}

    Tick(tickNumber: number): void {
        let location = this.squad.GetLocation();
        
        let distance = MiraUtils.ChebyshevDistance(
            this.squad.TargetCell, 
            location.Point
        );

        if (distance <= this.squad.MovementPrecision) {
            this.squad.SetState(new MiraSquadIdleState(this.squad));
            return;
        }

        if (location.Spread > this.squad.MinSpread * MAX_SPREAD_THRESHOLD_MULTIPLIER) {
            this.squad.SetState(new MiraSquadGatheringUpState(this.squad));
            return;
        }
    }
}

class MiraSquadGatheringUpState extends MiraSquadState {
    OnEntry(): void {
        if (this.squad.TargetCell) {
            let closestToTargetUnit = null;
            let minDistance = Infinity;

            for (let unit of this.squad.Units) {
                let unitDistance = MiraUtils.ChebyshevDistance(unit.Cell, this.squad.TargetCell);
                
                if (unitDistance < minDistance) {
                    minDistance = unitDistance;
                    closestToTargetUnit = unit;
                }
            }

            for (let unit of this.squad.Units) {
                MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, closestToTargetUnit.Cell);
            }
        }
    }
    
    OnExit(): void {}
    
    Tick(tickNumber: number): void {
        let location = this.squad.GetLocation();

        if (location.Spread <= this.squad.MinSpread * MIN_SPREAD_THRESHOLD_MULTIPLIER) {
            this.continueMotion();
            return;
        }

        if (this.squad.IsAllUnitsIdle()) {
            this.continueMotion();
            return;
        }
    }

    private continueMotion(): void {
        if (this.squad.IsAttackMode) {
            this.squad.SetState(new MiraSquadAttackState(this.squad));
        }
        else {
            this.squad.SetState(new MiraSquadMoveState(this.squad));
        }
    }
}

class MiraSquadBattleState extends MiraSquadState {
    OnEntry(): void {
        let location = this.squad.GetLocation();
        
        let enemies = MiraUtils.GetSettlementUnitsInArea(
            location.Point, 
            ENEMY_SEARCH_RADIUS, 
            this.squad.Controller.EnemySettlements
        );


    }
    
    OnExit(): void {}
    
    Tick(tickNumber: number): void {
        
    }
}