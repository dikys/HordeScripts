import { Mira, MiraLogLevel } from "Mira/Mira";
import { MiraSquad } from "Mira/Subcontrollers/Squads/MiraSquad";
import { createBox, createPoint } from "library/common/primitives";
import { UnitFlags, UnitCommand, AllContent } from "library/game-logic/horde-types";
import { UnitProfession } from "library/game-logic/unit-professions";
import { AssignOrderMode, VirtualInput, VirtualSelectUnitsMode } from "library/mastermind/virtual-input";
import { enumerate, eNext } from "./Common";
import { generateCellInSpiral } from "library/common/position-tools";

class MiraSettlementData {
    public Settlement: any;
    public MasterMind: any;
    public Player: any;

    constructor(settlement, masterMind, player) {
        this.Settlement = settlement;
        this.MasterMind = masterMind;
        this.Player = player;
    }
}

class DotnetHolder {
    private static realScena;
    
    public static get RealScena() {
        if (!DotnetHolder.realScena) {
            DotnetHolder.realScena = ActiveScena.GetRealScena();
        }

        return DotnetHolder.realScena;
    }

    private static unitsMap;
    
    public static get UnitsMap() {
        if (!DotnetHolder.unitsMap) {
            DotnetHolder.unitsMap = ActiveScena.GetRealScena().UnitsMap;
        }
        
        return DotnetHolder.unitsMap;
    }

    private static landscapeMap;
    
    public static get LandscapeMap() {
        if (!DotnetHolder.landscapeMap) {
            DotnetHolder.landscapeMap = ActiveScena.GetRealScena().LandscapeMap;
        }
        
        return DotnetHolder.landscapeMap;
    }
}

export class MiraProfiler {
    private message: string;
    private callCount: number;
    private executionTime: number;

    constructor(message: string) {
        this.message = message;
        this.callCount = 0;
        this.executionTime = 0;
    }

    public Print(): void {
        Mira.Debug(this.message + ` took ${this.executionTime} ms, call count: ${this.callCount}`);
    }

    public Profile(call: () => void): void {
        let startTime = Date.now();
        call();
        this.executionTime += Date.now() - startTime;
        this.callCount++;
    }
}

let TileType = HCL.HordeClassLibrary.HordeContent.Configs.Tiles.Stuff.TileType;
export type UnitComposition = Map<string, number>;

export class MiraUtils {
    static GetSettlementsSquadsFromUnits(units: Array<any>, settlements: Array<any>): Array<MiraSquad> {
        let processedUnitIds = new Set<number>();
        let result: Array<MiraSquad> = [];
        
        for (let unit of units) {
            if (processedUnitIds.has(unit.Id)) {
                continue;
            }

            let squad = MiraUtils.constructMiraSquad(unit, processedUnitIds, settlements);
            result.push(squad);
        }

        return result;
    }
    
    private static constructMiraSquad(unit: any, processedUnitIds: Set<number>, settlements: Array<any>): MiraSquad {
        const UNIT_SEARCH_RADIUS = 3;
        
        let unitSettlement = unit.Owner;
        
        let newUnits: any[] = [unit];
        let currentUnits: any[] = [];
        let units: any[] = [];

        do {
            units.push(...newUnits);
            currentUnits = [...newUnits];
            
            newUnits = [];
            let newUnitIds = new Set<number>();

            for (let curUnit of currentUnits) {
                if (processedUnitIds.has(curUnit.Id)) {
                    continue;
                }

                processedUnitIds.add(curUnit.Id);

                let friends = MiraUtils.GetSettlementUnitsInArea(curUnit.Cell, UNIT_SEARCH_RADIUS, settlements);
                friends = friends.filter((unit) => {
                    return  unit.Owner === unitSettlement && 
                        !processedUnitIds.has(unit.Id) &&
                        currentUnits.indexOf(unit) == -1
                });

                for (let friend of friends) {
                    if (!newUnitIds.has(friend.Id)) {
                        newUnits.push(friend);
                        newUnitIds.add(friend.Id);
                    }
                }
            }
        }
        while (newUnits.length > 0);

        return new MiraSquad(units);
    }
    
    static GetSettlementUnitsInArea(cell: any, radius: number, enemySettelemnts: Array<any>, includePassive: boolean = false): Array<any> {
        let units = MiraUtils.GetUnitsInArea(cell, radius);
        let enemies = units.filter((unit) => {
            return enemySettelemnts.indexOf(unit.Owner) > -1 && unit.IsAlive && (unit.Cfg.HasNotFlags(UnitFlags.Passive) || includePassive)
        });

        return enemies;
    }

    static FindCells(
        center: {X: number; Y: number;}, 
        radius: number, 
        filter: (cell: any) => boolean
    ): Array<any> {
        let result: any[] = [];
        
        let generator = generateCellInSpiral(center.X, center.Y);
        let cell: any;
        for (cell = generator.next(); !cell.done; cell = generator.next()) {
            if (MiraUtils.ChebyshevDistance(cell.value, center) > radius) {
                return result;
            }

            if ( filter(cell.value) ) {
                result.push(cell.value);
            }
        }

        return result;
    }
    
    static GetTileType(point: {X: number; Y: number;}): any {
        if (
            0 <= point.X && point.X < DotnetHolder.RealScena.Size.Width &&
            0 <= point.Y && point.Y < DotnetHolder.RealScena.Size.Height
        ) {
            var tile = DotnetHolder.LandscapeMap.Item.get(point.X, point.Y);

            return tile.Cfg.Type;
        }
        else {
            return null;
        }
    }
    
    static GetUnitsInArea(cell: any, radius: number): Array<any> {
        let box = createBox(cell.X - radius, cell.Y - radius, 0, cell.X + radius, cell.Y + radius, 2);
        let unitsInBox = ScriptUtils.Invoke(DotnetHolder.RealScena.UnitsMap.UnitsTree, "GetUnitsInBox", box);
        let count = ScriptUtils.GetValue(unitsInBox, "Count");
        let units = ScriptUtils.GetValue(unitsInBox, "Units");

        let unitsIds = new Set<number>();
        let result = new Array<any>();

        for (let index = 0; index < count; ++index) {
            let unit = units[index];

            if (unit == null) {
                continue;
            }

            if (unitsIds.has(unit.Id)) {
                continue;
            }

            unitsIds.add(unit.Id);
            result.push(unit);
        }

        return result;
    }
    
    static PrintMap(map: UnitComposition) {
        map.forEach(
            (value, key, m) => {
                Mira.Log(MiraLogLevel.Debug, `${key}: ${value}`);
            }
        )
    }
    
    static IncrementMapItem(map: UnitComposition, key: string): void {
        MiraUtils.AddToMapItem(map, key, 1);
    }

    static AddToMapItem(map: UnitComposition, key: string, value: number): void {
        if (map.has(key)) {
            map.set(key, (map.get(key) ?? 0) + value);
        }
        else {
            map.set(key, value);
        }
    }

    static SubstractCompositionLists(
        minuend: UnitComposition, 
        subtrahend: UnitComposition
    ): UnitComposition {
        var newList = new Map<string, number>();

        minuend.forEach(
            (value, key, map) => {
                if (subtrahend.has(key)) {
                    var newCount = value - (subtrahend.get(key) ?? 0);
                    
                    if (newCount > 0) {
                        newList.set(key, newCount);
                    }
                }
                else {
                    newList.set(key, value);
                }
            }
        );

        return newList;
    }
    
    static SetContains(
        set: UnitComposition, 
        subset: UnitComposition
    ): boolean {
        var isContain = true;

        subset.forEach( //using forEach here because keys(), values() or entries() return empty iterators for some reason
            (val, key, m) => {
                if ( !set.has(key) ) {
                    isContain = false;
                }
                else if ((set.get(key) ?? 0) < val) {
                    isContain = false;
                }    
            }
        )

        return isContain;
    }

    static GetAllSettlements(): Array<any> {
        var result: Array<any> = [];

        for (var player of Players) {
            result.push(player.GetRealPlayer().GetRealSettlement());
        }
        
        return result;
    }

    static GetAllPlayers(): Array<{index: string, player: any}> {
        let result: Array<any> = [];

        for (let i in Players) {
            let player = Players[i];
            result.push({index: i, player: player});
        }
        
        return result;
    }

    static GetSettlementData(playerId: string): MiraSettlementData | null {
        var realPlayer = Players[playerId].GetRealPlayer();
        if (!realPlayer) {
            return null;
        }

        var settlement = realPlayer.GetRealSettlement();
        var masterMind = ScriptUtils.GetValue(realPlayer, "MasterMind");

        return new MiraSettlementData(settlement, masterMind, realPlayer);
    }

    static GetUnit(cell: any): any {
        var unitsMap = DotnetHolder.UnitsMap;
        return unitsMap.GetUpperUnit(cell.X, cell.Y);
    }

    // finds a free cell nearest to given
    static FindFreeCell(point): any {
        var unitsMap = DotnetHolder.UnitsMap;
        
        var generator = generateCellInSpiral(point.X, point.Y);
        var cell: any;
        for (cell = generator.next(); !cell.done; cell = generator.next()) {
            var unit = unitsMap.GetUpperUnit(cell.value.X, cell.value.Y);
            if (!unit) {
                return {X: cell.value.X, Y: cell.value.Y};
            }
        }

        return null;
    }

    static IssueAttackCommand(unit: any, player: any, location: any, isReplaceMode: boolean = true) {
        MiraUtils.issueCommand(unit, player, location, UnitCommand.Attack, isReplaceMode);
    }

    static IssueMoveCommand(unit: any, player: any, location: any, isReplaceMode: boolean = true) {
        MiraUtils.issueCommand(unit, player, location, UnitCommand.MoveToPoint, isReplaceMode);
    }

    private static issueCommand(unit: any, player: any, location: any, command: any, isReplaceMode: boolean = true) {
        let mode = isReplaceMode ? AssignOrderMode.Replace : AssignOrderMode.Queue;
        VirtualInput.selectUnitsById(player, [unit.Id], VirtualSelectUnitsMode.Select);
        VirtualInput.pointBasedCommand(player, createPoint(location.X, location.Y), command, mode);
    }

    static Random(max: number, min: number = 0) {
        let rnd = DotnetHolder.RealScena.Context.Randomizer;
        return rnd.RandomNumber(min, max);
    }

    static GetUnitConfig(configId: string): any {
        return HordeContentApi.GetUnitConfig(configId);
    }

    static RequestMasterMindProduction(configId: string, productionDepartment: any, checkDuplicate: boolean = false) {
        var cfg = MiraUtils.GetUnitConfig(configId);
        
        return productionDepartment.AddRequestToProduce(cfg, 1, null, checkDuplicate);
    }

    static ConfigHasProfession(unitConfig: any, profession: any): boolean {
        var profParams = host.newVar(HCL.HordeClassLibrary.HordeContent.Configs.Units.ProfessionParams.AUnitProfessionParams);
        if (!unitConfig.ProfessionParams.TryGetValue(profession, profParams.out)) {
            return false;
        }
        else {
            return true;
        }
    }

    static ChebyshevDistance(cell1: any, cell2: any): number {
        const xDiff = Math.abs(cell1.X - cell2.X);
        const yDiff = Math.abs(cell1.Y - cell2.Y);

        return Math.max(xDiff, yDiff);
    }

    static ForestCellFilter(cell: any): boolean {
        let unit = DotnetHolder.UnitsMap.GetUpperUnit(cell.X, cell.Y);

        if (unit) {
            return false;
        }

        let tileType = MiraUtils.GetTileType({X: cell.X, Y: cell.Y});

        return tileType == TileType.Forest;
    }

    static ForEachCell(center: any, radius: any, action: (cell: any) => void): void {
        let endRow = Math.min(center.Y + radius, DotnetHolder.RealScena.Size.Height);
        let endCol = Math.min(center.X + radius, DotnetHolder.RealScena.Size.Width)
        
        for (
            let row = Math.max(center.Y - radius, 0);
            row <= endRow;
            row++
        ) {
            for (
                let col = Math.max(center.X - radius, 0);
                col <= endCol;
                col++
            ) {
                action({X: col, Y: row});
            }
        }
    }

    static IsCellReachable(cell: any, unit: any): boolean {
        return unit.MapMind.CheckPathTo(createPoint(cell.X, cell.Y), false);
    }

    static GetUnitTarget(unit: any): any {
        let action = unit.OrdersMind.ActiveAct;

        if (!action) {
            return null;
        }
        
        if (
            action.GetType() != 
                ScriptUtils.GetTypeByName("HordeClassLibrary.UnitComponents.OrdersSystem.Acts.ActAttackUnit", "HordeClassLibrary")
        ) {
            return null;
        }
        else {
            return action.Target;
        }
    }

    static IsCombatConfig(unitConfig: any): boolean {
        let mainArmament = unitConfig.MainArmament;
        let isHarvester = MiraUtils.ConfigHasProfession(unitConfig, UnitProfession.Harvester);

        return mainArmament != null && !isHarvester;
    }

    static IsProducerConfig(cfgId: string): boolean {
        let cfg = MiraUtils.GetUnitConfig(cfgId);
        
        return MiraUtils.ConfigHasProfession(cfg, UnitProfession.UnitProducer);
    }

    static IsTechConfig(cfgId: string): boolean {
        let unitConfigs = enumerate(AllContent.UnitConfigs.Configs);
        let kv;
        
        while ((kv = eNext(unitConfigs)) !== undefined) {
            let config = kv.Value;

            let productionRequirements = enumerate(config.TechConfig?.Requirements);
            let requirementConfig;

            while ((requirementConfig = eNext(productionRequirements)) !== undefined) {
                if (requirementConfig.Uid == cfgId) {
                    return true;
                }
            }
        }
        
        return false;
    }

    static GetUnitStrength(unit: any): number {
        if (this.IsCombatConfig(unit.Cfg) && unit.IsAlive) {
            return Math.max(unit.Health, 0);
        }
        else {
            return 0;
        }
    }

    static IsPointsEqual(point1: any, point2: any): boolean {
        return point1.X == point2.X && point1.Y == point2.Y;
    }
}