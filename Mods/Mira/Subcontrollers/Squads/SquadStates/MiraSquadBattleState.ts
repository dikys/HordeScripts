import { MiraUtils } from "Mira/Utils/MiraUtils";
import { MiraSquad } from "../MiraSquad";
import { MiraSquadAttackState } from "./MiraSquadAttackState";
import { MiraSquadMoveState } from "./MiraSquadMoveState";
import { ENEMY_SEARCH_RADIUS, MiraSquadState } from "./MiraSquadState";
import { TileType } from "library/game-logic/horde-types";

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

export class MiraSquadBattleState extends MiraSquadState {
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
        if (this.squad.MovementTargetCell != null) {
            this.squad.SetState(new MiraSquadMoveState(this.squad));
            return;
        }

        if (tickNumber % 50 == 0) {
            this.updateThreats();

            if (this.enemyUnits.length == 0) {
                this.squad.Attack(this.squad.CurrentTargetCell);
                this.squad.SetState(new MiraSquadAttackState(this.squad));
                return;
            }

            // Temporarily (?) disable proper micro because of it being slow as hell
            //this.distributeTargets();
            //this.distributeTargets_lite();
            this.distributeTargets_liter();
        }
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
            let optimalTargetData: any = null;
            this.cellHeuristics = new MiraCellHeuristics();

            let mainAttackRange = unit.Cfg.MainArmament.Range;
            let forestAttackRange = unit.Cfg.MainArmament.ForestRange;
            
            let mainVisionRange = unit.Cfg.Sight;
            let forestVisionRange = unit.Cfg.ForestVision;
            
            for (let enemy of this.enemyUnits) {
                if (!unit.BattleMind.CanAttackTarget(enemy) || !enemy.IsAlive) {
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
                        let atttackRadius = 0;

                        if (MiraUtils.GetTileType(analyzedCell) == TileType.Forest) {
                            atttackRadius = Math.min(forestAttackRange, forestVisionRange);
                        }
                        else {
                            atttackRadius = Math.min(mainAttackRange, mainVisionRange);
                        }

                        let analyzedCellDistance = MiraUtils.ChebyshevDistance(unit.Cell, analyzedCell);

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

                            if (optimalTargetData == null) {
                                optimalTargetData = targetData;
                            }
                            else if (targetData.heuristic < optimalTargetData.heuristic) {
                                if (MiraUtils.IsCellReachable(cell, unit)) {
                                    optimalTargetData = targetData;
                                }
                            }
                            else if (targetData.heuristic == optimalTargetData.heuristic) {
                                if (targetData.target.Health < optimalTargetData.target.Health) {
                                    if (MiraUtils.IsCellReachable(cell, unit)) {
                                        optimalTargetData = targetData;
                                    }
                                }
                            }
                        });
                    }
                }
            }

            if (optimalTargetData) {
                let attackCell = optimalTargetData.target.MoveToCell ?? optimalTargetData.target.Cell;
                
                if (optimalTargetData.heuristic < Infinity) {
                    if (MiraUtils.ChebyshevDistance(unit.Cell, optimalTargetData.cell) > 0) {
                        MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, optimalTargetData.cell);
                        MiraUtils.IssueAttackCommand(unit, this.squad.Controller.Player, attackCell, false);
                        this.reservedCells.Set(optimalTargetData.cell, true);
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
            let optimalTargetData: any = null;
            this.cellHeuristics = new MiraCellHeuristics();

            let mainAttackRange = unit.Cfg.MainArmament.Range;
            let forestAttackRange = unit.Cfg.MainArmament.ForestRange;
            
            let mainVisionRange = unit.Cfg.Sight;
            let forestVisionRange = unit.Cfg.ForestVision;

            let optimalEnemy: any = null;
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
                        let atttackRadius = 0;
    
                        if (MiraUtils.GetTileType(analyzedCell) == TileType.Forest) {
                            atttackRadius = Math.min(forestAttackRange, forestVisionRange);
                        }
                        else {
                            atttackRadius = Math.min(mainAttackRange, mainVisionRange);
                        }

                        let analyzedCellDistance = MiraUtils.ChebyshevDistance(unit.Cell, analyzedCell);
    
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
    
                            if (optimalTargetData == null) {
                                optimalTargetData = targetData;
                            }
                            else if (targetData.heuristic < optimalTargetData.heuristic) {
                                if (MiraUtils.IsCellReachable(cell, unit)) {
                                    optimalTargetData = targetData;
                                }
                            }
                            else if (targetData.heuristic == optimalTargetData.heuristic) {
                                if (targetData.target.Health < optimalTargetData.target.Health) {
                                    if (MiraUtils.IsCellReachable(cell, unit)) {
                                        optimalTargetData = targetData;
                                    }
                                }
                            }
                        });
                    }
                }
            }

            if (optimalTargetData) {
                let attackCell = optimalTargetData.target.MoveToCell ?? optimalTargetData.target.Cell;
                
                if (optimalTargetData.heuristic < Infinity) {
                    if (MiraUtils.ChebyshevDistance(unit.Cell, optimalTargetData.cell) > 0) {
                        MiraUtils.IssueMoveCommand(unit, this.squad.Controller.Player, optimalTargetData.cell);
                        MiraUtils.IssueAttackCommand(unit, this.squad.Controller.Player, attackCell, false);
                        this.reservedCells.Set(optimalTargetData.cell, true);
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

    private distributeTargets_liter(): void {
        let attackCell = MiraUtils.FindFreeCell(this.enemySquads[0].GetLocation().Point);

        for (let unit of this.squad.Units) {
            MiraUtils.IssueAttackCommand(unit, this.squad.Controller.Player, attackCell);
        }
    }

    private calcCellHeuristic(targetCell: any, unit: any): number {
        let occupyingUnit = MiraUtils.GetUnit(targetCell);
        
        if (occupyingUnit && occupyingUnit.Id != unit.Id) {
            return Infinity;
        }
        
        if (this.reservedCells.Get(targetCell)) {
            return Infinity;
        }

        let threat = this.threatMap.Get(targetCell);

        return threat + 6 * MiraUtils.ChebyshevDistance(unit.Cell, targetCell);
    }
}