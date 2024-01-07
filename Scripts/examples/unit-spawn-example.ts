
/**
 * Пример создания юнита
 */
function example_spawnUnit() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var realScena = scena.GetRealScena();
    var settlements = realScena.Settlements;

    var settlement_0 = settlements.Item.get('0');  // Олег
    var archerCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Archer");
    var cell = createPoint(5, 5);
    var dir = UnitDirection.RightDown;

    var unit = spawnUnit(
        settlement_0,
        archerCfg,
        cell,
        dir
    );

    if (unit) {
        logi(`  Создан юнит: ${unit.ToString()}`);
    } else {
        logi('  Юнита создать не удалось');
    }
}
