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
    static LogLevel: MiraLogLevel = MiraLogLevel.Debug;
    private static Controllers: Array<MiraSettlementController>;
    
    static Tick(tickNumber: number): void {
        for (var controller of this.Controllers) {
            controller.Tick(tickNumber);
        }
    };

    static FirstRun(): void {
        Mira.Controllers.length = 0;
        Mira.AttachToPlayer("0");
    };

    static AttachToPlayer(playerId: string): void {
        var settlementData = MiraUtils.GetSettlementData(playerId);

        if (!settlementData) {
            return;
        }

        var controller = new MiraSettlementController(settlementData.Settlement, settlementData.MasterMind, playerId);
        Mira.Controllers.push(controller);
        controller.State = new DevelopingState(controller);

        Mira.Info("Attached to player " + playerId);
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