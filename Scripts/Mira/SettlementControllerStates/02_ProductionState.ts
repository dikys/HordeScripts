
abstract class ProductionState extends MiraSettlementControllerState {
    private targetUnitsComposition: UnitComposition = new Map<string, number>();

    protected abstract getTargetUnitsComposition(): UnitComposition;
    protected abstract onTargetCompositionReached(): void;
    
    OnEntry(): void {
        this.settlementController.ProductionController.CancelAllProduction();
        this.targetUnitsComposition = this.getTargetUnitsComposition();
        this.refreshTargetProductionLists();
    }

    OnExit(): void {
        //do nothing
    }

    Tick(tickNumber: number): void {
        if (tickNumber % 5 !== 0) {
            return;
        }

        if (tickNumber % 1000 !== 0) {
            if (this.settlementController.IsUnderAttack()) {
                this.settlementController.State = new DefendingState(this.settlementController);
                return;
            }
        }

        this.refreshTargetProductionLists();

        var composition = this.settlementController.GetCurrentEconomyComposition();

        if (MiraUtils.SetContains(composition, this.targetUnitsComposition)) {
            this.onTargetCompositionReached();
        }
    }

    private getRemainingProductionList(): UnitComposition {
        var currentEconomy = this.settlementController.GetCurrentEconomyComposition();
        
        for (var productionListItem of this.settlementController.ProductionController.ProductionList) {
            MiraUtils.IncrementMapItem(currentEconomy, productionListItem);
        }

        var masterMind = this.settlementController.MasterMind;
        var requests = enumerate(masterMind.Requests);
        var request;
        while ((request = eNext(requests)) !== undefined) {
            if (request.RequestedCfg) {
                MiraUtils.IncrementMapItem(currentEconomy, request.RequestedCfg.Uid);
            }
        }

        return MiraUtils.SubstractCompositionLists(this.targetUnitsComposition, currentEconomy);
    }

    private refreshTargetProductionLists(): void {
        var trainingList = this.getRemainingProductionList();
        
        trainingList.forEach(
            (val, key, map) => {
                for (let i = 0; i < val; i++) {
                    this.settlementController.ProductionController.RequestProduction(key);
                }
            }
        );
    }
}