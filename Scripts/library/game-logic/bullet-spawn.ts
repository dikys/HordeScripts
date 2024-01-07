
/**
 * Создание одного снаряда в заданных координатах.
 * 
 * Возвращает созданный снаряд.
 */
function spawnBullet(sourceUnit, targetUnit, sourceArmament, bullCfg, bulletCombatParams, launchPos, targetPos, targetLayer) {
    var csType = HordeUtils.GetTypeByName("HordeClassLibrary.World.Objects.Bullets.BulletEmittingArgs, HordeClassLibrary");
    var emittingArgs = HordeUtils.CreateInstance(csType);
    HordeUtils.setValue(emittingArgs, "SourceUnit", sourceUnit);
    HordeUtils.setValue(emittingArgs, "TargetUnit", targetUnit);
    HordeUtils.setValue(emittingArgs, "SourceArmament", sourceArmament);
    HordeUtils.setValue(emittingArgs, "BulletConfig", bullCfg);
    HordeUtils.setValue(emittingArgs, "BulletCombatParams", bulletCombatParams);
    HordeUtils.setValue(emittingArgs, "LaunchPosition", launchPos);
    HordeUtils.setValue(emittingArgs, "TargetPosition", targetPos);
    HordeUtils.setValue(emittingArgs, "TargetLayer", targetLayer);

    var emittingArgsVar = host.newVar(HCL.HordeClassLibrary.World.Objects.Bullets.BulletEmittingArgs);
    emittingArgsVar.value = emittingArgs;

    var bull = bullCfg.CreateInstance(emittingArgsVar.ref);
    sourceUnit.Scena.ObjectController.RegisterBullet(bull);

    return bull;
}
