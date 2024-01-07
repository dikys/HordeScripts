// флаг, что игра закончилась
var mapdefens_isFinish;
var mapdefens_timeElapsed;
// 40 минут с 50 кадрами в секунду
var mapdefens_timeEnd;
// ссылка на замок, который должны уничтожить враги
var mapdefens_goalCastle;
// прямоугольник для спавна
var mapdefens_enemySpawnRectangle;
// конфиги юнитов для спавна
var mapdefens_enemyUnitsCfg;
// конфиги снарядов
var mapdefens_enemyBulletCfg;
// игрок врага для управления
var mapdefens_enemyPlayer;
// игрок врага для управления
var mapdefens_enemySettlement;
// текущая волна
var mapdefens_spawnWaveNum;
// план для спавна
var mapdefens_spawnPlan;
// максимальное количество игроков в игре
var mapdefens_playersMaxCount;
// количество игроков в игре
var mapdefens_playersCount;
// список ид легендарных юнитов, которые будут рандомно спавнится
var mapdefens_legendaryUnitsCFGId;

// список легендарных рыцарей, которые после смерти спавнят 2 клонов с половиной хп
var mapdefens_boss_10_min_1_unitsInfo;

function mapdefens_onFirstRun() {
    var realScena   = scena.GetRealScena();
    var settlements = realScena.Settlements;
    // Рандомизатор
    var rnd         = realScena.Context.Randomizer;
    
    mapdefens_isFinish    = false;
    mapdefens_timeElapsed = 0;
    mapdefens_timeEnd     = (40 * 60) * 50;
    mapdefens_enemySpawnRectangle = {
        x: 0,
        y: 0,
        w: 182,
        h: 22
    };

    mapdefens_playersMaxCount = 5;
    mapdefens_playersCount    = 0;
    // пробегаемся по занятым слотам
    for (var player of players) {
        var realPlayer = player.GetRealPlayer();
        var settlement = realPlayer.GetRealSettlement();
        
        // игрок
        if (settlement.Uid < mapdefens_playersMaxCount) {
            if (!HordeUtils.getValue(realPlayer, "MasterMind")) {
                mapdefens_playersCount++;
                // любому игроку добавляем церковь
                // если объекта нету, тогда спавним его на карте
                if (!mapdefens_goalCastle) {
                    var goalUnitCfg = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Church"));
                    // увеличиваем хп до 400
                    HordeUtils.setValue(goalUnitCfg, "MaxHealth", 400);
                    // убираем починку
                    goalUnitCfg.ProfessionParams.Remove(UnitProfession.Reparable);

                    mapdefens_goalCastle = spawnUnit(
                        settlement,
                        goalUnitCfg,
                        createPoint(89, 124),
                        //createPoint(89, 150), // для тестов
                        UnitDirection.Down
                    );
                }
                logi("Поселение ", settlement.Uid, " is player");
            }
        }
        // враг
        else if (settlement.Uid == mapdefens_playersMaxCount) {
            mapdefens_enemyPlayer     = realPlayer;
            mapdefens_enemySettlement = settlement;
            logi("Поселение ", settlement.Uid, " is enemy");
        }
    }
    logi("Игроков: ", mapdefens_playersCount);

    ////////////////////////////
    // задаем конфиги врагов
    ////////////////////////////

    mapdefens_enemyUnitsCfg       = {};
    mapdefens_enemyBulletCfg      = {};
    mapdefens_legendaryUnitsCFGId = [];

    // (легкая пехота) рыцарь
    mapdefens_enemyUnitsCfg["UnitConfig_Barbarian_Swordmen"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Barbarian_Swordmen"));
    // (легкая пехота) лучник
    mapdefens_enemyUnitsCfg["UnitConfig_Barbarian_Archer"]   = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Barbarian_Archer"));
    // (легкая пехота) лучник с зажигательными стрелами
    mapdefens_enemyUnitsCfg["UnitConfig_Barbarian_Archer_2"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Barbarian_Archer_2"));

    // (тяжелая пехота) тяжелый рыцарь
    mapdefens_enemyUnitsCfg["UnitConfig_Barbarian_Heavymen"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Barbarian_Heavymen"));

    // (конница) всадник
    mapdefens_enemyUnitsCfg["UnitConfig_Barbarian_Raider"]   = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Barbarian_Raider"));

    // (техника) катапульта
    mapdefens_enemyUnitsCfg["UnitConfig_Slavyane_Catapult"]  = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Catapult"));
    // (техника) баллиста
    mapdefens_enemyUnitsCfg["UnitConfig_Slavyane_Balista"]   = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Balista"));

    // (маг) Фантом (1 молния)
    mapdefens_enemyUnitsCfg["UnitConfig_Mage_Mag_2"]         = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Mage_Mag_2"));
    // (маг) Виллур (1 фаерболл)
    mapdefens_enemyUnitsCfg["UnitConfig_Mage_Villur"]        = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Mage_Villur"));
    // (маг) Ольга (шторм из молний)
    mapdefens_enemyUnitsCfg["UnitConfig_Mage_Olga"]          = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Mage_Olga"));

    // (легендарный) рыцарь
    mapdefens_legendaryUnitsCFGId.push("UnitConfig_legendary_swordmen");
    mapdefens_enemyUnitsCfg["UnitConfig_legendary_swordmen"] = HordeContent.CloneConfig(mapdefens_enemyUnitsCfg["UnitConfig_Barbarian_Swordmen"]);
    // назначаем имя
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_swordmen"], "Name", "Легендарный рыцарь");
    // меняем цвет
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_swordmen"], "TintColor", createHordeColor(255, 255, 100, 100));
    // задаем количество здоровья от числа игроков
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_swordmen"], "MaxHealth", 100 * Math.sqrt(mapdefens_playersCount));
    // создаем конфиги для клонов
    var swordmenClonesDepth = Math.ceil(Math.log2(mapdefens_enemyUnitsCfg["UnitConfig_legendary_swordmen"].MaxHealth / 10));
    for (var i = 0; i < swordmenClonesDepth; i++) {
        var uid = "UnitConfig_legendary_swordmen_" + i;

        // копируем базового рыцаря
        mapdefens_enemyUnitsCfg[uid] = HordeContent.CloneConfig(mapdefens_enemyUnitsCfg["UnitConfig_legendary_swordmen"]);
        // задаем количество здоровья
        HordeUtils.setValue(mapdefens_enemyUnitsCfg[uid], "MaxHealth", Math.ceil(mapdefens_enemyUnitsCfg["UnitConfig_legendary_swordmen"].MaxHealth / Math.pow(2, i + 1)));
        // задаем цвет
        HordeUtils.setValue(mapdefens_enemyUnitsCfg[uid], "TintColor", createHordeColor(255, 255, Math.floor(255 * (i + 1) / swordmenClonesDepth), Math.floor(255 * (i + 1) / swordmenClonesDepth)));
    }

    // (легендарный) тяжелый рыцарь
    mapdefens_legendaryUnitsCFGId.push("UnitConfig_legendary_heavymen");
    mapdefens_enemyUnitsCfg["UnitConfig_legendary_heavymen"] = HordeContent.CloneConfig(mapdefens_enemyUnitsCfg["UnitConfig_Barbarian_Heavymen"]);
    // назначаем имя
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_heavymen"], "Name", "Легендарный тяжелый рыцарь");
    // меняем цвет
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_heavymen"], "TintColor", createHordeColor(255, 255, 100, 100));
    // увеличиваем хп
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_heavymen"], "MaxHealth", 400 * Math.sqrt(mapdefens_playersCount));
    // делаем броню 3, чтобы стрели не брали его
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_heavymen"], "Shield", 3);

    // (легендарный) лучник
    mapdefens_legendaryUnitsCFGId.push("UnitConfig_legendary_archer");
    mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer"] = HordeContent.CloneConfig(mapdefens_enemyUnitsCfg["UnitConfig_Barbarian_Archer"]);
    // назначаем имя
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer"], "Name", "Легендарный лучник");
    // меняем цвет
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer"], "TintColor", createHordeColor(255, 255, 100, 100));
    // стреляет сразу 10 стрелами
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer"].MainArmament, "EmitBulletsCountMin", 10);
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer"].MainArmament, "EmitBulletsCountMax", 10);
    // увеличиваем разброс
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer"].MainArmament, "BaseAccuracy", 0);
    // увеличиваем дальность
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer"].MainArmament, "Range", 10);
    // делаем так, чтобы не давили всадники
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer"], "Weight", 12);
    // задаем количество здоровья от числа игроков
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer"], "MaxHealth", 200 * Math.sqrt(mapdefens_playersCount));

    // (легендарный) поджигатель
    mapdefens_legendaryUnitsCFGId.push("UnitConfig_legendary_archer_2");
    mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer_2"] = HordeContent.CloneConfig(mapdefens_enemyUnitsCfg["UnitConfig_Barbarian_Archer_2"]);
    // назначаем имя
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer_2"], "Name", "Легендарный поджигатель");
    // меняем цвет
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer_2"], "TintColor", createHordeColor(255, 255, 100, 100));
    // стреляет сразу 5 стрелами
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer_2"].MainArmament, "EmitBulletsCountMin", 5);
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer_2"].MainArmament, "EmitBulletsCountMax", 5);
    // увеличиваем дальность
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer_2"].MainArmament, "Range", 10);
    // увеличиваем разброс
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer_2"].MainArmament, "BaseAccuracy", 0);
    // делаем так, чтобы не давили всадники
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer_2"], "Weight", 12);
    // задаем количество здоровья от числа игроков
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer_2"], "MaxHealth", 200 * Math.sqrt(mapdefens_playersCount));

    // (легендарная) баллиста
    /*mapdefens_legendaryUnitsCFGId.push("UnitConfig_legendary_Balista");
    // делаем стрелы
    mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_0"] = HordeContent.CloneConfig(HordeContent.GetBulletConfig("#BulletConfig_BallistaArrow"));
    mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_1"] = HordeContent.CloneConfig(HordeContent.GetBulletConfig("#BulletConfig_BallistaArrow"));
    mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_1_fragment"] = HordeContent.CloneConfig(HordeContent.GetBulletConfig("#BulletConfig_BallistaArrow_Fragment"));
    //printObjectItems(mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_1_fragment"], 2);
    HordeUtils.setValue(mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_1_fragment"], "Archetype", mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_1"].Uid);
    
    // делаем, чтобы предыдущая стрела создавала следующую
    //HordeUtils.setValue(mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_0"].SpecialParams.FragmentBulletConfig, "Uid", mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_1"].Uid);
    HordeUtils.setValue(mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_0"].SpecialParams.FragmentBulletConfig, "Uid", mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_1_fragment"].Uid);
    // устанавливаем 1 фрагмент
    HordeUtils.setValue(mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_0"].SpecialParams, "FragmentsCount", 1);

    //HordeUtils.setValue(mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_0"].SpecialParams, "FragmentsFlyRadius", 8);
    //HordeUtils.setValue(mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_0"].SpecialParams.FragmentCombatParams, "AdditiveBulletSpeed", createPF(5, 5));
    printObjectItems(mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_0"].SpecialParams, 2);
    
    mapdefens_enemyUnitsCfg["UnitConfig_legendary_Balista"] = HordeContent.CloneConfig(mapdefens_enemyUnitsCfg["UnitConfig_Slavyane_Balista"]);
    // назначаем имя
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_Balista"], "Name", "Легендарная баллиста");
    // меняем цвет
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_Balista"], "TintColor", createHordeColor(255, 255, 100, 100));
    // задаем количество здоровья от числа игроков
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_Balista"], "MaxHealth", 300 * mapdefens_playersCount);
    // ставим легендарный снаряд
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_Balista"].MainArmament.BulletConfig, "Uid", mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_0"].Uid);
    // убираем возможность захвата
    mapdefens_enemyUnitsCfg["UnitConfig_legendary_Balista"].ProfessionParams.Remove(UnitProfession.Capturable);*/
    
    /////////////////////////
    // общие настройки для всех юнитов
    /////////////////////////

    // убираем возможность захвата зданий у всех юнитов
    // нужно убрать
    for (var unitID in mapdefens_enemyUnitsCfg) {
        mapdefens_enemyUnitsCfg[unitID].AllowedCommands.Remove(UnitCommand.Capture);
    }
    
    ////////////////////////////////////////////////////
    // задаем волны спавна
    ////////////////////////////////////////////////////

    // всадники между волнами убрать

    mapdefens_spawnWaveNum = 0;
    mapdefens_spawnPlan = [];
    mapdefens_spawnPlan.push({
        message: "ВОЛНА 1",
        gameTickNum: 1 * 60 * 50,
        units: [
            { count: 5 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 2 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Archer" }
        ]
    }, {
        message: "ВОЛНА 2",
        gameTickNum: 3 * 60 * 50,
        units: [
            { count: 10 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 4 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer" }
        ]
    }, {
        message: "ВОЛНА 3",
        gameTickNum: 5 * 60 * 50,
        units: [
            { count: 10 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 3 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 4 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer" }
        ]
    }, {
        message: "ВОЛНА 4",
        gameTickNum: 8 * 60 * 50,
        units: [
            { count: 12 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 4 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 3 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 2 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer_2" }
        ]
    }, {
        message: "БОСС ВОЛНА 5",
        gameTickNum: 10 * 60 * 50,
        units: [
            { count: 1,                          cfgId: mapdefens_legendaryUnitsCFGId[rnd.RandomNumber(0, mapdefens_legendaryUnitsCFGId.length - 1)] },
            { count: 5 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Raider" }
        ]
    }, {
        message: "ВОЛНА 6",
        gameTickNum: 15 * 60 * 50,
        units: [
            { count: 8 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 8 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 4 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 6 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Archer_2" }
        ]
    }, {
        gameTickNum: 15.3 * 60 * 50,
        units: [
            { count: 5 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Raider" }
        ]
    }, {
        message: "ВОЛНА 7",
        gameTickNum: 18 * 60 * 50,
        units: [
            { count: 10 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 15 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 5 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 6 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer_2" }
        ]
    }, {
        gameTickNum: 18.3 * 60 * 50,
        units: [
            { count: 5 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Raider" }
        ]
    }, {
        message: "БОСС ВОЛНА 8",
        gameTickNum: 20 * 60 * 50,
        units: [
            { count: 10 * mapdefens_playersCount, cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: 10 * mapdefens_playersCount, cfgId: "UnitConfig_Slavyane_Balista" }
        ]
    }, {
        message: "ВОЛНА 9",
        gameTickNum: 23 * 60 * 50,
        units: [
            { count: 10 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 14 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 5 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 8 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer_2" },
            { count: 2 * mapdefens_playersCount,  cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: 2 * mapdefens_playersCount,  cfgId: "UnitConfig_Slavyane_Balista" }
        ]
    }, {
        gameTickNum: 23.3 * 60 * 50,
        units: [
            { count: 6 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Raider" },
            { count: 1,                          cfgId: mapdefens_legendaryUnitsCFGId[rnd.RandomNumber(0, mapdefens_legendaryUnitsCFGId.length - 1)] }
        ]
    }, {
        message: "ВОЛНА 10",
        gameTickNum: 26 * 60 * 50,
        units: [
            { count: 20 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 16 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 5 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 10 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Archer_2" },
            { count: 3 * mapdefens_playersCount,  cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: 3 * mapdefens_playersCount,  cfgId: "UnitConfig_Slavyane_Balista" }
        ]
    }, {
        gameTickNum: 26.3 * 60 * 50,
        units: [
            { count: 10 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Raider" },
            { count: 1,                           cfgId: mapdefens_legendaryUnitsCFGId[rnd.RandomNumber(0, mapdefens_legendaryUnitsCFGId.length - 1)] }
        ]
    }, {
        message: "БОСС ВОЛНА 11",
        gameTickNum: 30 * 60 * 50,
        units: [
            { count: 3 * mapdefens_playersCount, cfgId: "UnitConfig_Mage_Mag_2" },
            { count: 1 * mapdefens_playersCount, cfgId: "UnitConfig_Mage_Villur" },
            { count: 1 * mapdefens_playersCount, cfgId: "UnitConfig_Mage_Olga" },
            { count: 1,                          cfgId: mapdefens_legendaryUnitsCFGId[rnd.RandomNumber(0, mapdefens_legendaryUnitsCFGId.length - 1)] },
            { count: 1,                          cfgId: mapdefens_legendaryUnitsCFGId[rnd.RandomNumber(0, mapdefens_legendaryUnitsCFGId.length - 1)] }
        ]
    }, {
        message: "ВОЛНА 12",
        gameTickNum: 32 * 60 * 50,
        units: [
            { count: 20 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 16 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 5 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 10 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Archer_2" },
            { count: 3 * mapdefens_playersCount,  cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: 3 * mapdefens_playersCount,  cfgId: "UnitConfig_Slavyane_Balista" },
            { count: 3 * mapdefens_playersCount,  cfgId: "UnitConfig_Mage_Mag_2" },
            { count: 1,                           cfgId: mapdefens_legendaryUnitsCFGId[rnd.RandomNumber(0, mapdefens_legendaryUnitsCFGId.length - 1)] }
        ]
    }, {
        message: "ВОЛНА 13",
        gameTickNum: 34 * 60 * 50,
        units: [
            { count: 20 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 16 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 5 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 10 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Archer_2" },
            { count: 3 * mapdefens_playersCount,  cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: 3 * mapdefens_playersCount,  cfgId: "UnitConfig_Slavyane_Balista" },
            { count: 1 * mapdefens_playersCount,  cfgId: "UnitConfig_Mage_Mag_2" },
            { count: 1 * mapdefens_playersCount,  cfgId: "UnitConfig_Mage_Villur" },
            { count: 1 * mapdefens_playersCount,  cfgId: "UnitConfig_Mage_Olga" },
            { count: 1,                           cfgId: mapdefens_legendaryUnitsCFGId[rnd.RandomNumber(0, mapdefens_legendaryUnitsCFGId.length - 1)] }
        ]
    }, {
        message: "ФИНАЛЬНАЯ ВОЛНА 14",
        gameTickNum: 36 * 60 * 50,
        units: [
            { count: 100 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 30 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 10 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 20 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer_2" },
            { count: 6 * mapdefens_playersCount,   cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: 6 * mapdefens_playersCount,   cfgId: "UnitConfig_Slavyane_Balista" },
            { count: 2 * mapdefens_playersCount,   cfgId: "UnitConfig_Mage_Mag_2" },
            { count: 2 * mapdefens_playersCount,   cfgId: "UnitConfig_Mage_Villur" },
            { count: 1 * mapdefens_playersCount,   cfgId: "UnitConfig_Mage_Olga" },
            { count: 1,                            cfgId: "UnitConfig_legendary_swordmen" },
            { count: 1,                            cfgId: "UnitConfig_legendary_heavymen" },
            { count: 1,                            cfgId: "UnitConfig_legendary_archer" },
            { count: 1,                            cfgId: "UnitConfig_legendary_archer_2" }
        ]
    }
    );

    // прочее

    // для корректной работы делаем пустой массив
    if (!mapdefens_boss_10_min_1_unitsInfo) {
        mapdefens_boss_10_min_1_unitsInfo = [];
    }

    // тест
    //mapdefens_spawnPlan = [];
    //mapdefens_spawnPlan.push({
    //    message: "ВОЛНА 1",
    //    gameTickNum: 1 * 60 * 50,
    //    units: [
    //        { count: 1 * mapdefens_playersCount, cfgId: "UnitConfig_legendary_Balista" }
    //    ]
    //});
}

function mapdefens_everyTick(gameTickNum: number) {
    // конец игры
    if (mapdefens_isFinish) {
        return;
    }

    // целевой объект разрушили - игроки проиграли
    if ((!mapdefens_goalCastle || mapdefens_goalCastle.IsDead) && !mapdefens_isFinish) {
        mapdefens_isFinish = true;
        broadcastMessage("ИГРОКИ ПРОИГРАЛИ", createHordeColor(255, 255, 50, 10));
        for (var i = 0; i < mapdefens_playersMaxCount; i++) {
            scena.GetRealScena().Settlements.Item.get("" + i).Existence.ForceDefeat();
        }
    }
    // прошло gameEnd тиков - игроки победили
    if (gameTickNum >= mapdefens_timeEnd) {
        mapdefens_isFinish = true;
        broadcastMessage("ИГРОКИ ПОБЕДИЛИ", createHordeColor(255, 255, 50, 10));
        scena.GetRealScena().Settlements.Item.get("" + mapdefens_playersMaxCount).Existence.ForceDefeat();
    }

    // спавним волны
    if (mapdefens_spawnWaveNum < mapdefens_spawnPlan.length && mapdefens_spawnPlan[mapdefens_spawnWaveNum].gameTickNum <= gameTickNum) {
        var generator = generateRandomPositionInRect2D(mapdefens_enemySpawnRectangle.x, mapdefens_enemySpawnRectangle.y, mapdefens_enemySpawnRectangle.w, mapdefens_enemySpawnRectangle.h);
        for (var i = 0; i < mapdefens_spawnPlan[mapdefens_spawnWaveNum].units.length; i++) {
            var spawnedUnits = spawnUnits(mapdefens_enemySettlement,
                mapdefens_enemyUnitsCfg[mapdefens_spawnPlan[mapdefens_spawnWaveNum].units[i].cfgId],
                mapdefens_spawnPlan[mapdefens_spawnWaveNum].units[i].count,
                UnitDirection.Down,
                generator);
                
            if ("UnitConfig_legendary_swordmen" == mapdefens_spawnPlan[mapdefens_spawnWaveNum].units[i].cfgId) {
                for (var spawnedUnit of spawnedUnits) {
                    mapdefens_boss_10_min_1_unitsInfo.push({
                        unit:       spawnedUnit,
                        cloneDepth: 0
                    });
                }
            }
        }

        // отправляем сообщение в чат, если оно есть
        if (mapdefens_spawnPlan[mapdefens_spawnWaveNum]["message"]) {
            logi(mapdefens_spawnPlan[mapdefens_spawnWaveNum]["message"]);
            
            broadcastMessage(mapdefens_spawnPlan[mapdefens_spawnWaveNum]["message"], createHordeColor(255, 255, 50, 10));
        }

        // переходим к следующему плану
        mapdefens_spawnWaveNum++;
    }

    // регистрируем смерть легендарных рыцарей для клонирования
    for (var i = 0; i < mapdefens_boss_10_min_1_unitsInfo.length; i++) {
        // если рыцарь умер
        if (mapdefens_boss_10_min_1_unitsInfo[i].unit.IsDead) {
            // если существует конфиг для следующего уровня клонов, то спавним 2-ух клонов и увеличиваем уровень клонов на 1
            var cloneCfg = mapdefens_enemyUnitsCfg["UnitConfig_legendary_swordmen_" + mapdefens_boss_10_min_1_unitsInfo[i].cloneDepth];
            if (cloneCfg) {
                // создаем генератор по спирали вокруг умершего рыцаря
                var generator = generatePositionInSpiral(mapdefens_boss_10_min_1_unitsInfo[i].unit.Cell.X, mapdefens_boss_10_min_1_unitsInfo[i].unit.Cell.Y);
                // спавним 2-ух рыцарей
                var spawnedUnits = spawnUnits(mapdefens_enemySettlement,
                    cloneCfg,
                    2,
                    UnitDirection.Down,
                    generator);
                for (var spawnedUnit of spawnedUnits) {
                    mapdefens_boss_10_min_1_unitsInfo.push({
                        unit: spawnedUnit,
                        cloneDepth: (mapdefens_boss_10_min_1_unitsInfo[i].cloneDepth + 1)
                    });
                }
            }
            
            // удаляем из массива умершего рыцаря
            mapdefens_boss_10_min_1_unitsInfo.splice(i--, 1);
        }
    }

    // приказываем врагам атаковать из места спавна
    //if (gameTickNum % 180 == 0) {
    //    // выделяем юнитов в точке спавна
    //    inputSelectUnits(mapdefens_enemyPlayer,
    //        createPoint(mapdefens_enemySpawnRectangle.x, mapdefens_enemySpawnRectangle.y),
    //        createPoint(mapdefens_enemySpawnRectangle.x + mapdefens_enemySpawnRectangle.w, mapdefens_enemySpawnRectangle.y + mapdefens_enemySpawnRectangle.h));

    //    // отправляем их в бой в ближайшую пустую точку к замку
    //    var generator = generatePositionInSpiral(mapdefens_goalCastle.Cell.X, mapdefens_goalCastle.Cell.Y);
    //    for (var position = generator.next(); !position.done; position = generator.next()) {
    //        if (unitCanBePlacedByRealMap(mapdefens_enemyUnitsCfg["UnitConfig_Barbarian_Swordmen"], position.value.X, position.value.Y)) {
    //            inputPointBasedCommand(mapdefens_enemyPlayer, createPoint(position.value.X, position.value.Y), UnitCommand.Attack);
    //            break;
    //        }
    //    }
    //}

    // приказываем бездействующим юнитам врага атаковать
    // это очень долго!! или где-то ошибка висит!
    // нужно попробовать список делать?))
    if (gameTickNum % 180 == 0) {
        // генерируем позицию для атаки цели
        var goalPosition;
        {
            var generator = generatePositionInSpiral(mapdefens_goalCastle.Cell.X, mapdefens_goalCastle.Cell.Y);
            for (goalPosition = generator.next(); !goalPosition.done; goalPosition = generator.next()) {
                if (unitCanBePlacedByRealMap(mapdefens_enemyUnitsCfg["UnitConfig_Barbarian_Swordmen"], goalPosition.value.X, goalPosition.value.Y)) {
                    break;
                }
            }
        }

        var enumerator = mapdefens_enemySettlement.Units.GetEnumerator();
        var generator  = generateRandomPositionInRect2D(72, 78, 110 - 72, 83 - 78);
        while (enumerator.MoveNext()) {
            var unit         = enumerator.Current;
            // отдел приказов
            var ordersMind   = unit.OrdersMind;
            
            // Проверка что юнит бездействует
            if (!ordersMind.IsIdle() || unit.Id == 0) {
                continue;
            }

            // выделяем данного юнита
            inputSelectUnitsById(mapdefens_enemyPlayer, [unit.Id]);
            
            // если Y < 80, то оправляем сначала в центр
            if (unit.Cell.Y < 80) {
                var positionFound = false;
                while (!positionFound) {
                    var position = generator.next();
                    for (; !position.done; position = generator.next()) {
                        if (unitCanBePlacedByRealMap(mapdefens_enemyUnitsCfg["UnitConfig_Barbarian_Swordmen"], position.value.X, position.value.Y)) {
                            positionFound = true;
                            break;
                        }
                    }
                    // генератор закончился, делаем новый
                    if (!positionFound) {
                        generator = generateRandomPositionInRect2D(72, 78, 110 - 72, 83 - 78);
                    }
                }
                inputPointBasedCommand(mapdefens_enemyPlayer, createPoint(position.value.X, position.value.Y), UnitCommand.Attack);
            }
            
            // в конце отправляем в атаку
            inputPointBasedCommand(mapdefens_enemyPlayer, createPoint(goalPosition.value.X, goalPosition.value.Y), UnitCommand.Attack, AssignOrderMode.Queue);
        }
        enumerator.Dispose();
    }
}
