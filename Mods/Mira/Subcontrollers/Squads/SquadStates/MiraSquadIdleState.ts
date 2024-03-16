import { MiraUtils } from "Mira/Utils/MiraUtils";
import { TileType } from "library/game-logic/horde-types";
import { MiraSquadAttackState } from "./MiraSquadAttackState";
import { MiraSquadBattleState } from "./MiraSquadBattleState";
import { MiraSquadIdleGatheringUpState } from "./MiraSquadIdleGatheringUpState";
import { MiraSquadMoveState } from "./MiraSquadMoveState";
import { MiraSquadState, MIN_SPREAD_THRESHOLD_MULTIPLIER, MAX_SPREAD_THRESHOLD_MULTIPLIER } from "./MiraSquadState";

export class MiraSquadIdleState extends MiraSquadState {
    OnEntry(): void {
        this.squad.CurrentTargetCell = this.squad.GetLocation().Point;
        this.distributeUnits();
    }
    
    OnExit(): void {}

    Tick(tickNumber: number): void {
        if (this.squad.MovementTargetCell != null) {
            this.squad.SetState(new MiraSquadMoveState(this.squad));
            return;
        }

        if (this.squad.AttackTargetCell != null) {
            this.squad.SetState(new MiraSquadAttackState(this.squad));
            return;
        }
        
        if (this.squad.IsEnemyNearby()) {
            this.squad.SetState(new MiraSquadBattleState(this.squad));
            return;
        }
        
        if (
            this.squad.IsAllUnitsIdle() &&
            this.squad.GetLocation().Spread > this.squad.MinSpread * MIN_SPREAD_THRESHOLD_MULTIPLIER
        ) {
            this.squad.SetState(new MiraSquadIdleGatheringUpState(this.squad));
            return;
        }
    }

    IsIdle(): boolean {
        return true;
    }

    private distributeUnits(): void {
        let unitsToDistribute:any[] = [];

        for (let unit of this.squad.Units) {
            let tileType = MiraUtils.GetTileType(unit.Cell);
            
            if (tileType !== TileType.Forest) { //run, Forest, run!!
                unitsToDistribute.push(unit);
            }
            else {
                MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, unit.Cell);
            }
        }

        if (unitsToDistribute.length == 0) {
            return;
        }

        let searchRadius = this.squad.MinSpread * (MAX_SPREAD_THRESHOLD_MULTIPLIER + MIN_SPREAD_THRESHOLD_MULTIPLIER) / 2;
        let forestCells = MiraUtils.FindCells(this.squad.CurrentTargetCell, searchRadius, MiraUtils.ForestCellFilter);
        let cellIndex = 0;

        for (let unit of unitsToDistribute) {
            if (cellIndex >= forestCells.length) {
                MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, this.squad.CurrentTargetCell);
            }
            else {
                MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, forestCells[cellIndex]);
                cellIndex++;
            }
        }
    }
}