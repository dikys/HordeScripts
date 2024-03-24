import { MaraSettlementControllerState } from "./MaraSettlementControllerState";

export class IdleState extends MaraSettlementControllerState {
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