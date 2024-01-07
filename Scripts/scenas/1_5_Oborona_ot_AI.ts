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

// список ид легендарных юнитов
var mapdefens_legendaryUnitsCFGId;
// слабость легендарных юнитов
var mapdefens_legendaryUnitsInformation;

// список легендарных рыцарей на карте
var mapdefens_legendary_swordmen_unitsInfo;
// список легендарных всадников на карте
var mapdefens_legendary_raider_unitsInfo;
// список легендарных рабочих на карте
var mapdefens_legendary_worker_unitsInfo;

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
    mapdefens_legendaryUnitsInformation = [];

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
    mapdefens_legendaryUnitsInformation.push("Слабости: давится, горит. Преимущества: очень силен в ближнем бою.");
    mapdefens_enemyUnitsCfg["UnitConfig_legendary_swordmen"] = HordeContent.CloneConfig(mapdefens_enemyUnitsCfg["UnitConfig_Barbarian_Swordmen"]);
    // назначаем имя
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_swordmen"], "Name", "Легендарный рыцарь");
    // меняем цвет
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_swordmen"], "TintColor", createHordeColor(255, 255, 100, 100));
    // задаем количество здоровья от числа игроков
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_swordmen"], "MaxHealth", Math.floor(100 * Math.sqrt(mapdefens_playersCount)));
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
    mapdefens_legendaryUnitsInformation.push("Слабости: горит, окружение. Преимущества: ближний бой, броня, много хп.");
    mapdefens_enemyUnitsCfg["UnitConfig_legendary_heavymen"] = HordeContent.CloneConfig(mapdefens_enemyUnitsCfg["UnitConfig_Barbarian_Heavymen"]);
    // назначаем имя
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_heavymen"], "Name", "Легендарный тяжелый рыцарь");
    // меняем цвет
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_heavymen"], "TintColor", createHordeColor(255, 255, 100, 100));
    // увеличиваем хп
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_heavymen"], "MaxHealth", Math.floor(400 * Math.sqrt(mapdefens_playersCount)));
    // делаем броню 3, чтобы стрели не брали его
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_heavymen"], "Shield", 3);

    // (легендарный) лучник
    mapdefens_legendaryUnitsCFGId.push("UnitConfig_legendary_archer");
    mapdefens_legendaryUnitsInformation.push("Слабости: ближний бой, окружение. Преимущества: дальний бой, не горит.");
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
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer"], "MaxHealth", Math.floor(200 * Math.sqrt(mapdefens_playersCount)));
    // делаем имунитет к огню
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer"], "Flags", UnitFlags.FireResistant);

    // (легендарный) поджигатель
    mapdefens_legendaryUnitsCFGId.push("UnitConfig_legendary_archer_2");
    mapdefens_legendaryUnitsInformation.push("Слабости: ближний бой, окружение. Преимущества: дальний бой, не горит.");
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
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer_2"], "MaxHealth", Math.floor(200 * Math.sqrt(mapdefens_playersCount)));
    // делаем имунитет к огню
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_archer_2"], "Flags", UnitFlags.FireResistant);

    // (легендарный) всадник
    mapdefens_legendaryUnitsCFGId.push("UnitConfig_legendary_Raider");
    mapdefens_legendaryUnitsInformation.push("Слабости: ближний бой, окружение, горит. Преимущества: скорость, спавн союзников.");
    mapdefens_enemyUnitsCfg["UnitConfig_legendary_Raider"] = HordeContent.CloneConfig(mapdefens_enemyUnitsCfg["UnitConfig_Barbarian_Raider"]);
    // назначаем имя
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_Raider"], "Name", "Легендарный всадник");
    // меняем цвет
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_Raider"], "TintColor", createHordeColor(255, 255, 100, 100));
    // задаем количество здоровья от числа игроков
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_Raider"], "MaxHealth", Math.floor(120 * Math.sqrt(mapdefens_playersCount)));
    // удаляем команду атаки
    mapdefens_enemyUnitsCfg["UnitConfig_legendary_Raider"].AllowedCommands.Remove(UnitCommand.Attack);

    // (легендарная) башня к крестьянину
    mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker_Tower"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Tower"));
    // назначаем имя
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker_Tower"], "Name", "Легендарная башня");
    // меняем цвет
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker_Tower"], "TintColor", createHordeColor(255, 255, 100, 100));
    // задаем количество здоровья от числа игроков
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker_Tower"], "MaxHealth", Math.floor(50 * Math.sqrt(mapdefens_playersCount)));
    // делаем башню бесплатной
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker_Tower"].CostResources, "Gold",   0);
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker_Tower"].CostResources, "Metal",  0);
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker_Tower"].CostResources, "Lumber", 0);
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker_Tower"].CostResources, "People", 0);
    // убираем требования у башни
    mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker_Tower"].TechConfig.Requirements.Clear();
    // ускоряем время постройки
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker_Tower"], "ProductionTime", 200);
    // (легендарный) крестьянин
    mapdefens_legendaryUnitsCFGId.push("UnitConfig_legendary_worker");
    mapdefens_legendaryUnitsInformation.push("Слабости: ближний бой, окружение, огонь, ранней атаки. Преимущества: строит башни.");
    mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Worker1"));
    // назначаем имя
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker"], "Name", "Легендарный рабочий");
    // меняем цвет
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker"], "TintColor", createHordeColor(255, 255, 100, 100));
    // задаем количество здоровья от числа игроков
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker"], "MaxHealth", Math.floor(300 * Math.sqrt(mapdefens_playersCount)));
    // делаем так, чтобы не давили всадники
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker"], "Weight", 12);
    // удаляем команду атаки
    mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker"].AllowedCommands.Remove(UnitCommand.Attack);
    // добавляем в список построек легендарную башню
    {
        var producerParams = mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker"].GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
        var produceList    = producerParams.CanProduceList;
        produceList.Add(mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker_Tower"]);
    }

    // (легендарная) башня
    // mapdefens_legendaryUnitsCFGId.push("UnitConfig_legendary_Tower");
    // mapdefens_enemyUnitsCfg["UnitConfig_legendary_Tower"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Tower"));
    // // назначаем имя
    // HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_Tower"], "Name", "Легендарный передвижная башня");
    // // меняем цвет
    // HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_Tower"], "TintColor", createHordeColor(255, 255, 100, 100));
    // // задаем количество здоровья от числа игроков
    // HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_Tower"], "MaxHealth", Math.floor(150 * Math.sqrt(mapdefens_playersCount)));
    // // добавляем команду движения
    // {
    //     var cmdConfig = HCL.HordeClassLibrary.HordeContent.AllContent.UnitCommands.GetConfig("#UnitCommandConfig_MoveToPoint");
    //     mapdefens_enemyUnitsCfg["UnitConfig_legendary_Tower"].AllowedCommands.Add(UnitCommand.MoveToPoint, cmdConfig);
    // }
    // итог она не двигается))

    // printObjectItems(UnitCommand);
    // logi("--------------------------------");
    // printObjectItems(mapdefens_enemyUnitsCfg["UnitConfig_legendary_Tower"].AllowedCommands);

    // (легендарная) баллиста
    /*mapdefens_legendaryUnitsCFGId.push("UnitConfig_legendary_Balista");
    // делаем стрелы
    var legendary_balista_arrows = 5;
    for (var i = 0; i < legendary_balista_arrows; i++) {
        var arrowId = "BulletConfig_legendary_BallistaArrow_" + i;

        // клонируем обычный снаряд баллисты
        mapdefens_enemyBulletCfg[arrowId] = HordeContent.CloneConfig(HordeContent.GetBulletConfig("#BulletConfig_BallistaArrow"));
        
        // устанавливаем 1 фрагмент
        HordeUtils.setValue(mapdefens_enemyBulletCfg[arrowId].SpecialParams, "FragmentsCount", 1);
        // делаем, чтобы текущая стрела вылетала из следующей
        if (i > 0) {
            HordeUtils.setValue(mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_" + (i - 1)].SpecialParams.FragmentBulletConfig, "Uid", mapdefens_enemyBulletCfg[arrowId].Uid);
        }

        //mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_1_fragment"] = HordeContent.CloneConfig(HordeContent.GetBulletConfig("#BulletConfig_BallistaArrow_Fragment"));
        //printObjectItems(mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_1_fragment"], 2);
        //HordeUtils.setValue(mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_1_fragment"], "Archetype", mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_1"].Uid);
        
        //HordeUtils.setValue(mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_0"].SpecialParams, "FragmentsFlyRadius", 8);
        //HordeUtils.setValue(mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_0"].SpecialParams.FragmentCombatParams, "AdditiveBulletSpeed", createPF(5, 5));
        //printObjectItems(mapdefens_enemyBulletCfg["BulletConfig_legendary_BallistaArrow_0"].SpecialParams, 2);
    }
    
    mapdefens_enemyUnitsCfg["UnitConfig_legendary_Balista"] = HordeContent.CloneConfig(mapdefens_enemyUnitsCfg["UnitConfig_Slavyane_Balista"]);
    // назначаем имя
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_Balista"], "Name", "Легендарная баллиста");
    // меняем цвет
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_Balista"], "TintColor", createHordeColor(255, 255, 100, 100));
    // задаем количество здоровья от числа игроков
    HordeUtils.setValue(mapdefens_enemyUnitsCfg["UnitConfig_legendary_Balista"], "MaxHealth", Math.floor(300 * Math.sqrt(mapdefens_playersCount)));
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

    var randomItem = (array) => {
        return array[rnd.RandomNumber(0, array.length - 1)];
    };

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
            { count: 15 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 5 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 3 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 2 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer_2" }
        ]
    }, {
        message: "БОСС ВОЛНА 5",
        gameTickNum: 10 * 60 * 50,
        units: [
            { count: 1,                          cfgId: randomItem(mapdefens_legendaryUnitsCFGId) },
            { count: 5 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Raider" }
        ]
    }, {
        message: "ВОЛНА 6",
        gameTickNum: 13.5 * 60 * 50,
        units: [
            { count: 20 * mapdefens_playersCount, cfgId: randomItem(["UnitConfig_Barbarian_Swordmen", "UnitConfig_Barbarian_Heavymen", "UnitConfig_Barbarian_Archer", "UnitConfig_Barbarian_Archer_2" ]) }
        ]
    }, {
        message: "ВОЛНА 7",
        gameTickNum: 15 * 60 * 50,
        units: [
            { count: 10 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 10 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 4 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 6 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Archer_2" }
        ]
    }, {
        gameTickNum: 15.3 * 60 * 50,
        units: [
            { count: 5 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Raider" }
        ]
    }, {
        message: "ВОЛНА 8",
        gameTickNum: 18 * 60 * 50,
        units: [
            { count: 25 * mapdefens_playersCount, cfgId: randomItem(["UnitConfig_Barbarian_Swordmen", "UnitConfig_Barbarian_Heavymen", "UnitConfig_Barbarian_Archer", "UnitConfig_Barbarian_Archer_2" ]) }
        ]
    }, {
        gameTickNum: 18.3 * 60 * 50,
        units: [
            { count: 5 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Raider" }
        ]
    }, {
        message: "БОСС ВОЛНА 9",
        gameTickNum: 20 * 60 * 50,
        units: [
            { count: 10 * mapdefens_playersCount, cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: 10 * mapdefens_playersCount, cfgId: "UnitConfig_Slavyane_Balista" }
        ]
    }, {
        message: "ВОЛНА 10",
        gameTickNum: 23 * 60 * 50,
        units: [
            { count: 15 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 15 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 5 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 8 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer_2" },
            { count: 2 * mapdefens_playersCount,  cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: 2 * mapdefens_playersCount,  cfgId: "UnitConfig_Slavyane_Balista" }
        ]
    }, {
        gameTickNum: 23.3 * 60 * 50,
        units: [
            { count: 6 * mapdefens_playersCount,          cfgId: "UnitConfig_Barbarian_Raider" },
            { count: 1,                                   cfgId: randomItem(mapdefens_legendaryUnitsCFGId) },
            { count: mapdefens_playersCount >= 3 ? 1 : 0, cfgId: randomItem(mapdefens_legendaryUnitsCFGId) },
            { count: mapdefens_playersCount >= 5 ? 1 : 0, cfgId: randomItem(mapdefens_legendaryUnitsCFGId) }
        ]
    }, {
        message: "ВОЛНА 11",
        gameTickNum: 26 * 60 * 50,
        units: [
            { count: 20 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 16 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 8 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 10 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Archer_2" },
            { count: 3 * mapdefens_playersCount,  cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: 3 * mapdefens_playersCount,  cfgId: "UnitConfig_Slavyane_Balista" }
        ]
    }, {
        gameTickNum: 26.3 * 60 * 50,
        units: [
            { count: 10 * mapdefens_playersCount,         cfgId: "UnitConfig_Barbarian_Raider" },
            { count: 1,                                   cfgId: randomItem(mapdefens_legendaryUnitsCFGId) },
            { count: mapdefens_playersCount >= 3 ? 1 : 0, cfgId: randomItem(mapdefens_legendaryUnitsCFGId) },
            { count: mapdefens_playersCount >= 5 ? 1 : 0, cfgId: randomItem(mapdefens_legendaryUnitsCFGId) }
        ]
    }, {
        message: "БОСС ВОЛНА 12",
        gameTickNum: 30 * 60 * 50,
        units: [
            { count: 3 * mapdefens_playersCount,          cfgId: "UnitConfig_Mage_Mag_2" },
            { count: 1 * mapdefens_playersCount,          cfgId: "UnitConfig_Mage_Villur" },
            { count: 1 * mapdefens_playersCount,          cfgId: "UnitConfig_Mage_Olga" },
            { count: 1,                                   cfgId: randomItem(mapdefens_legendaryUnitsCFGId) },
            { count: 1,                                   cfgId: randomItem(mapdefens_legendaryUnitsCFGId) },
            { count: mapdefens_playersCount >= 3 ? 1 : 0, cfgId: randomItem(mapdefens_legendaryUnitsCFGId) },
            { count: mapdefens_playersCount >= 5 ? 1 : 0, cfgId: randomItem(mapdefens_legendaryUnitsCFGId) }
        ]
    }, {
        message: "ВОЛНА 13",
        gameTickNum: 32 * 60 * 50,
        units: [
            { count: 20 * mapdefens_playersCount,         cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 20 * mapdefens_playersCount,         cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 10 * mapdefens_playersCount,         cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 10 * mapdefens_playersCount,         cfgId: "UnitConfig_Barbarian_Archer_2" },
            { count: 3 * mapdefens_playersCount,          cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: 3 * mapdefens_playersCount,          cfgId: "UnitConfig_Slavyane_Balista" },
            { count: 3 * mapdefens_playersCount,          cfgId: "UnitConfig_Mage_Mag_2" },
            { count: 1,                                   cfgId: randomItem(mapdefens_legendaryUnitsCFGId) },
            { count: mapdefens_playersCount >= 3 ? 1 : 0, cfgId: randomItem(mapdefens_legendaryUnitsCFGId) },
            { count: mapdefens_playersCount >= 5 ? 1 : 0, cfgId: randomItem(mapdefens_legendaryUnitsCFGId) }
        ]
    }, {
        message: "ВОЛНА 14",
        gameTickNum: 34 * 60 * 50,
        units: [
            { count: 25 * mapdefens_playersCount,         cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 25 * mapdefens_playersCount,         cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 12 * mapdefens_playersCount,         cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 12 * mapdefens_playersCount,         cfgId: "UnitConfig_Barbarian_Archer_2" },
            { count: 3 * mapdefens_playersCount,          cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: 3 * mapdefens_playersCount,          cfgId: "UnitConfig_Slavyane_Balista" },
            { count: 1 * mapdefens_playersCount,          cfgId: "UnitConfig_Mage_Mag_2" },
            { count: 1 * mapdefens_playersCount,          cfgId: "UnitConfig_Mage_Villur" },
            { count: 1 * mapdefens_playersCount,          cfgId: "UnitConfig_Mage_Olga" },
            { count: 1,                                   cfgId: randomItem(mapdefens_legendaryUnitsCFGId) },
            { count: mapdefens_playersCount >= 3 ? 1 : 0, cfgId: randomItem(mapdefens_legendaryUnitsCFGId) },
            { count: mapdefens_playersCount >= 5 ? 1 : 0, cfgId: randomItem(mapdefens_legendaryUnitsCFGId) }
        ]
    }, {
        message: "ФИНАЛЬНАЯ ВОЛНА 15",
        gameTickNum: 36 * 60 * 50,
        units: [
            { count: 100 * mapdefens_playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 30 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 10 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 20 * mapdefens_playersCount,  cfgId: "UnitConfig_Barbarian_Archer_2" },
            { count: 6 * mapdefens_playersCount,   cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: 6 * mapdefens_playersCount,   cfgId: "UnitConfig_Slavyane_Balista" },
            { count: 1 * mapdefens_playersCount,   cfgId: "UnitConfig_Mage_Mag_2" },
            { count: 1 * mapdefens_playersCount,   cfgId: "UnitConfig_Mage_Villur" },
            { count: 1 * mapdefens_playersCount,   cfgId: "UnitConfig_Mage_Olga" },
            { count: 1,                            cfgId: "UnitConfig_legendary_swordmen" },
            { count: 1,                            cfgId: "UnitConfig_legendary_heavymen" },
            { count: 1,                            cfgId: "UnitConfig_legendary_archer" },
            { count: 1,                            cfgId: "UnitConfig_legendary_archer_2" },
            { count: 1,                            cfgId: "UnitConfig_legendary_Raider" },
            { count: 1,                            cfgId: "UnitConfig_legendary_worker" }
        ]
    }
    );

    // тест
    // mapdefens_spawnPlan = [];
    // mapdefens_spawnPlan.push({
    //    message: "ВОЛНА 1",
    //    gameTickNum: 1 * 60 * 50,
    //    units: [
    //        { count: 1 * mapdefens_playersCount, cfgId: "UnitConfig_legendary_archer" }
    //    ]
    // });

    // прочее

    // для корректной работы делаем пустой массив
    if (!mapdefens_legendary_swordmen_unitsInfo) {
        mapdefens_legendary_swordmen_unitsInfo = [];
    }
    if (!mapdefens_legendary_raider_unitsInfo) {
        mapdefens_legendary_raider_unitsInfo = [];
    }
    if (!mapdefens_legendary_worker_unitsInfo) {
        mapdefens_legendary_worker_unitsInfo = [];
    }
}

function mapdefens_everyTick(gameTickNum: number) {
    var realScena   = scena.GetRealScena();
    // Рандомизатор
    var rnd         = realScena.Context.Randomizer;

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

    //////////////////////////////////////////
    // обработка волн
    //////////////////////////////////////////

    if (mapdefens_spawnWaveNum < mapdefens_spawnPlan.length &&
        mapdefens_spawnPlan[mapdefens_spawnWaveNum].gameTickNum <= gameTickNum) {
        // отправляем сообщение в чат, если оно есть
        if (mapdefens_spawnPlan[mapdefens_spawnWaveNum]["message"]) {
            logi(mapdefens_spawnPlan[mapdefens_spawnWaveNum]["message"]);
            
            broadcastMessage(mapdefens_spawnPlan[mapdefens_spawnWaveNum]["message"], createHordeColor(255, 255, 50, 10));
        }

        // спавним юнитов
        var generator = generateRandomPositionInRect2D(mapdefens_enemySpawnRectangle.x, mapdefens_enemySpawnRectangle.y, mapdefens_enemySpawnRectangle.w, mapdefens_enemySpawnRectangle.h);
        for (var i = 0; i < mapdefens_spawnPlan[mapdefens_spawnWaveNum].units.length; i++) {
            if (mapdefens_spawnPlan[mapdefens_spawnWaveNum].units[i].count <= 0) {
                continue;
            }

            var spawnedUnits = spawnUnits(mapdefens_enemySettlement,
                mapdefens_enemyUnitsCfg[mapdefens_spawnPlan[mapdefens_spawnWaveNum].units[i].cfgId],
                mapdefens_spawnPlan[mapdefens_spawnWaveNum].units[i].count,
                UnitDirection.Down,
                generator);
            
            // информируем о легендарных противниках и их слабостях
            var legendaryIndex = mapdefens_legendaryUnitsCFGId.indexOf(mapdefens_spawnPlan[mapdefens_spawnWaveNum].units[i].cfgId);
            if (legendaryIndex >= 0) {
                broadcastMessage("Замечен " + mapdefens_enemyUnitsCfg[mapdefens_spawnPlan[mapdefens_spawnWaveNum].units[i].cfgId].Name, createHordeColor(255, 255, 165, 10));
                broadcastMessage(mapdefens_legendaryUnitsInformation[legendaryIndex], createHordeColor(255, 200, 130, 10));
            }

            // запоминаем некоторых юнитов
            if ("UnitConfig_legendary_swordmen" == mapdefens_spawnPlan[mapdefens_spawnWaveNum].units[i].cfgId) {
                for (var spawnedUnit of spawnedUnits) {
                    mapdefens_legendary_swordmen_unitsInfo.push({
                        unit:       spawnedUnit,
                        cloneDepth: 0
                    });
                }
            } else if ("UnitConfig_legendary_Raider" == mapdefens_spawnPlan[mapdefens_spawnWaveNum].units[i].cfgId) {
                for (var spawnedUnit of spawnedUnits) {
                    mapdefens_legendary_raider_unitsInfo.push({
                        unit: spawnedUnit
                    });
                }
            } else if ("UnitConfig_legendary_worker" == mapdefens_spawnPlan[mapdefens_spawnWaveNum].units[i].cfgId) {
                for (var spawnedUnit of spawnedUnits) {
                    mapdefens_legendary_worker_unitsInfo.push({
                        unit: spawnedUnit,
                        towersBuild: 2 + mapdefens_playersCount
                    });
                }
            }
        }

        // переходим к следующему плану
        mapdefens_spawnWaveNum++;
    }

    //////////////////////////////////////////
    // обработка легендарных рыцарей
    //////////////////////////////////////////

    // регистрируем смерть легендарных рыцарей для клонирования
    for (var i = 0; i < mapdefens_legendary_swordmen_unitsInfo.length; i++) {
        // если рыцарь умер
        if (mapdefens_legendary_swordmen_unitsInfo[i].unit.IsDead) {
            // если существует конфиг для следующего уровня клонов, то спавним 2-ух клонов и увеличиваем уровень клонов на 1
            var cloneCfg = mapdefens_enemyUnitsCfg["UnitConfig_legendary_swordmen_" + mapdefens_legendary_swordmen_unitsInfo[i].cloneDepth];
            if (cloneCfg) {
                // создаем генератор по спирали вокруг умершего рыцаря
                var generator = generatePositionInSpiral(mapdefens_legendary_swordmen_unitsInfo[i].unit.Cell.X, mapdefens_legendary_swordmen_unitsInfo[i].unit.Cell.Y);
                // спавним 2-ух рыцарей
                var spawnedUnits = spawnUnits(mapdefens_enemySettlement,
                    cloneCfg,
                    2,
                    UnitDirection.Down,
                    generator);
                for (var spawnedUnit of spawnedUnits) {
                    mapdefens_legendary_swordmen_unitsInfo.push({
                        unit: spawnedUnit,
                        cloneDepth: (mapdefens_legendary_swordmen_unitsInfo[i].cloneDepth + 1)
                    });
                }
            }
            
            // удаляем из массива умершего рыцаря
            mapdefens_legendary_swordmen_unitsInfo.splice(i--, 1);
        }
    }

    //////////////////////////////////////////
    // обработка легендарных всадников
    //////////////////////////////////////////

    // регистрируем смерть легендарных всадников
    for (var i = 0; i < mapdefens_legendary_raider_unitsInfo.length; i++) {
        // если всадник умер, то исключаем его из списка
        if (mapdefens_legendary_raider_unitsInfo[i].unit.IsDead) {
            mapdefens_legendary_raider_unitsInfo.splice(i--, 1);
        }
    }
    // каждые 5 секунд спавним юнитов вокруг всадника
    if (gameTickNum % 300 == 0) {
        for (var i = 0; i < mapdefens_legendary_raider_unitsInfo.length; i++) {
            var raider = mapdefens_legendary_raider_unitsInfo[i].unit;
            var spawnUnitId;
            var randomNumber = rnd.RandomNumber(1, 4);
            if (randomNumber == 1) {
                spawnUnitId = "UnitConfig_Barbarian_Swordmen";
            } else if (randomNumber == 2) {
                spawnUnitId = "UnitConfig_Barbarian_Archer";
            } else if (randomNumber == 3) {
                spawnUnitId = "UnitConfig_Barbarian_Archer_2";
            } else {
                spawnUnitId = "UnitConfig_Barbarian_Heavymen";
            }

            var generator    = generatePositionInSpiral(raider.Cell.X, raider.Cell.Y);
            var spawnedUnits = spawnUnits(mapdefens_enemySettlement,
                mapdefens_enemyUnitsCfg[spawnUnitId],
                Math.min(mapdefens_playersCount, 3),
                UnitDirection.Down,
                generator);
        }
    }

    //////////////////////////////////////////
    // обработка легендарных рабочих
    //////////////////////////////////////////

    for (var i = 0; i < mapdefens_legendary_worker_unitsInfo.length; i++) {
        // если всадник умер, то исключаем его из списка
        if (mapdefens_legendary_worker_unitsInfo[i].unit.IsDead) {
            mapdefens_legendary_worker_unitsInfo.splice(i--, 1);
        }
    }

    //////////////////////////////////////////
    // логика поведения юнитов
    //////////////////////////////////////////

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
    if (gameTickNum % 180 == 0) {
        // позиция для атаки цели
        var goalPosition;
        {
            var generator = generatePositionInSpiral(mapdefens_goalCastle.Cell.X, mapdefens_goalCastle.Cell.Y);
            for (goalPosition = generator.next(); !goalPosition.done; goalPosition = generator.next()) {
                if (unitCanBePlacedByRealMap(mapdefens_enemyUnitsCfg["UnitConfig_Barbarian_Swordmen"], goalPosition.value.X, goalPosition.value.Y)) {
                    break;
                }
            }
        }

        //////////////////////////////////////////
        // логика поведения легендарных рабочих
        //////////////////////////////////////////
        
        for (var i = 0; i < mapdefens_legendary_worker_unitsInfo.length; i++) {
            var worker = mapdefens_legendary_worker_unitsInfo[i].unit;

            // юнит только что заспавнился и пока у него нету ид
            if (worker.Id == 0) {
                continue;
            }

            // отдел приказов
            var ordersMind   = worker.OrdersMind;

            // юнит бездействует и у него фулл хп, то отправляем его на базу врага
            if (ordersMind.IsIdle() && worker.Health == mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker"].MaxHealth) {
                // выделяем данного юнита
                inputSelectUnitsById(mapdefens_enemyPlayer, [worker.Id]);

                // в конце отправляем в атаку на цель
                inputPointBasedCommand(mapdefens_enemyPlayer, createPoint(goalPosition.value.X, goalPosition.value.Y), UnitCommand.MoveToPoint);

                continue;
            }

            // проверка, что рабочий что-то строит
            var currentOrderProducing = ordersMind.ActiveOrder.ProductUnit != undefined;

            // проверка, что юнит не строит ничего
            // что юнит, что-то строит
            if ((!ordersMind.IsIdle() && worker.Health == mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker"].MaxHealth) ||
                currentOrderProducing) {
                continue;
            }

            // выделяем данного юнита
            inputSelectUnitsById(mapdefens_enemyPlayer, [worker.Id]);

            // ищем ближайшее место куда можно построить башню
            var generator = generatePositionInSpiral(worker.Cell.X, worker.Cell.Y);
            for (var position = generator.next(); !position.done; position = generator.next()) {
                if (unitCanBePlacedByRealMap(mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker_Tower"], position.value.X, position.value.Y)) {
                    inputProduceBuildingCommand(mapdefens_enemyPlayer, mapdefens_enemyUnitsCfg["UnitConfig_legendary_worker_Tower"].Uid, createPoint(position.value.X, position.value.Y), null);
                    mapdefens_legendary_worker_unitsInfo[i].towersBuild--;
                    // если рабочий больше не строит, то удаляем его из списка
                    if (mapdefens_legendary_worker_unitsInfo[i].towersBuild == 0) {
                        mapdefens_legendary_worker_unitsInfo.splice(i--, 1);
                    }
                    break;
                }
            }
        }

        //////////////////////////////////////////
        // логика поведения легендарных всадников
        //////////////////////////////////////////
        
        for (var i = 0; i < mapdefens_legendary_raider_unitsInfo.length; i++) {
            var raider = mapdefens_legendary_raider_unitsInfo[i].unit;
            // отдел приказов
            var ordersMind   = raider.OrdersMind;

            // проверка, что у юнита менее 3 приказов
            // или юнит только что заспавнился и пока у него нету ид
            if (raider.Id == 0 || ordersMind.OrdersCount > 2) {
                continue;
            }

            // выделяем данного юнита
            inputSelectUnitsById(mapdefens_enemyPlayer, [raider.Id]);

            // генерируем 5 рандомных достижимых точек вокруг цели
            var generator = generateRandomPositionInRect2D(mapdefens_goalCastle.Cell.X - 20, mapdefens_goalCastle.Cell.Y - 20, 40, 40);
            for (var position = generator.next(), newOrders = 0; !position.done && newOrders < 5; position = generator.next()) {
                if (unitCheckPathTo(raider, createPoint(position.value.X, position.value.Y))) {
                    newOrders++;
                    inputPointBasedCommand(mapdefens_enemyPlayer, createPoint(position.value.X, position.value.Y), UnitCommand.MoveToPoint, AssignOrderMode.Queue);
                }
            }
        }

        //////////////////////////////////////////
        // логика поведения почти всех юнитов
        //////////////////////////////////////////
        var enemyUnitsEnumerator = mapdefens_enemySettlement.Units.GetEnumerator();
        var centerRect = { x: 72, y: 78, w: 110 - 72, h: 83 - 78 };

        var generator  = generateRandomPositionInRect2D(centerRect.x, centerRect.y, centerRect.w, centerRect.h);
        while (enemyUnitsEnumerator.MoveNext()) {
            var unit         = enemyUnitsEnumerator.Current;
            // отдел приказов
            var ordersMind   = unit.OrdersMind;
            
            // Проверка что юнит бездействует
            // или юнит только что заспавнился и пока у него нету ид
            if (!ordersMind.IsIdle() || unit.Id == 0) {
                continue;
            }

            // выделяем данного юнита
            inputSelectUnitsById(mapdefens_enemyPlayer, [unit.Id]);
            
            // если Y < 80, то оправляем сначала в центр
            if (unit.Cell.Y < 80) {
                var positionFound = false;
                var position;
                while (!positionFound) {
                    for (position = generator.next(); !position.done; position = generator.next()) {
                        if (unitCanBePlacedByRealMap(mapdefens_enemyUnitsCfg["UnitConfig_Barbarian_Swordmen"], position.value.X, position.value.Y)) {
                            positionFound = true;
                            break;
                        }
                    }
                    // генератор закончился, делаем новый
                    if (!positionFound) {
                        generator = generateRandomPositionInRect2D(centerRect.x, centerRect.y, centerRect.w, centerRect.h);
                    }
                }
                inputPointBasedCommand(mapdefens_enemyPlayer, createPoint(position.value.X, position.value.Y), UnitCommand.Attack);

                // вызывает рассинхрон
                // 20% юнитов идут в обход
                // var randomNumber = rnd.RandomNumber(1, 100);
                // if (randomNumber <= 10) {
                //     var position2 = { X: goalPosition.value.X - 30, Y: Math.floor((goalPosition.value.Y + position.value.Y) * 0.5) };
                //     inputPointBasedCommand(mapdefens_enemyPlayer, createPoint(position2.X, position2.Y), UnitCommand.Attack, AssignOrderMode.Queue);
                //     if (randomNumber <= 5) {
                //         var position3 = { X: goalPosition.value.X - 30, Y: goalPosition.value.Y };
                //         inputPointBasedCommand(mapdefens_enemyPlayer, createPoint(position3.X, position3.Y), UnitCommand.Attack, AssignOrderMode.Queue);
                //     }
                // } else if (randomNumber <= 20) {
                //     var position2 = { X: goalPosition.value.X + 30, Y: Math.floor((goalPosition.value.Y + position.value.Y) * 0.5) };
                //     inputPointBasedCommand(mapdefens_enemyPlayer, createPoint(position2.X, position2.Y), UnitCommand.Attack, AssignOrderMode.Queue);
                //     if (randomNumber <= 15) {
                //         var position3 = { X: goalPosition.value.X + 30, Y: goalPosition.value.Y };
                //         inputPointBasedCommand(mapdefens_enemyPlayer, createPoint(position3.X, position3.Y), UnitCommand.Attack, AssignOrderMode.Queue);
                //     }
                // }
            }
            
            // в конце отправляем в атаку на цель
            inputPointBasedCommand(mapdefens_enemyPlayer, createPoint(goalPosition.value.X, goalPosition.value.Y), UnitCommand.Attack, AssignOrderMode.Queue);
        }
        enemyUnitsEnumerator.Dispose();
    }
}
