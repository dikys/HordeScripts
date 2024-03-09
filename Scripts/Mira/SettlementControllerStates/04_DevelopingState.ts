
class DevelopingState extends ProductionState {
    protected readonly MAX_PRODUCTION_TIME = 6000; //2 min
    
    protected getTargetUnitsComposition(): UnitComposition {
        var targetCompostion = new Map<string, number>();
        
        targetCompostion.set("#UnitConfig_Slavyane_Farm", 5);
        targetCompostion.set("#UnitConfig_Slavyane_Worker1", 5);

        let economyComposition = this.settlementController.GetCurrentEconomyComposition();
        let produceableCfgIds = this.settlementController.ProductionController.GetProduceableCfgIds();

        let expansionRequested = false;

        for (let cfgId of produceableCfgIds) {
            if (economyComposition.has(cfgId)) {
                continue;
            }

            if (
                !expansionRequested && (
                    MiraUtils.IsProducerConfig(cfgId) ||
                    MiraUtils.IsTechConfig(cfgId)
                )
            ) {
                expansionRequested = true;

                if (!targetCompostion.has(cfgId)) {
                    targetCompostion.set(cfgId, 1);
                }
            }
        }

        let combatComposition = this.settlementController.StrategyController.GetArmyComposition();
        let estimation = this.settlementController.ProductionController.EstimateProductionTime(combatComposition);

        for (let cfgId of estimation.keys()) {
            if (estimation[cfgId] > this.MAX_PRODUCTION_TIME) {
                let producingCfgIds = this.settlementController.ProductionController.GetProducingCfgIds(cfgId);

                if (producingCfgIds.length > 0) {
                    let index = MiraUtils.Random(producingCfgIds.length - 1);
                    let producerCfgId = producingCfgIds[index];

                    if (!targetCompostion.has(cfgId)) {
                        targetCompostion.set(cfgId, 1);
                    }
                }
            }
        }

        return targetCompostion;
    }

    protected onTargetCompositionReached(): void {
        this.settlementController.State = new BuildingUpState(this.settlementController);
    }
}