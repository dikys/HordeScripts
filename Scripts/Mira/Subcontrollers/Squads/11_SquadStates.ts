
const MAX_SPREAD_THRESHOLD_MULTIPLIER = 2.8;
const MIN_SPREAD_THRESHOLD_MULTIPLIER = 2;
const ENEMY_SEARCH_RADIUS = 10; //TODO: maybe calculate this by adding some fixed number to a range of a longest range unit in game

abstract class MiraSquadState extends FsmState {
    protected squad: MiraControllableSquad;
    
    constructor(squad: MiraControllableSquad) {
        super();
        this.squad = squad;
    }

    IsIdle(): boolean {
        return false;
    }

    protected initiateMovement() {
        this.squad.CurrentTargetCell = this.squad.MovementTargetCell;
        this.squad.MovementTargetCell = null;
        
        for (let unit of this.squad.Units) {
            MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, this.squad.CurrentTargetCell);
        }
    }

    protected initiateAttack() {
        this.squad.CurrentTargetCell = this.squad.AttackTargetCell;
        this.squad.AttackTargetCell = null;
        
        for (let unit of this.squad.Units) {
            MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, this.squad.CurrentTargetCell);
        }
    }
}

class MiraSquadIdleState extends MiraSquadState {
    OnEntry(): void {
        if (!this.squad.CurrentTargetCell) {
            this.squad.CurrentTargetCell = this.squad.GetLocation().Point;
        }
        
        this.distributeUnits();
    }
    
    OnExit(): void {}

    Tick(tickNumber: number): void {
        if (this.squad.MovementTargetCell != null) {
            this.squad.SetState(new MiraSquadMoveState(this.squad));
            return;
        }

        if (this.squad.AttackTargetCell != null) {
            this.squad.SetState(new MiraSquadAttackState(this.squad));
            return;
        }
        
        if (this.squad.IsEnemyNearby()) {
            this.squad.SetState(new MiraSquadBattleState(this.squad));
            return;
        }
        
        if (
            this.squad.IsAllUnitsIdle() &&
            this.squad.GetLocation().Spread > this.squad.MinSpread * MIN_SPREAD_THRESHOLD_MULTIPLIER
        ) {
            this.squad.SetState(new MiraSquadIdleGatheringUpState(this.squad));
            return;
        }
    }

    IsIdle(): boolean {
        return true;
    }

    private distributeUnits(): void {
        let unitsToDistribute = [];

        for (let unit of this.squad.Units) {
            let tileType = MiraUtils.GetTileType(unit.Cell);
            
            if (tileType !== TileType.Forest) { //run, Forest, run!!
                unitsToDistribute.push(unit);
            }
            else {
                MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, unit.Cell);
            }
        }

        if (unitsToDistribute.length == 0) {
            return;
        }

        let searchRadius = this.squad.MinSpread * (MAX_SPREAD_THRESHOLD_MULTIPLIER + MIN_SPREAD_THRESHOLD_MULTIPLIER) / 2;
        let forestCells = MiraUtils.FindCells(this.squad.CurrentTargetCell, searchRadius, MiraUtils.ForestCellFilter);
        let cellIndex = 0;

        for (let unit of unitsToDistribute) {
            if (cellIndex >= forestCells.length) {
                MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, this.squad.CurrentTargetCell);
            }
            else {
                MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, forestCells[cellIndex]);
                cellIndex++;
            }
        }
    }
}

class MiraSquadMoveState extends MiraSquadState {
    private timeoutTick: number;
    
    OnEntry(): void {
        this.initiateMovement();
    }
    
    OnExit(): void {}
    
    Tick(tickNumber: number): void {
        if (this.squad.MovementTargetCell != null) {
            this.initiateMovement();
        }

        if (this.squad.AttackTargetCell != null) {
            this.squad.SetState(new MiraSquadAttackState(this.squad));
            return;
        }
        
        let location = this.squad.GetLocation();
        let distance = MiraUtils.ChebyshevDistance(
            this.squad.CurrentTargetCell, 
            location.Point
        );
        
        if (!this.timeoutTick) {
            this.timeoutTick = tickNumber + distance * 1000 * 3; // given that the speed will be 1 cell/s
        }

        if (this.squad.IsAllUnitsIdle() || tickNumber > this.timeoutTick) { // не шмогли...
            this.squad.SetState(new MiraSquadIdleState(this.squad));
            return;
        }

        if (distance <= this.squad.MovementPrecision) {
            this.squad.SetState(new MiraSquadIdleState(this.squad));
            return;
        }
    }
}

class MiraSquadAttackState extends MiraSquadState {
    OnEntry(): void {
        this.initiateAttack();
    }

    OnExit(): void {}

    Tick(tickNumber: number): void {
        if (this.squad.IsEnemyNearby()) {
            this.squad.SetState(new MiraSquadBattleState(this.squad));
            return;
        }
        
        if (this.squad.MovementTargetCell != null) {
            this.squad.SetState(new MiraSquadMoveState(this.squad));
            return;
        }

        if (this.squad.AttackTargetCell != null) {
            this.initiateAttack();
            return;
        }
        
        let location = this.squad.GetLocation();
        
        let distance = MiraUtils.ChebyshevDistance(
            this.squad.CurrentTargetCell, 
            location.Point
        );

        if (distance <= this.squad.MovementPrecision) {
            this.squad.SetState(new MiraSquadIdleState(this.squad));
            return;
        }

        if (location.Spread > this.squad.MinSpread * MAX_SPREAD_THRESHOLD_MULTIPLIER) {
            this.squad.SetState(new MiraSquadAttackGatheringUpState(this.squad));
            return;
        }
    }
}

abstract class MiraSquadGatheringUpState extends MiraSquadState {
    OnEntry(): void {
        if (this.squad.CurrentTargetCell) {
            let closestToTargetUnit = null;
            let minDistance = Infinity;

            for (let unit of this.squad.Units) {
                let unitDistance = MiraUtils.ChebyshevDistance(unit.Cell, this.squad.CurrentTargetCell);
                
                if (unitDistance < minDistance) {
                    minDistance = unitDistance;
                    closestToTargetUnit = unit;
                }
            }

            for (let unit of this.squad.Units) {
                MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, closestToTargetUnit.Cell);
            }
        }
    }
    
    OnExit(): void {}
    
    Tick(tickNumber: number): void {
        if (this.squad.IsEnemyNearby()) {
            this.squad.SetState(new MiraSquadBattleState(this.squad));
            return;
        }
        
        let location = this.squad.GetLocation();

        if (location.Spread <= this.squad.MinSpread * MIN_SPREAD_THRESHOLD_MULTIPLIER) {
            this.onGatheredUp();
            return;
        }

        if (this.squad.IsAllUnitsIdle()) {
            this.onGatheredUp();
            return;
        }
    }

    protected abstract onGatheredUp(): void;
}

class MiraSquadAttackGatheringUpState extends MiraSquadGatheringUpState {
    protected onGatheredUp(): void {
        this.squad.AttackTargetCell = this.squad.CurrentTargetCell;
        this.squad.SetState(new MiraSquadAttackState(this.squad));
    }
}

class MiraSquadIdleGatheringUpState  extends MiraSquadGatheringUpState {
    protected onGatheredUp(): void {
        this.squad.SetState(new MiraSquadIdleState(this.squad));
    }

    IsIdle(): boolean {
        return true;
    }
}

abstract class MiraCellDataHolder {
    protected data: any;
    
    constructor () {
        this.Clear();
    }

    abstract Get(cell: any): any;
    abstract Set(cell: any, value: any): void;

    Clear(): void {
        this.data = {};
    }

    protected makeIndex(cell: any): string {
        return `(${cell.X},${cell.Y})`;
    }
}

class MiraThreatMap extends MiraCellDataHolder {
    constructor () {
        super();
    }

    Get(cell: any): any {
        let index = this.makeIndex(cell);
        return (this.data[index] ?? 0);
    }

    Set(cell: any, value: any) {
        let index = this.makeIndex(cell);
        this.data[index] = value;
    }

    Add(cell: any, value: any): void {
        let index = this.makeIndex(cell);
        let threat = (this.data[index] ?? 0) + value;
        this.data[index] = threat;
    }
}

class MiraCellHeuristics extends MiraCellDataHolder {
    constructor () {
        super();
    }

    Get(cell: any): any {
        let index = this.makeIndex(cell);
        return this.data[index];
    }

    Set(cell: any, value: any) {
        let index = this.makeIndex(cell);
        this.data[index] = value;
    }
}

class MiraReservedCellData extends MiraCellDataHolder {
    constructor () {
        super();
    }

    Get(cell: any): any {
        let index = this.makeIndex(cell);
        return (this.data[index] ?? false);
    }

    Set(cell: any, value: any) {
        let index = this.makeIndex(cell);
        this.data[index] = value;
    }
}

class MiraSquadBattleState extends MiraSquadState {
    private enemySquads: Array<MiraSquad>;
    private enemyUnits: Array<any>;
    private threatMap: MiraThreatMap;
    private cellHeuristics: MiraCellHeuristics;
    private reservedCells: MiraReservedCellData;
    
    OnEntry(): void {
        this.updateThreats();
    }
    
    OnExit(): void {}
    
    Tick(tickNumber: number): void {
        if (tickNumber % 10 != 0) {
            return;
        }

        if (this.squad.MovementTargetCell != null) {
            this.squad.SetState(new MiraSquadMoveState(this.squad));
            return;
        }

        this.updateThreats();

        if (this.enemyUnits.length == 0) {
            this.squad.AttackTargetCell = this.squad.CurrentTargetCell;
            this.squad.SetState(new MiraSquadAttackState(this.squad));
            return;
        }

        // Temporarily (?) disable proper micro because of it being slow as hell
        //this.distributeTargets();
        this.distributeTargets_lite();
    }

    private updateThreats(): void {
        let location = this.squad.GetLocation();
        
        let enemies = MiraUtils.GetSettlementUnitsInArea(
            location.Point, 
            ENEMY_SEARCH_RADIUS, 
            this.squad.Controller.EnemySettlements
        );

        this.enemySquads = MiraUtils.GetSettlementsSquadsFromUnits(
            enemies, 
            this.squad.Controller.EnemySettlements
        );

        this.enemyUnits = [];

        for (let squad of this.enemySquads) {
            this.enemyUnits.push(...squad.Units);
        }

        this.updateThreatMap();
    }

    private updateThreatMap(): void {
        this.threatMap = new MiraThreatMap();

        for (let unit of this.enemyUnits) {
            this.addUnitThreatToMap(unit);
        }
    }

    private addUnitThreatToMap(unit: any): void {
        if (!unit.Cfg.MainArmament) {
            return;
        }

        //TODO: this should also process second armament
        let target = MiraUtils.GetUnitTarget(unit);

        if (target) {
            let unitDps = unit.Cfg.MainArmament.BulletCombatParams.Damage;

            if (unit.Cfg.MainArmament.MaxDistanceDispersion > 0) {
                MiraUtils.ForEachCell(target.Cell, 1, (cell) => {
                    this.threatMap.Add(cell, unitDps);
                });
            }
            else {
                this.threatMap.Add(target.Cell, unitDps);
            }
        }
    }

    private distributeTargets(): void {
        this.reservedCells = new MiraReservedCellData();
        
        for (let unit of this.squad.Units) {
            let optimalTarget = null;
            this.cellHeuristics = new MiraCellHeuristics();

            let mainAttackRange = unit.Cfg.MainArmament.Range;
            let forestAttackRange = unit.Cfg.MainArmament.ForestRange;
            
            let mainVisionRange = unit.Cfg.Sight;
            let forestVisionRange = unit.Cfg.ForestVision;
            
            for (let enemy of this.enemyUnits) {
                if (!unit.BattleMind.CanAttackTarget(enemy)) {
                    continue;
                }

                if (this.squad.Controller.Settlement.Vision.CanSeeUnit(enemy)) {
                    mainVisionRange = Infinity;
                    forestVisionRange = Infinity;
                }
                
                let maxCol = enemy.Cell.X + enemy.Rect.Width;
                let maxRow = enemy.Cell.Y + enemy.Rect.Height;

                for (let row = enemy.Cell.Y; row < maxRow; row++) {
                    for (let col = enemy.Cell.X; col < maxCol; col++) {
                        let analyzedCell = {X: col, Y: row};
                        let analyzedCellDistance = MiraUtils.ChebyshevDistance(unit.Cell, analyzedCell);

                        let atttackRadius = 0;

                        if (MiraUtils.GetTileType(analyzedCell) == TileType.Forest) {
                            atttackRadius = Math.min(forestAttackRange, forestVisionRange);
                        }
                        else {
                            atttackRadius = Math.min(mainAttackRange, mainVisionRange);
                        }

                        MiraUtils.ForEachCell(analyzedCell, atttackRadius, (cell) => {
                            if (MiraUtils.ChebyshevDistance(unit.Cell, cell) > analyzedCellDistance) {
                                return;
                            }
                            
                            let heuristic = this.cellHeuristics.Get(cell);
                            
                            if (heuristic == null) {
                                heuristic = this.calcCellHeuristic(cell, unit);
                                this.cellHeuristics.Set(cell, heuristic);
                            }

                            let targetData = {cell: cell, heuristic: heuristic, target: enemy};

                            if (optimalTarget == null) {
                                optimalTarget = targetData;
                            }
                            else if (targetData.heuristic < optimalTarget.heuristic) {
                                if (MiraUtils.IsCellReachable(cell, unit)) {
                                    optimalTarget = targetData;
                                }
                            }
                            else if (targetData.heuristic == optimalTarget.heuristic) {
                                if (targetData.target.Health < optimalTarget.target.Health) {
                                    if (MiraUtils.IsCellReachable(cell, unit)) {
                                        optimalTarget = targetData;
                                    }
                                }
                            }
                        });
                    }
                }
            }

            if (optimalTarget) {
                let attackCell = optimalTarget.target.MoveToCell ?? optimalTarget.target.Cell;
                
                if (optimalTarget.heuristic < Infinity) {
                    if (MiraUtils.ChebyshevDistance(unit.Cell, optimalTarget.cell) > 0) {
                        MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, optimalTarget.cell);
                        MiraUtils.IssueAttackCommand(unit, this.squad.Controller.Player, attackCell, false);
                        this.reservedCells.Set(optimalTarget.cell, true);
                    }
                    else {
                        MiraUtils.IssueAttackCommand(unit, this.squad.Controller.Player, attackCell);
                    }
                }
                else {
                    let nearestFreeCell = MiraUtils.FindFreeCell(attackCell);
                    
                    if (nearestFreeCell) {
                        MiraUtils.IssueAttackCommand(unit, this.squad.Controller.Player, nearestFreeCell);
                    }
                }
            }
            else {
                MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, unit.Cell);
            }
        }
    }

    private distributeTargets_lite(): void {
        this.reservedCells = new MiraReservedCellData();
        
        for (let unit of this.squad.Units) {
            let optimalTarget = null;
            this.cellHeuristics = new MiraCellHeuristics();

            let mainAttackRange = unit.Cfg.MainArmament.Range;
            let forestAttackRange = unit.Cfg.MainArmament.ForestRange;
            
            let mainVisionRange = unit.Cfg.Sight;
            let forestVisionRange = unit.Cfg.ForestVision;

            let optimalEnemy = null;
            let shortestDistance = Infinity;
            
            for (let enemy of this.enemyUnits) {
                if (!unit.BattleMind.CanAttackTarget(enemy) || !enemy.IsAlive) {
                    continue;
                }

                let distance = MiraUtils.ChebyshevDistance(unit.Cell, enemy.Cell);

                if (distance <= shortestDistance) {
                    if (distance < shortestDistance) {
                        optimalEnemy = enemy;
                    }
                    else if (enemy.Health < optimalEnemy.Health) {
                        optimalEnemy = enemy;
                    }
                    
                    shortestDistance = distance;
                }
            }

            if (optimalEnemy) {
                if (this.squad.Controller.Settlement.Vision.CanSeeUnit(optimalEnemy)) {
                    mainVisionRange = Infinity;
                    forestVisionRange = Infinity;
                }
                
                let maxCol = optimalEnemy.Cell.X + optimalEnemy.Rect.Width;
                let maxRow = optimalEnemy.Cell.Y + optimalEnemy.Rect.Height;
    
                for (let row = optimalEnemy.Cell.Y; row < maxRow; row++) {
                    for (let col = optimalEnemy.Cell.X; col < maxCol; col++) {
                        let analyzedCell = {X: col, Y: row};
                        let analyzedCellDistance = MiraUtils.ChebyshevDistance(unit.Cell, analyzedCell);
    
                        let atttackRadius = 0;
    
                        if (MiraUtils.GetTileType(analyzedCell) == TileType.Forest) {
                            atttackRadius = Math.min(forestAttackRange, forestVisionRange);
                        }
                        else {
                            atttackRadius = Math.min(mainAttackRange, mainVisionRange);
                        }
    
                        MiraUtils.ForEachCell(analyzedCell, atttackRadius, (cell) => {
                            if (MiraUtils.ChebyshevDistance(unit.Cell, cell) > analyzedCellDistance) {
                                return;
                            }
                            
                            let heuristic = this.cellHeuristics.Get(cell);
                            
                            if (heuristic == null) {
                                heuristic = this.calcCellHeuristic(cell, unit);
                                this.cellHeuristics.Set(cell, heuristic);
                            }
    
                            let targetData = {cell: cell, heuristic: heuristic, target: optimalEnemy};
    
                            if (optimalTarget == null) {
                                optimalTarget = targetData;
                            }
                            else if (targetData.heuristic < optimalTarget.heuristic) {
                                if (MiraUtils.IsCellReachable(cell, unit)) {
                                    optimalTarget = targetData;
                                }
                            }
                            else if (targetData.heuristic == optimalTarget.heuristic) {
                                if (targetData.target.Health < optimalTarget.target.Health) {
                                    if (MiraUtils.IsCellReachable(cell, unit)) {
                                        optimalTarget = targetData;
                                    }
                                }
                            }
                        });
                    }
                }
            }

            if (optimalTarget) {
                let attackCell = optimalTarget.target.MoveToCell ?? optimalTarget.target.Cell;
                
                if (optimalTarget.heuristic < Infinity) {
                    if (MiraUtils.ChebyshevDistance(unit.Cell, optimalTarget.cell) > 0) {
                        MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, optimalTarget.cell);
                        MiraUtils.IssueAttackCommand(unit, this.squad.Controller.Player, attackCell, false);
                        this.reservedCells.Set(optimalTarget.cell, true);
                    }
                    else {
                        MiraUtils.IssueAttackCommand(unit, this.squad.Controller.Player, attackCell);
                    }
                }
                else {
                    let nearestFreeCell = MiraUtils.FindFreeCell(attackCell);
                    
                    if (nearestFreeCell) {
                        MiraUtils.IssueAttackCommand(unit, this.squad.Controller.Player, nearestFreeCell);
                    }
                }
            }
            else {
                MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, unit.Cell);
            }
        }
    }

    private calcCellHeuristic(targetCell: any, unit: any): number {
        let occupyingUnit = MiraUtils.GetUnit(targetCell);
        
        if (occupyingUnit && occupyingUnit != unit) {
            return Infinity;
        }
        
        if (this.reservedCells.Get(targetCell)) {
            return Infinity;
        }

        let threat = this.threatMap.Get(targetCell);

        return threat + 6 * MiraUtils.ChebyshevDistance(unit.Cell, targetCell);
    }
}