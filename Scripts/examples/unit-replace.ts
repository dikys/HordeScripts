import { spawnDecoration } from "library/game-logic/decoration-spawn";
import HordeExampleBase from "./base-example";
import { getOrCreateTestUnit } from "./unit-example-utils";

/**
 * Пример замены юнита
 */
export class Example_ReplaceUnit extends HordeExampleBase {

    public constructor() {
        super("Replace unit");
    }

    public onFirstRun() {
        this.logMessageOnRun();
        
        let unit = getOrCreateTestUnit(this);
        if (unit == null) {
            this.log.info('Не удалось создать юнита для этого примера!');
            return;
        }
        this.log.info('Для этого примера выбран:', unit);

        let newCfg = HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Heavymen");
        // let newCfg = HordeContentApi.GetUnitConfig("#UnitConfig_Slavyane_Castle");
        this.log.info('Заменяем выбранного юнита на:', newCfg);

        const silent = true;  // Отключаем вывод в лог возможных ошибок (при регистрации и создании модели)
        let newUnit = unit.Owner.Units.ReplaceUnit(unit, newCfg, silent);
        if (newUnit) {
            // Создание графического эффекта
            spawnDecoration(ActiveScena.GetRealScena(), HordeContentApi.GetVisualEffectConfig("#VisualEffectConfig_LittleDust"), newUnit.Position);
            this.log.info("Выбранный юнит заменен на:", newUnit);
        } else {
            this.log.info("Не удалось заменить юнита");
        }
    }
}
