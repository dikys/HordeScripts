class MiraSquad {
    Units: Array<any> = []; //but actually Unit
    private controller: StrategySubcontroller;
    
    public get Controller(): StrategySubcontroller {
        return this.controller;
    }

    constructor(controller: StrategySubcontroller){
        this.controller = controller;
    }

    Cleanup(): void {
        this.Units = this.Units.filter((unit) => {return !unit.IsAlive});
    }

    Attack(targetLocation: any): void {
        for (var unit of this.Units) {
            MiraUtils.IssueAttackCommand(unit, this.controller.Player, targetLocation);
        }
    }
}