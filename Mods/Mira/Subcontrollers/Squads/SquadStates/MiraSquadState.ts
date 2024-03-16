import { FsmState } from "Mira/Utils/Common";
import { MiraUtils } from "Mira/Utils/MiraUtils";
import { MiraControllableSquad } from "../MiraControllableSquad";

export const MAX_SPREAD_THRESHOLD_MULTIPLIER = 2.8;
export const MIN_SPREAD_THRESHOLD_MULTIPLIER = 2;
export const ENEMY_SEARCH_RADIUS = 10; //TODO: maybe calculate this by adding some fixed number to a range of a longest range unit in game


export abstract class MiraSquadState extends FsmState {
    protected squad: MiraControllableSquad;
    
    constructor(squad: MiraControllableSquad) {
        super();
        this.squad = squad;
    }

    IsIdle(): boolean {
        return false;
    }

    protected initiateMovement() {
        this.squad.CurrentTargetCell = this.squad.MovementTargetCell;
        this.squad.MovementTargetCell = null;
        
        for (let unit of this.squad.Units) {
            MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, this.squad.CurrentTargetCell);
        }
    }

    protected initiateAttack() {
        this.squad.CurrentTargetCell = this.squad.AttackTargetCell;
        this.squad.AttackTargetCell = null;
        
        for (let unit of this.squad.Units) {
            MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, this.squad.CurrentTargetCell);
        }
    }
}