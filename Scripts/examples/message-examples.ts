
// ===================================================
// --- Отправка сообщений

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


// ===================================================
// --- Перехват чат-сообщений


/**
 * Обработка отправляемых сообщений в чате.
 * Так же это пример корректной обработки .net-событий.
 */
function example_hookSentChatMessages_v1() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    // Получаем UI-объект строки чата
    var AllUIModules = HordeUtils.GetTypeByName("HordeResurrection.Game.UI.AllUIModules, HordeResurrection.Game");
    var battleUI = ReflectionUtils.GetStaticProperty(AllUIModules, "BattleUI").GetValue(AllUIModules);
    var chatPanel = HordeUtils.getValue(battleUI, "ChatPanel");
    var chatInputLine = HordeUtils.getValue(chatPanel, "ChatInputLine");

    // Удаляем предыдущий обработчик сообщений, если был закреплен
    if (example_prevChatHook_v1) {
        example_prevChatHook_v1.disconnect();
    }

    // Устанавливаем обработчик сообщений
    example_prevChatHook_v1 = chatInputLine.MessageSent.connect(function (sender, args) {
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
var example_prevChatHook_v1;


/**
 * Обработка отправляемых сообщений в чате.
 * Здесь демонстрируется способ с использованием темной магии, который позволяет подключиться к internal и private событиям.
 */
function example_hookSentChatMessages_v2() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    // Получаем UI-объект строки чата
    var AllUIModules = HordeUtils.GetTypeByName("HordeResurrection.Game.UI.AllUIModules, HordeResurrection.Game");
    var battleUI = ReflectionUtils.GetStaticProperty(AllUIModules, "BattleUI").GetValue(AllUIModules);
    var chatPanel = HordeUtils.getValue(battleUI, "ChatPanel");
    var chatInputLine = HordeUtils.getValue(chatPanel, "ChatInputLine");

    // Удаляем предыдущий обработчик сообщений, если был закреплен
    if (example_prevChatHook_v2) {
        example_prevChatHook_v2.disconnect();
    }

    // Создаём EventSource-объект для MessageSent-события в internal-классе ChatInputLine
    var sentEventArgsT = HordeUtils.GetTypeByName('HordeResurrection.Game.UI.MultiuseControls.ChatPanel.ChatInputLine+MessageSentEventArgs, HordeResurrection.Game');
    var messageSentEvent = makePrivateEventSource(chatInputLine, "MessageSent", sentEventArgsT);
    logi('  EventSource:', messageSentEvent.ToString());

    // Устанавливаем обработчик сообщений
    example_prevChatHook_v2 = messageSentEvent.connect(function (sender, args) {
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
var example_prevChatHook_v2;


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
    if (example_prevNetworkChatHook) {
        example_prevNetworkChatHook.disconnect();
    }

    // Устанавливаем обработчик сообщений
    example_prevNetworkChatHook = NetworkController.NetWorker.Events.ChatEvents.ChatItemPacketReceived.connect(function (sender, args) {
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
var example_prevNetworkChatHook;

