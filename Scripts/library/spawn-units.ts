
function test_spawnUnits() {
    var realScena = scena.GetRealScena();
    var settlements = realScena.Settlements;

    var settlement_0 = settlements.Item.get('0');  // Олег
    var archerCfg    = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Archer");
    var spawnCounts  = 100;
    var cell         = createPoint(5, 5);
    var dir          = UnitDirection.RightDown;

    logi("spawn units");
    var spawnedUnits = spawnUnits(settlement_0, archerCfg, spawnCounts, cell, dir);

    // так можно посмотреть всех юнитов
    //for (var unit of spawnedUnit) {
    //    logi(unit.ToString());
    //}

    // когда при спавне ИД будет даваться сразу, а пока выходим
    return;

    logi("select spawned units");
    var spawnedUnitIdx = [];
    for (var unit of spawnedUnits) {
        logi(unit.Id);
    }
    inputSelectUnitsById(settlement_0, spawnedUnitIdx);

    logi("attack by spawn units");
    inputPointBasedCommand(oleg, createPoint(50, 50), UnitCommand.Attack);
}


/**
 * Создание юнитов вокруг заданной клетки по спирали.
 *
 * Возвращает список созданных юнитов.
 */
function spawnUnits(settlement, uCfg, uCount, cell, direction) {
    var csType = HordeUtils.GetTypeByName("HordeClassLibrary.World.Objects.Units.SpawnUnitParameters");
    var spawnParams = HordeUtils.CreateInstance(csType);
    HordeUtils.setValue(spawnParams, "ProductUnitConfig", uCfg);
    HordeUtils.setValue(spawnParams, "Cell", cell);
    HordeUtils.setValue(spawnParams, "Direction", direction);

    var spawnedUnits = 0;
    var spawnRadius  = 0;
    var scenaWidth   = scena.GetRealScena().Size.Width;
    var scenaHeight  = scena.GetRealScena().Size.Height;
    var x            = 0;
    var y            = 0;

    outSpawnedUnits = [];
    var trySpawnToCell = (x, y) => {
        HordeUtils.setValue(spawnParams, "Cell", createPoint(x, y));
        var unit = settlement.Units.SpawnUnit(spawnParams);
        if (unit) {
            spawnedUnits++;
            outSpawnedUnits.push(unit);
        }
    };

    while (spawnedUnits < uCount) {
        // флаг, что идет создание юнитов вне сцены!
        var outside = true;

        // верхняя часть
        y = cell.Y - spawnRadius;
        if (y >= 0) {
            outside    = false;
            var xStart = Math.max(cell.X - spawnRadius, 0);
            var xEnd   = Math.min(cell.X + spawnRadius, scenaWidth - 1);
            for (x = xStart; x <= xEnd; x++) {
                trySpawnToCell(x, y);
                if (spawnedUnits == uCount) {
                    return outSpawnedUnits;
                }
            }
        }

        // правая сторона
        x = cell.X + spawnRadius;
        if (x >= 0) {
            outside    = false;
            var yStart = Math.max(cell.Y - spawnRadius + 1, 0);
            var yEnd   = Math.min(cell.Y + spawnRadius - 1, scenaHeight - 1);
            for (y = yEnd; y >= yStart; y--) {
                trySpawnToCell(x, y);
                if (spawnedUnits == uCount) {
                    return outSpawnedUnits;
                }
            }
        }

        // нижняя часть
        y = cell.Y + spawnRadius;
        if (y < scenaHeight) {
            outside    = false;
            var xStart = Math.max(cell.X - spawnRadius, 0);
            var xEnd   = Math.min(cell.X + spawnRadius, scenaWidth - 1);
            for (x = xEnd; x >= xStart; x--) {
                trySpawnToCell(x, y);
                if (spawnedUnits == uCount) {
                    return outSpawnedUnits;
                }
            }
        }

        // левая сторона
        x = cell.X - spawnRadius;
        if (x >= 0) {
            outside    = false;
            var yStart = Math.max(cell.Y - spawnRadius + 1, 0);
            var yEnd   = Math.min(cell.Y + spawnRadius - 1, scenaHeight - 1);
            for (y = yStart; y <= yEnd; y++) {
                trySpawnToCell(x, y);
                if (spawnedUnits == uCount) {
                    return outSpawnedUnits;
                }
            }
        }

        if (outside) {
            break;
        }

        spawnRadius++;
    }
    return outSpawnedUnits;
}
