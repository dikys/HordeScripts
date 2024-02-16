
// Перечисление профессий (enum)
var UnitProfession = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitProfession;

// Параметры - это в конфиге, а данные - это в юните (т.е. на сцене)
var UnitProducerProfessionParams = HCL.HordeClassLibrary.HordeContent.Configs.Units.ProfessionParams.UnitProducerProfessionParams;
var UnitProducerProfessionData = HCL.HordeClassLibrary.UnitComponents.ProfessionData.UnitProducerProfessionData;
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
function getUnitProfessionParams(uCfg, prof) {
    var profParams = host.newVar(HCL.HordeClassLibrary.HordeContent.Configs.Units.ProfessionParams.AUnitProfessionParams);
    if (!uCfg.ProfessionParams.TryGetValue(prof, profParams.out)) {
        logw('Can\'t get profession params:', prof.ToString());
        return null;
    }
    return profParams.value;

    // Так почему-то не вышло:
    // var prof = uCfg.ProfessionParams.Item.get(prof);
}
