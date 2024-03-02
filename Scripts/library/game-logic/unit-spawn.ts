import { log } from "library/common/logging";
import { generateRandomCellInRect } from "library/common/position-tools";
import { createPoint } from "library/common/primitives";
import { UnitDirection } from "./horde-types";
import { unitCanBePlacedByRealMap } from "./unit-and-map";

/**
 * Создание одного юнита в заданной клетке.
 * 
 * Возвращает созданного юнита.
 */
export function spawnUnit(settlement, uCfg, cell, direction) {
    let csType = ScriptUtils.GetTypeByName("HordeClassLibrary.World.Objects.Units.SpawnUnitParameters, HordeClassLibrary");
    let spawnParams = ScriptUtils.CreateInstance(csType);
    ScriptUtils.SetValue(spawnParams, "ProductUnitConfig", uCfg);
    ScriptUtils.SetValue(spawnParams, "Cell", cell);
    ScriptUtils.SetValue(spawnParams, "Direction", direction);

    let unit = settlement.Units.SpawnUnit(spawnParams);
    return unit;
}

/**
 * Создание uCount (может быть создано меньше, поскольку генератор конечный) юнитов согласно переданному generator - генератору позиций
 *
 * Возвращает список созданных юнитов.
 */
export function spawnUnits(settlement, uCfg, uCount, direction, generator) {
    let csType = ScriptUtils.GetTypeByName("HordeClassLibrary.World.Objects.Units.SpawnUnitParameters, HordeClassLibrary");
    let spawnParams = ScriptUtils.CreateInstance(csType);
    ScriptUtils.SetValue(spawnParams, "ProductUnitConfig", uCfg);
    ScriptUtils.SetValue(spawnParams, "Direction", direction);

    let outSpawnedUnits: any[] = [];
    for (let position = generator.next(); !position.done && outSpawnedUnits.length < uCount; position = generator.next()) {
        if (unitCanBePlacedByRealMap(uCfg, position.value.X, position.value.Y)) {
            ScriptUtils.SetValue(spawnParams, "Cell", createPoint(position.value.X, position.value.Y));
            outSpawnedUnits.push(settlement.Units.SpawnUnit(spawnParams));
        }
    }

    return outSpawnedUnits;
}


// ===================================================
// --- Test

export function test_spawnUnits() {
    let realScena = ActiveScena.GetRealScena();
    let settlements = realScena.Settlements;

    let settlement_0 = settlements.Item.get('0');  // Олег
    let archerCfg = HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Archer");
    let spawnCounts = 100;
    let dir = UnitDirection.RightDown;

    let spawnedUnits = spawnUnits(settlement_0, archerCfg, spawnCounts, dir, generateRandomCellInRect(0, 0, 176, 22));

    log.info('Созданные юниты:');
    for (let unit of spawnedUnits) {
        log.info('-', unit);
    }

    return;
}
