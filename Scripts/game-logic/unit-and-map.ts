
// ===================================================
// --- Взаимодействие юнитов и карты

/**
 * Можно ли установить юнита с таким конфигом в заданную точку?
 * (Тут используется актуальные данные карты)
 */
function unitCanBePlacedByRealMap(uCfg, x, y) {
    return uCfg.CanBePlaced(scena.GetRealScena(), x, y);
}

/**
 * Можно ли установить юнита с таким конфигом в заданную точку согласно известной карте?
 * (Т.е. учитывается туман войны и другие виды вИдения)
 */
function unitCanBePlacedByKnownMap(uCfg, settlement, x, y) {
    return uCfg.CanBePlacedByKnownMap(settlement, x, y);
}

/**
 * Скорость юнита в указанной точке карты.
 * (Тут используется актуальные данные карты)
 */
function unitSpeedAtCellByRealMap(unit, cell) {
    var unitVar = host.newVar(Unit);
    return unit.MapMind.SpeedAtCellByRealMap(cell, unitVar.out)

    // В переменной unitVar находится юнит, если тут кто-то стоит и мешается
    // На возвращаемую скорость это не влияет
}

/**
 * Скорость юнита в указанной точке карты согласно известной карте.
 * (Т.е. учитывается туман войны и другие виды вИдения)
 */
function unitSpeedAtCellByKnownMap(unit, cell) {
    var knownUnitVar = host.newVar(KnownUnit);
    return unit.MapMind.SpeedAtCellByKnownMap(cell, knownUnitVar.out)

    // В переменной knownUnitVar находится known-юнит, если тут кто-то стоит и мешается
    // На возвращаемую скорость это не влияет
}

/**
 * Может ли юнит дойти к указанной точке?
 * (Тут учитывается туман войны и другие виды вИдения)
 */
function unitCheckPathTo(unit, cell) {
    return unit.MapMind.CheckPathTo(cell, false);
}

/**
 * Телепортировать юнита
 */
function unitTeleport(unit, cell) {
    unit.MapMind.TeleportToCell(cell);
    return unit.Cell == cell;
}
