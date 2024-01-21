
class BuildingUpState extends ProductionState {
    protected getTargetUnitsComposition(): UnitComposition {
        return this.settlementController.StrategyController.GetArmyComposition();
    }

    protected onTargetCompositionReached(): void {
        this.settlementController.State = new ExterminatingState(this.settlementController);
    }
}