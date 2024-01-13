class MiraSquad {
    Units: Array<any>; //but actually Unit
    private controller: StrategySubcontroller;
    private initialUnitCount:number;
    
    public get Controller(): StrategySubcontroller {
        return this.controller;
    }

    public get CombativityIndex(): number {
        return this.Units.length / this.initialUnitCount;
    }

    constructor(units:Array<any>, controller: StrategySubcontroller){
        this.controller = controller;
        this.Units = units;
        this.initialUnitCount = this.Units.length;
    }

    Cleanup(): void {
        this.Units = this.Units.filter((unit) => {return !unit.IsAlive});
    }

    Attack(targetLocation: any): void {
        for (var unit of this.Units) {
            MiraUtils.IssueAttackCommand(unit, this.controller.Player, targetLocation);
        }
    }

    Pullback(location: any): void {
        for (var unit of this.Units) {
            MiraUtils.IssueMoveCommand(unit, this.controller.Player, location);
        }
    }
}