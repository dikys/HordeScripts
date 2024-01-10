

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
