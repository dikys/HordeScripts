/**
 * тип для сцен
 */
type ScenaScriptsInfo = {
    name: string;
    onFirstRun:  () => void;
    onEveryTick: (gameTickNum: number) => void;
};

/**
 * класс для регистрации скриптов сцены
 */
class ScenaScripts {
    private _isScenaScriptsRegistered : boolean;
    private _currentScenaScripts      : ScenaScriptsInfo;

    public constructor() {
        this._isScenaScriptsRegistered = false;
        logi("Запущена сцена: ", scena.GetRealScena().ScenaName);
    }

    // зарегистрировать сцену
    public registerScena(scenaScripts : ScenaScriptsInfo) {
        var scenaName = scena.GetRealScena().ScenaName;
        if (scenaName == scenaScripts.name) {
            this._currentScenaScripts      = scenaScripts;
            this._isScenaScriptsRegistered = true;
            logi("Скрипты для сцены успешно зарегистрированы!");
        }
    }

    public onFirstRun() {
        if (this._isScenaScriptsRegistered) {
            this._currentScenaScripts.onFirstRun();
        }
    }

    public onEveryTick(gameTickNum: number) {
        if (this._isScenaScriptsRegistered) {
            this._currentScenaScripts.onEveryTick(gameTickNum);
        }
    }
}

/**
 * объект для работы со сценами 
 */
var scenaScripts : ScenaScripts;

/**
 * Вызывается при первом запуске скрипта, а так же при hot-reload
 */
function scenaScriptsFirstRun() {
    scenaScripts = new ScenaScripts();

    // регистрируем сцены
    scenaScripts.registerScena({name: "1-5 - Оборона от ИИ", onFirstRun: mapdefens_onFirstRun, onEveryTick: mapdefens_everyTick});

    // запускаем текущую сцену
    scenaScripts.onFirstRun();
}

/**
 * Вызывается каждый игровой такт
 */
function scenaScriptsEveryTick(gameTickNum: number) {
    scenaScripts.onEveryTick(gameTickNum);
}
