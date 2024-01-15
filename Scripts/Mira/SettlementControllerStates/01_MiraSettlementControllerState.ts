
abstract class MiraSettlementControllerState {
    protected settlementController: MiraSettlementController;
    
    constructor(settlementController: MiraSettlementController) {
        this.settlementController = settlementController;
    }
    
    abstract OnEntry(): void;
    abstract OnExit(): void;
    abstract Tick(tickNumber: number): void;
}