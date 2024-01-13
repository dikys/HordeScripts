
class MiraUnitCompositionItem {
    ConfigId: string;
    Count: number;

    constructor(configId, count) {
        this.ConfigId = configId;
        this.Count = count;
    }
}

class MiraUtils {
    static MapContains(map: Map<string, number>, subset: Array<MiraUnitCompositionItem>): boolean {
        for (var item of subset) {
            if ( !map.has(item.ConfigId) ) {
                return false;
            }
            else if (map[item.ConfigId] !== item.Count) {
                return false;
            }
        }

        return true;
    }

    static GetAllSettlements(): Array<any> {
        var result: Array<any>;
        var playersEnum = enumerate(players);
        var player;
        
        while ((player = eNext(playersEnum)) !== undefined) {
            result.push(player.GetRealPlayer().GetRealSettlement());
        }

        return result;
    }

    // ищет свободную клетку, ближайшую заданной
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
}