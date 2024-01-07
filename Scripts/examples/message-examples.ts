
/**
 * Отправка игровых сообщений всем игрокам.
 */
function example_sendMessageToAll() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    var unitsMap = scena.GetRealScena().UnitsMap;
    var unit = unitsMap.GetUpperUnit(5, 5);
    if (unit) {
        var msgColor = createHordeColor(255, 255, 255, 255);
        broadcastMessage("  Обнаружен юнит: " + unit.ToString(), msgColor);
    } else {
        var msgColor = createHordeColor(255, 200, 200, 200);
        broadcastMessage("  Юнит не обнаружен в клетке (5, 5)", msgColor);
    }
}


/**
 * Обработка отправляемых сообщений в чате.
 */
function example_hookSentChatMessages_v1() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    logi('  Внимание! В данный момент этот пример не работает, т.к. событие chatInputLine.MessageSent имеет модификатор internal.');
    logi('  Поэтому этот пример отключен');
    return;

    // Получаем UI-объект строки чата
    var AllUIModules = HordeUtils.GetTypeByName("HordeResurrection.Game.UI.AllUIModules, HordeResurrection.Game");
    var battleUI = ReflectionUtils.GetStaticProperty(AllUIModules, "BattleUI").GetValue(AllUIModules);
    var chatPanel = HordeUtils.getValue(battleUI, "ChatPanel");
    var chatInputLine = HordeUtils.getValue(chatPanel, "ChatInputLine");

    // Удаляем предыдущий обработчик сообщений, если был закреплен
    if (prevChatHook) {
        prevChatHook.disconnect();
    }

    // Устанавливаем обработчик сообщений
    prevChatHook = chatInputLine.MessageSent.connect(function (sender, args) {
        try {
            var senderPlayer = HordeUtils.getValue(args, "InitiatorPlayer");
            var targets = HordeUtils.getValue(args, "Targets");
            var message = HordeUtils.getValue(args, "Message");
            logi(`[${senderPlayer.Nickname} -> ${targets.ToString()}] ${message}`);
        } catch (ex) {
            logExc(ex);
        }
    });

    logi('  Установлен хук на отправку сообщения');
}
var prevChatHook;


/**
 * Обработка отправляемых сообщений в чате.
 * 
 * Тут много магии с рефлексией, т.к. доступ к классам и некоторым полям закрыт
 */
function example_hookSentChatMessages_v2() {

    logi('  Внимание! В данный момент, при выходе из сражения обработчик не удаляется, что приводит к крашу игры.');
    logi('  Поэтому этот пример отключен');
    return;

    // Получаем UI-объект строки чата
    var AllUIModules = HordeUtils.GetTypeByName("HordeResurrection.Game.UI.AllUIModules, HordeResurrection.Game");
    var battleUI = ReflectionUtils.GetStaticProperty(AllUIModules, "BattleUI").GetValue(AllUIModules);
    var chatPanel = HordeUtils.getValue(battleUI, "ChatPanel");
    var chatInputLine = HordeUtils.getValue(chatPanel, "ChatInputLine");

    // Удаляем предыдущий обработчик сообщений, если был закреплен
    if (prevChatHandler) {
        var args = host.newArr(xHost.type('System.Object'), 1);
        args[0] = prevChatHandler;
        HordeUtils.call(chatInputLine, "remove_MessageSent", args);
    }

    // Получение типов для создания обработчика сообщений
    var MessageSentEventArgsClass = HordeUtils.GetTypeByName("HordeResurrection.Game.UI.MultiuseControls.ChatPanel.ChatInputLine+MessageSentEventArgs, HordeResurrection.Game");
    var MessageSentEventArgsType = xHost.type(MessageSentEventArgsClass);
    var EventHandlerType = xHost.type("System.EventHandler", MessageSentEventArgsType);

    // Получение типов для создания обработчика сообщений
    var handler = host.del(EventHandlerType, function (sender, args) {
        try {
            var senderPlayer = HordeUtils.getValue(args, "InitiatorPlayer");
            var targets = HordeUtils.getValue(args, "Targets");
            var message = HordeUtils.getValue(args, "Message");
            logi(`[${senderPlayer.Nickname} -> ${targets.ToString()}] ${message}`);
        } catch (ex) {
            logExc(ex);
        }
    });

    // Установка обработчика сообщений
    var args = host.newArr(xHost.type('System.Object'), 1);
    args[0] = handler;
    HordeUtils.call(chatInputLine, "add_MessageSent", args);

    // Запоминаем текущий обработчик сообщений
    prevChatHandler = handler;

    logi('  Установлен хук на отправку сообщения');
}
var prevChatHandler;


/**
 * Обработка принимаемых сообщений в чате.
 * Работает только в сетевом режиме.
 */
function example_hookReceivedChatMessages() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    // NetworkController - центральный класс сетевого взаимодействия
    var NetworkController = HordeEngine.HordeResurrection.Engine.Logic.Main.NetworkController;
    if (NetworkController.NetWorker == null) {
        logi('  Сетевой режим не активирован. Для этого примера необходимо начать сетевую игру.');
        return;
    }

    // Удаляем предыдущий обработчик сообщений, если был закреплен
    if (prevNetworkChatHook) {
        prevNetworkChatHook.disconnect();
    }

    // Устанавливаем обработчик сообщений
    prevNetworkChatHook = NetworkController.NetWorker.Events.ChatEvents.ChatItemPacketReceived.connect(function (sender, args) {
        try {
            var senderPlayer = HordeEngine.HordeResurrection.Engine.Logic.Main.PlayersController.GetNetElementMainPlayer(HordeUtils.getValue(args, "NetworkElement"));
            var targets = host.cast(HordeEngine.HordeResurrection.Engine.Logic.Battle.Stuff.ChatTargets, HordeUtils.getValue(args, "Targets"));
            var message = HordeUtils.getValue(args, "Message");
            logi(`[${senderPlayer.Nickname} -> ${targets.ToString()}] ${message}`);
        } catch (ex) {
            logExc(ex);
        }
    });

    logi('  Установлен хук на приём сообщения');
}
var prevNetworkChatHook;

