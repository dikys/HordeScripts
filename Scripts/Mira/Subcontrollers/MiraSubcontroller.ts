import { MiraSettlementController } from "Mira/MiraSettlementController";

export abstract class MiraSubcontroller {
    protected readonly parentController: MiraSettlementController;

    constructor (parent: MiraSettlementController) {
        this.parentController = parent;
    }

    abstract Tick(tickNumber: number): void;
}