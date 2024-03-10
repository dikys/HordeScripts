
class DevelopingState extends ProductionState {
    protected readonly MAX_PRODUCTION_TIME = 6000 / 2; //2 min
    
    protected getTargetUnitsComposition(): UnitComposition {
        var targetCompostion = new Map<string, number>();
        
        targetCompostion.set("#UnitConfig_Slavyane_Farm", 5);
        targetCompostion.set("#UnitConfig_Slavyane_Worker1", 5);

        let economyComposition = this.settlementController.GetCurrentEconomyComposition();
        let produceableCfgIds = this.settlementController.ProductionController.GetProduceableCfgIds();
        let absentProducers = [];
        let absentTech = [];

        for (let cfgId of produceableCfgIds) {
            if (economyComposition.has(cfgId)) {
                continue;
            }

            if (MiraUtils.IsProducerConfig(cfgId)) {
                absentProducers.push(cfgId);
            }
            else if (MiraUtils.IsTechConfig(cfgId)) {
                absentTech.push(cfgId);
            }
        }

        if (absentProducers.length > 0 || absentTech.length > 0) {
            let selectedCfgIds: Array<string>;

            if (absentProducers.length > 0 && absentTech.length > 0) {
                let pick = MiraUtils.Random(100, 1);
                
                if (pick > 70) {
                    selectedCfgIds = absentTech;
                }
                else {
                    selectedCfgIds = absentProducers;
                }
            }
            else if (absentProducers.length > 0) {
                selectedCfgIds = absentProducers;
            }
            else {
                selectedCfgIds = absentTech;
            }
            
            let index = MiraUtils.Random(selectedCfgIds.length - 1);
            MiraUtils.IncrementMapItem(targetCompostion, selectedCfgIds[index]);
        }

        let combatComposition = this.settlementController.StrategyController.GetArmyComposition();
        let estimation = this.settlementController.ProductionController.EstimateProductionTime(combatComposition);

        for (let cfgId of estimation.keys()) {
            if (estimation[cfgId] > this.MAX_PRODUCTION_TIME) {
                let producingCfgIds = this.settlementController.ProductionController.GetProducingCfgIds(cfgId);

                if (producingCfgIds.length > 0) {
                    let index = MiraUtils.Random(producingCfgIds.length - 1);
                    let producerCfgId = producingCfgIds[index];

                    if (!targetCompostion.has(producerCfgId)) {
                        targetCompostion.set(producerCfgId, 1);
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