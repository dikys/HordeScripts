
abstract class FsmState {
    abstract OnEntry(): void;
    abstract OnExit(): void;
    abstract Tick(tickNumber: number): void;
}

abstract class MiraSettlementControllerState extends FsmState {
    protected settlementController: MiraSettlementController;
    
    constructor(settlementController: MiraSettlementController) {
        super();
        this.settlementController = settlementController;
    }
}