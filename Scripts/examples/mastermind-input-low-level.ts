import { createPoint } from "library/common/primitives";
import { inspectEnum } from "library/common/introspection";
import { UnitCommand } from "library/game-logic/horde-types";
import { AssignOrderMode, VirtualInput, VirtualSelectUnitsMode } from "library/mastermind/virtual-input";
import HordeExampleBase from "./base-example";

/**
 * Пример имитации ввода игрока
 */
export class Example_InputLowLevel extends HordeExampleBase {

    public constructor() {
        super("Input low-level");
    }

    public onFirstRun() {
        this.logMessageOnRun();
            
        let oleg = players["0"].GetRealPlayer();
        
        this.logi('Список всех команд юнитов');
        inspectEnum(UnitCommand);

        this.logi('Выделить юнитов в области');
        VirtualInput.selectUnits(oleg, createPoint(0, 0), createPoint(15, 15));

        this.logi('Добавить к выделению юнитов в области (shift)');
        VirtualInput.selectUnits(oleg, createPoint(18, 18), createPoint(20, 20), VirtualSelectUnitsMode.Include);

        this.logi('Убрать из текущего выделения юнитов из области (ctrl)');
        VirtualInput.selectUnits(oleg, createPoint(18, 18), createPoint(18, 18), VirtualSelectUnitsMode.Exclude);

        this.logi('Клик правой кнопкой');
        VirtualInput.smartClick(oleg, createPoint(9, 9));

        this.logi('Команда атаки (в очередь)');
        VirtualInput.pointBasedCommand(oleg, createPoint(19, 19), UnitCommand.Attack, AssignOrderMode.Queue);

        this.logi('Выбор по id');
        VirtualInput.selectUnitsById(oleg, [42]);

        this.logi('Команда атаки');
        VirtualInput.pointBasedCommand(oleg, createPoint(19, 19), UnitCommand.Attack);

        this.logi('Команда держать позицию');
        VirtualInput.oneClickCommand(oleg, UnitCommand.HoldPosition);

        this.logi('Выделить замок и заказать производство рабочего');
        let castle = oleg.GetRealSettlement().Units.GetCastleOrAnyUnit();
        VirtualInput.selectUnitsById(oleg, [castle.Id]);
        VirtualInput.produceUnitCommand(oleg, "#UnitConfig_Slavyane_Worker1", 1);

        // Отправить свободного рабочего строить здание
        let someFreeWorker = oleg.GetRealSettlement().Units.Professions.FreeWorkers.First();
        if (someFreeWorker) {
            this.logi('Выделить свободного рабочего');
            VirtualInput.selectUnitsById(oleg, [someFreeWorker.Id]);

            this.logi('Построить забор');
            VirtualInput.produceBuildingCommand(oleg, "#UnitConfig_Slavyane_Fence", createPoint(1, 5), createPoint(7, 7));

            this.logi('Построить ферму (в очередь)');
            VirtualInput.produceBuildingCommand(oleg, "#UnitConfig_Slavyane_Farm", createPoint(1, 8), null, AssignOrderMode.Queue);
        } else {
            this.logi('Свободный рабочий не найден');
        }

        // Показать выделенных в предыдущем такте юнитов
        // Внимание! Здесь не учитываются команды выданные в этом такте! Т.е. это выделение с прошлого такта.
        let selectedSquad = oleg.SelectedSquadVirtual;
        if (selectedSquad.Count > 0) {
            this.logi('У', oleg.Nickname, 'выделены следующие юниты:');
            ForEach(selectedSquad, u => {
                this.logi('- ', u.ToString());
            });
        } else {
            this.logi('У', oleg.Nickname, 'нет выделенных юнитов в данный момент');
        }
    }
}
