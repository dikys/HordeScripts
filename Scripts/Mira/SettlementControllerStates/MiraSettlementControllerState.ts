import { MiraSettlementController } from "Mira/MiraSettlementController";
import { FsmState } from "Mira/Utils/Common";

export abstract class MiraSettlementControllerState extends FsmState {
    protected settlementController: MiraSettlementController;
    
    constructor(settlementController: MiraSettlementController) {
        super();
        this.settlementController = settlementController;
    }
}