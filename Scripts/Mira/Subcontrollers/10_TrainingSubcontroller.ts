
//TODO: implement proper removing of a unit from a target list
//TODO: reorganize training list to a queue
//TODO? probably reorganize code to an abstract producer...

class TrainingSubcontroller extends MiraSubcontroller {
    private trainingList: Array<string> = [];
    
    constructor (parent: MiraSettlementController) {
        super(parent);
    }

    Tick(tickNumber: number): void {
        if (tickNumber % 10 !== 0) {
            return;
        }

        if (this.trainingList.length === 0) {
            return;
        }
        
        var mmProductionDepartament = this.parentController.MasterMind.ProductionDepartment;
        var producedUnits:Array<string> = []
        
        for (var traineeConfig of this.trainingList) {
            if (MiraUtils.RequestMasterMindProduction(traineeConfig, mmProductionDepartament)) {
                this.parentController.Log(MiraLogLevel.Debug, "Added " + traineeConfig + " to the production list");
                producedUnits.push(traineeConfig);
            }
        }

        if (producedUnits.length > 0) {
            this.parentController.Log(MiraLogLevel.Debug, `Removed ${producedUnits.length} items from target training list`);
            
            for (var cfg of producedUnits) {
                const index = this.trainingList.indexOf(cfg);

                if (index > -1) {
                    this.trainingList.splice(index, 1);
                }
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

    public get TrainingList(): Array<string> {
        return this.trainingList;
    }
}