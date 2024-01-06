
/**
 * Выбрать всех юнитов в области (вариант 1 - перебор)
 * Внимание! Прямой перебор больших областей будет подтормаживать.
 */
function example_getUnitsInArea_v1() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var unitsMap = scena.GetRealScena().UnitsMap;

    for (var i = 0; i < 20; i++) {
        for (var j = 0; j < 20; j++) {
            var unit = unitsMap.GetUpperUnit(i, j);
            if (!unit)
                continue;
            logi('  =', unit.ToString());
        }
    }
}


/**
 * Выбрать всех юнитов в области (вариант 2 - через отряд)
 * Внимание! Здесь используется такая же логика как и при выделению юнитов рамкой, т.е., например, нельзя выбрать несколько зданий.
 */
function example_getUnitsInArea_v2() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    // Создаём колбек для фильтрации юнитов
    var filterCallback = xHost.func(xHost.type('System.Boolean'), 1, function (unit) {
        // Для примера пропускаем все здания в области
        return !unit.Cfg.IsBuilding;
    });

    var unitsMap = scena.GetRealScena().UnitsMap;
    var rect = createRect(0,0,20,20);
    var squad = unitsMap.GetSquadFromRect(rect, filterCallback);

    logi('  Собрано юнитов:', squad.Count);
    var enumerator = squad.GetEnumerator();
    while(enumerator.MoveNext()) {
        logi('  =', enumerator.Current.ToString());
    }
    enumerator.Dispose();
}


/**
 * Выбрать всех юнитов в области (вариант 3 - оптимизация через k-мерное дерево)
 */
function example_getUnitsInArea_v3() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    // Эта функция возвращает юнитов по очереди от самого ближайшего, к самому дальнему.
    // Если юнит находится в нескольких клетках, то будет возвращен несколько раз (здания и юниты в движении)
    function* iterateOverUnitsInBox(cell, radius) {
        var box = createBox(cell.X - radius, cell.Y - radius, 0, cell.X + radius - 1, cell.Y + radius - 1, 2);
        var unitsInBox = HordeUtils.call(scena.GetRealScena().UnitsMap.UnitsTree, "GetUnitsInBox" ,box);
        var count = HordeUtils.getValue(unitsInBox, "Count");
        var units = HordeUtils.getValue(unitsInBox, "Units");
        var positions = HordeUtils.getValue(unitsInBox, "Positions");
        if (count == 0) {
            return;
        }

        for (var index = 0; index < count; ++index) {
            var unit = units[index];
            if (unit == null) {
                continue;
            }

            // Координаты клетки из который был "взят юнит". Может быть актуально при переборе зданий и движущихся юнитов
            //var x = positions[index * 3];
            //var y = positions[index * 3 + 1];
            //var layer = positions[index * 3 + 2];

            yield unit;
        }
    }

    var unitsIter = iterateOverUnitsInBox(createPoint(100, 20), 20);

    logi('  Юниты:');
    for (var u = unitsIter.next(); !u.done; u = unitsIter.next()) {
        logi('  =', u.value.ToString());
    }
}
