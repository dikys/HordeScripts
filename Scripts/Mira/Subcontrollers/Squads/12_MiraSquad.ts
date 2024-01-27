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
    protected location: MiraSquadLocation;

    public get Strength(): number {
        let strength = 0;
        
        for (let unit of this.Units) {
            strength += unit.Health
        }
        
        return strength;
    }
    
    constructor(units:Array<any>) {
        this.Units = units;
    }

    private cleanup(): void {
        this.Units = this.Units.filter((unit) => {return unit != null && unit.IsAlive});
    }

    Tick(tickNumber: number): void {
        this.location = null;
        this.cleanup();
    }

    GetLocation(): MiraSquadLocation {
        if (!this.location) {
            if (this.Units.length > 0) {
                let uppermostUnit: any = null;
                let lowermostUnit: any = null;
                let leftmostUnit: any = null;
                let rightmostUnit: any = null;

                let avgPosition = {X: 0, Y: 0};
                
                for (let unit of this.Units) {
                    avgPosition.X += unit.Cell.X;
                    avgPosition.Y += unit.Cell.Y;
                    
                    if (uppermostUnit == null) {
                        uppermostUnit = unit;
                    }

                    if (lowermostUnit == null) {
                        lowermostUnit = unit;
                    }

                    if (leftmostUnit == null) {
                        leftmostUnit = unit;
                    }

                    if (rightmostUnit == null) {
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
                    Math.round(avgPosition.X / this.Units.length),
                    Math.round(avgPosition.Y / this.Units.length),
                    spread
                );
            }
            else {
                this.location = new MiraSquadLocation(0, 0, 0);
            }
        }

        return this.location;
    }
}

class MiraControllableSquad extends MiraSquad {
    private controller: TacticalSubcontroller;
    private initialStrength: number;
    private state: MiraSquadState;
    private minSpread: number;

    public get MinSpread(): number {
        return this.minSpread;
    }

    public get Controller(): TacticalSubcontroller {
        return this.controller;
    }

    public get CombativityIndex(): number {
        return this.Strength / this.initialStrength;
    }

    TargetCell: any;
    IsAttackMode: boolean;

    constructor(units:Array<any>, controller: TacticalSubcontroller){
        super(units);
        this.controller = controller;
        this.initialStrength = this.Strength;
        this.recalcMinSpread();

        this.SetState(new MiraSquadIdleState(this));
    }

    Tick(tickNumber: number): void {
        this.location = null;
        this.clean();
        this.state.Tick(tickNumber);
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

    SetState(newState: MiraSquadState): void {
        if (this.state) {
            this.state.OnExit();
        }

        this.state = newState;
        this.state.OnEntry();
    }

    IsIdle(): boolean {
        return this.state.IsIdle();
    }

    private recalcMinSpread(): void {
        this.minSpread = Math.round(Math.sqrt(this.Units.length));
    }

    private clean(): void {
        let unitCount = this.Units.length;
        this.Units = this.Units.filter((unit) => {return unit != null && unit.IsAlive});
        
        if (this.Units.length !== unitCount) {
            this.recalcMinSpread();
        }
    }
}