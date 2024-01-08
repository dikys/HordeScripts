
//TODO: implement proper removing of a building from a target list

class BuildingSubcontroller extends MiraSubcontroller {
    private targetBuildingList: Array<string>;

    constructor (parent: MiraSettlementController) {
        super(parent);
    }
    
    Tick(tickNumber: number): void {
        var mmProductionDepartament = this.parentController.MasterMind.ProductionDepartment;
        var producedBuildings:Array<string> = []

        for (var buildingConfig of this.targetBuildingList) {
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
            const index = this.targetBuildingList.indexOf(cfg);

            if (index > -1) {
                this.targetBuildingList.splice(index, 1);
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

    AddToTargetList(buildingConfig: string): void {
        this.targetBuildingList.push(buildingConfig);
        this.parentController.Log(MiraLogLevel.Debug, "Added " + buildingConfig + " to target production list");
    }

    ClearTargetList(): void {
        this.targetBuildingList = [];
        this.parentController.Log(MiraLogLevel.Debug, "Cleared target production list");
    }
}