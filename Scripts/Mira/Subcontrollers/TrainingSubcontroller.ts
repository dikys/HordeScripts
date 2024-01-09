
//TODO: implement proper removing of a unit from a target list
//TODO: reorganize training list to a queue
//TODO? probably reorganize code to an abstract producer...

class TrainingSubcontroller extends MiraSubcontroller {
    private trainingList: Array<string>;
    
    constructor (parent: MiraSettlementController) {
        super(parent);
    }

    Tick(tickNumber: number): void {
        var mmProductionDepartament = this.parentController.MasterMind.ProductionDepartment;
        var producedUnits:Array<string> = []
        
        for (var traineeConfig of this.trainingList) {
            if (mmProductionDepartament.AddRequestToProduce(traineeConfig, 1)) {
                this.parentController.Log(MiraLogLevel.Debug, "Added " + traineeConfig + " to the production list");
                producedUnits.push(traineeConfig);
            }
            else {
                this.parentController.Log(MiraLogLevel.Debug, "Unable to add " + traineeConfig + " to the production list");
            }            
        }

        for (var cfg of producedUnits) {
            const index = this.trainingList.indexOf(cfg);

            if (index > -1) {
                this.trainingList.splice(index, 1);
                this.parentController.Log(MiraLogLevel.Debug, "Removed " + index.toString() + " from target training list");
            }
        }
    }

    AddToTrainingList(traineeConfig: string): void {
        this.trainingList.push(traineeConfig);
        this.parentController.Log(MiraLogLevel.Debug, "Added " + traineeConfig + " to target training list");
    }

    ClearTrainingList(): void {
        this.trainingList = [];
        this.parentController.Log(MiraLogLevel.Debug, "Cleared target training list");
    }
}