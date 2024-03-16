import { MiraSquadAttackState } from "./MiraSquadAttackState";
import { MiraSquadGatheringUpState } from "./MiraSquadGatheringUpState";

export class MiraSquadAttackGatheringUpState extends MiraSquadGatheringUpState {
    protected onGatheredUp(): void {
        this.squad.Attack(this.squad.CurrentTargetCell);
        this.squad.SetState(new MiraSquadAttackState(this.squad));
    }
}