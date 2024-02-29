import { logi, logw, loge, logDbg } from "library/common/logging";

/**
 * Базовый класс для плагина.
 */
export default class HordePluginBase {
    
    // --- Fields -----------------------------------------------

    public name: string;
    public displayName: string;
    protected globalStorage: any;  // Хранилище переменных, которое не обнуляется при hot reload

    // --- Initialization -----------------------------------------------

    public constructor(displayName: string) {
        this.displayName = displayName;
        this.name = this.constructor.name;

        this.globalStorage = this._getOrCreateStorage();
    }

    // --- Virtual Methods -----------------------------------------------

    public onFirstRun() {

    }

    public onEveryTick(gameTickNum: number) {

    }

    // --- Storage -----------------------------------------------

    private _getOrCreateStorage() {
        if (DataStorage.plugins[this.name] === undefined) {
            DataStorage.plugins[this.name] = {};
        }
        return DataStorage.plugins[this.name];
    }

    // --- Logging -----------------------------------------------

    protected logi(...vars: any[]){
        logi(`[${this.name}]`, ...vars)
    }
    
    protected logw(...vars: any[]){
        logw(`[${this.name}]`, ...vars)
    }
    
    protected loge(...vars: any[]){
        loge(`[${this.name}]`, ...vars)
    }
    
    protected logExc(ex){
        loge(`[${this.name}]`, ex)
    }
    
    protected logDbg(...vars: any[]){
        logDbg(`[${this.name}]`, ...vars)
    }
}


/**
 * Заготовка для создания плагина.
 */
export class PLUGIN_TEMPLATE extends HordePluginBase {

    /**
     * Конструктор.
     */
    public constructor() {
        super("__PLUGIN_NAME__");
    }

    /**
     * Метод вызывается при загрузке сцены и после hot-reload.
     */
    public onFirstRun() {
        
    }

    /**
     * Метод выполняется каждый игровой такт.
     */
    public onEveryTick(gameTickNum: number) {
        
    }
}
