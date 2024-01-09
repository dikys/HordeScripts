

/**
 * Этот блок выполняется только при первом запуске скрипт-машины.
 * При каждом запуске сцены создаётся новая скрипт-машина и выполняется этот код.
 * Здесь следует выполнять инициализацию глобальных переменных.
 */
if (globalStorage === undefined) {
    let globalStorage : { [name: string]: any } = {};
}


/**
 * Вызывается при первом запуске скрипта, а так же при hot-reload
 */
function onFirstRun() {
    // Setup globals
    globalStorage.reloadCounter = ++globalStorage.reloadCounter || 1;
    globalStorage.scriptWorkTicks = 0;
    logi("Playground running... (Start number:", globalStorage.reloadCounter, ")");
    
    // Примеры. Нужно настроить, см. файл "examples.ts"
    runExamples();

    // Запускаем скрипты сцены
    scenaScriptsFirstRun();
}


/**
 * Вызывается каждый игровой такт
 */
function everyTick(gameTickNum: number) {
    // Update globals
    globalStorage.scriptWorkTicks += 1;
    globalStorage.gameTickNum = gameTickNum;
    
    // Any works
    if (globalStorage.scriptWorkTicks % 1000 == 0) {
        // logi(`TypeScript working now! Script running along ${globalStorage.scriptWorkTicks} game ticks!`);
    }

    // Any works every N game ticks
    if (gameTickNum % 100 == 0) {
        // logi(`Now is ${gameTickNum} game tick!`);
    }

    // Примеры. Нужно настроить, см. файл "examples.ts"
    runEveryTickExamples();

    // Запускаем скрипты сцены
    scenaScriptsEveryTick(gameTickNum);
}

