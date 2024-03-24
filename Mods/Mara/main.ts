import { activePlugins } from "active-plugins";
import { MaraPlugin } from "./maraPlugin";

export function onInitialization() {
    activePlugins.register(new MaraPlugin());
}
