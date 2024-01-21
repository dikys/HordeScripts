

/**
 * Пример итерирования текущих снарядов на сцене.
 * Может пригодиться для кастомной обработки снарядов.
 * 
 * Тут жесткая рефлексия, т.к. идет работа с обобщенными типами, наследованием и private-полями.
 */
function example_iterateBullets() {
    if (example_iterateBullets_RunFlag === undefined) {
        logi('> Запущен пример', '"' + arguments.callee.name + '"');
    } else if (example_iterateBullets_RunFlag == false) {
        return;
    }
    example_iterateBullets_RunFlag = true;

    // Реестр снарядов на сцене
    var realScena = scena.GetRealScena();
    var bulletsRegistry = realScena.Bullets;
    
    if (!example_bulletsIdProvider) {
        logi('  Реестр снарядов:', bulletsRegistry.ToString());

        // Магия рефлексии для получения доступа к IdProvider 
        var BaseBulletT = HordeUtils.GetTypeByName("HordeClassLibrary.World.Objects.Bullets.BaseBullet, HordeClassLibrary");
        var ScenaObjectsRegistryT = HordeUtils.GetTypeByName("HordeClassLibrary.World.ScenaComponents.Intrinsics.ScenaObjectsRegistry`1").MakeGenericType(BaseBulletT);
        var propIdProvider = ScenaObjectsRegistryT.GetProperty("IdProvider", makeBindingFlags([BindingFlags.Instance, BindingFlags.Public, BindingFlags.NonPublic]));
        example_bulletsIdProvider = propIdProvider.GetValue(bulletsRegistry);
        logi('  Bullets IdProvider:', example_bulletsIdProvider.ToString());
    }

    // Следующий ID снаряда
    var currentNextId = HordeUtils.getValue(example_bulletsIdProvider, "TotalIds");

    // Итерируем новые снаряды на сцене
    var bullVar = host.newVar(BaseBullet);
    for (var i = example_lastNextBulletId; i < currentNextId; i++) {
        if(!bulletsRegistry.TryGet(i, bullVar.out))
            continue;
        var bull = bullVar.value;
        logi('  - Новый снаряд:', '[' + bull.State.ToString() + ']', bull.ToString());

        // Внимание! Здесь будут только те снаряды, которые имеются на сцене в данный момент.
        // Т.е. здесь не найти снаряды, которые уже завершили своё движение.
    }

    // Запоминаем на каком снаряде остановились в этот раз
    example_lastNextBulletId = currentNextId;
}
var example_bulletsIdProvider;
var example_lastNextBulletId = 0;
var example_iterateBullets_RunFlag;  // Флаг для отключения повторяющихся логов
example_iterateBullets_RunFlag = undefined;
