import { MaraSettlementController } from "Mara/MaraSettlementController";
import { FsmState } from "Mara/Utils/Common";

export abstract class MaraSettlementControllerState extends FsmState {
    protected settlementController: MaraSettlementController;
    
    constructor(settlementController: MaraSettlementController) {
        super();
        this.settlementController = settlementController;
    }
}