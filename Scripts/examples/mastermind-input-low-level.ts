
/**
 * Пример имитации ввода игрока
 */
function example_inputLowLevel() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var oleg = players["0"].GetRealPlayer();
    
    logi('  Список всех команд юнитов');
    inspectEnum(UnitCommand);

    logi('  Выделить юнитов в области');
    inputSelectUnits(oleg, createPoint(0, 0), createPoint(15, 15));

    logi('  Добавить к выделению юнитов в области (shift)');
    inputSelectUnits(oleg, createPoint(18, 18), createPoint(20, 20), VirtualSelectUnitsMode.Include);

    logi('  Убрать из текущего выделения юнитов из области (ctrl)');
    inputSelectUnits(oleg, createPoint(18, 18), createPoint(18, 18), VirtualSelectUnitsMode.Exclude);

    logi('  Клик правой кнопкой');
    inputSmartClick(oleg, createPoint(9, 9));

    logi('  Команда атаки (в очередь)');
    inputPointBasedCommand(oleg, createPoint(19, 19), UnitCommand.Attack, AssignOrderMode.Queue);

    logi('  Выбор по id');
    inputSelectUnitsById(oleg, [42]);

    logi('  Команда атаки');
    inputPointBasedCommand(oleg, createPoint(19, 19), UnitCommand.Attack);

    logi('  Команда держать позицию');
    inputOneClickCommand(oleg, UnitCommand.HoldPosition);

    logi('  Выделить замок и заказать производство рабочего');
    var castle = oleg.GetRealSettlement().Units.GetCastleOrAnyUnit();
    inputSelectUnitsById(oleg, [castle.Id]);
    inputProduceUnitCommand(oleg, "#UnitConfig_Slavyane_Worker1", 1);

    // Отправить свободного рабочего строить здание
    var someFreeWorker = oleg.GetRealSettlement().Units.Professions.FreeWorkers.First();
    if (someFreeWorker) {
        logi('  Выделить свободного рабочего');
        inputSelectUnitsById(oleg, [someFreeWorker.Id]);

        logi('  Построить забор');
        inputProduceBuildingCommand(oleg, "#UnitConfig_Slavyane_Fence", createPoint(1, 5), createPoint(7, 7));

        logi('  Построить ферму (в очередь)');
        inputProduceBuildingCommand(oleg, "#UnitConfig_Slavyane_Farm", createPoint(1, 8), null, AssignOrderMode.Queue);
    } else {
        logi('  Свободный рабочий не найден');
    }

    // Показать выделенных в предыдущем такте юнитов
    // Внимание! Здесь не учитываются команды выданные в этом такте! Т.е. это выделение с прошлого такта.
    var selectedSquad = oleg.SelectedSquadVirtual;
    if (selectedSquad.Count > 0) {
        logi('  У', oleg.Nickname, 'выделены следующие юниты:');
        var enumerator = selectedSquad.GetEnumerator();
        while(enumerator.MoveNext()) {
            logi('  - ', enumerator.Current.ToString());
        }
        enumerator.Dispose();
    } else {
        logi('  У', oleg.Nickname, 'нет выделенных юнито в данный момент');
    }
}
