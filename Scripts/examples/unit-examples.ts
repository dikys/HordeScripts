
/**
 * Пример работы с юнитом
 */
function example_unitWorks() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var unit = getOrCreateTestUnit();
    if (unit == null) {
        logi('  Не удалось создать юнита для этого примера!');
        return;
    }
    logi('  Для этого примера выбран:', unit.ToString());

    // В юните много разных методов (убрать false, чтобы отобразить названия)
    if (false) inspect(unit);

    // Здесь хранятся значения переменных юнита
    var unitDTO = HordeUtils.getValue(unit, "Model");
    logi('  Здоровье юнита:', unitDTO.Health);
    logi('  Направление юнита:', unitDTO.PositionModel.Direction.ToString());

    // Устанавливаем направление "Вверх"
    unitDTO.PositionModel.Direction = UnitDirection.Up;
    logi('  Направление юнита после изменения:', unitDTO.PositionModel.Direction.ToString());

    // Боевой отдел:
    var battleMind = unit.BattleMind;

    logi(`  Нанесем 1 ед. урона юниту с типом повреждения "ближний бой"`)
    battleMind.TakeDamage(null, 1, UnitDeathType.Mele);

    // Другие методы в BattleMind:
    //   TakeEffectiveDamage(attacker, dmg, type) - нанесение урона без учета брони
    //   InstantDeath(attacker, type) - уничтожить юнит
    //   CauseDamage(target, dmg, type) - нанесение урона другому юниту
    //   CauseEffectiveDamage(target, dmg, type) - нанесение урона другому юниту без учета брони

    // Отдел приказов
    var ordersMind = unit.OrdersMind;
    // Подробнее см. в отдельном примере

    // Отдел команд
    var commandsMind = unit.CommandsMind;

    //  Словарь с запрещенными командами
    var disallowedCommands = HordeUtils.getValue(commandsMind, "DisallowedCommands");

    // Запретим/разрешим команду атаки
    if (!disallowedCommands.ContainsKey(UnitCommand.Attack)) {
        disallowedCommands.Add(UnitCommand.Attack, 1);  // 1 - это сколько раз команда была запрещена
        logi('  Команда атаки запрещена', disallowedCommands.Item.get(UnitCommand.Attack) ,'раз!');
        // Запрет будет действовать на уровне получения команды.
        // Т.е. непосредственно атаковать юнит все ещё сможет и даже будет получать приказ при автоатаке, но игрок не сможет выдать эту команду.

    } else {
        var n = disallowedCommands.Item.get(UnitCommand.Attack);
        if (n == 1) {
            disallowedCommands.Remove(UnitCommand.Attack);
        } else {
            disallowedCommands.Item.set(UnitCommand.Attack, n - 1);
        }
        logi('  Команда атаки разрешена');
    }

    // Проверим, может ли юнит дойти до клетки?
    var cell = createPoint(55, 10);
    if (unitCheckPathTo(unit, cell)) {
        logi('  Юнит может пройти к', cell.ToString());
    } else {
        logi('  Юнит НЕ может пройти к', cell.ToString());
    }

    // Телепортация юнита (отключено, чтобы не сбивать другие примеры)
    if (false) {
        if (unitTeleport(unit, cell)) {
            logi('  Юнит телепортирован в', cell.ToString());
        } else {
            logi('  Юнит НЕ может быть телепортирован в', cell.ToString());
        }
    }

    // Скорость юнита в клетке
    logi('  Скорость юнита в клетке', cell.ToString(), 'согласно реальной карте:', unitSpeedAtCellByRealMap(unit, cell));

    // Скорость юнита в клетке с учетом тумана войны
    logi('  Скорость юнита в клетке', cell.ToString(), 'согласно известной карте:', unitSpeedAtCellByKnownMap(unit, cell));

    // Можно ли разместить юнита с указанным конфигом в этой клетке?
    // Тут важно, что проверяется без наличия самого юнита
    var riderCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Raider");
    var settlement = unit.Owner;
    logi('  Можно ли поместить юнита', '"' + riderCfg.Name + '"', 'в клетке', cell.ToString(),
         'согласно известной карте:', unitCanBePlacedByKnownMap(riderCfg, settlement, cell.X, cell.Y));

    // Такая же проверка с учетом тумана войны
    logi('  Можно ли поместить юнита', '"' + riderCfg.Name + '"', 'в клетке', cell.ToString(),
         'согласно реальной карте:', unitCanBePlacedByRealMap(riderCfg, cell.X, cell.Y));
}


/**
 * Пример работы с приказами юнита
 */
function example_unitOrders() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var unit = getOrCreateTestUnit();
    if (unit == null) {
        logi('  Не удалось создать юнита для этого примера!');
        return;
    }
    logi('  Для этого примера выбран:', unit.ToString());
    var unitDTO = HordeUtils.getValue(unit, "Model");

    // Отдел приказов
    var ordersMind = unit.OrdersMind;

    // Проверка что юнит бездействует
    logi('  Юнит бездействует? Вариант 1:', ordersMind.IsIdle());
    logi('  Юнит бездействует? Вариант 2:', ordersMind.OrdersCount == 0);

    // Текущий приказ юнита (другой вариант)
    var activeOrder = ordersMind.ActiveOrder;
    logi('  Текущий приказ юнита:', activeOrder.ToString());

    // Отменить приказы юнита кроме текущего
    ordersMind.CancelOrders(false);

    // Отменить все приказы юнита
    ordersMind.CancelOrders(true);

    // Устанавливаем smart-приказ юниту (как при клике правой кнопкой мыши)
    var deactivateNotificationsTime = 600;  // отмена инстинктов на столько тактов
    var targetCell = createPoint(unit.Cell.X, unit.Cell.Y + 1);
    ordersMind.AssignSmartOrder(targetCell, AssignOrderMode.Replace, deactivateNotificationsTime);
    logi('  Юнит получил smart-приказ в', targetCell.ToString());

    // Создание разных команд для приказов
    var oneClickCommandArgs = new OneClickCommandArgs(UnitCommand.StepAway, AssignOrderMode.Queue);
    logi('  Простая команда:', '"' + oneClickCommandArgs.ToString() + '"');
    var pointCommandArgs = new PointCommandArgs(createPoint(10, 10), UnitCommand.Attack, AssignOrderMode.Queue);
    logi('  Команда с целью в клетке:', '"' + pointCommandArgs.ToString()) + '"';
    var produceAtCommandArgs = new ProduceAtCommandArgs(AssignOrderMode.Queue, HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Fence"), createPoint(2, 4), createPoint(3, 7), 1000);
    logi('  Команда строительства в клетке:', '"' + produceAtCommandArgs.ToString() + '"');
    var produceCommandArgs = new ProduceCommandArgs(AssignOrderMode.Queue, HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Worker1"), 1);
    logi('  Команда тренировки:', '"' + produceCommandArgs.ToString() + '"');

    // Выдача приказа согласно команде
    if (unit.Cfg.GetOrderWorker(unit, oneClickCommandArgs)) {
        logi('  Добавлен приказ для команды:', '"' + oneClickCommandArgs.ToString() + '"');
    } else {
        logi('  Не удалось добавить команду');
    }

    // Выдача приказа согласно команде
    if (unit.Cfg.GetOrderWorker(unit, pointCommandArgs)) {
        logi('  Добавлен приказ для команды:', '"' + pointCommandArgs.ToString() + '"');
    } else {
        logi('  Не удалось добавить команду');
    }
}


/**
 * Пример работы с собятиями юнита
 * 
 * Здесь не те события, которые обрабатываются колбеками, а просто данные о том, что что-то случилось.
 */
function example_unitEnumerateEvents() {
    if (example_unitEnumerateEvents_RunFlag === undefined) {
        logi('> Запущен пример', '"' + arguments.callee.name + '"');
    } else if (example_unitEnumerateEvents_RunFlag == false) {
        return;
    }

    var unit = getOrCreateTestUnit();
    if (unit == null) {
        logi('  Не удалось создать юнита для этого примера!');
        logi('  Пример', '"' + arguments.callee.name + '"', 'отключен!');
        example_unitEnumerateEvents_RunFlag = false;
        return;
    } else if (example_unitEnumerateEvents_RunFlag === undefined) {
        logi('  Для этого примера выбран:', unit.ToString());
        example_unitEnumerateEvents_RunFlag = true;
    }

    try {
        // Отдел событий
        var eventsMind = unit.EventsMind;

        // События за последний такт
        var lastFrameEvents = HordeUtils.getValue(eventsMind, "LastFrameEvents");

        // Перечисление событий
        var enumerator = lastFrameEvents.GetEnumerator();
        while(enumerator.MoveNext()) {
            var e = enumerator.Current;
            logi('  #' + BattleController.GameTimer.GameFramesCounter, '-', e.ToString());
            if (unit.Health <=0 && e.AttackerUnit) {
                logi('    Тестовый юнит был убит юнитом:', e.AttackerUnit.ToString());
            }

            // Внимание! Объект события может "жить" от 1 до 2 игровых тактов. Зависит от места проверки событий.
            // Если отсчитывать такты относительно юнита, то объект события (e) живет ровно 1 такт после обработки.

            // Важно! Не следует сохранять "e"-объекты в глобальные переменные, т.к. данные в них будут заменены через 1-2 такта.
            // Это связанно с тем, что для оптимизации используется общий пул "e"-объектов.
            // Если требуется сохранить какие-то данные собятия, то для этого нужно переместить их в отдельную структуру.
        }
        enumerator.Dispose();
    } catch (ex) {
        logExc(ex);
        logi('  Пример', '"' + arguments.callee.name + '"', 'отключен!');
        example_unitEnumerateEvents_RunFlag = false;
    }
}
var example_unitEnumerateEvents_RunFlag;  // Флаг для отключения повторяющихся логов
example_unitEnumerateEvents_RunFlag = undefined;
