import { Mira } from "Mira/Mira";
import HordePluginBase from "../plugins/base-plugin";
import { createResourcesAmount } from "library/common/primitives";

export class MiraPlugin extends HordePluginBase {
    public constructor() {
        super("Mira");
    }

    public onFirstRun() {
        Mira.FirstRun();
    }

    public onEveryTick(gameTickNum: number) {
        this.mineResources(gameTickNum);
        Mira.Tick(gameTickNum);
    }

    private mineResources(gameTickNum: number): void {
        const RESOUCE_INCREASE_INTERVAL = 10 * 50; // 10 seconds for standard speed

        if (gameTickNum % RESOUCE_INCREASE_INTERVAL > 0) {
            return;
        }

        let resourceIncrease = createResourcesAmount(100, 100, 100, 2);
        
        for (let controller of Mira.Controllers) {
            let settlementResources = controller.Settlement.Resources;
            settlementResources.AddResources(resourceIncrease);
        }

        Mira.Info("Mined resources for all controllers: " + resourceIncrease.ToString());
    }
}