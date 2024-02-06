
/**
 * Пример создания юнита со скриптовым обработчиком удара
 */
function example_customUnit() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var realScena = scena.GetRealScena();
    var settlement_0 = realScena.Settlements.Item.get('0');  // Олег

    // Создание конфига воина
    var beammanCfg = example_customUnit_getOrCreateUnitConfig();

    // Создание обработчика
    var JsUnitWorkerCommon = HCL.HordeClassLibrary.UnitComponents.Workers.Script.JsUnitWorkerCommon;
    var hitWorker = host.newObj(JsUnitWorkerCommon);
    HordeUtils.setValue(hitWorker, "FuncName", "example_customUnit_hitWorker");

    // Установка обработчика
    var stateWorkers = HordeUtils.getValue(beammanCfg, "StateWorkers");
    stateWorkers.Item.set(UnitState.Hit, hitWorker);

    // Инициализация переменных
    init_beammanHitTable();
}

/**
 * Создание конфига воина с дубиной
 */
function example_customUnit_getOrCreateUnitConfig() {
    var beammanCfgOrig = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Beamman");
    var exampleCfgUid = "#UnitConfig_Slavyane_Beamman_EXAMPLE";
    if (HordeContent.HasUnitConfig(exampleCfgUid)) {
        // Конфиг уже был создан, берем предыдущий
        var beammanCfg = HordeContent.GetUnitConfig(exampleCfgUid);
        logi('  Конфиг воина для теста:', beammanCfg.ToString());
    } else {
        // Создание нового конфига
        var beammanCfg = HordeContent.CloneConfig(beammanCfgOrig, exampleCfgUid);

        // Добавление юнита в казарму
        var barrakCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Barrack");
        var producerParams = barrakCfg.GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
        var produceList = producerParams.CanProduceList;
        produceList.Add(beammanCfg);

        logi('  Создан новый конфиг воина для теста:', beammanCfg.ToString());
    }

    // Настройка
    HordeUtils.setValue(beammanCfg, "ProductionTime", 50);
    HordeUtils.setValue(beammanCfg, "Shield", 1);
    HordeUtils.setValue(beammanCfg, "CostResources", createResourcesAmount(50, 100, 0 ,1));

    // Установка снаряда "Удар дубины"
    var beamBulletCfg = example_customUnit_getOrCreateBeamHitBullet();
    HordeUtils.getValue(beammanCfg.MainArmament, "BulletConfigRef").SetConfig(beamBulletCfg);
    HordeUtils.setValue(beammanCfg.MainArmament.BulletCombatParams, "Damage", 10);

    return beammanCfg;
}

/**
 * Создание снаряда для удара дубины
 */
function example_customUnit_getOrCreateBeamHitBullet() {
    var meleBulletCfg = HordeContent.GetBulletConfig("#BulletConfig_CommonMele");
    var beamBulletCfgUid = "#BulletConfig_BeamMele";

    if (HordeContent.HasBulletConfig(beamBulletCfgUid)) {
        // Конфиг уже был создан, берем предыдущий
        var beamBulletCfg = HordeContent.GetBulletConfig(beamBulletCfgUid);
        logi('  Конфиг снаряда для теста:', beamBulletCfg.ToString());
    } else {
        // Создание нового конфига
        var beamBulletCfg = HordeContent.CloneConfig(meleBulletCfg, beamBulletCfgUid);
        logi('  Создан новый конфиг снаряда для теста:', beamBulletCfg.ToString());
    }

    // Настройка
    HordeUtils.setValue(beamBulletCfg, "Description", "Удар дубины");
    HordeUtils.setValue(beamBulletCfg, "CanDamageAllied", true);
    HordeUtils.setValue(beamBulletCfg, "UnitDeathType", UnitDeathType.Heavy);

    return beamBulletCfg;
}

/**
 * Обработчик состояния Hit
 */
function example_customUnit_hitWorker(u) {
    var motion = u.OrdersMind.ActiveMotion;  // Здесь MotionHit
    if (motion.IsUnprepared)
    {
        motion.State = StateMotion.InProgress;

        const stage = 0;
        const looped = false;
        u.VisualMind.SetAnimState(UnitAnimState.Attack, stage, looped);
    }

    // Произвести удар в момент, который задан анимацией (обычно, когда оружие достигает цели)
    if (u.VisualMind.Animator.HasTask(AnimatorScriptTasks.Hit))
    {
        var unitsMap = u.Scena.UnitsMap;

        var hits = beammanHitTable[u.Direction.ToString()];
        if (hits) {
            for (var hit of hits) {
                var targetPosition = createPoint(hit.X + u.Position.X,
                                                 hit.Y + u.Position.Y);

                // Дружественным воинам урон не наносим
                var unitInCell = unitsMap.GetUpperUnit(Math.floor(targetPosition.X / WorldConstants.CellSize),
                                                       Math.floor(targetPosition.Y / WorldConstants.CellSize));
                if (unitInCell != null && unitInCell.Owner.Diplomacy.IsAllianceStatus(u.Owner)) {
                    // Исключение - здания и те, кого юнит атакует умышленно
                    if (!unitInCell.Cfg.IsBuilding && unitInCell != motion.Target) {
                        continue;
                    }
                }

                // Создание снаряда
                var armament = u.BattleMind.SelectedArmament;
                spawnBullet(u, motion.Target, armament, armament.BulletConfig, armament.BulletCombatParams, targetPosition, targetPosition, motion.TargetMapLayer);

                // В большинстве случаев для создания снаряда удобно использовать метод "Shot",
                // но он не позволяет задать SourcePosition, который необходим здесь для удара дубины
                //u.BattleMind.SelectedArmament.Shot(u, motion.Target, targetPosition, motion.TargetMapLayer);
            }

            // Звуки боя
            var sounds = HordeContent.GetSoundsCatalog("#SoundsCatalog_Hits_Mele_Dubina_02eb130f59b6");
            var snd = u.SoundsMind.UtterSound(sounds, "Hit", u.Position);
        }

        // Устанавливаем время перезарядки
        u.ReloadCounter = u.Cfg.ReloadTime;

        // Отмечаем, что удар был произведен
        u.VisualMind.Animator.CompleteTask(AnimatorScriptTasks.Hit);
    }

    // Движение удара считается завершенным только на последнем кадре анимации
    if (u.VisualMind.Animator.IsAnimationCompleted)
    {
        motion.State = StateMotion.Done;

        u.VisualMind.SetAnimState(UnitAnimState.Stand);
    }
    else
    {
        motion.State = StateMotion.InProgress;
    }
}

/**
 * Таблица смещений удара по направлениям
 */
var beammanHitTable;
function init_beammanHitTable() {
    beammanHitTable = {
        "Up": [
            createPoint(25,-25),
            createPoint(0,-25),
            createPoint(-25,-25),
        ],
        "RightUp": [
            createPoint(25, -3),
            createPoint(25,-25),
            createPoint(0,-25),
        ],
        "Right": [
            createPoint(25, 25),
            createPoint(25, -3),
            createPoint(25,-25),
        ],
        "RightDown": [
            createPoint(0, 20),
            createPoint(25, 25),
            createPoint(25, -3),
        ],
        "Down": [
            createPoint(-25, 25),
            createPoint(0, 20),
            createPoint(25, 25),
        ],
        "LeftDown": [
            createPoint(-25,  3),
            createPoint(-25, 25),
            createPoint(0, 20),
        ],
        "Left": [
            createPoint(-25,-25),
            createPoint(-25,  3),
            createPoint(-25, 25),
        ],
        "LeftUp": [
            createPoint(0,-25),
            createPoint(-25,-25),
            createPoint(-25,  3),
        ],
    };
}
