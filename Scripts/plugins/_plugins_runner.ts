
/**
 * Вызывается при первом запуске скрипта, а так же при hot-reload
 */
function pluginsFirstRun() {
    hordePlugins = new HordePluginsManager();

    // Регистрируем плагины
    hordePlugins.registerPlugin(new AttentionSmokePlugin());

    // Запускаем плагины
    hordePlugins.onFirstRun();
}

/**
 * Вызывается каждый игровой такт
 */
function pluginsEveryTick(gameTickNum: number) {
    hordePlugins.onEveryTick(gameTickNum);
}


// ===================================================
// --- Internal

/**
 * Класс для работы с плагинами.
 */
class HordePluginsManager {
    private _plugins : Array<HordePluginBase>;

    public constructor() {
        this._plugins = [];
    }

    public registerPlugin(plugin : HordePluginBase) {
        this._plugins.push(plugin);
    }

    public onFirstRun() {
        for (var plugin of this._plugins) {
            plugin.onFirstRun();
        }
    }

    public onEveryTick(gameTickNum: number) {
        for (var plugin of this._plugins) {
            plugin.onEveryTick(gameTickNum);
        }
    }
}

/**
 * Класс-заготовка для плагина.
 */
class HordePluginBase {
    private name : String;

    public constructor(name: String) {
        this.name = name;
    }

    public onFirstRun() {

    }

    public onEveryTick(gameTickNum: number) {

    }
}

/**
 * Объект для работы с плагинами.
 */
var hordePlugins : HordePluginsManager;
