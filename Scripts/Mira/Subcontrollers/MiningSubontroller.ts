
class MiningSubcontroller extends MiraSubcontroller {
    //TODO: implement resource mining properly
    private readonly RESOUCE_INCREASE_INTERVAL = 10 * 50;

    constructor (parent: MiraSettlementController) {
        super(parent);
    }

    Tick(tickNumber: number): void {
        if (tickNumber % this.RESOUCE_INCREASE_INTERVAL > 0) {
            return;
        }

        var settlementResources = this.parentController!.Settlement!.Resources;
        var resourceIncrease = createResourcesAmount(100, 100, 100, 10);
        settlementResources.AddResources(resourceIncrease);

        this.parentController.Log(MiraLogLevel.Debug, "Mined resources: " + resourceIncrease.ToString())
    }
}