import { log } from "library/common/logging";

// Перечисление профессий (enum)
export const UnitProfession = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitProfession;

// Параметры - это в конфиге, а данные - это в юните (т.е. на сцене)
export const UnitProducerProfessionParams = HCL.HordeClassLibrary.HordeContentApi.Configs.Units.ProfessionParams.UnitProducerProfessionParams;
export const UnitProducerProfessionData = HCL.HordeClassLibrary.UnitComponents.ProfessionData.UnitProducerProfessionData;
// ... позже тут будут добавлены остальные типы.

/**
 * Берет параметры профессии из конфига юнита.
 * 
 * Почему-то не получилось просто взять значение по ключу из словаря (см. ниже)
 * Пришлось переделать через out-параметр.
 * 
 * @param uCfg - конфиг юнита
 * @param prof - профессия (значение из enum UnitProfession) (TODO: можно сделать парсинг из строки)
 * 
 * @return result - параметры профессии
 */
export function getUnitProfessionParams(uCfg, prof) {
    let profParams = host.newVar(HCL.HordeClassLibrary.HordeContentApi.Configs.Units.ProfessionParams.AUnitProfessionParams);
    if (!uCfg.ProfessionParams.TryGetValue(prof, profParams.out)) {
        log.warning('Can\'t get profession params:', prof);
        return null;
    }
    return profParams.value;

    // Так почему-то не вышло:
    // let prof = uCfg.ProfessionParams.Item.get(prof);
}
