
// ===================================================
// --- Различные типы

CanNotAttackCause = HCL.HordeClassLibrary.UnitComponents.Enumerations.CanNotAttackCause;
CanNotBuildReason = HCL.HordeClassLibrary.UnitComponents.Enumerations.CanNotBuildReason;
CaptureCondition = HCL.HordeClassLibrary.UnitComponents.Enumerations.CaptureCondition;
CompoundPart = HCL.HordeClassLibrary.UnitComponents.Enumerations.CompoundPart;
PatternUnitFeature = HCL.HordeClassLibrary.UnitComponents.Enumerations.PatternUnitFeature;
ResourceItemType = HCL.HordeClassLibrary.UnitComponents.Enumerations.ResourceItemType;
UnitDeathType = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitDeathType;
UnitDirection = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitDirection;
UnitAnimDirection = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitAnimDirection;
UnitAnimState = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitAnimState;
UnitEffectFlag = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitEffectFlag;
UnitEventFlag = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitEventFlag;
UnitFlags = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitFlags;
UnitHealthLevel = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitHealthLevel;
UnitLifeState = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitLifeState;
UnitMapLayer = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitMapLayer;
UnitQueryFlag = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitQueryFlag;
UnitSpecification = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitSpecification;
UnitState = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitState;
UnitStateSpecial = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitStateSpecial;
UnitVisibility = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitVisibility;
UnitCommand = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.UnitCommand;

BulletCombatParams = HCL.HordeClassLibrary.World.Objects.Bullets.BulletCombatParams;
DelegateWork = HCL.HordeClassLibrary.UnitComponents.Workers.Interfaces.AUnitWorkerCommon.DelegateWork;
Unit = HCL.HordeClassLibrary.World.Objects.Units.Unit;
KnownUnit = HCL.HordeClassLibrary.World.Objects.Units.KnownUnit;


// ===================================================
// --- Простые объекты

ResourcesAmount = HCL.HordeClassLibrary.World.Simple.ResourcesAmount;
function createResourcesAmount(gold: number, metal: number, lumber: number, people: number) {
    return host.newObj(ResourcesAmount, gold, metal, lumber, people);
}

GameMessage = HCL.HordeClassLibrary.World.Simple.GameMessage;
function createGameMessageWithNoSound(text: number, color=null) {
    return GameMessage.CreateWithNoSound(text, color);
}
function createGameMessageWithSound(text: number, color=null) {
    return GameMessage.CreateWithDefaultSound(text, color);
}


// ===================================================
// --- Объекты на сцене

function spawnUnit(settlement, uCfg, cell, direction) {
    var csType = HordeUtils.GetTypeByName("HordeClassLibrary.World.Objects.Units.SpawnUnitParameters");
    var spawnParams = HordeUtils.CreateInstance(csType);
    HordeUtils.setValue(spawnParams, "ProductUnitConfig", uCfg);
    HordeUtils.setValue(spawnParams, "Cell", cell);
    HordeUtils.setValue(spawnParams, "Direction", direction);

    var unit = settlement.Units.SpawnUnit(spawnParams);
    return unit;
}

function spawnBullet(sourceUnit, targetUnit, sourceArmament, bullCfg, bulletCombatParams, launchPos, targetPos, targetLayer) {
    var csType = HordeUtils.GetTypeByName("HordeClassLibrary.World.Objects.Bullets.BulletEmittingArgs, HordeClassLibrary");
    var emittingArgs = HordeUtils.CreateInstance(csType);
    HordeUtils.setValue(emittingArgs, "SourceUnit", sourceUnit);
    HordeUtils.setValue(emittingArgs, "TargetUnit", targetUnit);
    HordeUtils.setValue(emittingArgs, "SourceArmament", sourceArmament);
    HordeUtils.setValue(emittingArgs, "BulletConfig", bullCfg);
    HordeUtils.setValue(emittingArgs, "BulletCombatParams", bulletCombatParams);
    HordeUtils.setValue(emittingArgs, "LaunchPosition", launchPos);
    HordeUtils.setValue(emittingArgs, "TargetPosition", targetPos);
    HordeUtils.setValue(emittingArgs, "TargetLayer", targetLayer);

    var emittingArgsVar = host.newVar(HCL.HordeClassLibrary.World.Objects.Bullets.BulletEmittingArgs);
    emittingArgsVar.value = emittingArgs;

    var bull = bullCfg.CreateInstance(emittingArgsVar.ref);
    sourceUnit.Scena.ObjectController.RegisterBullet(bull);

    return bull;
}

/**
 * Послать сообщение всем поселениям на карте.
 */
function broadcastMessage(text, color) {
    var settlements = enumerate(scena.GetRealScena().Settlements);

    var settlement;
    while ((settlement = eNext(settlements)) !== undefined) {
        var msg = createGameMessageWithSound(text, color);
        settlement.Messages.AddMessage(msg);
    } 
}


// ===================================================
// --- Взаимодействие юнитов и карты

/**
 * Можно ли установить юнита с таким конфигом в заданную точку?
 * (Тут используется актуальные данные карты)
 */
function unitCanBePlacedByRealMap(uCfg, x, y) {
    return uCfg.CanBePlaced(scena.GetRealScena(), x, y);
}

/**
 * Можно ли установить юнита с таким конфигом в заданную точку согласно известной карте?
 * (Т.е. учитывается туман войны и другие виды вИдения)
 */
function unitCanBePlacedByKnownMap(uCfg, settlement, x, y) {
    return uCfg.CanBePlacedByKnownMap(settlement, x, y);
}

/**
 * Скорость юнита в указанной точке карты.
 * (Тут используется актуальные данные карты)
 */
function unitSpeedAtCellByRealMap(unit, cell) {
    var unitVar = host.newVar(Unit);
    return unit.MapMind.SpeedAtCellByRealMap(cell, unitVar.out)

    // В переменной unitVar находится юнит, если тут кто-то стоит и мешается
    // На возвращаемую скорость это не влияет
}

/**
 * Скорость юнита в указанной точке карты согласно известной карте.
 * (Т.е. учитывается туман войны и другие виды вИдения)
 */
function unitSpeedAtCellByKnownMap(unit, cell) {
    var knownUnitVar = host.newVar(KnownUnit);
    return unit.MapMind.SpeedAtCellByKnownMap(cell, knownUnitVar.out)

    // В переменной knownUnitVar находится known-юнит, если тут кто-то стоит и мешается
    // На возвращаемую скорость это не влияет
}

/**
 * Может ли юнит дойти к указанной точке?
 * (Тут учитывается туман войны и другие виды вИдения)
 */
function unitCheckPathTo(unit, cell) {
    return unit.MapMind.CheckPathTo(cell, false);
}

/**
 * Телепортировать юнита
 */
function unitTeleport(unit, cell) {
    unit.MapMind.TeleportToCell(cell);
    return unit.Cell == cell;
}


// ===================================================
// --- Профессии

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
 * В целом этот метод тоже пока что не работает как надо, т.к. объект с итоговыми параметрами имеет не тот тип.
 * Оставил, как пример работы с out-параметром.
 * 
 * @param uCfg - конфиг юнита
 * @param prof - профессия (значение из enum UnitProfession) (TODO: можно сделать парсинг из строки)
 * 
 * @return result - the concatenated description of all object properties
 */
function getUnitProfessionParams(uCfg, prof) {
    var profParams = host.newVar(HCL.HordeClassLibrary.HordeContent.Configs.Units.ProfessionParams.AUnitProfessionParams);
    if (!uCfg.ProfessionParams.TryGetValue(prof, profParams.out)) {
        logw('Can\'t get profession params:', prof.ToString());
        return null;
    }
    return profParams;

    // Так почему-то не вышло:
    // var prof = uCfg.ProfessionParams.Item.get(prof);
}
