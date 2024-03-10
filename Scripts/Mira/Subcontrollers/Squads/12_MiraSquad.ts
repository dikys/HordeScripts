
const MIN_INITIAL_SQUAD_STRENGTH = 100;

class MiraSquadLocation {
    Point: {
        X: number;
        Y: number;
    };
    
    Spread: number;

    constructor(x: number, y: number, spread: number) {
        this.Point = {X: x, Y: y};
        this.Spread = spread;
    }
}

class MiraSquad {
    Units: Array<any>; //but actually Unit
    protected location: MiraSquadLocation;

    public get Strength(): number {
        this.cleanup();
        
        let strength = 0;
        
        for (let unit of this.Units) {
            strength += MiraUtils.GetUnitStrength(unit);
        }
        
        return strength;
    }
    
    constructor(units:Array<any>) {
        this.Units = units;
    }

    protected cleanup(): void {
        this.Units = this.Units.filter((unit) => {return unit != null && unit.IsAlive});
    }

    Tick(tickNumber: number): void {
        this.location = null;
        this.cleanup();
    }

    GetLocation(): MiraSquadLocation {
        if (!this.location) {
            this.cleanup();
            
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

    IsAllUnitsIdle(): boolean {
        this.cleanup();

        for (let unit of this.Units) {
            if (!unit.OrdersMind.IsIdle()) {
                return false;
            }
        }

        return true;
    }

    AddUnits(units: Array<any>): void {
        this.cleanup();

        this.Units.push(...units);
        this.location = null;

        this.onUnitsAdded();
    }

    protected onUnitsAdded(): void {
        //do nothing
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

    AttackTargetCell: any; //but actually cell
    MovementTargetCell: any; //but actually cell
    CurrentTargetCell: any; //but actually cell
    MovementPrecision: number;
    public readonly DEFAULT_MOVEMENT_PRECISION = 3;

    constructor(units:Array<any>, controller: TacticalSubcontroller){
        super(units);
        this.controller = controller;
        this.initialStrength = Math.max(this.Strength, MIN_INITIAL_SQUAD_STRENGTH);
        this.recalcMinSpread();

        this.SetState(new MiraSquadIdleState(this));
    }

    Tick(tickNumber: number): void {
        this.location = null;
        this.cleanup();
        this.state.Tick(tickNumber);
    }

    Attack(targetLocation: any, precision?: number): void {
        this.AttackTargetCell = targetLocation;
        this.MovementTargetCell = null;
        this.MovementPrecision = precision ? precision : this.DEFAULT_MOVEMENT_PRECISION;
    }

    Move(location: any, precision?: number): void {
        this.MovementTargetCell = location;
        this.AttackTargetCell = null;
        this.MovementPrecision = precision ? precision : this.DEFAULT_MOVEMENT_PRECISION;
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

    IsEnemyNearby(): boolean {
        let enemies = MiraUtils.GetSettlementUnitsInArea(
            this.GetLocation().Point, 
            ENEMY_SEARCH_RADIUS, 
            this.Controller.EnemySettlements
        );

        return enemies.length > 0;
    }

    private recalcMinSpread(): void {
        this.minSpread = Math.round(Math.sqrt(this.Units.length));
    }

    protected cleanup(): void {
        let unitCount = this.Units.length;
        this.Units = this.Units.filter((unit) => {return unit != null && unit.IsAlive});
        
        if (this.Units.length !== unitCount) {
            this.recalcMinSpread();
        }
    }

    protected onUnitsAdded(): void {
        this.recalcMinSpread();
    }
}