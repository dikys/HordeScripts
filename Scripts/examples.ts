
/**
 * Запуск примеров.
 * Нужно раскомментировать функции, которые следует запустить.
 */
function runExamples() {
    // example_importDotNetTypes();
    // example_introspection();

    // example_configWorks();
    // example_configCreation();
    // example_changeUnitWorker_1();
    // example_changeUnitWorker_2();

    // example_scenaWorks();
    // example_playerWorks();
    // example_unitWorks();

    // example_createBullet();
    // example_createUnit();
    
    // example_inputLowLevel();
    // example_inputHiLevel();
    // example_requestForMasterMind();
    
    // example_getUnitsInArea_v1();
    // example_getUnitsInArea_v2();
}


/**
 * Выбрать всех юнитов в области (вариант 1 - перебор)
 * Внимание! Прямой перебор больших областей будет подтормаживать.
 */
function example_getUnitsInArea_v1() {
    var unitsMap = scena.GetRealScena().UnitsMap;

    for (var i = 0; i < 20; i++) {
        for (var j = 0; j < 20; j++) {
            var unit = unitsMap.GetUpperUnit(i, j);
            if (!unit)
                continue;
            logi(unit.ToString());
        }
    }
}


/**
 * Выбрать всех юнитов в области (вариант 2 - через отряд)
 * Внимание! Здесь используется такая же логика как и при выделению юнитов рамкой, т.е., например, нельзя выбрать несколько зданий.
 */
function example_getUnitsInArea_v2() {
    // Создаём колбек для фильтрации юнитов
    var filterCallback = xHost.func(xHost.type('System.Boolean'), 1, function (unit) {
        // Для примера пропускаем все здания в области
        return !unit.Cfg.IsBuilding;
    });

    var unitsMap = scena.GetRealScena().UnitsMap;
    var rect = createRect(0,0,20,20);
    var squad = unitsMap.GetSquadFromRect(rect, filterCallback);

    logi('Собрано юнитов:', squad.Count);
    var enumerator = squad.GetEnumerator();
    while(enumerator.MoveNext()) {
        logi('  =', enumerator.Current.ToString());
    }
    enumerator.Dispose();
}


/**
 * Пример работы с MasterMind
 */
function example_requestForMasterMind() {
    var realPlayer = players["1"].GetRealPlayer();
    var masterMind = HordeUtils.getValue(realPlayer, "MasterMind");
    if (!masterMind) {
        logi('Выбранный игрок не управляется MasterMind.');
        return;
    }

    // Активация бота, если отключен
    if (!masterMind.IsWorkMode) {
        logi('Включение режима работы MasterMind для', realPlayer.Nickname);
        masterMind.IsWorkMode = true;
    }

    // Создадим запрос на производство катапульты
    var productionDepartament = masterMind.ProductionDepartment;
    var catapultCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Catapult");
    if (!productionDepartament.AddRequestToProduce(catapultCfg, 1)) {
        logi('Не удалось добавить запрос на создание катапульты.');
    } else {
        logi('Добавлен запрос на создание 1 катапульты.');
    }

    // Проверяем запросы
    var requests = masterMind.Requests;
    logi('Запросов в обработке:', requests.Count);
    // Пока что не удаётся проитерировать запросы, хотя этот тип производный от IEnumerable

    // Доп. информация
    var professionCenter = masterMind.Settlement.Units.Professions;
    var settlementProduction = masterMind.Settlement.Production;
    logi('В данный момент катапульт имеется:', professionCenter.CountUnitsOfType(catapultCfg));
    logi('В данный момент катапульт производится:', settlementProduction.CountProducingNowUnits(catapultCfg));

    // Юниты разных типов
    logi('Выбор юнита по типу:');
    var logUnit = function(str, u) { logi(str+':', u ? u.ToString() : '<None>') };
    logUnit('- Первый в MainBuildings', professionCenter.MainBuildings.First());
    logUnit('- Первый в Barracks', professionCenter.Barracks.First());
    logUnit('- Первый в Factories', professionCenter.Factories.First());
    logUnit('- Первый в Stables', professionCenter.Stables.First());
    logUnit('- Первый в Sawmills', professionCenter.Sawmills.First());
    logUnit('- Первый в MetalStocks', professionCenter.MetalStocks.First());
    logUnit('- Первый в Workers', professionCenter.Workers.First());
    logUnit('- Первый в FreeWorkers', professionCenter.FreeWorkers.First());
    logUnit('- Первый в AllUnitsExceptPassive', professionCenter.AllUnitsExceptPassive.First());
    logUnit('- Первый в ProducingUnits', professionCenter.ProducingUnits.First());
    logUnit('- Первый в ProducingBuildings', professionCenter.ProducingBuildings.First());
    logUnit('- Первый в ActiveBuildings', professionCenter.ActiveBuildings.First());
    logUnit('- Первый в DevelopmentBoosterBuildings', professionCenter.DevelopmentBoosterBuildings.First());
    logUnit('- Первый в MaxGrowthSpeedIncreaseBuildings', professionCenter.MaxGrowthSpeedIncreaseBuildings.First());
    logUnit('- Первый в Harmless', professionCenter.Harmless.First());
}


/**
 * Пример имитации ввода игрока (связки команд)
 */
function example_inputHiLevel() {
    // Will be soon...
}


/**
 * Пример имитации ввода игрока
 */
function example_inputLowLevel() {
    var oleg = players["0"].GetRealPlayer();
    
    logi('Список всех команд юнитов');
    inspectEnum(UnitCommand);

    logi('Выделить юнитов в области');
    inputSelectUnits(oleg, createPoint(0, 0), createPoint(15, 15));

    logi('Добавить к выделению юнитов в области (shift)');
    inputSelectUnits(oleg, createPoint(18, 18), createPoint(20, 20), VirtualSelectUnitsMode.Include);

    logi('Убрать из текущего выделения юнитов из области (ctrl)');
    inputSelectUnits(oleg, createPoint(18, 18), createPoint(18, 18), VirtualSelectUnitsMode.Exclude);

    logi('Клик правой кнопкой');
    inputSmartClick(oleg, createPoint(9, 9));

    logi('Команда атаки (в очередь)');
    inputPointBasedCommand(oleg, createPoint(19, 19), UnitCommand.Attack, AssignOrderMode.Queue);

    logi('Выбор по id');
    inputSelectUnitsById(oleg, [42]);

    logi('Команда атаки');
    inputPointBasedCommand(oleg, createPoint(19, 19), UnitCommand.Attack);

    logi('Команда держать позицию');
    inputOneClickCommand(oleg, UnitCommand.HoldPosition);

    logi('Выделить замок и заказать производство рабочего');
    var castle = oleg.GetRealSettlement().Units.GetCastleOrAnyUnit();
    inputSelectUnitsById(oleg, [castle.Id]);
    inputProduceUnitCommand(oleg, "#UnitConfig_Slavyane_Worker1", 1);

    // Отправить свободного рабочего строить здание
    var someFreeWorker = oleg.GetRealSettlement().Units.Professions.FreeWorkers.First();
    if (someFreeWorker) {
        logi('строить');

        logi('Выделить свободного рабочего');
        inputSelectUnitsById(oleg, [someFreeWorker.Id]);

        logi('Построить забор');
        inputProduceBuildingCommand(oleg, "#UnitConfig_Slavyane_Fence", createPoint(1, 5), createPoint(7, 7));

        logi('Построить ферму (в очередь)');
        inputProduceBuildingCommand(oleg, "#UnitConfig_Slavyane_Farm", createPoint(1, 8), null, AssignOrderMode.Queue);
    } else {
        logi('Свободный рабочий не найден');
    }

    // Показать выделенных в предыдущем такте юнитов
    // Внимание! Здесь не учитываются команды выданные в этом такте! Т.е. это выделение с прошлого такта.
    var selectedSquad = oleg.SelectedSquadVirtual;
    if (selectedSquad.Count > 0) {
        logi('У', oleg.Nickname, 'выделены следующие юниты:');
        var enumerator = selectedSquad.GetEnumerator();
        while(enumerator.MoveNext()) {
            logi('- ', enumerator.Current.ToString());
        }
        enumerator.Dispose();
    } else {
        logi('У', oleg.Nickname, 'нет выделенных юнито в данный момент');
    }
}


/**
 * Пример создания юнита
 */
function example_createUnit() {
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
        logi(`Создан юнит: ${unit.ToString()}`);
    } else {
        logi('Юнита создать не удалось');
    }
}


/**
 * Пример создания снаряда
 * Тестил только некоторые виды снарядов, поэтому может работать не все.
 */
function example_createBullet() {
    var realScena = scena.GetRealScena();
    var settlement_0 = realScena.Settlements.Item.get('0');  // Олег

    // Любой юнит, от имени которого будет отправлена стрела
    var someUnit = settlement_0.Units.GetCastleOrAnyUnit();

    // Конфиги снарядов
    var arrowCfg = HordeContent.GetBulletConfig("#BulletConfig_Arrow");
    var bombCfg = HordeContent.GetBulletConfig("#BulletConfig_CatapultBomb");

    // Характеристики выстрела
    var combatParams = BulletCombatParams.CreateInstance();
    HordeUtils.setValue(combatParams, "Damage", 4);
    HordeUtils.setValue(combatParams, "AdditiveBulletSpeed", createPF(0, 0));

    // Функция-обертка для упрощения создания снарядов
    var createBull = function(cfg, start, finish) {
        var bull = spawnBullet(
            someUnit,
            null,
            null,
            cfg,
            combatParams,
            start,
            finish,
            UnitMapLayer.Main
        );
        return bull;
    }
    
    // Создание одного снаряда
    var bull = createBull(arrowCfg, createPoint(10, 100), createPoint(1000, 800));
    logi(`Создан снаряд: ${bull.ToString()}`);

    // Рандомизатор
    var rnd = realScena.Context.Randomizer;

    // Функция для создания снаряда со случайным полетом
    var createBullRnd = function(cfg) {
        // Старт снаряда генерируем наверху карты
        var start = createPoint(rnd.RandomNumber(0,32*48), rnd.RandomNumber(0,32));

        // Цель снаряда в квадрате (16; 16) - (32; 32)
        var end = createPoint(rnd.RandomNumber(32*16,32*32), rnd.RandomNumber(32*16,32*32));

        // Создание снаряда
        return createBull(cfg, start, end);
    }

    // А теперь развлекаемся!
    broadcastMessage("Внимание! По прогнозу дождь из стрел, местами град! O_O", createHordeColor(255, 255, 50, 10));
    for (var i = 0; i < 200; i++) {
        createBullRnd(arrowCfg);
    }
    for (var i = 0; i < 20; i++) {
        createBullRnd(bombCfg);
    }
}


/**
 * Пример работы с юнитом
 */
function example_unitWorks() {
    var unit = getOrCreateTestUnit();
    if (unit == null) {
        logi('Не удалось создать юнита для этого теста!');
        return;
    }
    logi('Для этого теста выбран:', unit.ToString());

    // Здесь хранятся значения переменных юнита
    var unitDTO = HordeUtils.getValue(unit, "Model");

    // Отдел приказов
    var ordersMind = unit.OrdersMind;

    // Проверка что юнит бездействует
    if (ordersMind.IsIdle()) {
        logi('Юнит бездействует:', unit.ToString());

        // Устанавливаем направление "Вниз"
        unitDTO.PositionModel.Direction = UnitDirection.Down;
    }

    // Проверка что юнит бездействует (другой вариант)
    if (ordersMind.OrdersCount == 0) {
        logi('Юнит бездействует v2:', unit.ToString());

        // Устанавливаем направление "Вверх"
        unitDTO.PositionModel.Direction = UnitDirection.Down;
    }

    // Отдел команд
    var commandsMind = unit.CommandsMind;

    //  Словарь с запрещенными командами
    var disallowedCommands = HordeUtils.getValue(commandsMind, "DisallowedCommands");

    // Запретим/разрешим команду атаки
    if (!disallowedCommands.ContainsKey(UnitCommand.Attack)) {
        disallowedCommands.Add(UnitCommand.Attack, 1);  // 1 - это сколько раз команда была запрещена
        logi('Команда атаки запрещена', disallowedCommands.Item.get(UnitCommand.Attack) ,'раз!');
        // Запрет будет действовать на уровне получения команды.
        // Т.е. непосредственно атаковать юнит все ещё сможет и даже будет получать приказ при автоатаке, но игрок не сможет выдать эту команду.

    } else {
        var n = disallowedCommands.Item.get(UnitCommand.Attack);
        if (n == 1) {
            disallowedCommands.Remove(UnitCommand.Attack);
        } else {
            disallowedCommands.Item.set(UnitCommand.Attack, n - 1);
        }
        logi('Команда атаки разрешена');
    }

    // Проверим, может ли юнит дойти до клетки?
    var cell = createPoint(55, 10);
    if (unitCheckPathTo(unit, cell)) {
        logi('Юнит может пройти к', cell.ToString());
    } else {
        logi('Юнит НЕ может пройти к', cell.ToString());
    }

    // Телепортация юнита
    if (unitTeleport(unit, cell)) {
        logi('Юнит телепортирован в', cell.ToString());
    } else {
        logi('Юнит НЕ может быть телепортирован в', cell.ToString());
    }

    // Скорость юнита в клетке
    logi('Скорость юнита в клетке', cell.ToString(), 'согласно реальной карте:', unitSpeedAtCellByRealMap(unit, cell));

    // Скорость юнита в клетке с учетом тумана войны
    logi('Скорость юнита в клетке', cell.ToString(), 'согласно известной карте:', unitSpeedAtCellByKnownMap(unit, cell));

    // Можно ли разместить юнита с указанным конфигом в этой клетке?
    // Тут важно, что проверяется без наличия самого юнита
    var riderCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Raider");
    var settlement = unit.Owner;
    logi('Можно ли поместить юнита', '"' + riderCfg.Name + '"', 'в клетке', cell.ToString(),
         'согласно известной карте:', unitCanBePlacedByKnownMap(riderCfg, settlement, cell.X, cell.Y));

    // Такая же проверка с учетом тумана войны
    logi('Можно ли поместить юнита', '"' + riderCfg.Name + '"', 'в клетке', cell.ToString(),
         'согласно реальной карте:', unitCanBePlacedByRealMap(riderCfg, cell.X, cell.Y));
}


/**
 * Пример работы со сценой
 */
function example_scenaWorks() {
    // Глобальная переменная "scena" - это API для доступа к данным текущей сцены
    // Т.к. API ещё не разработано, ВРЕМЕННО прокинул объект реальной сцены
    // Здесь и далее в функии выполняется работа с реальными объектами (не API)
    var realScena = scena.GetRealScena();
    logi('Сцена:', '"' + realScena.ScenaName + '"');

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


/**
 * Пример работы с игроками
 */
function example_playerWorks() {
    // Глобальная переменная "players" - это массив с API для доступа к каждому игроку
    logi('Количество игроков:', '"' + players.length + '"');

    for(var i in players) {
        player = players[i];

        // Т.к. API ещё не разработано, ВРЕМЕННО прокинул реальный объект игрока
        // Здесь и далее в функии выполняется работа с реальными объектами (не API)
        var realPlayer = player.GetRealPlayer();
        logi(`Игрок ${i}:`, `${realPlayer.Nickname}`);

        // Поселение игрока
        var realSettlement = realPlayer.GetRealSettlement();
        logi(`  Предводитель: ${realSettlement.LeaderName}`);

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

        // Дипломатия
        var diplomacy = realSettlement.Diplomacy;
        var otherSettlement = players["0"].GetRealPlayer().GetRealSettlement();
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

        // Перечисление юнитов
        var enumerator = units.GetEnumerator();
        while(enumerator.MoveNext()) {
            logi('  Первый юнит:', enumerator.Current.ToString());
            break;
        }
        enumerator.Dispose();

        // Работа с юнитом
        if (unit) {
            logi(`  У ${realPlayer.Nickname} обнаружен юнит с id=0: ${unit.ToString()}`);

            // Здесь много разных методов (убрать false, чтобы отобразить названия)
            if (false) inspect(unit, "", 1);

            // Боевой отдел:
            logi(`  Нанесем 1 ед. урона юниту с типом повреждения "ближний бой"`)
            var battleMind = unit.BattleMind;
            battleMind.TakeDamage(null, 1, UnitDeathType.Mele);
            // Другие методы:
            //   TakeEffectiveDamage(attacker, dmg, type) - нанесение урона без учета брони
            //   InstantDeath(attacker, type) - уничтожить юнит
            //   CauseDamage(target, dmg, type) - нанесение урона другому юниту
            //   CauseEffectiveDamage(target, dmg, type) - нанесение урона другому юниту без учета брони

            // Есть ещё много других отделов, которые отвечают за другие аспекты юнита.
            // Про них позже.
        }

        // Объект для бота
        var realMasterMind = HordeUtils.getValue(realPlayer, "MasterMind");
        if (realMasterMind){
            logi(`  Характер:`, realMasterMind.Character.Description);
        } else {
            logi(`  Управляется игроком`);
        }
        // Подробнее в отдельном примере

        // Отправить текстовое сообщение игроку (вернее поселению игрока)
        var messages = realSettlement.Messages;
        var msg = createGameMessageWithNoSound(`Привет, ${realPlayer.Nickname}!`);
        messages.AddMessage(msg);
        var msg = createGameMessageWithSound(`И вот тебе цветной текст со звуком`, createHordeColor(255, 150, 150, 255));
        messages.AddMessage(msg);
        // Можно ещё разукрашивать отдельные слова, но это покажу потом

        // Объявить поражение
        var existence = realSettlement.Existence;
        if (realMasterMind) {
            // Убрать false и тогда всем, кроме игрока будет объявлено поражение, а ему, соответственно, победа
            if (false) { existence.ForceDefeat(); }

            // Внимание!
            // Пока что не работает, если вызывать на первом такте игры
            // Пока что не отображает сообщение о поражении
        }
    }
}


/**
 * Пример работы с конфигами
 * Здесь выполняется работа с реальными объектами (не API)
 * Внимание! Для сброса изменений требуется перезапуск игры.
 */
function example_configWorks() {
    logi("Слепок контента:", HordeContent.ContentStamp);

    // Получаем конфиг катапульты
    var catapultCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Catapult");

    // Здесь можно убрать if-false, чтобы отобразить поля конфига
    // Здесь не следует копать более чем на 1 уровень в глубину, т.к. получается слишком много данных
    if (false) inspect(catapultCfg, "Конфиг катапульты:", 1);
    
    // Получаем значения из конфига
    logi("Текущее количество камней при выстреле:", catapultCfg.MainArmament.EmitBulletsCountMin);

    // Устанавливаем значения в private-члены конфига
    logi("Делаем магию..");
    HordeUtils.setValue(catapultCfg.MainArmament, "EmitBulletsCountMin", 10);
    HordeUtils.setValue(catapultCfg.MainArmament, "EmitBulletsCountMax", 10);
    
    // Результат можно проверить в игре
    logi("Теперь катапульты кидают", catapultCfg.MainArmament.EmitBulletsCountMin, "камней за выстрел!");
}


/**
 * Пример добавления конфига
 * Внимание! Для сброса изменений требуется перезапуск игры.
 */
function example_configCreation() {
    // Берем исходные конфиги
    var ballistaCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Balista");
    var factoryCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Factory");

    // Клонируем конфиг и изменяем
    var newBallistaCfg = HordeContent.CloneConfig(ballistaCfg);
    HordeUtils.setValue(newBallistaCfg, "Name", "Динамическая баллиста");
    HordeUtils.setValue(newBallistaCfg, "ProductionTime", 50);
    HordeUtils.setValue(newBallistaCfg, "TintColor", createHordeColor(255, 255, 150, 150));
    logi('Создан новый конфиг баллисты:', newBallistaCfg.Uid, `(${newBallistaCfg.Name})`);

    // Добавляем новую баллисту в завод
    var producerParams = factoryCfg.GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
    var produceList = producerParams.CanProduceList;
    logi('Сейчас завод производит:', produceList.Count, 'вида техники');
    logi('Добавляем только что созданную баллисту в список производства..');
    produceList.Add(newBallistaCfg);
    logi('Теперь завод производит:', produceList.Count, 'вида техники');
}


/**
 * Пример замены обработчика состояния юнита
 * Внимание! Для сброса изменений требуется перезапуск игры.
 */
function example_changeUnitWorker_1() {

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
        ? 'Обработчик мечника успешно изменен!'
        : 'Обработчик мечника НЕ изменен!');
    // Если все ок, то теперь все мечники не будут поворачиваться когда стоят, но будут лечиться!
}


/**
 * Пример замены обработчика состояния юнита с проксированием в исходный обработчик
 * Внимание! Для сброса изменений требуется перезапуск игры.
 */
function example_changeUnitWorker_2() {

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
        ? 'Обработчик лучника успешно изменен!'
        : 'Обработчик лучника НЕ изменен!');

    // Внимание!
    // При каждом следующем вызове примера "текущий обработчик" уже будет содержать предыдущий код лечения + проксирование,
    // поэтому туда дополнительно добавится ещё одно лечение.
    // Желательно сохранить исходный обработчик в глобальную переменную, чтобы не делать матрешку из вызовов.
}


/**
 * Пример интроспекции объектов.
 * Если убрать if-false, то в логи будет записана структура API Орды
 */
function example_introspection() {
    // Remove false-condition to reveal the Horde API structure
    if (false) inspect(HordeAPI, "Horde API structure (в разработке)");
    if (false) inspect(HCL, "HordeClassLibrary (полный доступ)", 5);
    if (false) inspect(players["0"].GetRealPlayer().GetRealSettlement().Units, ".Net объект с юнитами игрока", 1);

    // Пример получения содержимого в enum-типах
    if (false) inspectEnum(UnitAnimState);

    // Пример получения содержимого в enum-типах, которые флаги
    if (false) inspectFlagEnum(UnitLifeState);
}


/**
 * Пример использования .Net-типов в скриптах
 * 
 * См. также документацию и пример использования ExtendedHostFunctions
 * https://microsoft.github.io/ClearScript/Reference/html/T_Microsoft_ClearScript_ExtendedHostFunctions.htm
 * https://microsoft.github.io/ClearScript/Tutorial/FAQtorial.html (см. пункт 24)
 */
function example_importDotNetTypes() {
    var List = xHost.type('System.Collections.Generic.List');
    var DayOfWeek = xHost.type('System.DayOfWeek');
    var week = xHost.newObj(List(DayOfWeek), 7);
    week.Add(DayOfWeek.Sunday);
    
    logi("[Example-DotNetTypes] DayOfWeek:", week[0].ToString());
}


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
