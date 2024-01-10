
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
}