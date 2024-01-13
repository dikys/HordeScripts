
class BuildingUpState extends MiraSettlementControllerState {
    private targetUnitsComposition: Array<MiraUnitCompositionItem>;
    
    OnEntry(): void {
        this.settlementController.BuildingController.ClearBuildList();
        this.settlementController.TrainingController.ClearTrainingList();
        
        this.targetUnitsComposition = this.settlementController.StrategyController.GetArmyComposition();

        for (var compositionItem of this.targetUnitsComposition) {
            for (var i = 0; i < compositionItem.Count; i++) {
                this.settlementController.TrainingController.AddToTrainingList(compositionItem.ConfigId);
            }
        }
    }

    OnExit(): void {
        //do nothing
    }

    Tick(tickNumber: number): void {
        if (tickNumber % 5 != 0) {
            return;
        }

        var composition = this.settlementController.GetCurrentEconomyComposition();

        if (MiraUtils.MapContains(composition, this.targetUnitsComposition)) {
            this.settlementController.State = new ExterminatingState(this.settlementController);
        }
    }
}