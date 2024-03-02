import { inspect, inspectEnum, inspectFlagEnum } from "library/common/introspection";
import { UnitAnimState, UnitLifeState } from "library/game-logic/horde-types";
import HordeExampleBase from "./base-example";

/**
 * Пример работы с данными игры
 */
export class Example_GameWorks extends HordeExampleBase {

    public constructor() {
        super("Game works");
    }

    public onFirstRun() {
        this.logMessageOnRun();
        
        // Инфо по тактам
        let BattleController = HordeEngine.HordeResurrection.Engine.Logic.Battle.BattleController;
        this.log.info('Текущий такт:', BattleController.GameTimer.GameFramesCounter);
        this.log.info('Текущий FPS:', BattleController.GameTimer.CurrentFpsLimit);

        // Инфо по реплею (недоступно при инициализации сцены, т.е. в onFirstRun)
        let BattleControllerT = HordeUtils.GetTypeByName("HordeResurrection.Engine.Logic.Battle.BattleController, HordeResurrection.Engine")
        let repl = HordeUtils.getValue(ReflectionUtils.GetStaticProperty(BattleControllerT, "ReplayModule").GetValue(BattleControllerT), "_mode");
        if (repl.ToString() == "Play") {
            this.log.info('В данный момент запущено воспроизведение реплея');
        } else if (repl.ToString() == "Record") {
            this.log.info('В данный момент запущена запись реплея');
        } else {
            this.log.info('В данный момент невозможно определить статус реплея:', repl);
        }

        // Инфо по игрокам
        this.log.info('Происхождение игроков:');
        for (let player of players) {
            let realPlayer = player.GetRealPlayer();
            let pOrigin = realPlayer.PlayerOrigin.ToString();
            if (pOrigin == "Replay") {
                this.log.info('- Реплей-игрок:', realPlayer);
            } else if (pOrigin == "Local") {
                this.log.info('- Локальный игрок:', realPlayer);
            } else if (pOrigin == "Remote") {
                this.log.info('- Удаленный игрок:', realPlayer);
            } else {
                this.log.info('- Невозможно определить происхождение игрока:', realPlayer);
            }
        }
    }
}

/**
 * Пример интроспекции объектов.
 * Если убрать if-false, то в логи будет записана структура API Орды
 */
export class Example_Introspection extends HordeExampleBase {

    public constructor() {
        super("Introspection");
    }

    public onFirstRun() {
        this.logMessageOnRun();
        
        // Remove false-condition to reveal the Horde API structure
        if (false) inspect(HordeAPI, 1, "Horde API structure (в разработке)");
        if (false) inspect(HCL, 5, "HordeClassLibrary (полный доступ)");
        if (true) inspect(players["0"].GetRealPlayer().GetRealSettlement().Units, 1, ".Net объект с юнитами игрока");

        // Пример получения содержимого в enum-типах
        if (true) inspectEnum(UnitAnimState);

        // Пример получения содержимого в enum-типах, которые флаги
        if (true) inspectFlagEnum(UnitLifeState);
    }
}


/**
 * Пример использования .Net-типов в скриптах
 * 
 * См. также документацию и пример использования ExtendedHostFunctions
 * https://microsoft.github.io/ClearScript/Reference/html/T_Microsoft_ClearScript_ExtendedHostFunctions.htm
 * https://microsoft.github.io/ClearScript/Tutorial/FAQtorial.html (см. пункт 24)
 */
export class Example_ImportDotNetTypes extends HordeExampleBase {

    public constructor() {
        super("Import .Net types");
    }

    public onFirstRun() {
        this.logMessageOnRun();
        
        let List = xHost.type('System.Collections.Generic.List');
        let DayOfWeek = xHost.type('System.DayOfWeek');
        let week = xHost.newObj(List(DayOfWeek), 7);
        week.Add(DayOfWeek.Sunday);
        
        this.log.info("DayOfWeek:", week[0]);
    }
}
