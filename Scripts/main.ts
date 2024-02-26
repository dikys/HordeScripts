import "/library/dotnet/dotnet-utils.ts"
import { logi } from "library/common/logging";
import * as examples from "./examples/_examples-runner";
import * as plugins from "./plugins/_plugins-runner";

/**
 * Этот блок выполняется только при первом запуске скрипт-машины, т.е. только один раз сразу после загрузки сцены.
 * Здесь следует выполнять инициализацию глобальных переменных, которые НЕ будут очищаться при HotReload.
 */
if (DataStorage.initialized === undefined) {

    DataStorage.plugins = {};
    DataStorage.reloadCounter = 0;
    DataStorage.initialized = true;
}


/**
 * Вызывается при первом запуске скрипта, а так же при hot-reload
 */
export function onFirstRun() {
    // Setup globals
    DataStorage.reloadCounter = ++DataStorage.reloadCounter || 1;
    DataStorage.scriptWorkTicks = 0;
    logi("Playground running... (Start number:", DataStorage.reloadCounter, ")");

    // Установка дебаг-параметров
    ScriptMachineDebugApi.SetHotReloadOnFileChanging(false);  // автоматическая перезагрузка скрипта при изменении файла
    
    // Инициализация плагинов
    plugins.initializePlugins();
    examples.registerExamples();  // Настройка запускаемых примеров находится в файле "_examples-runner.ts"

    // Запук плагинов
    plugins.pluginsFirstRun();
}


/**
 * Вызывается каждый игровой такт
 */
export function onEveryTick(gameTickNum: number) {
    // Update globals
    DataStorage.scriptWorkTicks += 1;
    DataStorage.gameTickNum = gameTickNum;

    // Запук плагинов
    plugins.pluginsEveryTick(gameTickNum);
}

