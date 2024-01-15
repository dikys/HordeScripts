
class BuildingUpState extends MiraSettlementControllerState {
    private targetUnitsComposition: Array<MiraUnitCompositionItem>;
    
    OnEntry(): void {
        this.settlementController.BuildingController.ClearBuildList();
        this.settlementController.TrainingController.ClearTrainingList();
        
        this.targetUnitsComposition = this.settlementController.StrategyController.GetArmyComposition();

        this.refreshBuildLists();
    }

    OnExit(): void {
        //do nothing
    }

    Tick(tickNumber: number): void {
        if (tickNumber % 5 != 0) {
            return;
        }

        this.refreshBuildLists();

        var composition = this.settlementController.GetCurrentEconomyComposition();

        if (MiraUtils.MapContains(composition, this.targetUnitsComposition)) {
            this.settlementController.State = new ExterminatingState(this.settlementController);
        }
    }

    private getTrainingList(): Array<MiraUnitCompositionItem> {
        var currentEconomy = this.settlementController.GetCurrentEconomyComposition();
        
        for (var trainingListItem of this.settlementController.TrainingController.TrainingList) {
            MiraUtils.IncrementMapItem(currentEconomy, trainingListItem);
        }

        return MiraUtils.SubstractCompositionLists(this.targetUnitsComposition, currentEconomy);
    }

    private refreshBuildLists(): void {
        var trainingList = this.getTrainingList();
        
        for (var trainingItem of trainingList) {
            for (var i = 0; i < trainingItem.Count; i++) {
                this.settlementController.TrainingController.AddToTrainingList(trainingItem.ConfigId);
            }
        }
    }
}