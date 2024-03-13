
export const BindingFlags = xHost.type("System.Reflection.BindingFlags");
export const Activator = xHost.type("System.Activator");


/**
 * Возвращает имя с неймспейсом для указанного хост-типа.
 */
export function getTypeNameWithNamespace(hostType) {
	let csType = host.typeOf(hostType);
	let name = csType.Name;
	if (csType.Namespace) {
		name = csType.Namespace + '.' + name;
	}
	return name;
}

/**
 * Возвращает полное имя указанного хост-типа.
 */
export function getTypeFullName(hostType) {
	let csType = host.typeOf(hostType);
	return csType.FullName;
}
