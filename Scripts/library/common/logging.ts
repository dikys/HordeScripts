
export function logi(msg: string, ...vars: any[]) {
    DebugLogger.WriteLine(_prepareMsg("Info", msg, ...vars));
}
export function logw(msg: string, ...vars: any[]) {
    DebugLogger.WriteLine(_prepareMsg("WARN", msg, ...vars));
}
export function loge(msg: string, ...vars: any[]) {
    DebugLogger.WriteLine(_prepareMsg("ERR", msg, ...vars));
}
export function logDbg(msg: string, ...vars: any[]) {
    DebugLogger.WriteLine(_prepareMsg("DBG", msg, ...vars));
}
export function logExc(ex) {
    loge(ex);
    DebugLogger.WriteLine(ex.stack);
}
export function _prepareMsg(level: string, msg: string, ...vars: any[]) {
    if (vars.length > 0)
        msg = msg + ' ' + vars.join(' ');
    return `[JS: ${level}] ${msg}`;
}
