
/**
 * Создание эффекта-декорации в заданных координатах
 */
function spawnDecoration(scena, decorationCfg, position) {
    var decoration = decorationCfg.CreateInstance(scena.Context, position);
    scena.ObjectController.RegisterVisualEffect(decoration);
    return decoration;
}

/**
 * Создание звукового эффекта в заданных координатах
 */
function spawnSound(scena, soundsCatalog, sectionName, position, isLooping) {
	scena.ObjectController.UtterSound(soundsCatalog, sectionName, position, isLooping);
}
