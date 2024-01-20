
class DevelopingState extends MiraSettlementControllerState {
    private targetUnitsComposition: UnitComposition = new Map<string, number>();
    private targetBuildingComposition: UnitComposition = new Map<string, number>();
    
    //TODO: use more generalized approach to initial economy composition
    //TODO:     while doing so maybe redo all cfg references to their ids instead of uids for performance sake
    //TODO: add different opening strategies (maybe through strategy controller)
    OnEntry(): void {
        this.settlementController.BuildingController.ClearBuildList();
        this.settlementController.TrainingController.ClearTrainingList();
        
        this.targetBuildingComposition.set("#UnitConfig_Slavyane_Farm", 5);
        this.targetBuildingComposition.set("#UnitConfig_Slavyane_Barrack", 1);
        this.targetBuildingComposition.set("#UnitConfig_Slavyane_Sawmill", 1);

        this.targetUnitsComposition.set("#UnitConfig_Slavyane_Worker1", 5);

        this.refreshTargetBuildLists();
    }

    OnExit(): void {
        //do nothing
    }

    Tick(tickNumber: number): void {
        if (tickNumber % 5 != 0) {
            return;
        }

        this.refreshTargetBuildLists();

        var composition = this.settlementController.GetCurrentEconomyComposition();

        if (
            MiraUtils.SetContains(composition, this.targetUnitsComposition) &&
            MiraUtils.SetContains(composition, this.targetBuildingComposition)
        ) {
            this.settlementController.State = new BuildingUpState(this.settlementController);
        }
    }

    private getRemainingBuildList(): UnitComposition {
        var currentEconomy = this.settlementController.GetCurrentEconomyComposition();
        
        for (var buildListItem of this.settlementController.BuildingController.BuildList) {
            MiraUtils.IncrementMapItem(currentEconomy, buildListItem);
        }

        return MiraUtils.SubstractCompositionLists(this.targetBuildingComposition, currentEconomy);
    }

    private getRemainingTrainingList(): UnitComposition {
        var currentEconomy = this.settlementController.GetCurrentEconomyComposition();
        
        for (var trainingListItem of this.settlementController.TrainingController.TrainingList) {
            MiraUtils.IncrementMapItem(currentEconomy, trainingListItem);
        }

        return MiraUtils.SubstractCompositionLists(this.targetUnitsComposition, currentEconomy);
    }

    private refreshTargetBuildLists(): void {
        var buildList = this.getRemainingBuildList();

        buildList.forEach(
            (val, key, map) => {
                for (let i = 0; i < val; i++) {
                    this.settlementController.BuildingController.AddToBuildList(key);
                }
            }
        );

        var trainingList = this.getRemainingTrainingList();

        trainingList.forEach(
            (val, key, map) => {
                for (let i = 0; i < val; i++) {
                    this.settlementController.TrainingController.AddToTrainingList(key);
                }
            }
        );
    }
}