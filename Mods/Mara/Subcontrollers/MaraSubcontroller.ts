import { MaraSettlementController } from "Mara/MaraSettlementController";

export abstract class MaraSubcontroller {
    protected readonly parentController: MaraSettlementController;

    constructor (parent: MaraSettlementController) {
        this.parentController = parent;
    }

    abstract Tick(tickNumber: number): void;
}