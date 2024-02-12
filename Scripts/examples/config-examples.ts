
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
 * Внимание! Для сброса изменений требуется запуск "example_configRemoving()".
 */
function example_configCreation() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    // Берем исходные конфиги
    var ballistaCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Balista");
    var factoryCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Factory");

    // Идентификатор для нового конфига
    // Если установить null или существующий идентификатор, то будет при клонировании будет сгенерирован уникальный идентификатор
    var newCfgUid = "#UnitConfig_Slavyane_DynamicBallista";
    // var newCfgUid = null;

    // Чистим, если конфиг с таким идентификатором уже имеется (видимо пример запускается не первый раз)
    example_configRemoving(noTitle=true);

    // Клонируем конфиг и изменяем
    var newBallistaCfg = HordeContent.CloneConfig(ballistaCfg, newCfgUid);
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
 * Пример удаления конфига
 * Внимание! Конфиг добавляется в примере "example_configCreation()".
 */
function example_configRemoving(noTitle) {
    if (!noTitle) {
        logi('> Запущен пример', '"' + arguments.callee.name + '"');
    }
    
    var targetCfgUid = "#UnitConfig_Slavyane_DynamicBallista";

    // Добавлен?
    if (!HordeContent.HasUnitConfig(targetCfgUid)) {
        logi('  Конфиг пока что не был добавлен:', targetCfgUid);
        return;
    }
    var targetCfg = HordeContent.GetUnitConfig(targetCfgUid);

    logi('  Удаление конфига из контента:', targetCfgUid);
    HordeContent.RemoveConfig(targetCfg);

    logi('  Удаление из завода ссылок на конфиг:', targetCfgUid);
    var factoryCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Factory");
    var producerParams = factoryCfg.GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
    var produceList = producerParams.CanProduceList;
    ScriptExtensions.RemoveAll(produceList, targetCfg);
}
