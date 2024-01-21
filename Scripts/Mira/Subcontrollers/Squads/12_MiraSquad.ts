class MiraSquadLocation {
    X: number;
    Y: number;
    Spread: number;

    constructor(x: number, y: number, spread: number) {
        this.X = x;
        this.Y = y;
        this.Spread = spread;
    }
}

class MiraSquad {
    Units: Array<any>; //but actually Unit
    private controller: StrategySubcontroller;
    private initialUnitCount: number;
    private state: MiraSquadState;
    private minSpread: number;
    private location: MiraSquadLocation;
    
    public get MinSpread(): number {
        return this.minSpread;
    }

    TargetCell: any;
    IsAttackMode: boolean;
    
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
        this.recalcMinSpread();

        this.SetState(new MiraSquadIdleState(this));
    }

    Tick(tickNumber: number): void {
        this.location = null;
        this.cleanup();
        this.state.Tick(tickNumber);
    }

    private cleanup(): void {
        let unitCount = this.Units.length;
        this.Units = this.Units.filter((unit) => {return unit.IsAlive});
        
        if (this.Units.length !== unitCount) {
            this.recalcMinSpread();
        }
    }

    Attack(targetLocation: any): void {
        this.TargetCell = targetLocation;
        this.IsAttackMode = true;
        this.SetState(new MiraSquadAttackState(this));
    }

    Move(location: any): void {
        this.TargetCell = location;
        this.IsAttackMode = false;
        this.SetState(new MiraSquadMoveState(this));
    }

    GetLocation(): MiraSquadLocation {
        if (!this.location) {
            let uppermostUnit: any = null;
            let lowermostUnit: any = null;
            let leftmostUnit: any = null;
            let rightmostUnit: any = null;
            
            for (let unit of this.Units) {
                if (uppermostUnit === null) {
                    uppermostUnit = unit;
                }

                if (lowermostUnit === null) {
                    lowermostUnit = unit;
                }

                if (leftmostUnit === null) {
                    leftmostUnit = unit;
                }

                if (rightmostUnit === null) {
                    rightmostUnit = unit;
                }

                if (unit !== uppermostUnit && unit.Cell.Y < uppermostUnit.Cell.Y) {
                    uppermostUnit = unit;
                }

                if (unit !== lowermostUnit && unit.Cell.Y > lowermostUnit.Cell.Y) {
                    lowermostUnit = unit;
                }

                if (unit !== leftmostUnit && unit.Cell.X < leftmostUnit.Cell.X) {
                    leftmostUnit = unit;
                }

                if (unit !== rightmostUnit && unit.Cell.X > rightmostUnit.Cell.X) {
                    rightmostUnit = unit;
                }
            }

            let verticalSpread = lowermostUnit.Cell.Y - uppermostUnit.Cell.Y;
            let horizontalSpread = rightmostUnit.Cell.X - leftmostUnit.Cell.X;
            let spread = Math.max(verticalSpread, horizontalSpread);

            this.location = new MiraSquadLocation(
                leftmostUnit.Cell.X + Math.round(horizontalSpread / 2),
                uppermostUnit.Cell.Y + Math.round(verticalSpread / 2),
                spread
            );
        }

        return this.location;
    }

    SetState(newState: MiraSquadState): void {
        if (this.state) {
            this.state.OnExit();
        }

        this.state = newState;
        this.state.OnEntry();
    }

    private recalcMinSpread(): void {
        this.minSpread = Math.round(Math.sqrt(this.initialUnitCount));
    }
}
