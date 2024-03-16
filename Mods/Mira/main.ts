import { activePlugins } from "active-plugins";
import { MiraPlugin } from "./miraPlugin";

export function onInitialization() {
    activePlugins.register(new MiraPlugin());
}
