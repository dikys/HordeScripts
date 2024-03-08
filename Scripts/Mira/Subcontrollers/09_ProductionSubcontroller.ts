
//TODO: implement proper removing of a building from a target list
//TODO: probably reorganize build list to a queue

class ProductionSubcontroller extends MiraSubcontroller {
    private productionList: Array<string> = [];
    private productionIndex: Map<string, Array<any>> = null;

    constructor (parent: MiraSettlementController) {
        super(parent);
    }
    
    Tick(tickNumber: number): void {
        if (tickNumber % 10 > 0) {
            return;
        }

        this.updateProductionIndex();
        
        var mmProductionDepartament = this.parentController.MasterMind.ProductionDepartment;
        var producedUnits:Array<string> = []

        for (var unitConfig of this.productionList) {
            var freeProducer = this.getProducer(unitConfig);
            
            //!! most probably doesn't work as expected since worker is always free on this tick
            if (freeProducer) {
                if (MiraUtils.RequestMasterMindProduction(unitConfig, mmProductionDepartament)) {
                    this.parentController.Log(MiraLogLevel.Debug, "Added " + unitConfig + " to the production list");
                    producedUnits.push(unitConfig);
                }
            }
        }

        if (producedUnits.length > 0) {
            this.parentController.Log(MiraLogLevel.Debug, `Removed ${producedUnits.length} units from target production list`);

            for (var cfg of producedUnits) {
                const index = this.productionList.indexOf(cfg);

                if (index > -1) {
                    this.productionList.splice(index, 1);
                }
            }
        }
    }

    public get ProductionList(): Array<string> {
        return this.productionList;
    }

    RequestProduction(unitConfig: string): void {
        this.productionList.push(unitConfig);
        this.parentController.Log(MiraLogLevel.Debug, "Added " + unitConfig + " to target production list");
    }

    RequestSingleProduction(unitConfig: string): void {
        if (this.productionList.indexOf(unitConfig) < 0) {
            this.RequestProduction(unitConfig);
        }
    }

    CancelAllProduction(): void {
        this.productionList = [];
        this.parentController.Log(MiraLogLevel.Debug, "Cleared target production list");
    }

    GetProduceableCfgIds(): Array<string> {
        if (!this.productionIndex) {
            this.updateProductionIndex();
        }
        
        return Array.from(this.productionIndex.keys());
    }

    private getProducer(unitConfig: string): any {
        //TODO: implement engagement of workers that are busy gathering resources
        var producers = this.productionIndex.get(unitConfig);

        if (producers) {
            for (var producer of producers) {
                if (producer.OrdersMind.OrdersCount === 0) {
                    return producer;
                }
            }
        }

        return null;
    }

    private updateProductionIndex(): void {
        this.productionIndex = new Map<string, Array<any>>();

        let units = enumerate(this.parentController.Settlement.Units);
        let unit;
        
        while ((unit = eNext(units)) !== undefined) {
            let producerParams;

            try {
                producerParams = unit.Cfg.GetProfessionParams(UnitProducerProfessionParams, UnitProfession.UnitProducer);
            }
            catch (e) { //GetProfessionParams throws exception if there is no such profession
                continue;
            }
            
            if (producerParams) {
                if (unit.EffectsMind.BuildingInProgress || unit.IsNearDeath) {
                    continue;
                }
                
                let produceList = enumerate(producerParams.CanProduceList);
                let produceListItem;

                while ((produceListItem = eNext(produceList)) !== undefined) {
                    if (!this.configProductionRequirementsMet(produceListItem)) {
                        continue;
                    }
                    
                    if (this.productionIndex.has(produceListItem.Uid)) {
                        let producers = this.productionIndex.get(produceListItem.Uid);
                        producers.push(unit);
                    }
                    else {
                        this.productionIndex.set(produceListItem.Uid, [unit]);
                    }
                }
            }
        }
    }

    private configProductionRequirementsMet(config: any): boolean {
        let productionRequirements = enumerate(config.TechConfig?.Requirements);
        let requirementConfig;

        while ((requirementConfig = eNext(productionRequirements)) !== undefined) {
            let atLeastOneUnitFound = false;

            let units = enumerate(this.parentController.Settlement.Units);
            let unit;
            
            while ((unit = eNext(units)) !== undefined) {
                if (
                    unit.Cfg.Uid == requirementConfig.Uid &&
                    !unit.EffectsMind.BuildingInProgress &&
                    !unit.IsNearDeath
                ) {
                    atLeastOneUnitFound = true;
                    break;
                }
            }

            if (!atLeastOneUnitFound) {
                return false;
            }
        }

        return true;
    }
}