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
            DotnetHolder.realScena = scena.GetRealScena();
        }

        return DotnetHolder.realScena;
    }

    private static unitsMap;
    
    public static get UnitsMap() {
        if (!DotnetHolder.unitsMap) {
            DotnetHolder.unitsMap = scena.GetRealScena().UnitsMap;
        }
        
        return DotnetHolder.unitsMap;
    }

    private static landscapeMap;
    
    public static get LandscapeMap() {
        if (!DotnetHolder.landscapeMap) {
            DotnetHolder.landscapeMap = scena.GetRealScena().LandscapeMap;
        }
        
        return DotnetHolder.landscapeMap;
    }
}

class MiraProfiler {
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
type UnitComposition = Map<string, number>;

class MiraUtils {
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
        
        //let units = MiraUtils.GetSettlementUnitsInArea(unit.Cell, UNIT_SEARCH_RADIUS, settlements);
        let unitSettlement = unit.Owner;
        
        let newUnits = [unit]; //units.filter((unit) => {return unit.Owner === unitSettlement});
        let currentUnits = [];
        let units = [];

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
    
    static GetSettlementUnitsInArea(cell: any, radius: number, enemySettelemnts: Array<any>): Array<any> {
        let units = MiraUtils.GetUnitsInArea(cell, radius);
        let enemies = units.filter((unit) => {return enemySettelemnts.indexOf(unit.Owner) > -1});

        return enemies;
    }

    static FindCells(
        center: {X: number; Y: number;}, 
        radius: number, 
        filter: (cell: any) => boolean
    ): Array<any> {
        let result = [];
        
        let generator = generatePositionInSpiral(center.X, center.Y);
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
        let unitsInBox = HordeUtils.call(scena.GetRealScena().UnitsMap.UnitsTree, "GetUnitsInBox", box);
        let count = HordeUtils.getValue(unitsInBox, "Count");
        let units = HordeUtils.getValue(unitsInBox, "Units");

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
        if (map.has(key)) {
            map.set(key, map.get(key) + 1);
        }
        else {
            map.set(key, 1);
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
                    var newCount = value - subtrahend.get(key);
                    
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
                else if (set.get(key) < val) {
                    isContain = false;
                }    
            }
        )

        return isContain;
    }

    static GetAllSettlements(): Array<any> {
        var result: Array<any> = [];

        for (var player of players) {
            result.push(player.GetRealPlayer().GetRealSettlement());
        }
        
        return result;
    }

    static GetSettlementData(playerId: string): MiraSettlementData {
        var realPlayer = players[playerId].GetRealPlayer();
        if (!realPlayer) {
            return null;
        }

        var settlement = realPlayer.GetRealSettlement();
        var masterMind = HordeUtils.getValue(realPlayer, "MasterMind");

        return new MiraSettlementData(settlement, masterMind, realPlayer);
    }

    static GetUnit(cell: any): any {
        var unitsMap = DotnetHolder.RealScena.UnitsMap;
        return unitsMap.GetUpperUnit(cell.X, cell.Y);
    }

    // finds a free cell nearest to given
    static FindFreeCell(point): any {
        var unitsMap = scena.GetRealScena().UnitsMap;
        
        var generator = generatePositionInSpiral(point.X, point.Y);
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
        inputSelectUnitsById(player, [unit.Id], VirtualSelectUnitsMode.Select);
        inputPointBasedCommand(player, createPoint(location.X, location.Y), command, mode);
    }

    static GetUnitConfig(configId: string): any {
        return HordeContent.GetUnitConfig(configId);
    }

    static RequestMasterMindProduction(configId: string, productionDepartment: any) {
        var cfg = MiraUtils.GetUnitConfig(configId);
        
        return productionDepartment.AddRequestToProduce(cfg, 1);
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

    static GetProduceList(unit: any) {
        var producerParams = unit.Cfg.GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
        var produceList = enumerate(producerParams.CanProduceList);
        var produceListItem;
        var result = [];

        while ((produceListItem = eNext(produceList)) !== undefined) {
            result.push(produceListItem.Uid);
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
        
        if (
            action.GetType() != 
                HordeUtils.GetTypeByName("HordeClassLibrary.UnitComponents.OrdersSystem.Acts.ActAttackUnit", "HordeClassLibrary")
        ) {
            return null;
        }
        else {
            return action.Target;
        }
    }
}