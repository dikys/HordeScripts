
class IdleState extends MiraSettlementControllerState {
    OnEntry(): void {
        this.settlementController.Log(MiraLogLevel.Info, "Chilling...")
    }

    OnExit(): void {
        //do nothing
    }

    Tick(tickNumber: number): void {
        //do nothing
    }
}

class DefendingState extends MiraSettlementControllerState {
    private reinforcementsCfgIds: Array<string>;
    
    OnEntry(): void {
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
                this.settlementController.State = new DevelopingState(this.settlementController);
                return;
            }
            else {
                this.refreshAttackersList();
                this.requestReinforcementsProduction();
            }
        }
    }

    private requestReinforcementsProduction() {
        for (let cfgId of this.reinforcementsCfgIds) {
            this.settlementController.ProductionController.RequestProduction(cfgId);
        }
    }

    private refreshAttackersList(): void {
        this.settlementController.AttackingSquads = [];

        //TODO: add enemy detection around expands
        let settlementCenter = this.settlementController.GetSettlementCenter();

        if (!settlementCenter) {
            return;
        }

        let attackers = this.settlementController.GetEnemiesInArea(settlementCenter, this.settlementController.SETTLEMENT_RADIUS);
        let attackingSquads = MiraUtils.GetSettlementsSquadsFromUnits(attackers, this.settlementController.StrategyController.EnemySettlements);
        this.settlementController.AttackingSquads.push(...attackingSquads);
    }
}