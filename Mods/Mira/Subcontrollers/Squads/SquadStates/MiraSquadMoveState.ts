import { MiraUtils } from "Mira/Utils/MiraUtils";
import { MiraSquadAttackState } from "./MiraSquadAttackState";
import { MiraSquadIdleState } from "./MiraSquadIdleState";
import { MiraSquadState } from "./MiraSquadState";

export class MiraSquadMoveState extends MiraSquadState {
    private timeoutTick: number;
    
    OnEntry(): void {
        this.initiateMovement();
    }
    
    OnExit(): void {}
    
    Tick(tickNumber: number): void {
        if (this.squad.MovementTargetCell != null) {
            this.initiateMovement();
        }

        if (this.squad.AttackTargetCell != null) {
            this.squad.SetState(new MiraSquadAttackState(this.squad));
            return;
        }
        
        let location = this.squad.GetLocation();
        let distance = MiraUtils.ChebyshevDistance(
            this.squad.CurrentTargetCell, 
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