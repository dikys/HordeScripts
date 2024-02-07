

/**
 * Работа с поселением
 */
function example_settlementWorks() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var realPlayer = players["0"].GetRealPlayer();
    var realSettlement = realPlayer.GetRealSettlement();

    // Дипломатия
    var diplomacy = realSettlement.Diplomacy;
    var otherSettlement = players["1"].GetRealPlayer().GetRealSettlement();
    if (diplomacy.IsWarStatus(otherSettlement)) {
        logi(`  ${realSettlement.LeaderName} ВОЮЕТ с ${otherSettlement.LeaderName}!`);
    } else {
        logi(`  ${realSettlement.LeaderName} НЕ воюет с ${otherSettlement.LeaderName}!`);
    }

    // Модуль вИдения
    var vision = realSettlement.Vision;
    // Примеры позже

    // Юниты поселения
    var units = realSettlement.Units;
    logi(`  Количество юнитов:`, units.Count);
    // Здесь можно получать юнитов только по идентификатору, а по координатам см. через сцену.
    var unit = HordeUtils.call(units, "GetById", 0);
    if (unit) {
        logi(`  У ${realPlayer.Nickname} обнаружен юнит с id=0: ${unit.ToString()}`);
    }

    // Перечисление юнитов этого поселения
    var enumerator = units.GetEnumerator();
    while(enumerator.MoveNext()) {
        logi('  Первый юнит:', enumerator.Current.ToString());
        break;
    }
    enumerator.Dispose();

    // Объявить поражение
    var existence = realSettlement.Existence;
    // Убрать false и тогда этому поселению будет засчитано поражение
    if (false) { existence.ForceTotalDefeat(); }
}


/**
 * Работа с ресурсами поселения
 */
function example_settlementResources() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var realPlayer = players["0"].GetRealPlayer();
    var realSettlement = realPlayer.GetRealSettlement();

    // Высокоуровневый объект для управления ресурсами поселения
    var settlementResources = realSettlement.Resources;
    logi("  Ресурсы:", settlementResources.ToString());
    // var resoucesAmount = HordeUtils.getValue(settlementResources, "Resources");

    // Прибавим ресурсы
    var addRes = createResourcesAmount(100, 100, 100, 10);
    settlementResources.AddResources(addRes);

    // Отнимем ресуры
    var subRes = createResourcesAmount(90, 300, 90, 9);
    if(!settlementResources.TakeResourcesIfEnough(subRes)) {
        logi("  Ресурсов недостаточно!");
    }
    logi("  Теперь ресурсов:", settlementResources.ToString());

    // Ещё у settlementResources есть следующие методы:
    //   TakeResources - забрать без проверки количества
    //   SetResources - установить значение
}


/**
 * Информация о юнитах поселения
 */
function example_settlementUnitsInfo() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var realPlayer = players["0"].GetRealPlayer();
    var realSettlement = realPlayer.GetRealSettlement();

    // Юниты разных типов
    var professionCenter = realSettlement.Units.Professions;
    logi('  Выбор юнита по типу:');
    var logUnit = function(str, u) { logi(str+':', u ? u.ToString() : '<None>') };
    logUnit('  - Первый в MainBuildings', professionCenter.MainBuildings.First());
    logUnit('  - Первый в Barracks', professionCenter.Barracks.First());
    logUnit('  - Первый в Factories', professionCenter.Factories.First());
    logUnit('  - Первый в Stables', professionCenter.Stables.First());
    logUnit('  - Первый в Sawmills', professionCenter.Sawmills.First());
    logUnit('  - Первый в MetalStocks', professionCenter.MetalStocks.First());
    logUnit('  - Первый в Workers', professionCenter.Workers.First());
    logUnit('  - Первый в FreeWorkers', professionCenter.FreeWorkers.First());
    logUnit('  - Первый в AllUnitsExceptPassive', professionCenter.AllUnitsExceptPassive.First());
    logUnit('  - Первый в ProducingUnits', professionCenter.ProducingUnits.First());
    logUnit('  - Первый в ProducingBuildings', professionCenter.ProducingBuildings.First());
    logUnit('  - Первый в ActiveBuildings', professionCenter.ActiveBuildings.First());
    logUnit('  - Первый в DevelopmentBoosterBuildings', professionCenter.DevelopmentBoosterBuildings.First());
    logUnit('  - Первый в MaxGrowthSpeedIncreaseBuildings', professionCenter.MaxGrowthSpeedIncreaseBuildings.First());
    logUnit('  - Первый в Harmless', professionCenter.Harmless.First());

	// Информация о производстве
    var settlementProduction = realSettlement.Production;
    var catapultCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Catapult");
    logi('  В данный момент катапульт имеется:', professionCenter.CountUnitsOfType(catapultCfg));
    logi('  В данный момент катапульт производится:', settlementProduction.CountProducingNowUnits(catapultCfg));
}
