
//TODO: implement proper removing of a building from a target list
//TODO: probably reorganize build list to a queue

class BuildingSubcontroller extends MiraSubcontroller {
    private buildList: Array<string>;

    constructor (parent: MiraSettlementController) {
        super(parent);
    }
    
    Tick(tickNumber: number): void {
        var mmProductionDepartament = this.parentController.MasterMind.ProductionDepartment;
        var producedBuildings:Array<string> = []

        for (var buildingConfig of this.buildList) {
            var freeWorker = this.GetFreeWorker();
            
            //!! most probably doesn't work as expected since worker is always free on this tick
            if (freeWorker) {
                if (mmProductionDepartament.AddRequestToProduce(buildingConfig, 1)) {
                    this.parentController.Log(MiraLogLevel.Debug, "Added " + buildingConfig + " to the production list");
                    producedBuildings.push(buildingConfig);
                }
                else {
                    this.parentController.Log(MiraLogLevel.Debug, "Unable to add " + buildingConfig + " to the production list");
                }
            }
            else {
                break;
            }
        }

        for (var cfg of producedBuildings) {
            const index = this.buildList.indexOf(cfg);

            if (index > -1) {
                this.buildList.splice(index, 1);
                this.parentController.Log(MiraLogLevel.Debug, "Removed " + index.toString() + " from target production list");
            }
        }
    }

    GetFreeWorker() {
        //TODO: implement engagement of workers that are busy gathering resources
        var freeWorker = this.parentController.Settlement.Units.Professions.FreeWorkers.First();
        
        if (freeWorker) {
            return freeWorker;
        }
    }

    AddToBuildList(buildingConfig: string): void {
        this.buildList.push(buildingConfig);
        this.parentController.Log(MiraLogLevel.Debug, "Added " + buildingConfig + " to target production list");
    }

    ClearBuildList(): void {
        this.buildList = [];
        this.parentController.Log(MiraLogLevel.Debug, "Cleared target production list");
    }
}