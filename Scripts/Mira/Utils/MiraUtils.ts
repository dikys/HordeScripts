 
class MiraUnitCompositionItem {
    ConfigId: string;
    Count: number;

    constructor(configId, count) {
        this.ConfigId = configId;
        this.Count = count;
    }
}

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

class MiraUtils {
    static IncrementMapItem(map: any, key: string): void {
        map[key] = map[key] ? map[key] + 1 : 1;
    }

    //TODO: get rid of different data types when working with unit compositions
    static SubstractCompositionLists(
        minuend: Array<MiraUnitCompositionItem>, 
        subtrahend: any
    ): Array<MiraUnitCompositionItem> {
        
        var newList: Array<MiraUnitCompositionItem> = [];

        for (var minuendItem of minuend) {
            if (subtrahend[minuendItem.ConfigId]) {
                var newListItem = new MiraUnitCompositionItem(minuendItem.ConfigId, minuendItem.Count - subtrahend[minuendItem.ConfigId]);
                
                if (newListItem.Count > 0) {
                    newList.push(newListItem);
                }
            }
            else {
                newList.push(minuendItem);
            }
        }

        return newList;
    }
    
    static MapContains(map: any, subset: Array<MiraUnitCompositionItem>): boolean {
        for (var item of subset) {
            if ( !map[item.ConfigId] ) {
                return false;
            }
            else if (map[item.ConfigId] < item.Count) {
                return false;
            }
        }

        return true;
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
        MiraUtils.issueCommand(unit, player, location, UnitCommand.Move);
    }

    private static issueCommand(unit, player, location, command) {
        inputSelectUnitsById(player, [unit.Id], VirtualSelectUnitsMode.Select);
        inputPointBasedCommand(player, createPoint(location.X, location.Y), command, AssignOrderMode.Replace);
    }

    static RequestMasterMindProduction(unitConfig: string, productionDepartment: any) {
        var cfg = HordeContent.GetUnitConfig(unitConfig);
        
        return productionDepartment.AddRequestToProduce(cfg, 1);
    }
}