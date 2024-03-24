//import { createResourcesAmount } from "library/common/primitives";
import { MaraSubcontroller } from "./MaraSubcontroller";
//import { MaraLogLevel } from "Mara/Mara";
import { MaraSettlementController } from "Mara/MaraSettlementController";

export class MiningSubcontroller extends MaraSubcontroller {
    //TODO: implement resource mining properly
    //private readonly RESOUCE_INCREASE_INTERVAL = 10 * 50; // 10 seconds for standard speed

    constructor (parent: MaraSettlementController) {
        super(parent);
    }

    Tick(tickNumber: number): void {
        // if (tickNumber % this.RESOUCE_INCREASE_INTERVAL > 0) {
        //     return;
        // }

        // var settlementResources = this.parentController!.Settlement!.Resources;
        // var resourceIncrease = createResourcesAmount(100, 100, 100, 2);
        // settlementResources.AddResources(resourceIncrease);

        // this.parentController.Log(MaraLogLevel.Debug, "Mined resources: " + resourceIncrease.ToString());
    }
}