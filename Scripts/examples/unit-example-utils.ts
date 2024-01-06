// ==============================================================
// --- Утилиты

/**
 * Возвращает предыдущего или создаёт нового юнита для теста.
 */
function getOrCreateTestUnit() {
    if (unitForExample && unitForExample.IsAlive) {
        return unitForExample;
    }

    return createUnitForTest();
}


/**
 * Создаёт юнита для теста.
 */
function createUnitForTest() {
    var oleg = scena.GetRealScena().Settlements.Item.get('0');  // Олег
    unitForExample = spawnUnit(oleg, HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Archer"), createPoint(5, 5), UnitDirection.RightDown);
    if (!unitForExample) {
        return null;
    }

    logi('Создан новый юнит для теста!', unitForExample.ToString());
    return unitForExample;
}
var unitForExample;
