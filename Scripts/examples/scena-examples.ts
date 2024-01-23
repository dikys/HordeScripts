
/**
 * Пример работы со сценой
 */
function example_scenaWorks() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    // Глобальная переменная "scena" - это API для доступа к данным текущей сцены
    // Т.к. API ещё не разработано, ВРЕМЕННО прокинул объект реальной сцены
    // Здесь и далее в функии выполняется работа с реальными объектами (не API)
    var realScena = scena.GetRealScena();
    logi('  Сцена:', '"' + realScena.ScenaName + '"');

    // Карта юнитов, ландшафта и ресурсов
    var unitsMap = realScena.UnitsMap;
    var landscapeMap = realScena.LandscapeMap;
    var resourcesMap = realScena.ResourcesMap;

    // Специальный объект для работы с координатами - Point2D
    var cell = createPoint(9, 9);

    // Получаем различные данные
    logi(`  Информация по клетке ${cell.ToString()}`);
    var tile = landscapeMap.Item.get(cell);
    logi(`    Тип тайла: ${tile.Cfg.Type.ToString()}`);
    var res = resourcesMap.Item.get(cell);
    logi(`    Ресурс: ${res.ResourceType.ToString()}`);
    logi(`    Количество деревьев: ${res.TreesCount}`);
    var unit = unitsMap.GetUpperUnit(cell);
    if (unit) {
        logi(`    Юнит: ${unit.ToString()}`);
    } else {
        logi(`    Юнита нету`);
    }
    var unitAtFloor = unitsMap.Item.get(cell, UnitMapLayer.Floor);
    if (unitAtFloor) {
        logi(`    Мост в клетке: ${unitAtFloor.ToString()}`);
    } else {
        logi(`    В этой клетке нет моста`);
    }

    // Некоторые методы могут работать без Point2D
    var x = 25, y = 25;
    logi(`  Информация по клетке [${x}; ${y}]`);
    var tile = landscapeMap.Item.get(x, y);
    logi(`    Тип тайла: ${tile.Cfg.Type.ToString()}`);
    var res = resourcesMap.Item.get(x, y);
    logi(`    Ресурс: ${res.ResourceType.ToString()}`);
    logi(`    Количество деревьев: ${res.TreesCount}`);
    var unit = unitsMap.GetUpperUnit(x, y);
    if (unit) {
        logi(`    В клетке обнаружен ${unit.ToString()}`);
    } else {
        logi(`    В клетке пусто`);
    }

    // Поселения на сцене
    var settlements = realScena.Settlements;

    // Модуль вИдения
    var settlement_0 = settlements.Item.get('0');  // Олег
    var settlement_2 = settlements.Item.get('2');  // Эйрик
    var vision_0 = settlement_0.Vision;
    var enemyUnit = settlement_2.Units.GetCastleOrAnyUnit();
    if (enemyUnit) {
        if (vision_0.CanSeeUnit(enemyUnit)) {
            logi(`  ${settlement_0.TownName} видит ${enemyUnit.ToString()}`);
        } else {
            logi(`  ${settlement_0.TownName} не видит ${enemyUnit.ToString()}`);
        }
    } else {
        logi(`  Для этого примера нужен юнит`);
    }
}
