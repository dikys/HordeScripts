
class DevelopingState extends ProductionState {
    protected getTargetUnitsComposition(): UnitComposition {
        var targetCompostion = new Map<string, number>();
        
        targetCompostion.set("#UnitConfig_Slavyane_Farm", 5);
        targetCompostion.set("#UnitConfig_Slavyane_Barrack", 1);
        targetCompostion.set("#UnitConfig_Slavyane_Sawmill", 1);

        targetCompostion.set("#UnitConfig_Slavyane_Worker1", 5);

        return targetCompostion;
    }

    protected onTargetCompositionReached(): void {
        this.settlementController.State = new BuildingUpState(this.settlementController);
    }
}