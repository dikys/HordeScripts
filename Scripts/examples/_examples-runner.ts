import { registerPlugin } from "plugins/_plugins-runner";
import { Example_IterateBullets } from "./bullet-iterate";
import { Example_SpawnOneBullet } from "./bullet-spawn-one";
import { Example_SpawnBulletsRain } from "./bullet-spawn-rain";
import { Example_ConfigCreation, Example_ConfigRemoving, Example_ConfigWorks } from "./config-examples";
import { Example_InputHiLevel } from "./mastermind-input-hi-level";
import { Example_InputLowLevel } from "./mastermind-input-low-level";
import { Example_MasterMindRequest } from "./mastermind-request";
import { Example_HookReceivedChatMessages, Example_HookSentChatMessages, Example_SendMessageToAll } from "./message-examples";
import { Example_GameWorks, Example_ImportDotNetTypes, Example_Introspection } from "./other-examples";
import { Example_PlayerWorks } from "./player-examples";
import { Example_ScenaWorks } from "./scena-examples";
import { Example_SettlementWorks, Example_SettlementResources, Example_SettlementResources_2, Example_SettlementUnitsInfo } from "./settlement-examples";
import { Example_UnitEnumerateEvents, Example_UnitOrders, Example_UnitWorks } from "./unit-examples";
import { Example_GetUnitsInArea_Bruteforce, Example_GetUnitsInArea_KdTree, Example_GetUnitsInArea_Squad } from "./unit-get-in-area";
import { Example_SpawnUnit } from "./unit-spawn-example";
import { Example_CustomBullet } from "./custom-bullet-example";
import { Example_CustomUnit } from "./custom-unit-example";

/**
 * Регистрация примеров для запуска.
 * Нужно раскомментировать вызовы функций с примерами, которые следует запустить.
 */
export function registerExamples() {

    // // - Примеры из файла 'other-examples.ts'
    // registerPlugin(new Example_GameWorks());
    // registerPlugin(new Example_Introspection());
    // registerPlugin(new Example_ImportDotNetTypes());

    // // - Примеры работы данными игрока
    // registerPlugin(new Example_PlayerWorks());

    // // - Примеры работы с игровой логикой
    // registerPlugin(new Example_IterateBullets());  // В этом примере выполняется перечисление новых снарядов на сцене
    // registerPlugin(new Example_SpawnOneBullet());
    // registerPlugin(new Example_SpawnBulletsRain());
    // registerPlugin(new Example_SpawnUnit());
    // registerPlugin(new Example_UnitWorks());
    // registerPlugin(new Example_UnitOrders());
    // registerPlugin(new Example_UnitEnumerateEvents());  // В этом примере выполняется перечисление событий произошедших с тестовым юнитом
    // registerPlugin(new Example_ScenaWorks());
    // registerPlugin(new Example_SettlementWorks());
    // registerPlugin(new Example_SettlementResources());
    // registerPlugin(new Example_SettlementResources_2());
    // registerPlugin(new Example_SettlementUnitsInfo());

    // // - Примеры перечисления юнитов в области
    // registerPlugin(new Example_GetUnitsInArea_Bruteforce());
    // registerPlugin(new Example_GetUnitsInArea_Squad());
    // registerPlugin(new Example_GetUnitsInArea_KdTree());

    // // - Примеры по MasterMind
    // registerPlugin(new Example_InputLowLevel());
    // registerPlugin(new Example_InputHiLevel());
    // registerPlugin(new Example_MasterMindRequest());

    // // - Примеры работы с конфигами
    // registerPlugin(new Example_ConfigWorks());
    // registerPlugin(new Example_ConfigCreation());
    // registerPlugin(new Example_ConfigRemoving());

    // // - Примеры работы с сообщениями
    // registerPlugin(new Example_SendMessageToAll());
    // registerPlugin(new Example_HookSentChatMessages());
    // registerPlugin(new Example_HookReceivedChatMessages());

    // // - Примеры кастомных объектов
    // registerPlugin(new Example_CustomBullet());
    // registerPlugin(new Example_CustomUnit());
}
