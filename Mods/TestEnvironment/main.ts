import { activePlugins } from "active-plugins";
import { TestEnvironmentPlugin } from "./test-environment-plugin";

/**
 * Вызывается до вызова "onFirstRun()" при первом запуске скрипт-машины, а так же при hot-reload
 */
export function onInitialization() {
    // Место для регистрации отладочных плагинов
    activePlugins.register(new TestEnvironmentPlugin());
}
