import { activePlugins } from "active-plugins";
import { BeammanPlugin } from "./beamman";

/**
 * Вызывается до вызова "onFirstRun()" при первом запуске скрипт-машины, а так же при hot-reload
 */
export function onInitialization() {
    // Инициализация плагинов
    activePlugins.register(new BeammanPlugin());
}
