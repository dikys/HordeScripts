
class IdleState extends MiraSettlementControllerState {
    OnEntry(): void {
        this.settlementController.Log(MiraLogLevel.Info, "chilling...")
    }

    OnExit(): void {
        //do nothing
    }

    Tick(tickNumber: number): void {
        //do nothing
    }
}