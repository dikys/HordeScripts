//TODO: add unit types analysis and listing from game configs

class ArmyCompositionItem {
    UnitConfig: string;
    Count: number;

    constructor(unitConfig: string, count: number) {
        this.UnitConfig = unitConfig;
        this.Count = count;
    }
}

class StrategySubcontroller extends MiraSubcontroller {
    constructor (parent: MiraSettlementController) {
        super(parent);
    }
    
    Tick(tickNumber: number): void {
    }

    GetArmyComposition(): Array<ArmyCompositionItem> {
        //TODO: calculate army composition properly based on (explored) enemy forces
        var unitList: Array<ArmyCompositionItem> = [];

        unitList.push(new ArmyCompositionItem("#UnitConfig_Slavyane_Swordmen", 10));
        unitList.push(new ArmyCompositionItem("#UnitConfig_Slavyane_Archer", 10));
        return unitList;
    }
}