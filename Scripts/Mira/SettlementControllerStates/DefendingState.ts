import { MiraLogLevel } from "Mira/Mira";
import { MiraSettlementControllerState } from "./MiraSettlementControllerState";
import { RebuildState } from "./RebuildState";
import { MiraUtils } from "Mira/Utils/MiraUtils";

export class DefendingState extends MiraSettlementControllerState {
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
            if (!this.settlementController.IsUnderAttack()) {
                this.settlementController.Log(MiraLogLevel.Debug, `Attack countered`);
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
            this.settlementController.ProductionController.RequestSingleProduction(cfgId);
        }
    }

    private refreshAttackersList(): void {
        this.settlementController.HostileAttackingSquads = [];

        //TODO: add enemy detection around expands
        let settlementLocation = this.settlementController.GetSettlementLocation();

        if (!settlementLocation) {
            return;
        }

        let attackers = this.settlementController.GetEnemiesInArea(settlementLocation.Center, settlementLocation.Radius);
        let attackingSquads = MiraUtils.GetSettlementsSquadsFromUnits(attackers, this.settlementController.StrategyController.EnemySettlements);
        this.settlementController.HostileAttackingSquads.push(...attackingSquads);
    }
}