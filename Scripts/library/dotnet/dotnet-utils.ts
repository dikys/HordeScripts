

// ===================================================
// --- Any

/**
 * Складывает массив enum-флагов в один флаг.
 * Функция нужна из-за того, что здесь в js не получается использовать перегруженный оператор "|".
 */
function makeFlags(flagsType, flagsArray) {
	var flags = 0;

	for(var f of flagsArray) {
		flags += xHost.cast(Int32, f);
	}

	return xHost.cast(flagsType, flags);
}


// ===================================================
// --- Enumerations

/**
 * Делает IEnumerable перечислимым в JS.
 * 
 * Пример:
 * ```
 * var settlements = enumerate(scena.GetRealScena().Settlements);
 * while ((settlement = eNext(settlements)) !== undefined) {
 *     // do somthing with settlement
 * }
 * ```
 */
function* enumerate(enumerable) {
    var IEnumeratorT = xHost.type('System.Collections.IEnumerator');
    var enumerator = xHost.cast(IEnumeratorT, enumerable.GetEnumerator());
    while (enumerator.MoveNext()) {
        yield enumerator.Current;
    }
    
    var IDisposableT = xHost.type('System.IDisposable');
    xHost.cast(IDisposableT, enumerator).Dispose();
}
function eNext(enumerated) {
    var next = enumerated.next();
    if (next.done)
        return undefined;
    return next.value;
}
