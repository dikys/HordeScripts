
/**
 * Вызывается при первом запуске скрипта, а так же при hot-reload
 */
function pluginsFirstRun() {
    hordePlugins = new HordePluginsManager();

    // Регистрируем плагины
    hordePlugins.registerPlugin(new AttentionOnSurfacePlugin());

    // Плагины для отладки (раскомментировать необходимые)
    // hordePlugins.registerPlugin(new SetResourcesPlugin());

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
    private _plugins: Array<HordePluginBase>;

    public constructor() {
        this._plugins = [];
    }

    public registerPlugin(plugin: HordePluginBase) {
        this._plugins.push(plugin);
        logi('Plugin registered:', plugin.name);
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
    private name: string;

    public constructor(name: string) {
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
var hordePlugins: HordePluginsManager;
