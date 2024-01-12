namespace _6_DOTA {
    class PlayerInfo {
        // цвет игрока
        Color: any;
        // флаг, что игрок в игре
        InGame: boolean;
        // юнит - барраки где выбирают героя
        BarrackUnit: any;
        // юнит - замок игрока
        CastleUnit: any;
        // номер игрока
        PlayerNum: number;
        // конфиг героя
        HeroCFG: any;
        // юнит - герой игрока
        HeroUnit: any;
        // точка - места воскрешения
        PointRevive: any;
        // такт воскрешения
        TickRevive: number;

        // флаг, что герой только что воскрес и его нужно выделить
        NeedSelect: boolean;

        constructor() {
            this.InGame = false;
            this.NeedSelect = false;
        }
    };

    // cfg всех юнитов на сцене
    var configs;

    // описание спавна
    var waves;

    // инфа для игроков
    //var playersInfo;
    var playersInfo = Array<PlayerInfo>(6);
    for (var playerNum = 0; playerNum < playersInfo.length; playerNum++) {
        playersInfo[playerNum] = new PlayerInfo();
    }

    export function scena_onFirstRun() {
        configs = {};

        var realScena   = scena.GetRealScena();
        var settlements = realScena.Settlements;

        settlement_6 = settlements.Item.get('6');
        settlement_7 = settlements.Item.get('7');

        ///////////////////////////////////
        // конфиги башен и замка
        ///////////////////////////////////
        logi("конфиги башен и замка");

        // башня 1

        configs["left_tower_1"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Tower"));
        // назначаем имя
        HordeUtils.setValue(configs["left_tower_1"], "Name", "Башня 1");
        // убираем возможность захвата
        configs["left_tower_1"].ProfessionParams.Remove(UnitProfession.Capturable);
        // хп
        HordeUtils.setValue(configs["left_tower_1"], "MaxHealth", 200);
        // делаем иммунитет к огню, магии
        HordeUtils.setValue(configs["left_tower_1"], "Flags", makeFlags(UnitFlags, [UnitFlags.FireResistant, UnitFlags.MagicResistant, UnitFlags.Building, UnitFlags.Lifeless]));

        // башня 2

        configs["left_tower_2"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Tower"));
        // назначаем имя
        HordeUtils.setValue(configs["left_tower_2"], "Name", "Башня 2");
        // убираем возможность захвата
        configs["left_tower_2"].ProfessionParams.Remove(UnitProfession.Capturable);
        // хп
        HordeUtils.setValue(configs["left_tower_2"], "MaxHealth", 400);
        // делаем иммунитет к огню, магии
        HordeUtils.setValue(configs["left_tower_2"], "Flags", makeFlags(UnitFlags, [UnitFlags.FireResistant, UnitFlags.MagicResistant, UnitFlags.Building, UnitFlags.Lifeless]));

        // башня 3

        configs["left_tower_3"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Tower"));
        // назначаем имя
        HordeUtils.setValue(configs["left_tower_3"], "Name", "Башня 2");
        // убираем возможность захвата
        configs["left_tower_3"].ProfessionParams.Remove(UnitProfession.Capturable);
        // хп
        HordeUtils.setValue(configs["left_tower_3"], "MaxHealth", 10000);
        // делаем иммунитет к огню, магии
        HordeUtils.setValue(configs["left_tower_3"], "Flags", makeFlags(UnitFlags, [UnitFlags.FireResistant, UnitFlags.MagicResistant, UnitFlags.Building, UnitFlags.Lifeless]));
        // делаем урон = 100
        HordeUtils.setValue(configs["left_tower_3"], "Damage", 100);

        // замок

        configs["left_castle"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Castle"));
        // назначаем имя
        HordeUtils.setValue(configs["left_castle"], "Name", "Замок");
        // хп
        HordeUtils.setValue(configs["left_castle"], "MaxHealth", 500);
        // делаем иммунитет к огню, магии
        HordeUtils.setValue(configs["left_castle"], "Flags", makeFlags(UnitFlags, [UnitFlags.FireResistant, UnitFlags.MagicResistant, UnitFlags.Building, UnitFlags.Lifeless]));

        ///////////////////////////////////
        // конфиги юнитов
        ///////////////////////////////////
        logi("конфиги юнитов");

        // рыцарь
        configs["left_swordmen"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Swordmen"));
        // убираем возможность захвата
        configs["left_swordmen"].AllowedCommands.Remove(UnitCommand.Capture);

        // лучник
        configs["left_archer"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Archer"));
        // убираем возможность захвата
        configs["left_archer"].AllowedCommands.Remove(UnitCommand.Capture);

        // тяжелый рыцарь
        configs["left_heavymen"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Heavymen"));
        // убираем возможность захвата
        configs["left_heavymen"].AllowedCommands.Remove(UnitCommand.Capture);

        // катапульта
        configs["left_catapult"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Catapult"));

        // создаем отличительные черты фракций и клонируем для фракции right_
        for (var left_configId in configs) {
            if (!left_configId.includes("left_")) {
                continue;
            }

            HordeUtils.setValue(configs[left_configId], "TintColor", createHordeColor(255, 255, 100, 100));

            var right_configId = left_configId.replace("left_", "right_");
            configs[right_configId] = HordeContent.CloneConfig(configs[left_configId]);
            HordeUtils.setValue(configs[left_configId], "TintColor", createHordeColor(255, 100, 100, 255));
        }

        ///////////////////////////////////
        // конфиги героев
        ///////////////////////////////////
        logi("конфиги героев");

        var heroesId = [];

        // герой 1
        heroesId.push("hero_1");
        configs["hero_1"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Mage_Villur"));
        heroesId.push("hero_2");
        configs["hero_2"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Mage_Mag_16"));

        // обнуляем героям цену и требования
        for (var heroId of heroesId) {
            var heroCfg = configs[heroId];

            HordeUtils.setValue(heroCfg.CostResources, "Gold",   0);
            HordeUtils.setValue(heroCfg.CostResources, "Metal",  0);
            HordeUtils.setValue(heroCfg.CostResources, "Lumber", 0);
            HordeUtils.setValue(heroCfg.CostResources, "People", 0);

            heroCfg.TechConfig.Requirements.Clear();
        }

        ///////////////////////////////////
        // конфиги бараков с героями
        ///////////////////////////////////
        logi("конфиги бараков с героями");

        configs["barrack"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Barrack"));
        
        // обнуляем список постройки у замков
        {
            var producerParams = configs["barrack"].GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
            var produceList    = producerParams.CanProduceList;
            produceList.Clear();
            // добавляем в бараки
            for (var heroId of heroesId) {
                produceList.Add(configs[heroId]);
            }
        }
        
        ///////////////////////////////////
        // инициализируем конфиги игроков
        ///////////////////////////////////
        logi("инициализируем конфиги игроков");

        // var playersInfo = Array<PlayerInfo>(6);
        // for (var playerNum = 0; playerNum < playersInfo.length; playerNum++) {
        //     playersInfo[playerNum] = new PlayerInfo();
        // }
        // отличительные цвета игроков
        playersInfo[0].Color = createHordeColor(255, 241, 43, 29);
        playersInfo[1].Color = createHordeColor(255, 59, 117, 181);
        playersInfo[2].Color = createHordeColor(255, 5, 174, 121);
        playersInfo[3].Color = createHordeColor(255, 56, 101, 18);
        playersInfo[4].Color = createHordeColor(255, 230, 197, 172);
        playersInfo[5].Color = createHordeColor(255, 181, 115, 0);
    
        // смотрим какие игроки в игре
        for (var playerNum = 0; playerNum < players.length; playerNum++) {
            var realPlayer    = players[playerNum].GetRealPlayer();
            var settlement    = realPlayer.GetRealSettlement();
            var settlementNum = settlement.Uid;

            // проверяем, что это игрок
            if (settlementNum >= playersInfo.length) {
                continue;
            }

            playersInfo[settlementNum].PlayerNum  = playerNum;
            playersInfo[settlementNum].InGame     = true;
            playersInfo[settlementNum].CastleUnit = settlement.Units.GetCastleOrAnyUnit();

            // спавним барраки с героями
            playersInfo[settlementNum].BarrackUnit = spawnUnit(
                settlement,
                configs["barrack"],
                createPoint(playersInfo[settlementNum].CastleUnit.Cell.X, playersInfo[settlementNum].CastleUnit.Cell.Y - 2),
                UnitDirection.Down
            );

            // устанавливаем точку спавна
            if (settlementNum < 3) {
                playersInfo[settlementNum].PointRevive = createPoint(2, 2);
            } else {
                playersInfo[settlementNum].PointRevive = createPoint(125, 125);
            }
        }
        ///////////////////////////////////
        // конфиги волны
        ///////////////////////////////////
        logi("конфиги волны");
        
        waves = {};
        waves.periodicity = 60 * 50;
        waves.units = [{
            cfgId: "swordmen",
            count: 5
        },
        {
            cfgId: "archer",
            count: 3
        },
        {
            cfgId: "heavymen",
            count: 2
        }];
        waves.left  = {};
        waves.left.downPath    = [createPoint(11, 51), createPoint(7, 59), createPoint(3, 107), createPoint(20, 124), createPoint(68, 120), createPoint(76, 116), createPoint(112, 112)];
        waves.left.centerPath  = [createPoint(44, 51), createPoint(64, 63), createPoint(76, 83), createPoint(112, 112)];
        waves.left.upPath      = [createPoint(75, 8), createPoint(84, 4), createPoint(111, 7), createPoint(120, 16), createPoint(119, 51), createPoint(112, 112)];
        waves.left.downSpawnPoint   = {X: 3,  Y: 29};
        waves.left.centerSpawnPoint = {X: 18, Y: 18};
        waves.left.upSpawnPoint     = {X: 29, Y: 3};

        waves.right            = {};
        waves.right.downPath   = [createPoint(76, 116), createPoint(68, 120), createPoint(20, 124), createPoint(3, 107), createPoint(7, 59), createPoint(11, 51), createPoint(15, 15)];
        waves.right.centerPath = [createPoint(76, 83), createPoint(64, 63), createPoint(44, 51), createPoint(15, 15)];
        waves.right.upPath     = [createPoint(119, 51), createPoint(120, 16), createPoint(111, 7), createPoint(84, 4), createPoint(75, 8), createPoint(15, 15)];
        waves.right.downSpawnPoint   = {X: 98,  Y: 124};
        waves.right.centerSpawnPoint = {X: 109, Y: 109};
        waves.right.upSpawnPoint     = {X: 124, Y: 98};

        ///////////////////////////////////
        // спавним башни и замки
        ///////////////////////////////////
        logi("спавним башни и замки");

        spawnUnit(settlement_6, configs["left_castle"], createPoint(12, 13), UnitDirection.Down);

        spawnUnit(settlement_6, configs["left_tower_1"], createPoint(1, 82), UnitDirection.Down);
        spawnUnit(settlement_6, configs["left_tower_1"], createPoint(45, 41), UnitDirection.Down);
        spawnUnit(settlement_6, configs["left_tower_1"], createPoint(82, 1), UnitDirection.Down);

        spawnUnit(settlement_6, configs["left_tower_2"], createPoint(1, 35), UnitDirection.Down);
        spawnUnit(settlement_6, configs["left_tower_2"], createPoint(24, 23), UnitDirection.Down);
        spawnUnit(settlement_6, configs["left_tower_2"], createPoint(35, 1), UnitDirection.Down);

        spawnUnit(settlement_6, configs["left_tower_3"], createPoint(0, 0), UnitDirection.Down);

        spawnUnit(settlement_7, configs["right_castle"], createPoint(112, 112), UnitDirection.Down);

        spawnUnit(settlement_7, configs["right_tower_1"], createPoint(45, 124), UnitDirection.Down);
        spawnUnit(settlement_7, configs["right_tower_1"], createPoint(85, 81), UnitDirection.Down);
        spawnUnit(settlement_7, configs["right_tower_1"], createPoint(125, 44), UnitDirection.Down);

        spawnUnit(settlement_7, configs["right_tower_2"], createPoint(91, 125), UnitDirection.Down);
        spawnUnit(settlement_7, configs["right_tower_2"], createPoint(102, 102), UnitDirection.Down);
        spawnUnit(settlement_7, configs["right_tower_2"], createPoint(125, 92), UnitDirection.Down);

        spawnUnit(settlement_7, configs["right_tower_3"], createPoint(126, 126), UnitDirection.Down);
    }

    export function scena_onEveryTick(gameTickNum: number) {
        var FPS = HordeEngine.HordeResurrection.Engine.Logic.Battle.BattleController.GameTimer.CurrentFpsLimit;

        ///////////////////////////////////
        // смотрим кого выбрал игрок
        ///////////////////////////////////
        
        if (gameTickNum % 150 == 0) {
            for (var playerNum = 0; playerNum < playersInfo.length; playerNum++) {
                // проверяем, что игрок в игре
                if (!playersInfo[playerNum].InGame) {
                    continue;
                }

                // проверяем, выбрал ли игрок героя
                if (playersInfo[playerNum].HeroCFG) {
                    continue;
                }

                // проверяем строят ли что-то бараки
                if (playersInfo[playerNum].BarrackUnit.OrdersMind.ActiveOrder.ProductUnitConfig) {
                    playersInfo[playerNum].HeroCFG = HordeContent.CloneConfig(playersInfo[playerNum].BarrackUnit.OrdersMind.ActiveOrder.ProductUnitConfig);
                    // устанавливаем отличительный цвет
                    HordeUtils.setValue(playersInfo[playerNum].HeroCFG, "TintColor", playersInfo[playerNum].Color);
                    // устанавливаем такт воскрешения = текущий
                    playersInfo[playerNum].TickRevive = gameTickNum;
                    // отменяем казарме постройку
                    playersInfo[playerNum].BarrackUnit.OrdersMind.CancelOrders(true);
                }
            }
        }

        ///////////////////////////////////
        // отлавливаем смерть героев, выделяем героя после воскрешения
        ///////////////////////////////////

        for (var playerNum = 0; playerNum < playersInfo.length; playerNum++) {
            // проверка, что игрока вообще есть герой
            if (!playersInfo[playerNum].InGame ||
                !playersInfo[playerNum].HeroCFG ||
                !playersInfo[playerNum].HeroUnit) {
                continue;
            }
            // проверяем, что герой умер
            if (playersInfo[playerNum].HeroUnit.IsDead) {
                playersInfo[playerNum].HeroUnit   = undefined;
                playersInfo[playerNum].TickRevive = gameTickNum + 60 * 50;
            }
            // проверяем, что герой только что воскрес и его нужно выделить 2 раза
            else if (playersInfo[playerNum].NeedSelect) {
                playersInfo[playerNum].NeedSelect = false;
                inputSelectUnitsById(players[playersInfo[playerNum].PlayerNum].GetRealPlayer(), [playersInfo[playerNum].HeroUnit.Id]);
            }
        }

        ///////////////////////////////////
        // воскрешение умерших героев и обратный отсчет до воскрешения
        ///////////////////////////////////
        
        if (gameTickNum % FPS == 0) {
            for (var playerNum = 0; playerNum < playersInfo.length; playerNum++) {
                // проверяем, что в данном такте нужно воскресить героя игрока
                if (!playersInfo[playerNum].InGame ||
                    !playersInfo[playerNum].HeroCFG ||
                    playersInfo[playerNum].HeroUnit) {
                    continue;
                }

                // пора воскрешать героя
                if (gameTickNum > playersInfo[playerNum].TickRevive) {
                    playersInfo[playerNum].HeroUnit   = spawnUnit(scena.GetRealScena().Settlements.Item.get("" + playerNum), playersInfo[playerNum].HeroCFG, playersInfo[playerNum].PointRevive, UnitDirection.Down);
                    playersInfo[playerNum].NeedSelect = true;
                } else if (gameTickNum % (5 * FPS) == 0) {
                    var settlement = scena.GetRealScena().Settlements.Item.get("" + playerNum);
                    var msg = createGameMessageWithSound("воскрешение через " + Math.round((playersInfo[playerNum].TickRevive - gameTickNum) / FPS) + " секунд", createHordeColor(255, 100, 100, 100));
                    settlement.Messages.AddMessage(msg);
                }
            }
        }

        ///////////////////////////////////
        // спавним волны
        ///////////////////////////////////
        
        if (gameTickNum % waves.periodicity == 0) {
            var settlements   = [scena.GetRealScena().Settlements.Item.get('6'), scena.GetRealScena().Settlements.Item.get('7')]; 
            var fractionNames = ["left", "right"];
            var pathNames     = ["down", "center", "up"];
            for (var fractionNum = 0; fractionNum < fractionNames.length; fractionNum++) {
                for (var pathName of pathNames) {
                    // составляем список команд
                    var commands = [];
                    var path     = waves[fractionNames[fractionNum]][pathName + "Path"];
                    for (var point of path) {
                        // ищем ближайшую незанятую точку
                        var generator  = generatePositionInSpiral(point.X, point.Y);
                        var emptyPoint = generator.next();
                        for ( ; !emptyPoint.done; emptyPoint = generator.next()) {
                            if (unitCanBePlacedByRealMap(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Swordmen"), emptyPoint.value.X, emptyPoint.value.Y)) {
                                break;
                            }
                        }

                        commands.push(new PointCommandArgs(createPoint(emptyPoint.value.X, emptyPoint.value.Y), UnitCommand.Attack, AssignOrderMode.Queue));
                    }

                    // спавним юнитов
                    var spawnPoint = waves[fractionNames[fractionNum]][pathName + "SpawnPoint"];
                    var generator  = generatePositionInSpiral(spawnPoint.X, spawnPoint.Y);
                    for (var spawnInfo of waves.units) {
                        var units = spawnUnits(settlements[fractionNum],
                            configs[fractionNames[fractionNum] + "_" + spawnInfo.cfgId],
                            spawnInfo.count,
                            UnitDirection.Down,
                            generator);

                        // отправляем в путь
                        for (var unit of units) {
                            for (var command of commands) {
                                unit.Cfg.GetOrderWorker(unit, command);
                            }
                        }
                    }
                }
            }
        }
    }
}; // namespace _6_DOTA