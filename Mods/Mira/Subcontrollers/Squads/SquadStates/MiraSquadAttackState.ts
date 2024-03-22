import { MiraUtils } from "Mira/Utils/MiraUtils";
import { MiraSquadBattleState } from "./MiraSquadBattleState";
import { MiraSquadMoveState } from "./MiraSquadMoveState";
import { MAX_SPREAD_THRESHOLD_MULTIPLIER, MiraSquadState } from "./MiraSquadState";
import { MiraSquadIdleState } from "./MiraSquadIdleState";
import { MiraSquadAttackGatheringUpState } from "./MiraSquadAttackGatheringUpState";

export class MiraSquadAttackState extends MiraSquadState {
    OnEntry(): void {
        this.initiateAttack();
    }

    OnExit(): void {}

    Tick(tickNumber: number): void {
        if (this.squad.IsEnemyNearby()) {
            this.squad.SetState(new MiraSquadBattleState(this.squad));
            return;
        }
        
        if (this.squad.MovementTargetCell != null) {
            this.squad.SetState(new MiraSquadMoveState(this.squad));
            return;
        }

        if (this.squad.AttackTargetCell != null) {
            this.initiateAttack();
            return;
        }
        
        let location = this.squad.GetLocation();
        
        let distance = MiraUtils.ChebyshevDistance(
            this.squad.CurrentTargetCell, 
            location.Point
        );

        if (distance <= this.squad.MovementPrecision) {
            this.squad.SetState(new MiraSquadIdleState(this.squad));
            return;
        }

        if (tickNumber % 50 == 0) {
            if (location.Spread > this.squad.MinSpread * MAX_SPREAD_THRESHOLD_MULTIPLIER) {
                this.squad.SetState(new MiraSquadAttackGatheringUpState(this.squad));
                return;
            }
        }
    }
}