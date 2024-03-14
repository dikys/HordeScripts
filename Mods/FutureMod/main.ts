import { activePlugins } from "active-plugins";
import { FutureModPlugin } from "./future-mod-plugin";

/**
 * Вызывается до вызова "onFirstRun()" при первом запуске скрипт-машины, а так же при hot-reload
 */
export function onInitialization() {
    // Место для регистрации разрабатываемых плагинов
    activePlugins.register(new FutureModPlugin());
}
