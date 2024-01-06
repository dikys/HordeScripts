
/**
 * Пример работы с MasterMind
 */
function example_requestForMasterMind() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var realPlayer = players["1"].GetRealPlayer();
    var masterMind = HordeUtils.getValue(realPlayer, "MasterMind");
    if (!masterMind) {
        logi('  Выбранный игрок не управляется MasterMind.');
        return;
    }

    // Активация бота, если отключен
    if (!masterMind.IsWorkMode) {
        logi('  Включение режима работы MasterMind для', realPlayer.Nickname);
        masterMind.IsWorkMode = true;
    }

    // Создадим запрос на производство катапульты
    var productionDepartament = masterMind.ProductionDepartment;
    var catapultCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Catapult");
    if (!productionDepartament.AddRequestToProduce(catapultCfg, 1)) {
        logi('  Не удалось добавить запрос на создание катапульты.');
    } else {
        logi('  Добавлен запрос на создание 1 катапульты.');
    }

    // Проверяем запросы
    var requests = masterMind.Requests;
    logi('  Запросов в обработке:', requests.Count);
    // Пока что не удаётся проитерировать запросы, хотя этот тип производный от IEnumerable
}
