
var BindingFlags = xHost.type("System.Reflection.BindingFlags");
var Activator = xHost.type("System.Activator");


/**
 * Складывает массив BinbingFlags в один флаг.
 */
function makeBindingFlags(flagsArray) {
	return makeFlags(BindingFlags, flagsArray);
}

