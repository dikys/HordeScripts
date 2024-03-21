import { MiraUtils, UnitComposition } from "Mira/Utils/MiraUtils";
import { MiraSettlementControllerState } from "./MiraSettlementControllerState";
import { DefendingState } from "./DefendingState";
import { MiraLogLevel } from "../Mira";

export abstract class ProductionState extends MiraSettlementControllerState {
    private targetUnitsComposition: UnitComposition = new Map<string, number>();

    protected abstract getTargetUnitsComposition(): UnitComposition;
    protected abstract onTargetCompositionReached(): void;
    protected readonly PRODUCTION_TIMEOUT: number | null = null;

    private timeoutTick: number | null;
    
    OnEntry(): void {
        this.settlementController.ProductionController.CancelAllProduction();
        this.targetUnitsComposition = this.getTargetUnitsComposition();

        this.refreshTargetProductionLists();
        this.timeoutTick = null;
    }

    OnExit(): void {
        //do nothing
    }

    Tick(tickNumber: number): void {
        if (this.PRODUCTION_TIMEOUT != null) {
            if (this.timeoutTick == null) {
                this.timeoutTick = tickNumber + this.PRODUCTION_TIMEOUT;
            }
            else if (tickNumber > this.timeoutTick) {
                this.settlementController.Log(MiraLogLevel.Debug, `Production is too long-drawn, discontinuing`);
                this.onTargetCompositionReached();
                return;
            }
        }
        
        if (tickNumber % 10 != 0) {
            return;
        }

        if (tickNumber % 50 == 0) {
            if (this.settlementController.StrategyController.IsUnderAttack()) {
                this.settlementController.State = new DefendingState(this.settlementController);
                return;
            }
        }

        this.refreshTargetProductionLists();

        let composition = this.settlementController.GetCurrentDevelopedEconomyComposition();

        if (MiraUtils.SetContains(composition, this.targetUnitsComposition)) {
            this.onTargetCompositionReached();
            return;
        }
    }

    private getRemainingProductionList(): UnitComposition {
        let currentEconomy = this.settlementController.GetCurrentDevelopedEconomyComposition();
        
        for (let productionListItem of this.settlementController.ProductionController.ProductionList) {
            MiraUtils.IncrementMapItem(currentEconomy, productionListItem);
        }

        return MiraUtils.SubstractCompositionLists(this.targetUnitsComposition, currentEconomy);
    }

    private refreshTargetProductionLists(): void {
        let trainingList = this.getRemainingProductionList();
        
        trainingList.forEach(
            (val, key, map) => {
                for (let i = 0; i < val; i++) {
                    this.settlementController.ProductionController.RequestProduction(key);
                }
            }
        );
    }
}