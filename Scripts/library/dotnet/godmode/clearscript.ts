import { ObjectT } from "../dotnet-types";
import { createArray, mergeFlags } from "../dotnet-utils";
import { BindingFlags } from "./reflection";

/**
 * Создаёт EventSource для закрытого события, чтобы можно было использовать "connect" для обработки события.
 */
export function makePrivateEventSource(targetObject, eventName, eventArgsType) {

	// Получение дескриптора события (EventInfo)
    let bindingFlags = mergeFlags(BindingFlags, BindingFlags.Public, BindingFlags.NonPublic, BindingFlags.Instance)
    let eventInfo = targetObject.GetType().GetEvent(eventName, bindingFlags);
    // logi('  EventInfo:', eventInfo.ToString());

    // Составление типа для EventSource
    let eventHandlerT = HordeUtils.GetTypeByName('System.EventHandler`1, System.Private.CoreLib');
    let eventSourceT = HordeUtils.GetTypeByName('Microsoft.ClearScript.EventSource`1, ClearScript.Core');
    eventSourceT = eventSourceT.MakeGenericType(eventHandlerT.MakeGenericType(eventArgsType));
    // logi('  EventSource type:', eventSourceT.ToString());

    // Объект JS-движка
    let scriptEngine = getCurrentJsEngine();
    // logi('  ScriptEngine:', scriptEngine.ToString());

    // Создание EventSource-объекта
    let eventSourceCtor = eventSourceT.GetConstructors(mergeFlags(BindingFlags, BindingFlags.Public, BindingFlags.NonPublic, BindingFlags.Instance))[0];
    let eventSource = eventSourceCtor.Invoke(createArray(ObjectT, [scriptEngine, targetObject, eventInfo]));
    // logi('  EventSource:', eventSource.ToString());

    return eventSource;
}


/**
 * Возвращает js-движок этого потока.
 */
export function getCurrentJsEngine() {
    let scriptEngineHT = xHost.type(HordeUtils.GetTypeByName("Microsoft.ClearScript.ScriptEngine, ClearScript.Core"));
    let scriptEngine = scriptEngineHT.Current;
    return scriptEngine;
}
