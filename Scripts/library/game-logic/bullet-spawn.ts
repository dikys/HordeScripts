
/**
 * Создание одного снаряда в заданных координатах.
 * 
 * Возвращает созданный снаряд.
 */
export function spawnBullet(sourceUnit, targetUnit, sourceArmament, bullCfg, bulletCombatParams, launchPos, targetPos, targetLayer) {
    const csType = HordeUtils.GetTypeByName("HordeClassLibrary.World.Objects.Bullets.BulletEmittingArgs, HordeClassLibrary");
    let emittingArgs = HordeUtils.CreateInstance(csType);
    HordeUtils.setValue(emittingArgs, "SourceUnit", sourceUnit);
    HordeUtils.setValue(emittingArgs, "TargetUnit", targetUnit);
    HordeUtils.setValue(emittingArgs, "SourceArmament", sourceArmament);
    HordeUtils.setValue(emittingArgs, "BulletConfig", bullCfg);
    HordeUtils.setValue(emittingArgs, "BulletCombatParams", bulletCombatParams);
    HordeUtils.setValue(emittingArgs, "LaunchPosition", launchPos);
    HordeUtils.setValue(emittingArgs, "TargetPosition", targetPos);
    HordeUtils.setValue(emittingArgs, "TargetLayer", targetLayer);

    let emittingArgsVar = host.newVar(HCL.HordeClassLibrary.World.Objects.Bullets.BulletEmittingArgs);
    emittingArgsVar.value = emittingArgs;

    let bull = bullCfg.CreateInstance(emittingArgsVar.ref);
    sourceUnit.Scena.ObjectController.RegisterBullet(bull);

    return bull;
}
