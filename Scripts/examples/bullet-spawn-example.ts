

/**
 * Пример создания снаряда
 * Тестил только некоторые виды снарядов, поэтому может работать не все.
 */
function example_spawnBullet() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var realScena = scena.GetRealScena();
    var settlement_0 = realScena.Settlements.Item.get('0');  // Олег

    // Любой юнит, от имени которого будет отправлена стрела
    var someUnit = settlement_0.Units.GetCastleOrAnyUnit();

    // Конфиг снаряда
    var arrowCfg = HordeContent.GetBulletConfig("#BulletConfig_Arrow");

    // Характеристики выстрела
    var combatParams = BulletCombatParams.CreateInstance();
    HordeUtils.setValue(combatParams, "Damage", 4);
    HordeUtils.setValue(combatParams, "AdditiveBulletSpeed", createPF(0, 0));

    // Создание снаряда
    var bull = spawnBullet(someUnit, null, null, arrowCfg, combatParams, createPoint(10, 100), createPoint(1000, 800), UnitMapLayer.Main);
    logi(`  Создан снаряд: ${bull.ToString()}`);
}


/**
 * Пример создания большого количества снарядов
 */
function example_spawnBulletsRain() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

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
    var n = 0;
    for (var i = 0; i < 200; i++) {
        createBullRnd(arrowCfg);
        n++;
    }
    for (var i = 0; i < 20; i++) {
        createBullRnd(bombCfg);
        n++;
    }
    logi('  Создано', n, 'снарядов');
}
