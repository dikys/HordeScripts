
/**
 * Создаёт EventSource для закрытого события, чтобы можно было использовать "connect" для обработки события.
 */
function makePrivateEventSource(targetObject, eventName, eventArgsType) {

	// Получение дескриптора события (EventInfo)
    var bindingFlags = makeBindingFlags([BindingFlags.Public, BindingFlags.NonPublic, BindingFlags.Instance])
    var eventInfo = targetObject.GetType().GetEvent(eventName, bindingFlags);
    // logi('  EventInfo:', eventInfo.ToString());

    // Составление типа для EventSource
    var eventHandlerT = HordeUtils.GetTypeByName('System.EventHandler`1, System.Private.CoreLib');
    var eventSourceT = HordeUtils.GetTypeByName('Microsoft.ClearScript.EventSource`1, ClearScript.Core');
    eventSourceT = eventSourceT.MakeGenericType(eventHandlerT.MakeGenericType(eventArgsType));
    // logi('  EventSource type:', eventSourceT.ToString());

    // Объект JS-движка
    var scriptEngine = getCurrentJsEngine();
    // logi('  ScriptEngine:', scriptEngine.ToString());

    // Создание EventSource-объекта
    var eventSourceCtor = eventSourceT.GetConstructors(makeBindingFlags([BindingFlags.Public, BindingFlags.NonPublic, BindingFlags.Instance]))[0];
    var eventSource = eventSourceCtor.Invoke(createArray(ObjectT, [scriptEngine, targetObject, eventInfo]);
    // logi('  EventSource:', eventSource.ToString());

    return eventSource;
}


// ===================================================
// --- Утилиты

/**
 * Возвращает js-движок этого потока.
 */
function getCurrentJsEngine() {
    var scriptEngineHT = xHost.type(HordeUtils.GetTypeByName("Microsoft.ClearScript.ScriptEngine, ClearScript.Core"));
    var scriptEngine = scriptEngineHT.Current;
    return scriptEngine;
}

/**
 * Преобразует JS-массив в .Net-массив заданного типа.
 */
function createArray(type, items) {
	var array = host.newArr(type, items.length);
	for (var i = 0; i < items.length; i++) {
		array[i] = items[i];
	}
	return array;
}
