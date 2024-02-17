
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
}

class MiraSquadIdleState extends MiraSquadState {
    OnEntry(): void {
        this.squad.TargetCell = this.squad.GetLocation().Point;
        this.distributeUnits();

        // this.squad.IsAttackMode = false;
    }
    
    OnExit(): void {}
    
    //TODO: this needs better processing of too large spread, implement different gathering up state
    Tick(tickNumber: number): void {
        if (this.squad.IsEnemyNearby()) {
            this.squad.SetState(new MiraSquadBattleState(this.squad));
            return;
        }
        
        if (
            this.squad.IsAllUnitsIdle() &&
            this.squad.GetLocation().Spread > this.squad.MinSpread * MIN_SPREAD_THRESHOLD_MULTIPLIER
        ) {
            this.distributeUnits();
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
        }

        if (unitsToDistribute.length == 0) {
            return;
        }

        let searchRadius = this.squad.MinSpread * (MAX_SPREAD_THRESHOLD_MULTIPLIER + MIN_SPREAD_THRESHOLD_MULTIPLIER) / 2;
        let forestCells = MiraUtils.FindCells(this.squad.TargetCell, searchRadius, MiraUtils.ForestCellFilter);
        let cellIndex = 0;

        for (let unit of unitsToDistribute) {
            if (cellIndex >= forestCells.length) {
                MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, this.squad.TargetCell);
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
        for (let unit of this.squad.Units) {
            MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, this.squad.TargetCell);
        }
    }
    
    OnExit(): void {}
    
    Tick(tickNumber: number): void {
        let location = this.squad.GetLocation();
        let distance = MiraUtils.ChebyshevDistance(
            this.squad.TargetCell, 
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
        for (let unit of this.squad.Units) {
            MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, this.squad.TargetCell);
        }
    }

    OnExit(): void {}

    Tick(tickNumber: number): void {
        if (this.squad.IsEnemyNearby()) {
            this.squad.SetState(new MiraSquadBattleState(this.squad));
            return;
        }
        
        let location = this.squad.GetLocation();
        
        let distance = MiraUtils.ChebyshevDistance(
            this.squad.TargetCell, 
            location.Point
        );

        if (distance <= this.squad.MovementPrecision) {
            this.squad.SetState(new MiraSquadIdleState(this.squad));
            return;
        }

        if (location.Spread > this.squad.MinSpread * MAX_SPREAD_THRESHOLD_MULTIPLIER) {
            this.squad.SetState(new MiraSquadGatheringUpState(this.squad));
            return;
        }
    }
}

class MiraSquadGatheringUpState extends MiraSquadState {
    OnEntry(): void {
        if (this.squad.TargetCell) {
            let closestToTargetUnit = null;
            let minDistance = Infinity;

            for (let unit of this.squad.Units) {
                let unitDistance = MiraUtils.ChebyshevDistance(unit.Cell, this.squad.TargetCell);
                
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
            this.continueMotion();
            return;
        }

        if (this.squad.IsAllUnitsIdle()) {
            this.continueMotion();
            return;
        }
    }

    private continueMotion(): void {
        if (this.squad.IsAttackMode) {
            this.squad.SetState(new MiraSquadAttackState(this.squad));
        }
        else {
            this.squad.SetState(new MiraSquadMoveState(this.squad));
        }
    }
}

class MiraThreatMap {
    threatMap: any;

    constructor () {
        this.threatMap = {};
    }

    GetThreat(cell: any): number {
        let index = this.makeIndex(cell);
        return (this.threatMap[index] ?? 0);
    }

    AddThreat(cell: any, value: number): void {
        let index = `(${cell.X},${cell.Y})`;
        let threat = (this.threatMap[index] ?? 0) + value;
        this.threatMap[index] = threat;
    }

    private makeIndex(cell: any): string {
        return `(${cell.X},${cell.Y})`;
    }
}

class MiraSquadBattleState extends MiraSquadState {
    private enemySquads: Array<MiraSquad>;
    private enemyUnits: Array<any>;
    private threatMap: MiraThreatMap;
    private reservedCells: Array<any>;
    
    OnEntry(): void {
        this.updateThreats();
    }
    
    OnExit(): void {}
    
    Tick(tickNumber: number): void {
        if (tickNumber % 10 != 0) {
            return;
        }

        this.updateThreats();

        if (this.enemyUnits.length == 0) {
            this.squad.SetState(new MiraSquadAttackState(this.squad));
            return;
        }

        this.distributeTargets();
    }

    private updateThreats(): void {
        let location = this.squad.GetLocation();
        
        this.enemyUnits = MiraUtils.GetSettlementUnitsInArea(
            location.Point, 
            ENEMY_SEARCH_RADIUS, 
            this.squad.Controller.EnemySettlements
        );

        this.enemySquads = MiraUtils.GetSettlementsSquadsFromUnits(
            this.enemyUnits, 
            this.squad.Controller.EnemySettlements
        );

        this.updateThreatMap();
    }

    private updateThreatMap(): void {
        this.threatMap = new MiraThreatMap();

        for (let unit of this.enemyUnits) {
            this.addUnitThreatToMap(unit);
        }
    }

    private addUnitThreatToMap(unit: any): void {
        //TODO: this should also process second armament
        let mainRange = unit.Cfg.MainArmament.Range;
        let forestRange = unit.Cfg.MainArmament.ForestRange;
        let maxRange = Math.max(mainRange, forestRange);
        let minRange = unit.Cfg.MainArmament.RangeMin;
        let unitDps = (unit.Cfg.MainArmament.BulletCombatParams.Damage * 50) / unit.Cfg.MainArmament.ReloadTime;

        MiraUtils.ForEachCell(unit.Cell, maxRange, (cell) => {
            let distanceToCell = MiraUtils.ChebyshevDistance(unit.Cell, cell);
                
            if (distanceToCell < minRange) {
                return;
            }

            let tileType = MiraUtils.GetTileType(cell);
            let range = tileType == TileType.Forest ? forestRange : mainRange;

            if (distanceToCell <= range) {
                this.threatMap.AddThreat(cell, unitDps);
            }
        });
    }

    private distributeTargets(): void {
        this.reservedCells = [];
        
        for (let unit of this.squad.Units) {
            let targetsHeuristics = [];
            
            for (let enemy of this.enemyUnits) {
                if (!unit.BattleMind.CanAttackTarget(enemy)) {
                    continue;
                }
                
                let mainAttackRange = unit.Cfg.MainArmament.Range;
                let forestAttackRange = unit.Cfg.MainArmament.ForestRange;
                let mainVisionRange = unit.Cfg.Sight;
                let forestVisionRange = unit.Cfg.ForestVision;

                let atttackRadius = 0;

                //TODO: check if target is already visible
                if (MiraUtils.GetTileType(enemy.Cell) == TileType.Forest) {
                    atttackRadius = Math.min(forestAttackRange, forestVisionRange);
                }
                else {
                    atttackRadius = Math.min(mainAttackRange, mainVisionRange);
                }

                MiraUtils.ForEachCell(enemy.Cell, atttackRadius, (cell) => {
                    let heuristic = this.calcCellHeuristic(cell, unit);
                    targetsHeuristics.push({cell: cell, heuristic: heuristic, target: enemy});
                });
            }

            if (targetsHeuristics.length > 0) {
                targetsHeuristics.sort((a, b) => {
                    if (a.heuristic != b.heuristic) {
                        return a.heuristic - b.heuristic;
                    }
                    else {
                        return a.target.Health - b.target.Health;
                    }
                });

                let optimalTarget = targetsHeuristics[0];

                if (optimalTarget.heuristic != Infinity) {
                    if (unit.Cell != optimalTarget.cell) {
                        MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, optimalTarget.cell);
                        MiraUtils.IssueAttackCommand(unit, this.squad.Controller.Player, optimalTarget.target.Cell, false);
                        this.reservedCells.push(optimalTarget.cell);
                    }
                    else {
                        MiraUtils.IssueAttackCommand(unit, this.squad.Controller.Player, optimalTarget.target.Cell);
                    }
                }
                else {
                    MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, unit.Cell);
                }
            }
        }
    }

    private calcCellHeuristic(targetCell: any, unit: any): number {
        let occupyingUnits = MiraUtils.GetUnitsInArea(targetCell, 0);

        if (occupyingUnits.length > 0 && occupyingUnits[0] != unit) {
            return Infinity;
        }
        
        if (this.reservedCells.indexOf(targetCell) >= 0) {
            return Infinity;
        }
        
        if (!MiraUtils.IsCellReachable(targetCell, unit)) {
            return Infinity;
        }

        let threat = this.threatMap.GetThreat(targetCell);

        return threat * 5 + MiraUtils.ChebyshevDistance(unit.Cell, targetCell);
    }
}