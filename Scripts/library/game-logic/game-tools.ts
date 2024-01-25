
/**
 * Возвращает True, если проигрывается реплей.
 * 
 * Примечание:
 * Недоступно при инициализации сцены, т.е. в "onFirstRun()". Вместо этого можно проверить на первом такте в "everyTick()".
 */
function isReplayMode() {
    var BattleControllerT = HordeUtils.GetTypeByName("HordeResurrection.Engine.Logic.Battle.BattleController, HordeResurrection.Engine")
    var repl = HordeUtils.getValue(ReflectionUtils.GetStaticProperty(BattleControllerT, "ReplayModule").GetValue(BattleControllerT), "_mode");
    return repl.ToString() == "Play";
}
