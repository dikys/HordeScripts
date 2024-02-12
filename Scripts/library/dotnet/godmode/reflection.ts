
var BindingFlags = xHost.type("System.Reflection.BindingFlags");
var Activator = xHost.type("System.Activator");


/**
 * Складывает массив BinbingFlags в один флаг.
 */
function makeBindingFlags(flagsArray) {
	return makeFlags(BindingFlags, flagsArray);
}

/**
 * Возвращает имя с неймспейсом для указанного хост-типа.
 */
function getTypeNameWithNamespace(hostType) {
	var csType = host.typeOf(hostType);
	var name = csType.Name;
	if (csType.Namespace) {
		name = csType.Namespace + '.' + name;
	}
	return name;
}

/**
 * Возвращает полное имя указанного хост-типа.
 */
function getTypeFullName(hostType) {
	var csType = host.typeOf(hostType);
	return csType.FullName;
}
