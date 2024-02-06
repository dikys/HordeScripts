
/**
 * Пример создания юнита со скриптовым обработчиком удара
 */
function example_customUnit() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var realScena = scena.GetRealScena();
    var settlement_0 = realScena.Settlements.Item.get('0');  // Олег

    // Создание конфига воина
    var unitCfg = example_customUnit_getOrCreateUnitConfig();

    // Создание обработчика
    var moveWorker = host.newObj(JsUnitWorkerCommon);
    HordeUtils.setValue(moveWorker, "FuncName", "example_customUnit_moveWorker");

    // Установка обработчика
    var stateWorkers = HordeUtils.getValue(unitCfg, "StateWorkers");
    stateWorkers.Item.set(UnitState.Move, moveWorker);

    // Инициализация переменных
    example_customUnit_initVars();

    logi('  Настройка воина завершена!');
}

/**
 * Создание конфига воина
 */
function example_customUnit_getOrCreateUnitConfig() {
    var unitCfgOrig = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Araider");
    var exampleCfgUid = "#UnitConfig_Slavyane_Araider_EXAMPLE";
    if (HordeContent.HasUnitConfig(exampleCfgUid)) {
        // Конфиг уже был создан, берем предыдущий
        var unitCfg = HordeContent.GetUnitConfig(exampleCfgUid);
        logi('  Конфиг воина для теста:', unitCfg.ToString());
    } else {
        // Создание нового конфига
        var unitCfg = HordeContent.CloneConfig(unitCfgOrig, exampleCfgUid);

        // Добавление юнита в конюшню
        var producerCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Stables");
        var producerParams = producerCfg.GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
        var produceList = producerParams.CanProduceList;
        produceList.Add(unitCfg);

        logi('  Создан новый конфиг воина для теста:', unitCfg.ToString());
    }

    // Настройка
    HordeUtils.setValue(unitCfg, "ProductionTime", 50); // Быстрое производство для теста
    HordeUtils.setValue(unitCfg, "CostResources", createResourcesAmount(150, 200, 50 ,1));

    return unitCfg;
}

/**
 * Обработчик состояния Move
 */
function example_customUnit_moveWorker(u) {
    // Запуск обычного обработчика
    baseUnitMoveWorker.Work(u);

    // В CustomData можно хранить произвольные переменные для скрипта, но сначала их туда нужно поместить
    if (!("araiderShoot" in u.CustomData)) {
        u.CustomData.araiderShoot = new AraiderShootData();
    }

    // Выстрелить как только пришло время
    if (u.CustomData.araiderShoot.checkCharge()) {
        const result = example_customUnit_oneHit(u);
        if (result) {
            u.CustomData.araiderShoot.setReloadTime(araiderArmament.ReloadTime);
        }
    }
}

/**
 * Выполняет один удар.
 */
function example_customUnit_oneHit(u, motion, hitNum) {
    // Временно устанавливаем другое вооружение, для корректного поиска врага
    var prevArmament = u.BattleMind.SelectedArmament;
    HordeUtils.setValue(u.BattleMind, "SelectedArmament", araiderArmament);

    // Поиск ближайшего врага
    var allowedQueryFlags = makeFlags(UnitQueryFlag, [UnitQueryFlag.CanAttackTarget, UnitQueryFlag.Harmless, UnitQueryFlag.NearDeathUnits]);
    var nearestEnemy = u.CommunicationMind.GetNearestEnemy(allowedQueryFlags, araiderArmament.Range);

    // Был ли найден враг?
    if (!nearestEnemy) {
        // Возвращаем вооружение юнита
        HordeUtils.setValue(u.BattleMind, "SelectedArmament", prevArmament);

        return false;
    }

    // Координаты выстрела и цели
    var bias = araiderArmament.GunCoord.Item.get(u.Direction);
    var launchPos = createPoint(bias.X + u.Position.X,
                                bias.Y + u.Position.Y);
    var targetPos = createPoint(nearestEnemy.Position.X, nearestEnemy.Position.Y);

    // Создание снаряда
    //spawnBullet(u, nearestEnemy, araiderArmament, araiderArmament.BulletConfig, araiderArmament.BulletCombatParams, launchPos, targetPos, nearestEnemy.MapLayer);

    // В большинстве случаев для создания снаряда удобно использовать метод "Shot", но там используется вооружение заданное в конфиге юнита
    u.BattleMind.SelectedArmament.Shot(u, nearestEnemy, targetPos, nearestEnemy.MapLayer);

    // Возвращаем вооружение юнита
    HordeUtils.setValue(u.BattleMind, "SelectedArmament", prevArmament);

    return true;
}

/**
 * Настройка глобальных переменных.
 */
function example_customUnit_initVars() {
    // Базовый обработчик движения
    baseUnitMoveWorker = host.newObj(HCL.HordeClassLibrary.UnitComponents.Workers.BaseUnit.BaseUnitMove);

    // Смещение арбалета по направлениям
    var gunCoord = host.newObj(Dictionary(UnitDirection, Point2D));
    gunCoord.Add(UnitDirection.Up, createPoint(3,-10));
    gunCoord.Add(UnitDirection.RightUp, createPoint(5, -5));
    gunCoord.Add(UnitDirection.Right, createPoint(8, -4));
    gunCoord.Add(UnitDirection.RightDown, createPoint(0, 0));
    gunCoord.Add(UnitDirection.Down, createPoint(0, 0));
    gunCoord.Add(UnitDirection.LeftDown, createPoint(0, 0));
    gunCoord.Add(UnitDirection.Left, createPoint(-8, -4));
    gunCoord.Add(UnitDirection.LeftUp, createPoint(-10, -10));

    // Снаряд
    var arrowCfg = HordeContent.GetBulletConfig("#BulletConfig_Arrow");

    // Вооружение
    araiderArmament = UnitArmament.CreateArmament(arrowCfg);
    HordeUtils.setValue(araiderArmament.BulletCombatParams, "Damage", 4);
    HordeUtils.setValue(araiderArmament.BulletCombatParams, "AdditiveBulletSpeed", createPF(0, 0));
    HordeUtils.setValue(araiderArmament, "Range", 7);
    HordeUtils.setValue(araiderArmament, "ForestRange", 1);
    HordeUtils.setValue(araiderArmament, "RangeMin", 0);
    HordeUtils.setValue(araiderArmament, "Levels", 6);
    HordeUtils.setValue(araiderArmament, "ReloadTime", 15);
    HordeUtils.setValue(araiderArmament, "BaseAccuracy", 8);
    HordeUtils.setValue(araiderArmament, "MaxDistanceDispersion", 63);
    HordeUtils.setValue(araiderArmament, "DisableDispersion", false);
    HordeUtils.setValue(araiderArmament, "GunCoord", gunCoord);
    HordeUtils.setValue(araiderArmament, "EmitBulletsCountMin", 1);
    HordeUtils.setValue(araiderArmament, "EmitBulletsCountMax", 1);
}
var baseUnitMoveWorker;
var araiderArmament;

/**
 * Данные стрельбы конного арбалетчика.
 */
class AraiderShootData {
    public reloadTime: number;

    public constructor() {
        this.reloadTime = 0;
    }

    public checkCharge() {
        this.reloadTime--;
        return this.reloadTime <= 0;
    }

    public setReloadTime(ticks: number) {
        this.reloadTime = ticks;
    }
}
