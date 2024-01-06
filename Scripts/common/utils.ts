
// ===================================================
// --- ANY

/**
 * Делает IEnumerable перечислимым в JS.
 */
function* enumerate(enumerable) {
    var enumerator = enumerable.GetEnumerator();
    while (enumerator.MoveNext()) {
        yield enumerator.Current;
    }
    enumerator.Dispose();
}
function eNext(enumerated) {
    var next = enumerated.next();
    if (next.done)
        return undefined;
    return next.value;
}

// ===================================================
// --- JSON

/**
 * Это обычный js-сериализатор. Он редко дружит с .Net-объектами.
 */
function toJson(object) {
    return JSON.stringify(object, null, 2);
}


// ===================================================
// --- Logging

function logi(msg: string, ...vars: any[]) {
    DebugLogger.WriteLine(_prepareMsg("Info", msg, ...vars));
}
function logw(msg: string, ...vars: any[]) {
    DebugLogger.WriteLine(_prepareMsg("WARN", msg, ...vars));
}
function loge(msg: string, ...vars: any[]) {
    DebugLogger.WriteLine(_prepareMsg("ERR", msg, ...vars));
}
function logExc(ex) {
    loge(ex);
    DebugLogger.WriteLine(ex.stack);
}
function _prepareMsg(level: string, msg: string, ...vars: any[]) {
    if (vars.length > 0)
        msg = msg + ' ' + vars.join(' ');
    return `[JS: ${level}] ${msg}`;
}


// ===================================================
// --- Introspection

/**
 * Function digs through a Javascript object
 * to display all its properties
 *
 * @param object - a Javascript object to inspect
 * @param maxDepth - inspect recursion depth (здесь не следует задавать слишком большое значение)
 * @param result - a string of properties with datatypes
 *
 * @return result - the concatenated description of all object properties
 *
 * Source: https://stackoverflow.com/questions/5357442/how-to-inspect-javascript-objects/20513467#20513467
 */
function inspectToStr(object, maxDepth, result) {
    if (typeof object != "object")
        return "Invalid object";
    if (typeof result == "undefined")
        result = '';
    if (typeof maxDepth == "undefined")
        maxDepth = 1;

    if (result.length > maxDepth)
        return "[RECURSION TOO DEEP. ABORTING.]";

    var rows = [];
    for (var property in object) {
        var datatype = typeof object[property];

        var tempDescription = result+'"'+property+'"';
        tempDescription += ' ('+datatype+') => ';
        if (datatype == "object")
            tempDescription += 'object: '+inspectToStr(object[property], maxDepth, result+'  ');
        else
            tempDescription += object[property];

        rows.push(tempDescription);
    }

    return rows.join(result+"\n");
}

/**
 * Выводит в лог результат интроспекции.
 */
function inspect(object, msg, maxDepth) {
    msg = msg ?? 'Object introspection result:';
    logi(msg, '\nType:', typeof object, '\n' + inspectToStr(object, maxDepth));
}

/**
 * Выводит в лог элементы из enum.
 */
function inspectEnum(enumType, n=10) {
    for (var i = 0; i < n; i++) {
        logi(i, '-', host.cast(enumType, i).ToString());
    }
}

/**
 * Выводит в лог элементы из enum, который Flag.
 */
function inspectFlagEnum(enumType, n=31) {
    var end = 1 << n >>>0;
    logi('0'.padStart(n, '0'), '-', host.cast(enumType, 0).ToString());
    for (var i = 1; i < end; i = (i << 1 >>>0)) {
        logi(i.toString(2).padStart(n, '0'), '-', host.cast(enumType, i).ToString());
    }
}

/**
 * вывод всех свойств объекта
 */
function printObjectItems(object) {
    for (var prop in object) {
        logi(prop, " = ", object[prop]);
    }
}
