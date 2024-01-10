//TODO: add unit types analysis and listing from game configs

class StrategySubcontroller extends MiraSubcontroller {
    constructor (parent: MiraSettlementController) {
        super(parent);
    }
    
    Tick(tickNumber: number): void {
    }

    GetArmyComposition(): Array<MiraUnitCompositionItem> {
        //TODO: calculate army composition properly based on (discovered) enemy forces
        var unitList: Array<MiraUnitCompositionItem> = [];

        unitList.push(new MiraUnitCompositionItem("#UnitConfig_Slavyane_Swordmen", 10));
        unitList.push(new MiraUnitCompositionItem("#UnitConfig_Slavyane_Archer", 10));
        return unitList;
    }
}