import * as plugins from "plugins/_plugins-runner";
import { BeammanPlugin } from "./beamman";

/**
 * Вызывается до вызова "onFirstRun()" при первом запуске скрипт-машины, а так же при hot-reload
 */
export function onInitialization() {
    // Инициализация плагинов
    plugins.registerPlugin(new BeammanPlugin());
}
