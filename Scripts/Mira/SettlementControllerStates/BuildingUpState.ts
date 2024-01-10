
class BuildingUpState extends MiraSettlementControllerState {
    private targetUnitsComposition: Array<MiraUnitCompositionItem>;
    
    OnEntry(): void {
        this.targetUnitsComposition = this.settlementController.StrategyController.GetArmyComposition();
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
            //goto BuildUp state
        }
    }
}