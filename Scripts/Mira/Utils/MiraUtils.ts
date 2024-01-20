
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
    static PrintMap(map: Map<string, number>) {
        map.forEach(
            (value, key, m) => {
                Mira.Log(MiraLogLevel.Debug, `${key}: ${value}`);
            }
        )
    }
    
    static IncrementMapItem(map: Map<string, number>, key: string): void {
        if (map.has(key)) {
            map.set(key, map.get(key) + 1);
        }
        else {
            map.set(key, 1);
        }
    }

    static SubstractCompositionLists(
        minuend: Map<string, number>, 
        subtrahend: Map<string, number>
    ): Map<string, number> {
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
        set: Map<string, number>, 
        subset: Map<string, number>
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
}