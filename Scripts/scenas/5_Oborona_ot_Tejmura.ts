// оборачиваем все в пространство имен
namespace _5_Oborona_ot_Tejmura {

enum GameState { Init, ChoiseWave, Run, End }; 

// текущее состояние игры
var gameState : GameState;
// тик с которого начались волны
var timeStart : number;
// 40 минут с 50 кадрами в секунду
var timeEnd : number;

// количество отнятых ресурсов у игроков
var playerStartResources : any;

// текущая волна
var spawnWaveNum : number;
// план для спавна
var spawnPlan : any;
// генераторы планов для спавна на выбор
var spawnPlanGenerators : Array<any>;

// ссылка на замок, который должны уничтожить враги
var goalCastle;
// прямоугольник для спавна
var enemySpawnRectangle;
// конфиги юнитов для спавна
var enemyUnitsCfg : Array<any>;
// ид игрока врага
var enemySettlementId : number;
// игрок врага для управления
var enemySettlement;
// максимальное количество игроков в игре
var playersMaxCount : number;
// количество игроков в игре
var playersCount : number;

// список ид легендарных юнитов
var legendaryUnitsCFGId : Array<string>;
// слабость легендарных юнитов
var legendaryUnitsInformation : Array<string>;

// список легендарных рыцарей на карте
var legendary_swordmen_unitsInfo : Array<any>;
// список легендарных всадников на карте
var legendary_raider_unitsInfo : Array<any>;
// список легендарных инженер на карте
var legendary_worker_unitsInfo : Array<any>;

export function onFirstRun() {
    if (BattleController.GameTimer.GameFramesCounter == 0) {
        gameState           = GameState.Init;
        // Идет запуск - ничего не делаем, т.к. инициализация будет запущена в "everyTick()" после установки всех игровых переменных
    } else {
        // Идет перезапуск скриптов - перезапускаем иницилизацию
    }
    logi(`Текущее состояние ${gameState}`);

    initWavePlan_test();
}

export function everyTick(gameTickNum: number) {
    var FPS         = HordeEngine.HordeResurrection.Engine.Logic.Battle.BattleController.GameTimer.CurrentFpsLimit;

    if (gameState != GameState.Run) {
        if (gameState == GameState.Init) {
            if (gameTickNum != 0) {
                InitGame();
                gameState = GameState.ChoiseWave;
                return;
            }
        } else if (gameState == GameState.ChoiseWave) {
            if (gameTickNum % FPS != 0) {
                return;
            }

            // отбираем у игроков ресурсы на всякий случай
            for (var settlementId = 0; settlementId < 6; settlementId++) {
                if (settlementId == enemySettlementId) {
                    continue;
                }
                var settlement = scena.GetRealScena().Settlements.Item.get('' + settlementId);
                if (playerStartResources == undefined) {
                    playerStartResources = settlement.Resources.GetCopy();
                }
                settlement.Resources.TakeResources(settlement.Resources.GetCopy());
            }

            // проверяем выбирается ли волна
            if (!goalCastle.OrdersMind.ActiveOrder.ProductUnitConfig) {
                return;
            }

            ChoiseWave();

            gameState = GameState.Run;
            return;
        } else if (gameState == GameState.End) {
            return;
        }
    }
    // else GameState.Run

    // учитываем время заказа плана
    gameTickNum -= timeStart;

    var realScena   = scena.GetRealScena();
    var rnd         = realScena.Context.Randomizer;

    //////////////////////////////////////////
    // оповещаем сколько осталось до конца
    //////////////////////////////////////////
    
    if (gameTickNum % (30 * FPS) == 0) {
        var secondsLeft = Math.round(timeEnd - gameTickNum) / FPS;
        var minutesLeft = Math.floor(secondsLeft / 60);
        secondsLeft -= minutesLeft * 60;
        secondsLeft = Math.round(secondsLeft);
        broadcastMessage("Осталось продержаться " + (minutesLeft > 0 ? minutesLeft + " минут " : "") + secondsLeft + " секунд", createHordeColor(255, 100, 100, 100));
    }

    //////////////////////////////////////////
    // регистрируем конец игры
    //////////////////////////////////////////
    
    // целевой объект разрушили - игроки проиграли
    if ((!goalCastle || goalCastle.IsDead)) {
        gameState = GameState.End;
        broadcastMessage("ИГРОКИ ПРОИГРАЛИ", createHordeColor(255, 255, 50, 10));
        for (var i = 0; i < 6; i++) {
            if (i == enemySettlementId) {
                continue;
            }
            scena.GetRealScena().Settlements.Item.get("" + i).Existence.ForceTotalDefeat();
        }
        return;
    }
    // прошло gameEnd тиков - игроки победили
    if (gameTickNum >= timeEnd) {
        gameState = GameState.End;
        broadcastMessage("ИГРОКИ ПОБЕДИЛИ", createHordeColor(255, 255, 50, 10));
        scena.GetRealScena().Settlements.Item.get("" + enemySettlementId).Existence.ForceTotalDefeat();
        return;
    }

    //////////////////////////////////////////
    // обработка волн
    //////////////////////////////////////////

    while (spawnWaveNum < spawnPlan.length && spawnPlan[spawnWaveNum].gameTickNum <= gameTickNum) {
        // отправляем сообщение в чат, если оно есть
        if (spawnPlan[spawnWaveNum]["message"]) {
            logi(spawnPlan[spawnWaveNum]["message"]);
            
            broadcastMessage(spawnPlan[spawnWaveNum]["message"], createHordeColor(255, 255, 50, 10));
        }

        // спавним юнитов
        var generator = generateRandomPositionInRect2D(enemySpawnRectangle.x, enemySpawnRectangle.y, enemySpawnRectangle.w, enemySpawnRectangle.h);
        for (var i = 0; i < spawnPlan[spawnWaveNum].units.length; i++) {
            if (spawnPlan[spawnWaveNum].units[i].count <= 0) {
                continue;
            }

            var spawnedUnits = spawnUnits(enemySettlement,
                enemyUnitsCfg[spawnPlan[spawnWaveNum].units[i].cfgId],
                spawnPlan[spawnWaveNum].units[i].count,
                UnitDirection.Down,
                generator);
            
            // информируем о легендарных противниках и их слабостях
            var legendaryIndex = legendaryUnitsCFGId.indexOf(spawnPlan[spawnWaveNum].units[i].cfgId);
            if (legendaryIndex >= 0) {
                broadcastMessage("Замечен " + enemyUnitsCfg[spawnPlan[spawnWaveNum].units[i].cfgId].Name, createHordeColor(255, 255, 165, 10));
                broadcastMessage(legendaryUnitsInformation[legendaryIndex], createHordeColor(255, 200, 130, 10));
            }

            // запоминаем некоторых легендарных юнитов в список
            if ("UnitConfig_legendary_swordmen" == spawnPlan[spawnWaveNum].units[i].cfgId) {
                for (var spawnedUnit of spawnedUnits) {
                    legendary_swordmen_unitsInfo.push({
                        unit:       spawnedUnit,
                        cloneDepth: 0
                    });
                }
            } else if ("UnitConfig_legendary_Raider" == spawnPlan[spawnWaveNum].units[i].cfgId) {
                for (var spawnedUnit of spawnedUnits) {
                    legendary_raider_unitsInfo.push({
                        unit: spawnedUnit
                    });
                }
            } else if ("UnitConfig_legendary_worker" == spawnPlan[spawnWaveNum].units[i].cfgId) {
                for (var spawnedUnit of spawnedUnits) {
                    legendary_worker_unitsInfo.push({
                        unit: spawnedUnit,
                        towersBuild: 2 + playersCount
                    });
                }
            }
        }

        // переходим к следующему плану
        spawnWaveNum++;
    }

    //////////////////////////////////////////
    // обработка легендарных рыцарей
    //////////////////////////////////////////

    // регистрируем смерть легендарных рыцарей для клонирования
    for (var i = 0; i < legendary_swordmen_unitsInfo.length; i++) {
        // если рыцарь умер
        if (legendary_swordmen_unitsInfo[i].unit.IsDead) {
            // если существует конфиг для следующего уровня клонов, то спавним 2-ух клонов и увеличиваем уровень клонов на 1
            var cloneCfg = enemyUnitsCfg["UnitConfig_legendary_swordmen_" + legendary_swordmen_unitsInfo[i].cloneDepth];
            if (cloneCfg) {
                // создаем генератор по спирали вокруг умершего рыцаря
                var generator = generatePositionInSpiral(legendary_swordmen_unitsInfo[i].unit.Cell.X, legendary_swordmen_unitsInfo[i].unit.Cell.Y);
                // спавним 2-ух рыцарей
                var spawnedUnits = spawnUnits(enemySettlement,
                    cloneCfg,
                    2,
                    UnitDirection.Down,
                    generator);
                for (var spawnedUnit of spawnedUnits) {
                    legendary_swordmen_unitsInfo.push({
                        unit: spawnedUnit,
                        cloneDepth: (legendary_swordmen_unitsInfo[i].cloneDepth + 1)
                    });
                    spawnDecoration(scena.GetRealScena(), HordeContent.GetVisualEffectConfig("#VisualEffectConfig_LittleDust"), spawnedUnit.Position);
                }
            }
            
            // удаляем из массива умершего рыцаря
            legendary_swordmen_unitsInfo.splice(i--, 1);
        }
    }

    //////////////////////////////////////////
    // обработка легендарных всадников
    //////////////////////////////////////////

    // регистрируем смерть легендарных всадников
    for (var i = 0; i < legendary_raider_unitsInfo.length; i++) {
        // если всадник умер, то исключаем его из списка
        if (legendary_raider_unitsInfo[i].unit.IsDead) {
            legendary_raider_unitsInfo.splice(i--, 1);
        }
    }
    // каждые 5 секунд спавним юнитов вокруг всадника
    if (gameTickNum % 300 == 0) {
        for (var i = 0; i < legendary_raider_unitsInfo.length; i++) {
            var raider = legendary_raider_unitsInfo[i].unit;
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
            var spawnedUnits = spawnUnits(enemySettlement,
                enemyUnitsCfg[spawnUnitId],
                Math.min(playersCount, 3),
                UnitDirection.Down,
                generator);
            for (var spawnedUnit of spawnedUnits) {
                spawnDecoration(scena.GetRealScena(), HordeContent.GetVisualEffectConfig("#VisualEffectConfig_LittleDust"), spawnedUnit.Position);
            }
        }
    }

    //////////////////////////////////////////
    // обработка легендарных инженеров
    //////////////////////////////////////////

    for (var i = 0; i < legendary_worker_unitsInfo.length; i++) {
        // если инженер умер, то исключаем его из списка
        if (legendary_worker_unitsInfo[i].unit.IsDead) {
            legendary_worker_unitsInfo.splice(i--, 1);
        }
    }

    //////////////////////////////////////////
    // логика поведения юнитов
    //////////////////////////////////////////

    // приказываем бездействующим юнитам врага атаковать
    if (gameTickNum % 180 == 0) {
        // позиция для атаки цели
        var goalPosition;
        {
            var generator = generatePositionInSpiral(goalCastle.Cell.X, goalCastle.Cell.Y);
            for (goalPosition = generator.next(); !goalPosition.done; goalPosition = generator.next()) {
                if (unitCanBePlacedByRealMap(enemyUnitsCfg["UnitConfig_Barbarian_Swordmen"], goalPosition.value.X, goalPosition.value.Y)) {
                    break;
                }
            }
        }

        //////////////////////////////////////////
        // логика поведения легендарных инженеров
        //////////////////////////////////////////
        
        for (var i = 0; i < legendary_worker_unitsInfo.length; i++) {
            var worker = legendary_worker_unitsInfo[i].unit;

            // юнит только что заспавнился и пока у него нету ид
            if (worker.Id == 0) {
                continue;
            }

            // отдел приказов
            var ordersMind   = worker.OrdersMind;

            // юнит бездействует и у него фулл хп, то отправляем его на базу врага
            if (ordersMind.IsIdle() && worker.Health == enemyUnitsCfg["UnitConfig_legendary_worker"].MaxHealth) {
                // в конце отправляем в атаку на цель
                var pointCommandArgs = new PointCommandArgs(createPoint(goalPosition.value.X, goalPosition.value.Y), UnitCommand.MoveToPoint, AssignOrderMode.Queue);
                worker.Cfg.GetOrderDelegate(worker, pointCommandArgs);

                continue;
            }

            // проверка, что инженер что-то строит
            var currentOrderProducing = ordersMind.ActiveOrder.ProductUnit != undefined;

            // проверка, что юнит готов строить башню
            if (worker.Health == enemyUnitsCfg["UnitConfig_legendary_worker"].MaxHealth ||
                currentOrderProducing) {
                continue;
            }

            // Отменить все приказы юнита
            ordersMind.CancelOrders(true);

            // ищем ближайшее место куда можно построить башню
            var generator = generatePositionInSpiral(worker.Cell.X, worker.Cell.Y);
            for (var position = generator.next(); !position.done; position = generator.next()) {
                if (unitCanBePlacedByRealMap(enemyUnitsCfg["UnitConfig_legendary_worker_Tower"], position.value.X, position.value.Y)) {
                    // делаем так, чтобы инженер не отвлекался, когда строит башню (убираем реакцию на инстинкты)
                    ordersMind.AssignSmartOrder(worker.Cell, AssignOrderMode.Replace, 100000);

                    var produceAtCommandArgs = new ProduceAtCommandArgs(AssignOrderMode.Queue, enemyUnitsCfg["UnitConfig_legendary_worker_Tower"], createPoint(position.value.X, position.value.Y));
                    worker.Cfg.GetOrderDelegate(worker, produceAtCommandArgs);

                    // уменьшаем количество создаваемых башен на 1
                    legendary_worker_unitsInfo[i].towersBuild--;
                    // если инженер достиг лимита воздвигаемых башен, то удаляем его из списка
                    if (legendary_worker_unitsInfo[i].towersBuild == 0) {
                        legendary_worker_unitsInfo.splice(i--, 1);
                    }
                    break;
                }
            }
        }

        //////////////////////////////////////////
        // логика поведения легендарных всадников
        //////////////////////////////////////////
        
        for (var i = 0; i < legendary_raider_unitsInfo.length; i++) {
            var raider = legendary_raider_unitsInfo[i].unit;
            // отдел приказов
            var ordersMind   = raider.OrdersMind;

            // или юнит только что заспавнился и пока у него нету ид
            if (raider.Id == 0 || ordersMind.OrdersCount > 5) {
                continue;
            }

            // генерируем 5 рандомных достижимых точек вокруг цели
            var generator = generateRandomPositionInRect2D(goalCastle.Cell.X - 20, goalCastle.Cell.Y - 20, 40, 40);
            for (var position = generator.next(); !position.done; position = generator.next()) {
                if (unitCheckPathTo(raider, createPoint(position.value.X, position.value.Y))) {
                    ordersMind.AssignSmartOrder(createPoint(position.value.X, position.value.Y), AssignOrderMode.Queue, 100000);

                    break;
                }
            }
        }

        //////////////////////////////////////////
        // логика поведения почти всех юнитов
        //////////////////////////////////////////

        var enemyUnitsEnumerator = enemySettlement.Units.GetEnumerator();
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

            // если Y < 80, то оправляем сначала в центр
            if (unit.Cell.Y < 80) {
                var positionFound = false;
                var position;
                while (!positionFound) {
                    for (position = generator.next(); !position.done; position = generator.next()) {
                        if (unitCanBePlacedByRealMap(enemyUnitsCfg["UnitConfig_Barbarian_Swordmen"], position.value.X, position.value.Y)) {
                            positionFound = true;
                            break;
                        }
                    }
                    // генератор закончился, делаем новый
                    if (!positionFound) {
                        generator = generateRandomPositionInRect2D(centerRect.x, centerRect.y, centerRect.w, centerRect.h);
                    }
                }
                var pointCommandArgs = new PointCommandArgs(createPoint(position.value.X, position.value.Y), UnitCommand.Attack, AssignOrderMode.Queue);
                unit.Cfg.GetOrderDelegate(unit, pointCommandArgs);

                // вызывает рассинхрон
                // 20% юнитов идут в обход
                // var randomNumber = rnd.RandomNumber(1, 100);
                // if (randomNumber <= 10) {
                //     var position2 = { X: goalPosition.value.X - 30, Y: Math.floor((goalPosition.value.Y + position.value.Y) * 0.5) };
                //     inputPointBasedCommand(enemyPlayer, createPoint(position2.X, position2.Y), UnitCommand.Attack, AssignOrderMode.Queue);
                //     if (randomNumber <= 5) {
                //         var position3 = { X: goalPosition.value.X - 30, Y: goalPosition.value.Y };
                //         inputPointBasedCommand(enemyPlayer, createPoint(position3.X, position3.Y), UnitCommand.Attack, AssignOrderMode.Queue);
                //     }
                // } else if (randomNumber <= 20) {
                //     var position2 = { X: goalPosition.value.X + 30, Y: Math.floor((goalPosition.value.Y + position.value.Y) * 0.5) };
                //     inputPointBasedCommand(enemyPlayer, createPoint(position2.X, position2.Y), UnitCommand.Attack, AssignOrderMode.Queue);
                //     if (randomNumber <= 15) {
                //         var position3 = { X: goalPosition.value.X + 30, Y: goalPosition.value.Y };
                //         inputPointBasedCommand(enemyPlayer, createPoint(position3.X, position3.Y), UnitCommand.Attack, AssignOrderMode.Queue);
                //     }
                // }
            }
            
            // в конце отправляем в атаку на цель
            var pointCommandArgs = new PointCommandArgs(createPoint(goalPosition.value.X, goalPosition.value.Y), UnitCommand.Attack, AssignOrderMode.Queue);
            unit.Cfg.GetOrderDelegate(unit, pointCommandArgs);
        }
        enemyUnitsEnumerator.Dispose();
    }
}

function InitGame() {
    var realScena       = scena.GetRealScena();
    var settlements     = realScena.Settlements;
    var rnd             = realScena.Context.Randomizer;
    timeEnd             = (40 * 60) * 50;
    spawnPlansCount     = 2;
    enemySpawnRectangle = {
        x: 0,
        y: 0,
        w: 182,
        h: 22
    };
    spawnWaveNum        = 0;
    enemySettlementId   = 4;
    enemySettlement     = settlements.Item.get('' + enemySettlementId);
    
    ////////////////////////////////////////////////////
    // регистрируем генераторов планов
    ////////////////////////////////////////////////////

    var spawnPlanGeneratorsDescriptions = new Array<string>();

    spawnPlanGenerators = new Array<any>();
    spawnPlanGenerators.push(initWavePlan_1);
    spawnPlanGeneratorsDescriptions.push("15 волн, 1-ая на 1-ой минуте, сбалансированная армия врага.");
    spawnPlanGenerators.push(initWavePlan_2);
    spawnPlanGeneratorsDescriptions.push("враги идут непрерывно начиная с 3-ой минуты, сбалансированная армия врага.");
    spawnPlanGenerators.push(initWavePlan_3);
    spawnPlanGeneratorsDescriptions.push("враги идут непрерывно начиная с 1-ой минуты, в составе армии только рыцари.");
    spawnPlanGenerators.push(initWavePlan_4);
    spawnPlanGeneratorsDescriptions.push("враги идут каждые 2 минуты, в составе армии только легендарные юниты, у которых здоровье в 10 раз меньше обычного.");
    //spawnPlanGenerators.push(initWavePlan_test);
    //spawnPlanGeneratorsDescriptions.push("Тестовая волна");

    //////////////////////////////////////////
    // настраиваем целевого юнита
    //////////////////////////////////////////

    var goalUnitCfg = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_StoneCastle"));
    // увеличиваем хп до 500
    HordeUtils.setValue(goalUnitCfg, "MaxHealth", 500);
    // убираем починку
    goalUnitCfg.ProfessionParams.Remove(UnitProfession.Reparable);
    // меняем цвет
    // HordeUtils.setValue(goalUnitCfg, "TintColor", createHordeColor(255, 0, 255, 0));
    // добавляем постройку волн
    {
        var producerParams = goalUnitCfg.GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
        var produceList    = producerParams.CanProduceList;
        produceList.Clear();

        for (var spawnPlanGeneratorIdx = 0; spawnPlanGeneratorIdx < spawnPlanGenerators.length; spawnPlanGeneratorIdx++) {
            var cfg = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Barbarian_Swordmen"));
            // назначаем имя
            HordeUtils.setValue(cfg, "Name", "План спавна " + (spawnPlanGeneratorIdx+1));
            // описание
            HordeUtils.setValue(cfg, "Description", spawnPlanGeneratorsDescriptions[spawnPlanGeneratorIdx]);
            // записываем ид плана
            HordeUtils.setValue(cfg, "Shield", spawnPlanGeneratorIdx);
            // убираем цену
            HordeUtils.setValue(cfg.CostResources, "Gold",   0);
            HordeUtils.setValue(cfg.CostResources, "Metal",  0);
            HordeUtils.setValue(cfg.CostResources, "Lumber", 0);
            HordeUtils.setValue(cfg.CostResources, "People", 0);
            // убираем требования
            cfg.TechConfig.Requirements.Clear();
            produceList.Add(cfg);
        }
    }

    //////////////////////////////////////////
    // считаем количество игроков
    //////////////////////////////////////////

    var settlementAccounted = new Array<boolean>(6);
    for (var settlementNum = 0; settlementNum < settlementAccounted.length; settlementNum++) {
        settlementAccounted[settlementNum] = false;
    }

    playersCount    = 0;
    for (var player of players) {
        var realPlayer = player.GetRealPlayer();
        var settlement = realPlayer.GetRealSettlement();
        
        if (isReplayMode() && realPlayer.PlayerOrigin.ToString() != "Replay") {
            continue;
        }

        // игрок
        if (settlement.Uid < 6 && settlement.Uid != enemySettlementId) {
            if (!HordeUtils.getValue(realPlayer, "MasterMind")) {
                // несколько игроков может играть за 1 поселение
                if (!settlementAccounted[settlement.Uid]) {
                    playersCount++;
                    settlementAccounted[settlement.Uid] = true;
                }

                // позиция цели врагов
                var position = createPoint(88, 123);
                //var position = createPoint(89, 150); // для тестов;

                // любому игроку добавляем церковь - цель врагов
                if (!goalCastle) {
                    goalCastle = spawnUnit(
                        settlement,
                        goalUnitCfg,
                        position,
                        UnitDirection.Down
                    );
                }
                logi("Поселение ", settlement.Uid, " is player");
            }
        }
    }
    logi("Игроков: ", playersCount);

    ////////////////////////////
    // задаем конфиги врагов
    ////////////////////////////

    enemyUnitsCfg             = {};
    enemyBulletCfg            = {};
    legendaryUnitsCFGId       = [];
    legendaryUnitsInformation = [];

    // (легкая пехота) рыцарь
    enemyUnitsCfg["UnitConfig_Barbarian_Swordmen"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Barbarian_Swordmen"));
    // (легкая пехота) лучник
    enemyUnitsCfg["UnitConfig_Barbarian_Archer"]   = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Barbarian_Archer"));
    // (легкая пехота) лучник с зажигательными стрелами
    enemyUnitsCfg["UnitConfig_Barbarian_Archer_2"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Barbarian_Archer_2"));

    // (тяжелая пехота) тяжелый рыцарь
    enemyUnitsCfg["UnitConfig_Barbarian_Heavymen"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Barbarian_Heavymen"));

    // (конница) всадник
    enemyUnitsCfg["UnitConfig_Barbarian_Raider"]   = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Barbarian_Raider"));

    // (техника) катапульта
    enemyUnitsCfg["UnitConfig_Slavyane_Catapult"]  = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Catapult"));
    // (техника) баллиста
    enemyUnitsCfg["UnitConfig_Slavyane_Balista"]   = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Balista"));

    // (маг) Фантом (1 молния)
    enemyUnitsCfg["UnitConfig_Mage_Mag_2"]         = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Mage_Mag_2"));
    // (маг) Виллур (1 фаерболл)
    enemyUnitsCfg["UnitConfig_Mage_Villur"]        = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Mage_Villur"));
    // (маг) Ольга (шторм из молний)
    enemyUnitsCfg["UnitConfig_Mage_Olga"]          = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Mage_Olga"));
    
    // (легендарный) рыцарь
    legendaryUnitsCFGId.push("UnitConfig_legendary_swordmen");
    legendaryUnitsInformation.push("Слабости: давится, горит. Преимущества: очень силен в ближнем бою.");
    enemyUnitsCfg["UnitConfig_legendary_swordmen"] = HordeContent.CloneConfig(enemyUnitsCfg["UnitConfig_Barbarian_Swordmen"]);
    // назначаем имя
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_swordmen"], "Name", "Легендарный рыцарь");
    // меняем цвет
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_swordmen"], "TintColor", createHordeColor(255, 255, 100, 100));
    // задаем количество здоровья от числа игроков
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_swordmen"], "MaxHealth", Math.floor(100 * Math.sqrt(playersCount)));
    // создаем конфиги для клонов
    var swordmenClonesDepth = Math.ceil(Math.log2(enemyUnitsCfg["UnitConfig_legendary_swordmen"].MaxHealth / 10));
    for (var i = 0; i < swordmenClonesDepth; i++) {
        var uid = "UnitConfig_legendary_swordmen_" + i;

        // копируем базового рыцаря
        enemyUnitsCfg[uid] = HordeContent.CloneConfig(enemyUnitsCfg["UnitConfig_legendary_swordmen"]);
        // задаем количество здоровья
        HordeUtils.setValue(enemyUnitsCfg[uid], "MaxHealth", Math.ceil(enemyUnitsCfg["UnitConfig_legendary_swordmen"].MaxHealth / Math.pow(2, i + 1)));
        // задаем цвет
        HordeUtils.setValue(enemyUnitsCfg[uid], "TintColor", createHordeColor(255, 255, Math.floor(255 * (i + 1) / swordmenClonesDepth), Math.floor(255 * (i + 1) / swordmenClonesDepth)));
    }

    // (легендарный) тяжелый рыцарь
    legendaryUnitsCFGId.push("UnitConfig_legendary_heavymen");
    legendaryUnitsInformation.push("Слабости: горит, окружение. Преимущества: ближний бой, броня, много хп.");
    enemyUnitsCfg["UnitConfig_legendary_heavymen"] = HordeContent.CloneConfig(enemyUnitsCfg["UnitConfig_Barbarian_Heavymen"]);
    // назначаем имя
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_heavymen"], "Name", "Легендарный тяжелый рыцарь");
    // меняем цвет
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_heavymen"], "TintColor", createHordeColor(255, 255, 100, 100));
    // увеличиваем хп
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_heavymen"], "MaxHealth", Math.floor(400 * Math.sqrt(playersCount)));
    // делаем броню 3, чтобы стрели не брали его
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_heavymen"], "Shield", 3);

    // (легендарный) лучник
    legendaryUnitsCFGId.push("UnitConfig_legendary_archer");
    legendaryUnitsInformation.push("Слабости: ближний бой, окружение. Преимущества: дальний бой, не горит.");
    enemyUnitsCfg["UnitConfig_legendary_archer"] = HordeContent.CloneConfig(enemyUnitsCfg["UnitConfig_Barbarian_Archer"]);
    // назначаем имя
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer"], "Name", "Легендарный лучник");
    // меняем цвет
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer"], "TintColor", createHordeColor(255, 255, 100, 100));
    // стреляет сразу 10 стрелами
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer"].MainArmament, "EmitBulletsCountMin", 10);
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer"].MainArmament, "EmitBulletsCountMax", 10);
    // увеличиваем разброс
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer"].MainArmament, "BaseAccuracy", 0);
    // увеличиваем дальность
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer"].MainArmament, "Range", 10);
    // делаем так, чтобы не давили всадники
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer"], "Weight", 12);
    // задаем количество здоровья от числа игроков
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer"], "MaxHealth", Math.floor(200 * Math.sqrt(playersCount)));
    // делаем имунитет к огню
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer"], "Flags", UnitFlags.FireResistant);

    // (легендарный) поджигатель
    legendaryUnitsCFGId.push("UnitConfig_legendary_archer_2");
    legendaryUnitsInformation.push("Слабости: ближний бой, окружение. Преимущества: дальний бой, не горит.");
    enemyUnitsCfg["UnitConfig_legendary_archer_2"] = HordeContent.CloneConfig(enemyUnitsCfg["UnitConfig_Barbarian_Archer_2"]);
    // назначаем имя
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer_2"], "Name", "Легендарный поджигатель");
    // меняем цвет
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer_2"], "TintColor", createHordeColor(255, 255, 100, 100));
    // стреляет сразу 5 стрелами
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer_2"].MainArmament, "EmitBulletsCountMin", 5);
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer_2"].MainArmament, "EmitBulletsCountMax", 5);
    // увеличиваем дальность
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer_2"].MainArmament, "Range", 10);
    // увеличиваем разброс
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer_2"].MainArmament, "BaseAccuracy", 0);
    // делаем так, чтобы не давили всадники
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer_2"], "Weight", 12);
    // задаем количество здоровья от числа игроков
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer_2"], "MaxHealth", Math.floor(200 * Math.sqrt(playersCount)));
    // делаем имунитет к огню
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_archer_2"], "Flags", UnitFlags.FireResistant);

    // (легендарный) всадник
    legendaryUnitsCFGId.push("UnitConfig_legendary_Raider");
    legendaryUnitsInformation.push("Слабости: ближний бой, окружение, горит. Преимущества: скорость, спавн союзников.");
    enemyUnitsCfg["UnitConfig_legendary_Raider"] = HordeContent.CloneConfig(enemyUnitsCfg["UnitConfig_Barbarian_Raider"]);
    // назначаем имя
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_Raider"], "Name", "Легендарный всадник");
    // меняем цвет
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_Raider"], "TintColor", createHordeColor(255, 255, 100, 100));
    // задаем количество здоровья от числа игроков
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_Raider"], "MaxHealth", Math.floor(200 * Math.sqrt(playersCount)));
    // делаем урон = 0
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_Raider"].MainArmament.BulletCombatParams, "Damage", 0);

    // (легендарная) башня к крестьянину
    enemyUnitsCfg["UnitConfig_legendary_worker_Tower"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Tower"));
    // назначаем имя
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_worker_Tower"], "Name", "Легендарная башня");
    // меняем цвет
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_worker_Tower"], "TintColor", createHordeColor(255, 255, 100, 100));
    // задаем количество здоровья от числа игроков
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_worker_Tower"], "MaxHealth", Math.floor(50 * Math.sqrt(playersCount)));
    // делаем башню бесплатной
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_worker_Tower"].CostResources, "Gold",   0);
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_worker_Tower"].CostResources, "Metal",  0);
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_worker_Tower"].CostResources, "Lumber", 0);
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_worker_Tower"].CostResources, "People", 0);
    // убираем требования у башни
    enemyUnitsCfg["UnitConfig_legendary_worker_Tower"].TechConfig.Requirements.Clear();
    // ускоряем время постройки
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_worker_Tower"], "ProductionTime", 200);
    // убираем возможность захвата
    enemyUnitsCfg["UnitConfig_legendary_worker_Tower"].ProfessionParams.Remove(UnitProfession.Capturable);
    
    // (легендарный) крестьянин
    legendaryUnitsCFGId.push("UnitConfig_legendary_worker");
    legendaryUnitsInformation.push("Слабости: ближний бой, окружение, огонь, ранней атаки. Преимущества: строит башни.");
    enemyUnitsCfg["UnitConfig_legendary_worker"] = HordeContent.CloneConfig(HordeContent.GetUnitConfig("#UnitConfig_Barbarian_Worker1"));
    // назначаем имя
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_worker"], "Name", "Легендарный инженер");
    // меняем цвет
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_worker"], "TintColor", createHordeColor(255, 255, 100, 100));
    // задаем количество здоровья от числа игроков
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_worker"], "MaxHealth", Math.floor(300 * Math.sqrt(playersCount)));
    // делаем так, чтобы не давили всадники
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_worker"], "Weight", 12);
    // удаляем команду атаки
    enemyUnitsCfg["UnitConfig_legendary_worker"].AllowedCommands.Remove(UnitCommand.Attack);
    // добавляем в список построек легендарную башню
    {
        var producerParams = enemyUnitsCfg["UnitConfig_legendary_worker"].GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
        var produceList    = producerParams.CanProduceList;
        produceList.Clear();
        produceList.Add(enemyUnitsCfg["UnitConfig_legendary_worker_Tower"]);
    }

    // (легендарная) баллиста
    /*legendaryUnitsCFGId.push("UnitConfig_legendary_Balista");
    // делаем стрелы
    var legendary_balista_arrows = 5;
    for (var i = 0; i < legendary_balista_arrows; i++) {
        var arrowId = "BulletConfig_legendary_BallistaArrow_" + i;

        // клонируем обычный снаряд баллисты
        enemyBulletCfg[arrowId] = HordeContent.CloneConfig(HordeContent.GetBulletConfig("#BulletConfig_BallistaArrow"));
        
        // устанавливаем 1 фрагмент
        HordeUtils.setValue(enemyBulletCfg[arrowId].SpecialParams, "FragmentsCount", 1);
        // делаем, чтобы текущая стрела вылетала из следующей
        if (i > 0) {
            HordeUtils.setValue(enemyBulletCfg["BulletConfig_legendary_BallistaArrow_" + (i - 1)].SpecialParams.FragmentBulletConfig, "Uid", enemyBulletCfg[arrowId].Uid);
        }

        //enemyBulletCfg["BulletConfig_legendary_BallistaArrow_1_fragment"] = HordeContent.CloneConfig(HordeContent.GetBulletConfig("#BulletConfig_BallistaArrow_Fragment"));
        //printObjectItems(enemyBulletCfg["BulletConfig_legendary_BallistaArrow_1_fragment"], 2);
        //HordeUtils.setValue(enemyBulletCfg["BulletConfig_legendary_BallistaArrow_1_fragment"], "Archetype", enemyBulletCfg["BulletConfig_legendary_BallistaArrow_1"].Uid);
        
        //HordeUtils.setValue(enemyBulletCfg["BulletConfig_legendary_BallistaArrow_0"].SpecialParams, "FragmentsFlyRadius", 8);
        //HordeUtils.setValue(enemyBulletCfg["BulletConfig_legendary_BallistaArrow_0"].SpecialParams.FragmentCombatParams, "AdditiveBulletSpeed", createPF(5, 5));
        //printObjectItems(enemyBulletCfg["BulletConfig_legendary_BallistaArrow_0"].SpecialParams, 2);
    }
    enemyUnitsCfg["UnitConfig_legendary_Balista"] = HordeContent.CloneConfig(enemyUnitsCfg["UnitConfig_Slavyane_Balista"]);
    // назначаем имя
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_Balista"], "Name", "Легендарная баллиста");
    // меняем цвет
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_Balista"], "TintColor", createHordeColor(255, 255, 100, 100));
    // задаем количество здоровья от числа игроков
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_Balista"], "MaxHealth", Math.floor(300 * Math.sqrt(playersCount)));
    // ставим легендарный снаряд
    HordeUtils.setValue(enemyUnitsCfg["UnitConfig_legendary_Balista"].MainArmament.BulletConfig, "Uid", enemyBulletCfg["BulletConfig_legendary_BallistaArrow_0"].Uid);
    // убираем возможность захвата
    enemyUnitsCfg["UnitConfig_legendary_Balista"].ProfessionParams.Remove(UnitProfession.Capturable);*/
    
    /////////////////////////
    // общие настройки для всех юнитов
    /////////////////////////

    // убираем возможность захвата зданий у всех юнитов
    // нужно убрать
    for (var unitID in enemyUnitsCfg) {
        enemyUnitsCfg[unitID].AllowedCommands.Remove(UnitCommand.Capture);
    }
    
    ////////////////////////////////////////////////////
    // списки легендарных юнитов на карте
    ////////////////////////////////////////////////////

    if (!legendary_swordmen_unitsInfo) {
        legendary_swordmen_unitsInfo = [];
    }
    if (!legendary_raider_unitsInfo) {
        legendary_raider_unitsInfo = [];
    }
    if (!legendary_worker_unitsInfo) {
        legendary_worker_unitsInfo = [];
    }

    //////////////////////////////////////////
    // отбираем ресурсы у игроков
    //////////////////////////////////////////
    
    for (var settlementId = 0; settlementId < 6; settlementId++) {
        if (settlementId == enemySettlementId) {
            continue;
        }
        var settlement = settlements.Item.get('' + settlementId);
        if (playerStartResources == undefined) {
            playerStartResources = settlement.Resources.GetCopy();
        }
        settlement.Resources.TakeResources(settlement.Resources.GetCopy());
    }
}

function ChoiseWave() {
    // номер выбранной волны
    var spawnPlanGeneratorIdx = parseInt(goalCastle.OrdersMind.ActiveOrder.ProductUnitConfig.Shield);
    logi(`Выбран план ${spawnPlanGeneratorIdx}`);

    ////////////////////////////////////////////////////
    // задаем волны спавна
    ////////////////////////////////////////////////////

    spawnPlanGenerators[spawnPlanGeneratorIdx]();

    // считаем сколько будет врагов
    var unitsTotalCount = {};
    for (var plan of spawnPlan) {
        for (var unitInfo of plan.units) {
            if (unitsTotalCount[unitInfo.cfgId] == undefined) {
                unitsTotalCount[unitInfo.cfgId] = 0;
            }
            unitsTotalCount[unitInfo.cfgId] += unitInfo.count;
        }
    }
    for (var unitCfg in unitsTotalCount) {
        logi(unitCfg, " ", unitsTotalCount[unitCfg]);
    }

    timeStart = BattleController.GameTimer.GameFramesCounter;

    // возвращаем назад ресурсы игрокам

    for (var settlementId = 0; settlementId < 6; settlementId++) {
        if (settlementId == enemySettlementId) {
            continue;
        }
        var settlement = scena.GetRealScena().Settlements.Item.get('' + settlementId);
        settlement.Resources.SetResources(playerStartResources);
    }
}

function randomItem (array) {
    var rnd = scena.GetRealScena().Context.Randomizer;
    return array[rnd.RandomNumber(0, array.length - 1)];
};

function initWavePlan_1() {
    broadcastMessage("волны пойдут по плану 1 (1 минута до первой волны)", createHordeColor(255, 255, 50, 10));

    spawnPlan = [];
    spawnPlan.push({
        message: "ВОЛНА 1",
        gameTickNum: 1 * 60 * 50,
        units: [
            { count: 5 * playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 2 * playersCount, cfgId: "UnitConfig_Barbarian_Archer" }
        ]
    }, {
        message: "ВОЛНА 2",
        gameTickNum: 3 * 60 * 50,
        units: [
            { count: 10 * playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 4 * playersCount,  cfgId: "UnitConfig_Barbarian_Archer" }
        ]
    }, {
        message: "ВОЛНА 3",
        gameTickNum: 5 * 60 * 50,
        units: [
            { count: 10 * playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 3 * playersCount,  cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 4 * playersCount,  cfgId: "UnitConfig_Barbarian_Archer" }
        ]
    }, {
        message: "ВОЛНА 4",
        gameTickNum: 8 * 60 * 50,
        units: [
            { count: 15 * playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 5 * playersCount,  cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 3 * playersCount,  cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 2 * playersCount,  cfgId: "UnitConfig_Barbarian_Archer_2" }
        ]
    }, {
        message: "БОСС ВОЛНА 5",
        gameTickNum: 10 * 60 * 50,
        units: [
            { count: 1,                cfgId: randomItem(legendaryUnitsCFGId) },
            { count: 5 * playersCount, cfgId: "UnitConfig_Barbarian_Raider" }
        ]
    }, {
        message: "ВОЛНА 6",
        gameTickNum: 13.5 * 60 * 50,
        units: [
            { count: 20 * playersCount, cfgId: randomItem(["UnitConfig_Barbarian_Swordmen", "UnitConfig_Barbarian_Heavymen", "UnitConfig_Barbarian_Archer", "UnitConfig_Barbarian_Archer_2" ]) }
        ]
    }, {
        message: "ВОЛНА 7",
        gameTickNum: 15 * 60 * 50,
        units: [
            { count: 10 * playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 10 * playersCount, cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 4 * playersCount,  cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 6 * playersCount,  cfgId: "UnitConfig_Barbarian_Archer_2" }
        ]
    }, {
        gameTickNum: 15.3 * 60 * 50,
        units: [
            { count: 5 * playersCount, cfgId: "UnitConfig_Barbarian_Raider" }
        ]
    }, {
        message: "ВОЛНА 8",
        gameTickNum: 18 * 60 * 50,
        units: [
            { count: 25 * playersCount, cfgId: randomItem(["UnitConfig_Barbarian_Swordmen", "UnitConfig_Barbarian_Heavymen", "UnitConfig_Barbarian_Archer", "UnitConfig_Barbarian_Archer_2" ]) }
        ]
    }, {
        gameTickNum: 18.3 * 60 * 50,
        units: [
            { count: 5 * playersCount, cfgId: "UnitConfig_Barbarian_Raider" }
        ]
    }, {
        message: "БОСС ВОЛНА 9",
        gameTickNum: 20 * 60 * 50,
        units: [
            { count: 8 * playersCount, cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: 8 * playersCount, cfgId: "UnitConfig_Slavyane_Balista" }
        ]
    }, {
        message: "ВОЛНА 10",
        gameTickNum: 23 * 60 * 50,
        units: [
            { count: 15 * playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 15 * playersCount, cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 5 * playersCount,  cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 8 * playersCount,  cfgId: "UnitConfig_Barbarian_Archer_2" },
            { count: 2 * playersCount,  cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: 2 * playersCount,  cfgId: "UnitConfig_Slavyane_Balista" }
        ]
    }, {
        gameTickNum: 23.3 * 60 * 50,
        units: [
            { count: 6 * playersCount,          cfgId: "UnitConfig_Barbarian_Raider" },
            { count: 1,                         cfgId: randomItem(legendaryUnitsCFGId) },
            { count: playersCount >= 3 ? 1 : 0, cfgId: randomItem(legendaryUnitsCFGId) },
            { count: playersCount >= 5 ? 1 : 0, cfgId: randomItem(legendaryUnitsCFGId) }
        ]
    }, {
        message: "ВОЛНА 11",
        gameTickNum: 26 * 60 * 50,
        units: [
            { count: 20 * playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 16 * playersCount, cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 8 * playersCount,  cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 10 * playersCount, cfgId: "UnitConfig_Barbarian_Archer_2" },
            { count: Math.round(3 * Math.sqrt(playersCount)), cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: Math.round(3 * Math.sqrt(playersCount)), cfgId: "UnitConfig_Slavyane_Balista" }
        ]
    }, {
        gameTickNum: 26.3 * 60 * 50,
        units: [
            { count: 10 * playersCount,         cfgId: "UnitConfig_Barbarian_Raider" },
            { count: 1,                         cfgId: randomItem(legendaryUnitsCFGId) },
            { count: playersCount >= 3 ? 1 : 0, cfgId: randomItem(legendaryUnitsCFGId) },
            { count: playersCount >= 5 ? 1 : 0, cfgId: randomItem(legendaryUnitsCFGId) }
        ]
    }, {
        message: "БОСС ВОЛНА 12",
        gameTickNum: 30 * 60 * 50,
        units: [
            { count: 3 * playersCount,          cfgId: "UnitConfig_Mage_Mag_2" },
            { count: 1 * playersCount,          cfgId: "UnitConfig_Mage_Villur" },
            { count: 1 * playersCount,          cfgId: "UnitConfig_Mage_Olga" },
            { count: 1,                         cfgId: randomItem(legendaryUnitsCFGId) },
            { count: 1,                         cfgId: randomItem(legendaryUnitsCFGId) },
            { count: playersCount >= 3 ? 1 : 0, cfgId: randomItem(legendaryUnitsCFGId) },
            { count: playersCount >= 5 ? 1 : 0, cfgId: randomItem(legendaryUnitsCFGId) }
        ]
    }, {
        message: "ВОЛНА 13",
        gameTickNum: 32 * 60 * 50,
        units: [
            { count: 20 * playersCount,         cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 20 * playersCount,         cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 10 * playersCount,         cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 10 * playersCount,         cfgId: "UnitConfig_Barbarian_Archer_2" },
            { count: Math.round(3 * Math.sqrt(playersCount)), cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: Math.round(3 * Math.sqrt(playersCount)), cfgId: "UnitConfig_Slavyane_Balista" },
            { count: Math.round(3 * Math.sqrt(playersCount)), cfgId: "UnitConfig_Mage_Mag_2" },
            { count: 1,                         cfgId: randomItem(legendaryUnitsCFGId) },
            { count: playersCount >= 3 ? 1 : 0, cfgId: randomItem(legendaryUnitsCFGId) },
            { count: playersCount >= 5 ? 1 : 0, cfgId: randomItem(legendaryUnitsCFGId) }
        ]
    }, {
        message: "ВОЛНА 14",
        gameTickNum: 34 * 60 * 50,
        units: [
            { count: 25 * playersCount,         cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 25 * playersCount,         cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 12 * playersCount,         cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 12 * playersCount,         cfgId: "UnitConfig_Barbarian_Archer_2" },
            { count: Math.round(3 * Math.sqrt(playersCount)), cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: Math.round(3 * Math.sqrt(playersCount)), cfgId: "UnitConfig_Slavyane_Balista" },
            { count: Math.round(1 * Math.sqrt(playersCount)), cfgId: "UnitConfig_Mage_Mag_2" },
            { count: Math.round(1 * Math.sqrt(playersCount)), cfgId: "UnitConfig_Mage_Villur" },
            { count: Math.round(1 * Math.sqrt(playersCount)), cfgId: "UnitConfig_Mage_Olga" },
            { count: 1,                         cfgId: randomItem(legendaryUnitsCFGId) },
            { count: playersCount >= 3 ? 1 : 0, cfgId: randomItem(legendaryUnitsCFGId) },
            { count: playersCount >= 5 ? 1 : 0, cfgId: randomItem(legendaryUnitsCFGId) }
        ]
    }, {
        message: "ФИНАЛЬНАЯ ВОЛНА 15",
        gameTickNum: 36 * 60 * 50,
        units: [
            { count: 100 * playersCount, cfgId: "UnitConfig_Barbarian_Swordmen" },
            { count: 30 * playersCount,  cfgId: "UnitConfig_Barbarian_Heavymen" },
            { count: 10 * playersCount,  cfgId: "UnitConfig_Barbarian_Archer" },
            { count: 20 * playersCount,  cfgId: "UnitConfig_Barbarian_Archer_2" },
            { count: Math.round(6 * Math.sqrt(playersCount)), cfgId: "UnitConfig_Slavyane_Catapult" },
            { count: Math.round(6 * Math.sqrt(playersCount)), cfgId: "UnitConfig_Slavyane_Balista" },
            { count: Math.round(1 * Math.sqrt(playersCount)), cfgId: "UnitConfig_Mage_Mag_2" },
            { count: Math.round(1 * Math.sqrt(playersCount)), cfgId: "UnitConfig_Mage_Villur" },
            { count: Math.round(1 * Math.sqrt(playersCount)), cfgId: "UnitConfig_Mage_Olga" },
            { count: 1,                  cfgId: "UnitConfig_legendary_swordmen" },
            { count: 1,                  cfgId: "UnitConfig_legendary_heavymen" },
            { count: 1,                  cfgId: "UnitConfig_legendary_archer" },
            { count: 1,                  cfgId: "UnitConfig_legendary_archer_2" },
            { count: 1,                  cfgId: "UnitConfig_legendary_Raider" },
            { count: 1,                  cfgId: "UnitConfig_legendary_worker" }
        ]
    }
    );
}

function initWavePlan_2() {
    broadcastMessage("волны пойдут по плану 2 (3 минут до первой волны)", createHordeColor(255, 255, 50, 10));
    
    spawnPlan = [];
    var gameStartTick;

    gameStartTick = 3 * 60 * 50;
    for (var gameTick = gameStartTick; gameTick < timeEnd; gameTick += 30 * 50) {
        var spawnCount = Math.round(playersCount * 12 * (timeEnd - gameTick) / (timeEnd - gameStartTick));
        spawnPlan.push({
            gameTickNum: gameTick,
            units: [{
                count: spawnCount, cfgId: "UnitConfig_Barbarian_Swordmen"
            }]
        });
    }

    gameStartTick = 7 * 60 * 50 + 10 * 50;
    for (var gameTick = gameStartTick; gameTick < timeEnd; gameTick += 30 * 50) {
        var spawnCount = Math.round(playersCount * (2 + 6 * (timeEnd - gameTick) / (timeEnd - gameStartTick)));
        spawnPlan.push({
            gameTickNum: gameTick,
            units: [{
                count: spawnCount, cfgId: "UnitConfig_Barbarian_Archer"
            }]
        });
    }

    gameStartTick = 10 * 60 * 50 + 20 * 50;
    for (var gameTick = gameStartTick; gameTick < timeEnd; gameTick += 30 * 50) {
        var spawnCount = Math.round(playersCount * (3 + 10 * (gameTick - gameStartTick) / (timeEnd - gameStartTick)));
        spawnPlan.push({
            gameTickNum: gameTick,
            units: [{
                count: spawnCount, cfgId: "UnitConfig_Barbarian_Heavymen"
            }]
        });
    }

    gameStartTick = 14 * 60 * 50 + 55 * 50;
    for (var gameTick = gameStartTick; gameTick < timeEnd; gameTick += 30 * 50) {
        var spawnCount = Math.round(playersCount * (2 + 5 * (gameTick - gameStartTick) / (timeEnd - gameStartTick)));
        spawnPlan.push({
            gameTickNum: gameTick,
            units: [{
                count: spawnCount, cfgId: "UnitConfig_Barbarian_Archer_2"
            }]
        });
    }

    gameStartTick = 16 * 60 * 50 + 20 * 50;
    for (var gameTick = gameStartTick; gameTick < timeEnd; gameTick += 45 * 50) {
        var spawnCount = playersCount;
        spawnPlan.push({
            gameTickNum: gameTick,
            units: [{
                count: spawnCount, cfgId: "UnitConfig_Barbarian_Raider"
            }]
        });
    }

    gameStartTick = 18 * 60 * 50 + 35 * 50;
    for (var gameTick = gameStartTick; gameTick < timeEnd; gameTick += 45 * 50) {
        var spawnCoeff = Math.round(1 * Math.sqrt(playersCount));
        var spawnCount = Math.round(spawnCoeff * (1 + 1 * (timeEnd - gameStartTick) / (timeEnd - gameStartTick)));
        spawnPlan.push({
            gameTickNum: gameTick,
            units: [{
                count: spawnCount, cfgId: "UnitConfig_Slavyane_Catapult"
            }]
        });
    }

    gameStartTick = 19 * 60 * 50 + 5 * 50;
    for (var gameTick = gameStartTick; gameTick < timeEnd; gameTick += 45 * 50) {
        var spawnCoeff = Math.round(1 * Math.sqrt(playersCount));
        var spawnCount = Math.round(spawnCoeff * (1 + 1 * (timeEnd - gameStartTick) / (timeEnd - gameStartTick)));
        spawnPlan.push({
            gameTickNum: gameTick,
            units: [{
                count: spawnCount, cfgId: "UnitConfig_Slavyane_Balista"
            }]
        });
    }

    gameStartTick = 25 * 60 * 50 + 15 * 50;
    for (var gameTick = gameStartTick; gameTick < timeEnd; gameTick += 50 * 50) {
        var spawnCount = Math.round(1 * Math.sqrt(playersCount));
        spawnPlan.push({
            gameTickNum: gameTick,
            units: [{
                count: spawnCount, cfgId: "UnitConfig_Mage_Mag_2"
            }]
        });
    }

    gameStartTick = 30 * 60 * 50;
    for (var gameTick = gameStartTick; gameTick < timeEnd; gameTick += 60 * 50) {
        var spawnCount = 0;
        if (playersCount >= 4) {
            spawnCount = 1;
        }
        spawnPlan.push({
            gameTickNum: gameTick,
            units: [{
                count: spawnCount, cfgId: "UnitConfig_Mage_Villur"
            }]
        });
    }

    gameStartTick = 35 * 60 * 50 + 30 * 50;
    for (var gameTick = gameStartTick; gameTick < timeEnd; gameTick += 120 * 50) {
        var spawnCount = 1;
        spawnPlan.push({
            gameTickNum: gameTick,
            units: [{
                count: spawnCount, cfgId: "UnitConfig_Mage_Olga"
            }]
        });
    }

    gameStartTick = 14 * 60 * 50;
    for (var gameTick = gameStartTick; gameTick < timeEnd; gameTick += 150 * 50) {
        var spawnCount = 1;
        if (playersCount >= 5) {
            spawnCount = 3;
        } else if (playersCount >= 3) {
            spawnCount = 2;
        }

        spawnPlan.push({
            gameTickNum: gameTick,
            units: []
        });
        for (var i = 0; i < spawnCount; i++) {
            spawnPlan[spawnPlan.length - 1].units.push({count: 1, cfgId: randomItem(legendaryUnitsCFGId)});
        }
    }

    // сортируем в порядке тиков
    spawnPlan.sort((a, b) => a.gameTickNum > b.gameTickNum ? 1 : -1);
}

function initWavePlan_3() {
    broadcastMessage("волны пойдут по плану 3 (1 минута до первой волны)", createHordeColor(255, 255, 50, 10));
    
    spawnPlan = [];
    var gameStartTick;

    gameStartTick = 1 * 60 * 50;
    var spawnCount = 5;
    for (var gameTick = gameStartTick; gameTick < timeEnd; gameTick += 15 * 50) {
        spawnPlan.push({
            gameTickNum: gameTick,
            units: [{
                count: Math.round(playersCount*spawnCount), cfgId: "UnitConfig_Barbarian_Swordmen"
            }]
        });
        spawnCount *= 1.05;
    }

    // сортируем в порядке тиков
    spawnPlan.sort((a, b) => a.gameTickNum > b.gameTickNum ? 1 : -1);
}

function initWavePlan_4() {
    broadcastMessage("волны пойдут по плану 4 (3 минуты до первой волны).", createHordeColor(255, 255, 50, 10));
    
    spawnPlan = [];
    var gameStartTick;

    // делаем легендарных юнитов слабее
    for (var legendaryCFGId of legendaryUnitsCFGId) {
        HordeUtils.setValue(enemyUnitsCfg[legendaryCFGId], "MaxHealth", Math.max(40, Math.round(enemyUnitsCfg[legendaryCFGId].MaxHealth * 0.1)));
    }
    // урезаем легендарного рыцаря
    var cloneDepth = 0;
    while (enemyUnitsCfg["UnitConfig_legendary_swordmen_" + cloneDepth]) {
        delete enemyUnitsCfg["UnitConfig_legendary_swordmen_" + cloneDepth];
        cloneDepth++;
    }
    // создаем конфиги для клонов
    var swordmenClonesDepth = 2;
    for (var i = 0; i < swordmenClonesDepth; i++) {
        var uid = "UnitConfig_legendary_swordmen_" + i;

        // копируем базового рыцаря
        enemyUnitsCfg[uid] = HordeContent.CloneConfig(enemyUnitsCfg["UnitConfig_legendary_swordmen"]);
        // задаем количество здоровья
        HordeUtils.setValue(enemyUnitsCfg[uid], "MaxHealth", Math.ceil(enemyUnitsCfg["UnitConfig_legendary_swordmen"].MaxHealth / Math.pow(2, i + 1)));
        // задаем цвет
        HordeUtils.setValue(enemyUnitsCfg[uid], "TintColor", createHordeColor(255, 255, Math.floor(255 * (i + 1) / swordmenClonesDepth), Math.floor(255 * (i + 1) / swordmenClonesDepth)));
    }

    gameStartTick  = 3 * 60 * 50;
    for (var gameTick = gameStartTick, waveNum = 1, spawnCoeff = 2; gameTick < timeEnd; gameTick += 120 * 50, waveNum++, spawnCoeff *= 1.2) {
        var spawnCount = Math.round(playersCount * spawnCoeff);

        spawnPlan.push({
            message: "ВОЛНА " + waveNum,
            gameTickNum: gameTick,
            units: []
        });
        for (var i = 0; i < spawnCount; i++) {
            spawnPlan[spawnPlan.length - 1].units.push({count: 1, cfgId: randomItem(legendaryUnitsCFGId)});
        }
    }

    // сортируем в порядке тиков
    spawnPlan.sort((a, b) => a.gameTickNum > b.gameTickNum ? 1 : -1);
}

function initWavePlan_test() {
    spawnPlan = [];
    spawnPlan.push({
        message: "ТЕСТОВАЯ ВОЛНА",
        gameTickNum: 1 * 60 * 50,
        units: [
            { count: 30 * playersCount, cfgId: "UnitConfig_legendary_Raider" }
        ]
    });
}

} // namespace
