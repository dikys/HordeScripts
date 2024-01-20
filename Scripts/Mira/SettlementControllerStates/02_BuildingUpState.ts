
class BuildingUpState extends MiraSettlementControllerState {
    private targetUnitsComposition: Map<string, number> = new Map<string, number>();
    
    OnEntry(): void {
        this.settlementController.BuildingController.ClearBuildList();
        this.settlementController.TrainingController.ClearTrainingList();
        
        this.targetUnitsComposition = this.settlementController.StrategyController.GetArmyComposition();

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

        if (MiraUtils.SetContains(composition, this.targetUnitsComposition)) {
            this.settlementController.State = new ExterminatingState(this.settlementController);
        }
    }

    private getRemainingTrainingList(): Map<string, number> {
        var currentEconomy = this.settlementController.GetCurrentEconomyComposition();
        
        for (var trainingListItem of this.settlementController.TrainingController.TrainingList) {
            MiraUtils.IncrementMapItem(currentEconomy, trainingListItem);
        }

        return MiraUtils.SubstractCompositionLists(this.targetUnitsComposition, currentEconomy);
    }

    private refreshTargetBuildLists(): void {
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