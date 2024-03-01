import { Int32 } from "./dotnet-types";


// ===================================================
// --- Flags

/**
 * Складывает массив enum-флагов в один флаг.
 * Функция нужна из-за того, что здесь в js не получается использовать перегруженный оператор "|".
 * 
 * @param flagsType тип флага. Задаётся отдельно, т.к. нельзя использовать "GetType()" без GodMode.
 * @param flags массив флагов, которые нужно объединить
 */
export function mergeFlags(flagsType, ...flagsArray: any[]) {
	let flags = 0;

	for(let f of flagsArray) {
		flags |= host.cast(Int32, f);
	}

	return host.cast(flagsType, flags);
}


// ===================================================
// --- Enumerations

/**
 * ForEach - специальная функция для перечисления .Net-объектов.
 * 
 * Примеры:
```
ForEach(someList, item => {
    log.info('-', item.ToString());
});

ForEach(someList, (item, i, source) => {
    log.info('#' + i, item.ToString(), 'from', source);
});
```
 */
globalThis.ForEach = ScriptExtensions.ForEach;

/**
 * Преобразует JS-массив в .Net-массив заданного типа.
 */
export function createArray(type, items) {
	let array = host.newArr(type, items.length);
	for (let i = 0; i < items.length; i++) {
		array[i] = items[i];
	}
	return array;
}
