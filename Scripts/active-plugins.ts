import { logi } from "library/common/logging";
import HordePluginBase from "plugins/base-plugin";
import { AttentionOnSurfacePlugin } from "plugins/attention-on-surface";


/**
 * Инициализация стандартных плагинов.
 */
export function initializeDefaultPlugins() {
    activePlugins.register(new AttentionOnSurfacePlugin());
}


/**
 * Класс для работы с плагинами.
 */
export class HordePluginsCollection {
    private plugins: Array<HordePluginBase>;

    public constructor() {
        this.plugins = [];
    }

    public register(plugin: HordePluginBase) {
        this.plugins.push(plugin);
        logi(`Plugin registered: "${plugin.displayName}"`);
    }

    public onFirstRun() {
        for (let plugin of this.plugins) {
            plugin.onFirstRun();
        }
    }

    public onEveryTick(gameTickNum: number) {
        for (let plugin of this.plugins) {
            plugin.onEveryTick(gameTickNum);
        }
    }
}


/**
 * Объект с активными плагинами.
 */
export const activePlugins: HordePluginsCollection = new HordePluginsCollection();
