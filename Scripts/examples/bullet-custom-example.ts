
/**
 * Пример создания скриптового снаряда
 */
function example_customBullet() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var realScena = scena.GetRealScena();
    var settlement_0 = realScena.Settlements.Item.get('0');  // Олег

    // Любой юнит, от имени которого будет отправлена стрела
    var someUnit = settlement_0.Units.GetCastleOrAnyUnit();

    // Конфиг снаряда
    var bullCfgTemplate = HordeContent.GetBulletConfig("#BulletConfig_ScriptBullet_Template");
    var customBullCfg = HordeContent.CloneConfig(bullCfgTemplate, "#BulletConfig_ExampleScriptBullet");

    // Установка функций-обработчиков
    HordeUtils.setValue(customBullCfg.SpecialParams, "InitializeFuncName", "example_customBullet_initialize");
    HordeUtils.setValue(customBullCfg.SpecialParams, "ProcessFuncName", "example_customBullet_process");

    // Установка других параметров конфига
    HordeUtils.setValue(customBullCfg, "BaseBulletSpeed", createPF(8, 0));
    HordeUtils.setValue(customBullCfg, "IsBallistic", true);

    // Характеристики выстрела
    var combatParams = BulletCombatParams.CreateInstance();
    HordeUtils.setValue(combatParams, "Damage", 4);
    HordeUtils.setValue(combatParams, "AdditiveBulletSpeed", createPF(0, 0));

    // Создание снаряда
    var bull = spawnBullet(someUnit, null, null, customBullCfg, combatParams, createPoint(250, 250), createPoint(500, 300), UnitMapLayer.Main);
    if (!bull) {
        logi(`  Ошибка! Не удалось создать снаряд.`);
        return;
    }
    logi(`  Создан снаряд: ${bull.ToString()}`);
}

/**
 * Функция-обработчик для инициализации объекта скриптового снаряда.
 */
function example_customBullet_initialize(bull: BaseBullet, emitArgs: BulletEmittingArgs) {

    // Настройка анимации по данным из конфига
    bull.SetupAnimation();

    // Звук выстрела (берет из каталога заданного в конфиге снаряда)
    bull.UtterSound("Shot", bull.Position);

    // Скриптовые данные снаряда (тут можно запихнуть объект со множеством произвольных данных)
    example_customBullet_data[bull] = 0;
}

/**
 * Функция-обработчик скриптового снаряда. Вызывается каждый такт.
 */
function example_customBullet_process(bull: BaseBullet) {
    // Смена анимации
    bull.UpdateAnimation();

    // Кастомная обработка
    example_customBullet_data[bull]++;
    bull.DistanceDecrease();
    bull.ProcessBallistic();

    // Создание графических эффектов
    if (example_customBullet_data[bull] % 2 == 0) {
        var decorationCfg = HordeContent.GetVisualEffectConfig("#VisualEffectConfig_ArrowSmoke");
        var pos = createPoint(bull.Position.X, bull.Position.Y - Math.trunc(bull.Z));
        spawnDecoration(bull.Scena, decorationCfg, pos);
    }
    
    // Создание звуковых эффектов
    // Это пример запуска звуков, которые не прописаны в конфиге снаряда
    if (example_customBullet_data[bull] % 5 == 0) {
        var sndCatalog = HordeContent.GetSoundsCatalog("#SoundsCatalog_Hits_Mele_Axe");
        var pos = createPoint(bull.Position.X, bull.Position.Y - Math.trunc(bull.Z));
        spawnSound(bull.Scena, sndCatalog, "HitMetal", pos, false);
    }
    
    // Обработка достижения цели или завершения lifetime (для примера)
    if (example_customBullet_data[bull] >= 1000 || bull.IsTargetReached) {
        // Очистка скриптовых данных этого снаряда
        delete example_customBullet_data[bull];

        // Любое состояние кроме Flying ведет к удалению объекта
        HordeUtils.setValue(bull, "State", BulletState.ReachedTheGoal);

        // Снаряд успел долететь?
        if (bull.IsTargetReached) {
            bull.DamageArea(2);  // тут задаётся радиус, а урон был задан в BulletCombatParams
            bull.UtterSound("Hit", bull.Position);

            // Ещё есть метод `bull.DamageCell(bool magicDamage)` для нанесения точечного урона.
        }
    }
}
example_customBullet_data = {};
