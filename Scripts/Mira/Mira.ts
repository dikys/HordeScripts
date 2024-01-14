enum MiraLogLevel {
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

class Mira {
    static LogLevel: MiraLogLevel = MiraLogLevel.Info;
    
    private static controllers: Array<MiraSettlementController> = [];
    
    static Tick(tickNumber: number): void {
        for (var controller of this.controllers) {
            if (!controller.Settlement.Existence.TotalDefeat) {
                controller.Tick(tickNumber);
            }
            else {
                Mira.Log(MiraLogLevel.Info, `Controller '${controller.Player.Nickname}' lost the battle, but not the war!`);
            }
        }

        this.controllers = this.controllers.filter((controller) => {return !controller.Settlement.Existence.TotalDefeat});
    };

    static FirstRun(): void {
        Mira.controllers.length = 0;
        Mira.AttachToPlayer("1");
    };

    static AttachToPlayer(playerId: string): void {
        Mira.Debug(`Begin attach to player ${playerId}`);
        var settlementData = MiraUtils.GetSettlementData(playerId);

        if (!settlementData) {
            return;
        }

        if (!settlementData.MasterMind) {
            Mira.Error(`Unable to attach to player ${playerId}: player is not controlled by MasterMind`);
            return;
        }

        var controller = new MiraSettlementController(
            settlementData.Settlement, 
            settlementData.MasterMind, 
            settlementData.Player
        );
        
        Mira.controllers.push(controller);
        controller.State = new DevelopingState(controller);

        Mira.Info(`Successfully attached to player ${playerId}`);
    };

    //#region logging helpers
    static Log(level: MiraLogLevel, message: string) {
        if (this.LogLevel > level) {
            return;
        }

        var logMessage = "(Mira) " + message;

        switch (level) {
            case MiraLogLevel.Debug:
                logMessage = "(Mira) D " + message;
                logi(logMessage);
                break;
            case MiraLogLevel.Info:
                logi(logMessage);
                break;
            case MiraLogLevel.Warning:
                logw(logMessage);
                break;
            case MiraLogLevel.Error:
                loge(logMessage);
                break;
        }
    }
    static Debug(message: string): void {
        this.Log(MiraLogLevel.Debug, message);
    }
    static Info(message: string): void {
        this.Log(MiraLogLevel.Info, message);
    }
    static Warning(message: string): void {
        this.Log(MiraLogLevel.Warning, message);
    }
    static Error(message: string): void {
        this.Log(MiraLogLevel.Error, message);
    }
    //#endregion
}