import { MiraSettlementControllerState } from "./MiraSettlementControllerState";

export class IdleState extends MiraSettlementControllerState {
    OnEntry(): void {
        this.settlementController.Info(`Chilling...`);
    }

    OnExit(): void {
        //do nothing
    }

    Tick(tickNumber: number): void {
        //do nothing
    }
}