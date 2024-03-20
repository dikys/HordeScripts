import { activePlugins } from "active-plugins";

/**
 * Место для регистрации отладочных плагинов
 * 
 * Вызывается до вызова "onFirstRun()" при первом запуске скрипт-машины, а так же при hot-reload
 */
export function onInitialization() {
    // Общие тесты
    activePlugins.register(new TestEnvironmentPlugin());

    // // Тест Mastermind
    activePlugins.register(new TestMastermindPlugin());
}

// Плагины
import { TestEnvironmentPlugin } from "./test-environment-plugin";
import { TestMastermindPlugin } from "./test-mastermind-plugin";
