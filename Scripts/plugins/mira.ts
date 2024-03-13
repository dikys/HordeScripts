import { Mira } from "Mira/Mira";
import HordePluginBase from "./base-plugin";

export class MiraPlugin extends HordePluginBase {
    public constructor() {
        super("Mira");
    }

    public onFirstRun() {
        Mira.FirstRun();
    }

    public onEveryTick(gameTickNum: number) {
        Mira.Tick(gameTickNum);
    }
}