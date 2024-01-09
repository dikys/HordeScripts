
/**
 * Пример работы с данными игры
 */
function example_gameWorks() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var BattleController = HordeEngine.HordeResurrection.Engine.Logic.Battle.BattleController;
    logi('  Текущий такт:', BattleController.GameTimer.GameFramesCounter);
    logi('  Текущий FPS:', BattleController.GameTimer.CurrentFpsLimit);
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
