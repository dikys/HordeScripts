import { logi } from "library/common/logging";
import { AttentionOnSurfacePlugin } from "./attention-on-surface";

// ===================================================
// --- Service

/**
 * Инициализцаия
 */
export function initializePlugins() {
    // Объект для управления плагинами
    hordePlugins = new HordePluginsManager();

    // Регистрируем плагины
    hordePlugins.registerPlugin(new AttentionOnSurfacePlugin());
}

/**
 * Регистрация плагина
 */
export function registerPlugin(plugin: HordePluginBase) {
    hordePlugins.registerPlugin(plugin);
}

// ===================================================
// --- Work

/**
 * Вызывается при первом запуске скрипт-машины, а так же при hot-reload
 */
export function pluginsFirstRun() {
    hordePlugins.onFirstRun();
}

/**
 * Вызывается каждый игровой такт
 */
export function pluginsEveryTick(gameTickNum: number) {
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
        logi(`Plugin registered: "${plugin.displayName}"`);
    }

    public onFirstRun() {
        for (let plugin of this._plugins) {
            plugin.onFirstRun();
        }
    }

    public onEveryTick(gameTickNum: number) {
        for (let plugin of this._plugins) {
            plugin.onEveryTick(gameTickNum);
        }
    }
}

/**
 * Объект для работы с плагинами.
 */
let hordePlugins: HordePluginsManager;
