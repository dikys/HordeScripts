import { log } from "library/common/logging";
import { MiraSettlementController } from "./MiraSettlementController";
import { MiraUtils } from "./Utils/MiraUtils";

export enum MiraLogLevel {
    Debug = 0,
    Info = 1,
    Warning = 2,
    Error = 3
}

/*
    Class organizes work of each settlement controller since we can have multiple 
    of them in one game. Also provides some helper functions.

    The class itself is static by its nature
*/

export class Mira {
    static LogLevel: MiraLogLevel = MiraLogLevel.Debug;
    static CanRun = true;
    static IsNetworkMode = true;
    
    private static controllers: Array<MiraSettlementController> = [];
    
    public static get Controllers(): Array<MiraSettlementController> {
        return Mira.controllers;
    }
    
    static Tick(tickNumber: number): void {
        try {
            if (Mira.CanRun) {
                for (let controller of Mira.controllers) {
                    if (!controller.Settlement.Existence.IsTotalDefeat) {
                        controller.Tick(tickNumber - controller.TickOffset);
                    }
                    else {
                        Mira.Log(MiraLogLevel.Info, `Controller '${controller.Player.Nickname}' lost the battle, but not the war!`);
                    }
                }

                Mira.controllers = Mira.controllers.filter((controller) => {return !controller.Settlement.Existence.IsTotalDefeat});
            }
        }
        catch (ex) {
            log.exception(ex);
            Mira.CanRun = false;
        }
    };

    static FirstRun(): void {
        Mira.Info(`Engaging Mira...`);
        Mira.Info(`Failed to load library './Empathy/heart', reason: not found. Proceeding without it.`);
        Mira.Info(`Failed to load library './Empathy/soul', reason: not found. Proceeding without it.`);
        Mira.Info(`Empathy subsystem is not responding`);

        try {            
            Mira.CanRun = true;
            Mira.IsNetworkMode = MiraUtils.IsNetworkMode();
            Mira.controllers = [];

            let tickOffset = 0;

            for (let item of MiraUtils.GetAllPlayers()) {
                Mira.AttachToPlayer(item.index, tickOffset);
                tickOffset++;
            }
        }
        catch (ex) {
            log.exception(ex);
            Mira.CanRun = false;
            return;
        }

        Mira.Info(`Mira successfully engaged. Have fun! ^^`);
    };

    static AttachToPlayer(playerId: string, tickOffset: number = 0): void {
        Mira.Debug(`Begin attach to player ${playerId}`);
        let settlementData = MiraUtils.GetSettlementData(playerId);

        if (!settlementData) {
            return;
        }

        if (!settlementData.Player.IsLocal) {
            Mira.Info(`Skipping player ${playerId}: player is not local`);
            return;
        }

        if (!settlementData.MasterMind) {
            Mira.Info(`Unable to attach to player ${playerId}: player is not controlled by MasterMind`);
            return;
        }

        MiraUtils.SetValue(settlementData.Player, "Nickname", settlementData.Settlement.TownName);

        let controller = new MiraSettlementController(
            settlementData.Settlement, 
            settlementData.MasterMind, 
            settlementData.Player,
            tickOffset
        );
        
        Mira.controllers.push(controller);
        Mira.Info(`Successfully attached to player ${playerId}`);
    };

    //#region logging helpers
    static Log(level: MiraLogLevel, message: string) {
        if (Mira.LogLevel > level) {
            return;
        }

        let logMessage = "(Mira) " + message;

        switch (level) {
            case MiraLogLevel.Debug:
                logMessage = "(Mira) D " + message;
                log.info(logMessage);
                break;
            case MiraLogLevel.Info:
                log.info(logMessage);
                break;
            case MiraLogLevel.Warning:
                log.warning(logMessage);
                break;
            case MiraLogLevel.Error:
                log.error(logMessage);
                break;
        }
    }
    static Debug(message: string): void {
        Mira.Log(MiraLogLevel.Debug, message);
    }
    static Info(message: string): void {
        Mira.Log(MiraLogLevel.Info, message);
    }
    static Warning(message: string): void {
        Mira.Log(MiraLogLevel.Warning, message);
    }
    static Error(message: string): void {
        Mira.Log(MiraLogLevel.Error, message);
    }
    //#endregion
}