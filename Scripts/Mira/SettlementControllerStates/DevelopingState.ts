
class DevelopingState extends MiraSettlementControllerState {
    private targetUnitsComposition: Array<MiraUnitCompositionItem>;
    
    //TODO: use more generalized approach to initial economy composition
    //TODO:     while doing so maybe redo all cfg references to their ids instead of uids for performance sake
    //TODO: add different opening strategies (maybe through strategy controller)
    OnEntry(): void {
        this.targetUnitsComposition.push(new MiraUnitCompositionItem("UnitConfig_Slavyane_Farm", 5));
        this.targetUnitsComposition.push(new MiraUnitCompositionItem("UnitConfig_Slavyane_Barrack", 1));
        this.targetUnitsComposition.push(new MiraUnitCompositionItem("UnitConfig_Slavyane_Sawmill", 1));

        this.targetUnitsComposition.push(new MiraUnitCompositionItem("UnitConfig_Slavyane_Worker1", 5));

        //TODO: add units composition to the production list
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