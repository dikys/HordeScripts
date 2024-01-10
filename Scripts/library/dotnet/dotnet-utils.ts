

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
