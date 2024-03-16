import { MiraSquadGatheringUpState } from "./MiraSquadGatheringUpState";
import { MiraSquadIdleState } from "./MiraSquadIdleState";

export class MiraSquadIdleGatheringUpState  extends MiraSquadGatheringUpState {
    protected onGatheredUp(): void {
        this.squad.SetState(new MiraSquadIdleState(this.squad));
    }

    IsIdle(): boolean {
        return true;
    }
}