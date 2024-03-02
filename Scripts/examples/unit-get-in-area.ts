import { createPoint, createRect } from "library/common/primitives";
import { iterateOverUnitsInBox } from "library/game-logic/unit-and-map";
import HordeExampleBase from "./base-example";

/**
 * Выбрать всех юнитов в области (вариант 1 - перебор)
 * 
 * Внимание! Прямой перебор больших областей будет подтормаживать.
 */
export class Example_GetUnitsInArea_Bruteforce extends HordeExampleBase {

    public constructor() {
        super("Get units in area (bruteforce)");
    }

    public onFirstRun() {
        this.logMessageOnRun();
        
        let unitsMap = scena.GetRealScena().UnitsMap;

        this.log.info('Юниты:');
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
                let unit = unitsMap.GetUpperUnit(i, j);
                if (!unit)
                    continue;
                this.log.info('-', unit);
            }
        }
    }
}


/**
 * Выбрать всех юнитов в области (вариант 2 - через отряд)
 * 
 * Внимание! Здесь используется такая же логика как и при выделению юнитов рамкой, т.е., например, нельзя выбрать несколько зданий.
 */
export class Example_GetUnitsInArea_Squad extends HordeExampleBase {

    public constructor() {
        super("Get units in area (squad)");
    }

    public onFirstRun() {
        this.logMessageOnRun();
        
        // Создаём колбек для фильтрации юнитов
        let filterCallback = xHost.func(xHost.type('System.Boolean'), 1, function (unit) {
            // Для примера пропускаем все здания в области
            return !unit.Cfg.IsBuilding;
        });

        let unitsMap = scena.GetRealScena().UnitsMap;
        let rect = createRect(0,0,20,20);
        let squad = unitsMap.GetSquadFromRect(rect, filterCallback);

        this.log.info('Собрано юнитов:', squad.Count);
        ForEach(squad, u => {
            this.log.info('-', u);
        });
    }
}


/**
 * Выбрать всех юнитов в области (вариант 3 - оптимизация через k-мерное дерево)
 * Это наиболее оптимальный вариант для выделения юнитов, но нужно самостоятельно учитывать повторы для движущихся юнитов и зданий.
 */
export class Example_GetUnitsInArea_KdTree extends HordeExampleBase {

    public constructor() {
        super("Get units in area (Kd tree)");
    }

    public onFirstRun() {
        this.logMessageOnRun();

        let unitsIter = iterateOverUnitsInBox(createPoint(10, 10), 10);

        this.log.info('Юниты:');
        for (let u = unitsIter.next(); !u.done; u = unitsIter.next()) {
            this.log.info('-', u.value);
        }
    }
}
