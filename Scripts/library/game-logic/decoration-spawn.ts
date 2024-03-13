
/**
 * Создание эффекта-декорации в заданных координатах
 */
export function spawnDecoration(scena, decorationCfg, position) {
    let decoration = decorationCfg.CreateInstance(scena.Context, position);
    scena.ObjectController.RegisterVisualEffect(decoration);
    return decoration;
}

/**
 * Создание звукового эффекта в заданных координатах
 */
export function spawnSound(scena, soundsCatalog, sectionName, position, isLooping) {
	scena.ObjectController.UtterSound(soundsCatalog, sectionName, position, isLooping);
}
