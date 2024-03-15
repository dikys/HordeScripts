import { MiraUtils } from "Mira/Utils/MiraUtils";
import { MiraSquadBattleState } from "./MiraSquadBattleState";
import { MiraSquadState, MIN_SPREAD_THRESHOLD_MULTIPLIER } from "./MiraSquadState";

export abstract class MiraSquadGatheringUpState extends MiraSquadState {
    OnEntry(): void {
        if (this.squad.CurrentTargetCell) {
            let closestToTargetUnit:any = null;
            let minDistance = Infinity;

            for (let unit of this.squad.Units) {
                let unitDistance = MiraUtils.ChebyshevDistance(unit.Cell, this.squad.CurrentTargetCell);
                
                if (unitDistance < minDistance) {
                    minDistance = unitDistance;
                    closestToTargetUnit = unit;
                }
            }

            if (closestToTargetUnit) {
                for (let unit of this.squad.Units) {
                    MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, closestToTargetUnit.Cell);
                }
            }
        }
    }
    
    OnExit(): void {}
    
    Tick(tickNumber: number): void {
        if (this.squad.IsEnemyNearby()) {
            this.squad.SetState(new MiraSquadBattleState(this.squad));
            return;
        }
        
        let location = this.squad.GetLocation();

        if (location.Spread <= this.squad.MinSpread * MIN_SPREAD_THRESHOLD_MULTIPLIER) {
            this.onGatheredUp();
            return;
        }

        if (this.squad.IsAllUnitsIdle()) {
            this.onGatheredUp();
            return;
        }
    }

    protected abstract onGatheredUp(): void;
}