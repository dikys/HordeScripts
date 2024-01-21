
/**
 * Пример работы с конфигами
 * Здесь выполняется работа с реальными объектами (не API)
 * Внимание! Для сброса изменений требуется перезапуск игры.
 */
function example_configWorks() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    logi("  Слепок контента:", HordeContent.ContentStamp);

    // Перечисление всех доступных конфигов юнитов
    logi("  Конфиги рыцарей:");
    var unitConfigs = enumerate(AllContent.UnitConfigs.Configs);
    while ((kv = eNext(unitConfigs)) !== undefined) {
        var uid = kv.Key;
        var uCfg = kv.Value;
        if (uid.includes('men')) {
            logi('  -', '"' + uid + '"', '-', uCfg.ToString());
        }
    }

    // Получаем конфиг катапульты
    var catapultCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Catapult");

    // Здесь можно убрать if-false, чтобы отобразить поля конфига
    // Здесь не следует копать более чем на 1 уровень в глубину, т.к. получается слишком много данных
    if (false) inspect(catapultCfg, 1, "Конфиг катапульты:");
    
    // Получаем значения из конфига
    var rocks = catapultCfg.MainArmament.EmitBulletsCountMin;
    logi("  Текущее количество камней при выстреле:", rocks);

    // Устанавливаем значения в private-члены конфига
    logi("  Делаем магию..");
    rocks += 1;
    if (rocks > 10)
        rocks = 1;
    HordeUtils.setValue(catapultCfg.MainArmament, "EmitBulletsCountMin", rocks);
    HordeUtils.setValue(catapultCfg.MainArmament, "EmitBulletsCountMax", rocks);
    
    // Результат можно проверить в игре
    logi("  Теперь катапульты кидают", catapultCfg.MainArmament.EmitBulletsCountMin, "камней за выстрел!");
}


/**
 * Пример добавления конфига
 * Внимание! Для сброса изменений требуется перезапуск игры.
 */
function example_configCreation() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    // Берем исходные конфиги
    var ballistaCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Balista");
    var factoryCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Factory");

    // Клонируем конфиг и изменяем
    var newBallistaCfg = HordeContent.CloneConfig(ballistaCfg);
    HordeUtils.setValue(newBallistaCfg, "Name", "Динамическая баллиста");
    HordeUtils.setValue(newBallistaCfg, "ProductionTime", 50);
    HordeUtils.setValue(newBallistaCfg, "TintColor", createHordeColor(255, 255, 150, 150));
    logi('  Создан новый конфиг баллисты:', newBallistaCfg.Uid, `(${newBallistaCfg.Name})`);

    // Добавляем новую баллисту в завод
    var producerParams = factoryCfg.GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
    var produceList = producerParams.CanProduceList;
    logi('  Сейчас завод производит:', produceList.Count, 'вида техники');
    logi('  Добавляем только что созданную баллисту в список производства..');
    produceList.Add(newBallistaCfg);
    logi('  Теперь завод производит:', produceList.Count, 'вида техники');
}


/**
 * Пример замены обработчика состояния юнита
 * Внимание! Для сброса изменений требуется перезапуск игры.
 */
function example_changeUnitWorker_1() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    // Создаём новый обработчик.
    // Это будет обработчик для состояния Stay, т.е. когда юнит ничего не делает
    var newWorker = host.del(DelegateWork, function (unit) {

        // Важно делать обработку ошибок, т.к. иначе игра вылетит в меню (пока что)
        try {

            // Устанавливаем анимацию "Стоит"
            unit.VisualMind.SetAnimState(UnitAnimState.Stand);

            // Лечим юнита каждые 100 тактов
            if (globalStorage.gameTickNum % 100 == 0) {
                unit.AddHealth(1);
            }

            // Внимание! Обработчики некоторых состояний вызываются очень часто, как, например, для состояний Stay, Move.
            // Поэтому здесь не должно быть логов без дополнительных условий, ведь логгирование это очень дорогостоящая операция.

            // Т.е. так делать не стоит!
            //logi('Unit:', unit.ToString());

        } catch (ex) {
            logExc(ex);
        }
    });

    // Для теста можно взять любого подходящего юнита и подать внутрь нового обработчика, например, так:
    //newWorker(anySwordsmen);

    // Непосредственно установка созданного обработчика в конфиг мечника
    var swordCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Swordmen");
    swordCfg.StateWorkers.Item.set(UnitState.Stay, newWorker);
    logi(swordCfg.StateWorkers.Item.get(UnitState.Stay) == newWorker
        ? '  Обработчик мечника успешно изменен!'
        : '  Обработчик мечника НЕ изменен!');
    // Если все ок, то теперь все мечники не будут поворачиваться когда стоят, но будут лечиться!
}


/**
 * Пример замены обработчика состояния юнита с проксированием в исходный обработчик
 * Внимание! Для сброса изменений требуется перезапуск игры.
 */
function example_changeUnitWorker_2() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var archerCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Archer");

    // Запоминаем текущий обработчик
    var prevWorker = archerCfg.StateWorkers.Item.get(UnitState.Stay);

    // Создаём новый обработчик с использованием предыдущего
    var newWorker_2 = host.del(DelegateWork, function (unit) {
        try {

            // Проксируем вызов в предыдущий обработчик
            // Т.е. выполняем все то, что и должно делаться
            prevWorker(unit);

            // Дополнительно добавляем лечение
            if (globalStorage.gameTickNum % 100 == 0) {
                unit.AddHealth(1);
            }

        } catch (ex) {
            logExc(ex);
        }
    });

    // Непосредственно установка созданного обработчика в конфиг мечника
    archerCfg.StateWorkers.Item.set(UnitState.Stay, newWorker_2);
    logi(archerCfg.StateWorkers.Item.get(UnitState.Stay) == newWorker_2
        ? '  Обработчик лучника успешно изменен!'
        : '  Обработчик лучника НЕ изменен!');

    // Внимание!
    // При каждом следующем вызове примера "текущий обработчик" уже будет содержать предыдущий код лечения + проксирование,
    // поэтому туда дополнительно добавится ещё одно лечение.
    // Желательно сохранить исходный обработчик в глобальную переменную, чтобы не делать матрешку из вызовов.
}
