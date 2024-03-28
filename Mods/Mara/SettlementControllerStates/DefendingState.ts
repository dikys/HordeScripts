import { MaraSettlementControllerState } from "./MaraSettlementControllerState";
import { RebuildState } from "./RebuildState";
import { MaraUtils } from "Mara/Utils/MaraUtils";

export class DefendingState extends MaraSettlementControllerState {
    private reinforcementsCfgIds: Array<string>;
    
    OnEntry(): void {
        this.settlementController.TargetUnitsComposition = this.settlementController.GetCurrentEconomyComposition();
        
        this.refreshAttackersList();
        this.reinforcementsCfgIds = this.settlementController.StrategyController.GetReinforcementCfgIds();
        this.settlementController.TacticalController.Defend();
    }

    OnExit(): void {
        
    }

    Tick(tickNumber: number): void {
        if (tickNumber % 50 == 0) {
            if (!this.settlementController.StrategyController.IsUnderAttack()) {
                this.settlementController.Debug(`Attack countered`);
                this.settlementController.State = new RebuildState(this.settlementController);
                return;
            }
            else {
                this.refreshAttackersList();
                this.requestReinforcementsProduction();
                this.settlementController.TacticalController.ReinforceSquads();
            }
        }
    }

    private requestReinforcementsProduction() {
        for (let cfgId of this.reinforcementsCfgIds) {
            this.settlementController.ProductionController.ForceRequestSingleProduction(cfgId);
        }
    }

    private refreshAttackersList(): void {
        this.settlementController.HostileAttackingSquads = [];

        //TODO: add enemy detection around expands
        let settlementLocation = this.settlementController.GetSettlementLocation();

        if (!settlementLocation) {
            return;
        }

        let attackers = this.settlementController.StrategyController.GetEnemiesInArea(settlementLocation.Center, settlementLocation.Radius);
        
        let attackingSquads = MaraUtils.GetSettlementsSquadsFromUnits(
            attackers, 
            this.settlementController.StrategyController.EnemySettlements,
            (unit) => {return MaraUtils.ChebyshevDistance(unit.Cell, settlementLocation!.Center) <= settlementLocation!.Radius}
        );

        this.settlementController.HostileAttackingSquads.push(...attackingSquads);
    }
}