

/**
 * Пример итерирования текущих снарядов на сцене.
 * Может пригодиться для кастомной обработки снарядов.
 * 
 * Тут жесткая рефлексия, т.к. идет работа с обобщенными типами, наследованием и private-полями.
 */
function example_iterateBullets() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    // Магия для рефлексии
    var BindingFlags = xHost.type("System.Reflection.BindingFlags");
    var Int32 = xHost.type("System.Int32");
    var bindingFlags = xHost.cast(BindingFlags,
        xHost.cast(Int32, BindingFlags.Instance) +
        xHost.cast(Int32, BindingFlags.Public) +
        xHost.cast(Int32, BindingFlags.NonPublic));
    logi('  Флаги для рефлексии:', bindingFlags.ToString());

    // Реестр снарядов на сцене
    var realScena = scena.GetRealScena();
    var bulletsRegistry = realScena.Bullets;
    logi('  Реестр снарядов:', bulletsRegistry.ToString());

    // Магия рефлексии для получения доступа к IdProvider
    var BaseBullet = HordeUtils.GetTypeByName("HordeClassLibrary.World.Objects.Bullets.BaseBullet, HordeClassLibrary");
    var ScenaObjectsRegistry = HordeUtils.GetTypeByName("HordeClassLibrary.World.ScenaComponents.Intrinsics.ScenaObjectsRegistry`1").MakeGenericType(BaseBullet);
    var propIdProvider = ScenaObjectsRegistry.GetProperty("IdProvider", bindingFlags);
    var bulletsIdProvider = propIdProvider.GetValue(bulletsRegistry);
    logi('  Bullets IdProvider:', bulletsIdProvider.ToString());

    // Следующий ID снаряда
    var nextId = HordeUtils.getValue(bulletsIdProvider, "TotalIds");
    logi('  ID для следующего снаряда', nextId);

    if (nextId == 0) {
        logi('  Снаряды ещё не были созданы на этой сцене');
        return;
    }

    // Итерируем последние 5 снарядов на сцене
    var bullVar = host.newVar(xHost.type(BaseBullet));
    for (var i = Math.max(0, nextId - 5); i < nextId; i++) {
        if(!bulletsRegistry.TryGet(i, bullVar.out))
            continue;
        var bull = bullVar.value;
        logi('  -', '[' + bull.State.ToString() + ']', bull.ToString());

        // Внимание! Здесь будут только те снаряды, которые имеются на сцене в данный момент.
        // Т.е. здесь не найти снаряды, которые уже завершили своё движение.
    }
}
