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
        
        let units = MiraUtils.GetSettlementUnitsInArea(unit.Cell, UNIT_SEARCH_RADIUS, settlements);
        let unitSettlement = unit.Owner;
        
        let newUnits = units.filter((unit) => {return unit.Owner === unitSettlement});
        let currentEnemies = [];
        units = [];

        do {
            units.push(...newUnits);
            currentEnemies = [...newUnits];
            newUnits = [];

            for (let enemy of currentEnemies) {
                if (processedUnitIds.has(enemy.Id)) {
                    continue;
                }

                processedUnitIds.add(enemy.Id);

                let friends = MiraUtils.GetSettlementUnitsInArea(enemy.Cell, UNIT_SEARCH_RADIUS, settlements);
                friends.filter((unit) => {return unit.Owner === unitSettlement && !processedUnitIds.has(unit.Id)});

                newUnits.push(...friends);
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
        let box = createBox(cell.X - radius, cell.Y - radius, 0, cell.X + radius - 1, cell.Y + radius - 1, 2);
        let unitsInBox = HordeUtils.call(scena.GetRealScena().UnitsMap.UnitsTree, "GetUnitsInBox" ,box);
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

    static IssueAttackCommand(unit, player, location) {
        MiraUtils.issueCommand(unit, player, location, UnitCommand.Attack);
    }

    static IssueMoveCommand(unit, player, location) {
        MiraUtils.issueCommand(unit, player, location, UnitCommand.MoveToPoint);
    }

    private static issueCommand(unit, player, location, command) {
        inputSelectUnitsById(player, [unit.Id], VirtualSelectUnitsMode.Select);
        inputPointBasedCommand(player, createPoint(location.X, location.Y), command, AssignOrderMode.Replace);
    }

    static RequestMasterMindProduction(unitConfig: string, productionDepartment: any) {
        var cfg = HordeContent.GetUnitConfig(unitConfig);
        
        return productionDepartment.AddRequestToProduce(cfg, 1);
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
}