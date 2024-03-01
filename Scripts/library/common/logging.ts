
/**
 * Уровень записей в лог.
 */
export enum LogLevel {
    Debug,
    Info,
    Warning,
    Error
}

/**
 *  Выполняет логгирование.
 */
export class Logger {
    public logLevel: LogLevel = LogLevel.Info;
    public msgPrefix: String = "";

    /**
     * Конструктор.
     */
    public constructor() {
        
    }

    /**
     * Сделать отладочную запись.
     */
    public debug(msg: string, ...vars: any[]) {
        if (this.logLevel > LogLevel.Debug) {
            return;
        }
        this.write(this.prepareMsg("DBG", msg, ...vars));
    }
    
    /**
     * Сделать info-запись.
     */
    public info(msg: string, ...vars: any[]) {
        if (this.logLevel > LogLevel.Info) {
            return;
        }
        this.write(this.prepareMsg("Info", msg, ...vars));
    }
    
    /**
     * Сделать warning-запись.
     */
    public warning(msg: string, ...vars: any[]) {
        if (this.logLevel > LogLevel.Warning) {
            return;
        }
        this.write(this.prepareMsg("WARN", msg, ...vars));
    }
    
    /**
     * Сделать error-запись.
     */
    public error(msg: string, ...vars: any[]) {
        if (this.logLevel > LogLevel.Error) {
            return;
        }
        this.write(this.prepareMsg("ERR", msg, ...vars));
    }
    
    /**
     * Сделать запись об исключении.
     */
    public exception(ex) {
        this.error(ex);
        DebugLogger.WriteLine(ex.stack);
    }

    /**
     * Вызывается при добавлении записи в лог.
     * Можно переопределить, чтобы перенаправить вывод, например, в игровой чат.
     */
    private write(line) {
        DebugLogger.WriteLine(line);
    }

    /**
     * Составляет строку для записи в лог.
     */
    private prepareMsg(level: string, msg: string, ...vars: any[]) {
        if (vars.length > 0)
            msg = msg + ' ' + vars.join(' ');
        return `[JS: ${level}] ${this.msgPrefix}${msg}`;
    }
}

/**
 * Глобальный логгер по умолчанию.
 */
export const log = new Logger();
