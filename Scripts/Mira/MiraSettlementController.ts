
/* 
    Class that controls the entire life of a single settlement
*/

class MiraSettlementController {
    Settlement;
    MasterMind;

    private playerID: string;
    private miningController: MiningSubcontroller;
    private buildingController: BuildingSubcontroller;
    private trainingController: TrainingSubcontroller;
    private subcontrollers: Array<MiraSubcontroller>;

    constructor (controlledSettlement, settlementMM, controlledPlayerId: string) {
        this.Settlement = controlledSettlement;
        this.playerID = controlledPlayerId;
        this.MasterMind = settlementMM;

        this.miningController = new MiningSubcontroller(this);
        this.subcontrollers.push(this.miningController);

        this.buildingController = new BuildingSubcontroller(this);
        this.subcontrollers.push(this.buildingController);

        this.trainingController = new TrainingSubcontroller(this);
        this.subcontrollers.push(this.trainingController);
    }
    
    Tick(tickNumber: number): void {
        for (var subcontroller of this.subcontrollers) {
            subcontroller.Tick(tickNumber);
        }
    }

    Log(level: MiraLogLevel, message: string): void {
        var logMessage = "[Settlement #" + this.playerID + "] " + message;
        Mira.Log(level, logMessage);
    }
}