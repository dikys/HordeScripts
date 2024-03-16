import HordePluginBase from "plugins/base-plugin";


/**
 * Плагин для планируемых изменений.
 */
export class FutureModPlugin extends HordePluginBase {

    /**
     * Конструктор.
     */
    public constructor() {
        super("Test environment");
    }

    /**
     * Метод вызывается при загрузке сцены и после hot-reload.
     */
    public onFirstRun() {
        // Empty
    }

    /**
     * Метод выполняется каждый игровой такт.
     */
    public onEveryTick(gameTickNum: number) {
        // Empty
    }
}

