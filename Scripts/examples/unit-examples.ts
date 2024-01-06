
/**
 * Пример работы с юнитом
 */
function example_unitWorks() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var unit = getOrCreateTestUnit();
    if (unit == null) {
        logi('  Не удалось создать юнита для этого теста!');
        return;
    }
    logi('  Для этого теста выбран:', unit.ToString());

    // В юните много разных методов (убрать false, чтобы отобразить названия)
    if (false) inspect(unit);

    // Здесь хранятся значения переменных юнита
    var unitDTO = HordeUtils.getValue(unit, "Model");
    logi('  Здоровье юнита:', unitDTO.Health);
    logi('  Направление юнита:', unitDTO.PositionModel.Direction.ToString());

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

    // Проверка что юнит бездействует
    if (ordersMind.IsIdle()) {
        logi('  Юнит бездействует:', unit.ToString());

        // Устанавливаем направление "Вниз"
        unitDTO.PositionModel.Direction = UnitDirection.Down;
    }

    // Проверка что юнит бездействует (другой вариант)
    if (ordersMind.OrdersCount == 0) {
        logi('  Юнит бездействует v2:', unit.ToString());

        // Устанавливаем направление "Вверх"
        unitDTO.PositionModel.Direction = UnitDirection.Down;
    }

    // Отменить приказы юнита кроме текущего
    ordersMind.CancelOrders(false);

    // Отменить все приказы юнита
    ordersMind.CancelOrders(true);

    // Устанавливаем smart-приказ юниту (как при клике правой кнопкой мыши)
    var deactivateNotificationsTime = 600;  // отмена инстинктов на столько тактов
    var targetCell = createPoint(unit.Cell.X, unit.Cell.Y + 1);
    ordersMind.AssignSmartOrder(targetCell, AssignOrderMode.Replace, deactivateNotificationsTime);
    logi('  Юнит получил smart-приказ в', targetCell.ToString());

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
