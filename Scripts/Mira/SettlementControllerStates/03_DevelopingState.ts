
class DevelopingState extends MiraSettlementControllerState {
    private targetUnitsComposition: Array<MiraUnitCompositionItem> = [];
    private targetBuildingComposition: Array<MiraUnitCompositionItem> = [];
    
    //TODO: use more generalized approach to initial economy composition
    //TODO:     while doing so maybe redo all cfg references to their ids instead of uids for performance sake
    //TODO: add different opening strategies (maybe through strategy controller)
    OnEntry(): void {
        this.settlementController.BuildingController.ClearBuildList();
        this.settlementController.TrainingController.ClearTrainingList();
        
        this.targetBuildingComposition.push(new MiraUnitCompositionItem("#UnitConfig_Slavyane_Farm", 5));
        this.targetBuildingComposition.push(new MiraUnitCompositionItem("#UnitConfig_Slavyane_Barrack", 1));
        this.targetBuildingComposition.push(new MiraUnitCompositionItem("#UnitConfig_Slavyane_Sawmill", 1));

        this.targetUnitsComposition.push(new MiraUnitCompositionItem("#UnitConfig_Slavyane_Worker1", 5));

        this.refreshBuildLists();

        //!!DEBUG
        // this.targetUnitsComposition.push(new MiraUnitCompositionItem("#UnitConfig_Slavyane_Worker1", 1));
        // this.settlementController.TrainingController.AddToTrainingList("#UnitConfig_Slavyane_Worker1");
    }

    OnExit(): void {
        //do nothing
    }

    //TODO: GetCurrentEconomyComposition() is called 3 times per tick. do something about it
    Tick(tickNumber: number): void {
        if (tickNumber % 5 != 0) {
            return;
        }

        this.refreshBuildLists();

        var composition = this.settlementController.GetCurrentEconomyComposition();

        if (
            MiraUtils.MapContains(composition, this.targetUnitsComposition) &&
            MiraUtils.MapContains(composition, this.targetBuildingComposition)
        ) {
            this.settlementController.State = new BuildingUpState(this.settlementController);
        }
    }

    private getBuildList(): Array<MiraUnitCompositionItem> {
        var currentEconomy = this.settlementController.GetCurrentEconomyComposition();
        
        for (var buildListItem of this.settlementController.BuildingController.BuildList) {
            MiraUtils.IncrementMapItem(currentEconomy, buildListItem);
        }

        return MiraUtils.SubstractCompositionLists(this.targetBuildingComposition, currentEconomy);
    }

    private getTrainingList(): Array<MiraUnitCompositionItem> {
        var currentEconomy = this.settlementController.GetCurrentEconomyComposition();
        
        for (var trainingListItem of this.settlementController.TrainingController.TrainingList) {
            MiraUtils.IncrementMapItem(currentEconomy, trainingListItem);
        }

        return MiraUtils.SubstractCompositionLists(this.targetUnitsComposition, currentEconomy);
    }

    private refreshBuildLists(): void {
        var buildList = this.getBuildList();

        for (var buildItem of buildList) {
            for (var i = 0; i < buildItem.Count; i++) {
                this.settlementController.BuildingController.AddToBuildList(buildItem.ConfigId);
            }
        }

        var trainingList = this.getTrainingList();
        
        for (var trainingItem of trainingList) {
            for (var i = 0; i < trainingItem.Count; i++) {
                this.settlementController.TrainingController.AddToTrainingList(trainingItem.ConfigId);
            }
        }
    }
}