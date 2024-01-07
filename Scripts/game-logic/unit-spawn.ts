
function test_spawnUnits() {
    var realScena = scena.GetRealScena();
    var settlements = realScena.Settlements;

    var settlement_0 = settlements.Item.get('0');  // Олег
    var archerCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Archer");
    var spawnCounts = 100;
    var dir = UnitDirection.RightDown;

    var spawnedUnits = spawnUnits(settlement_0, archerCfg, spawnCounts, dir, generateRandomPositionInRect2D(0, 0, 176, 22));

    // так можно посмотреть всех юнитов
    //for (var unit of spawnedUnit) {
    //    logi(unit.ToString());
    //}

    // когда при спавне ИД будет даваться сразу, а пока выходим
    return;

    //logi("select spawned units");
    //var spawnedUnitIdx = [];
    //for (var unit of spawnedUnits) {
    //    logi(unit.Id);
    //}
    //inputSelectUnitsById(settlement_0, spawnedUnitIdx);

    //logi("attack by spawn units");
    //inputPointBasedCommand(oleg, createPoint(50, 50), UnitCommand.Attack);
}

/**
 * Генератор позиций вокруг точки по спирале в рамках сцены
 */
function* generatePositionInSpiral(centerX, centerY) {
    var scenaWidth = scena.GetRealScena().Size.Width;
    var scenaHeight = scena.GetRealScena().Size.Height;

    if (0 <= centerX && centerX < scenaWidth &&
        0 <= centerY && centerY < scenaHeight) {
        yield { X: centerX, Y: centerY };
    } else {
        return;
    }

    var x = 0;
    var y = 0;
    var spawnRadius = 1;

    // флаг, что позиции вышли за сцену
    var outside = false;
    while (!outside) {
        outside = true;

        // верхняя часть
        y = centerY - spawnRadius;
        if (y >= 0) {
            outside = false;
            var xStart = Math.max(centerX - spawnRadius, 0);
            var xEnd = Math.min(centerX + spawnRadius, scenaWidth - 1);
            for (x = xStart; x <= xEnd; x++) {
                yield { X: x, Y: y };
            }
        }

        // правая часть
        x = centerX + spawnRadius;
        if (x < scenaWidth) {
            outside = false;
            var yStart = Math.max(centerY - spawnRadius + 1, 0);
            var yEnd = Math.min(centerY + spawnRadius - 1, scenaHeight - 1);
            for (y = yEnd; y >= yStart; y--) {
                yield { X: x, Y: y };
            }
        }

        // нижняя часть
        y = centerY + spawnRadius;
        if (y < scenaHeight) {
            outside = false;
            var xStart = Math.max(centerX - spawnRadius, 0);
            var xEnd = Math.min(centerX + spawnRadius, scenaWidth - 1);
            for (x = xEnd; x >= xStart; x--) {
                yield { X: x, Y: y };
            }
        }

        // левая часть
        x = centerX - spawnRadius;
        if (x >= 0) {
            outside = false;
            var yStart = Math.max(centerY - spawnRadius + 1, 0);
            var yEnd = Math.min(centerY + spawnRadius - 1, scenaHeight - 1);
            for (y = yStart; y <= yEnd; y++) {
                yield { X: x, Y: y };
            }
        }

        spawnRadius++;
    }
    return;
}

/**
 * Генератор рандомных позиций в прямоугольнике в рамках сцены
 */
function* generateRandomPositionInRect2D(rectX, rectY, rectW, rectH) {
    var scenaWidth = scena.GetRealScena().Size.Width;
    var scenaHeight = scena.GetRealScena().Size.Height;
    // Рандомизатор
    var rnd = scena.GetRealScena().Context.Randomizer;

    rectX = Math.max(0, rectX);
    rectY = Math.max(0, rectY);
    rectW = Math.min(scenaWidth - rectX, rectW);
    rectH = Math.min(scenaHeight - rectY, rectH);

    var randomNumbers = [];
    for (var x = rectX; x < rectX + rectW; x++) {
        for (var y = rectY; y < rectY + rectH; y++) {
            randomNumbers.push({ X: x, Y: y });
        }
    }

    while (randomNumbers.length > 0) {
        var num = rnd.RandomNumber(0, randomNumbers.length - 1);
        var randomNumber = randomNumbers[num];
        randomNumbers.splice(num, 1);
        yield randomNumber;
    }

    return;
}

/**
 * Создание uCount (может быть создано меньше, поскольку генератор конечный) юнитов согласно переданному generator - генератору позиций
 *
 * Возвращает список созданных юнитов.
 */
function spawnUnits(settlement, uCfg, uCount, direction, generator) {
    var csType = HordeUtils.GetTypeByName("HordeClassLibrary.World.Objects.Units.SpawnUnitParameters");
    var spawnParams = HordeUtils.CreateInstance(csType);
    HordeUtils.setValue(spawnParams, "ProductUnitConfig", uCfg);
    HordeUtils.setValue(spawnParams, "Direction", direction);

    outSpawnedUnits = [];
    for (var position = generator.next(); !position.done && outSpawnedUnits.length < uCount; position = generator.next()) {
        if (unitCanBePlacedByRealMap(uCfg, position.value.X, position.value.Y) {
            HordeUtils.setValue(spawnParams, "Cell", createPoint(position.value.X, position.value.Y));
            outSpawnedUnits.push(settlement.Units.SpawnUnit(spawnParams));
        }
    }

    return outSpawnedUnits;
}
