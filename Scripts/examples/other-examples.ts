
/**
 * Пример работы с данными игры
 */
function example_gameWorks() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    // Инфо по тактам
    var BattleController = HordeEngine.HordeResurrection.Engine.Logic.Battle.BattleController;
    logi('  Текущий такт:', BattleController.GameTimer.GameFramesCounter);
    logi('  Текущий FPS:', BattleController.GameTimer.CurrentFpsLimit);

    // Инфо по реплею (недоступно при инициализации сцены, т.е. в onFirstRun)
    var BattleControllerT = HordeUtils.GetTypeByName("HordeResurrection.Engine.Logic.Battle.BattleController, HordeResurrection.Engine")
    var repl = HordeUtils.getValue(ReflectionUtils.GetStaticProperty(BattleControllerT, "ReplayModule").GetValue(BattleControllerT), "_mode");
    if (repl.ToString() == "Play") {
        logi('  В данный момент запущено воспроизведение реплея');
    } else if (repl.ToString() == "Record") {
        logi('  В данный момент запущена запись реплея');
    } else {
        logi('  В данный момент невозможно определить статус реплея:', repl.ToString());
    }

    // Инфо по игрокам
    logi('  Происхождение игроков:');
    for (var player of players) {
        var realPlayer = player.GetRealPlayer();
        var pOrigin = realPlayer.PlayerOrigin.ToString();
        if (pOrigin == "Replay") {
            logi('  - Реплей-игрок:', realPlayer.ToString());
        } else if (pOrigin == "Local") {
            logi('  - Локальный игрок:', realPlayer.ToString());
        } else if (pOrigin == "Remote") {
            logi('  - Удаленный игрок:', realPlayer.ToString());
        } else {
            logi('  - Невозможно определить происхождение игрока:', realPlayer.ToString());
        }
    }
}


/**
 * Пример интроспекции объектов.
 * Если убрать if-false, то в логи будет записана структура API Орды
 */
function example_introspection() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    // Remove false-condition to reveal the Horde API structure
    if (false) inspect(HordeAPI, 1, "Horde API structure (в разработке)");
    if (false) inspect(HCL, 5, "HordeClassLibrary (полный доступ)");
    if (false) inspect(players["0"].GetRealPlayer().GetRealSettlement().Units, 1, ".Net объект с юнитами игрока");

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
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var List = xHost.type('System.Collections.Generic.List');
    var DayOfWeek = xHost.type('System.DayOfWeek');
    var week = xHost.newObj(List(DayOfWeek), 7);
    week.Add(DayOfWeek.Sunday);
    
    logi("  [Example-DotNetTypes] DayOfWeek:", week[0].ToString());
}
