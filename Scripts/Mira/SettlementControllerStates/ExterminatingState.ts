
class ExterminatingState extends MiraSettlementControllerState {
    OnEntry(): void {
        if (!this.selectAndAttackEnemy()) {
            this.settlementController.State = new IdleState(this.settlementController);
            return;
        }
    }

    OnExit(): void {
        this.settlementController.StrategyController.ResetEnemy();
    }

    Tick(tickNumber: number): void {
        var enemy = this.settlementController.StrategyController.CurrentEnemy;
        
        if (!enemy) {
            if (!this.selectAndAttackEnemy()) {
                this.settlementController.State = new IdleState(this.settlementController);
                return;
            }
        }
    }

    private selectAndAttackEnemy(): boolean {
        var enemy = this.settlementController.StrategyController.CurrentEnemy;
        
        if (!enemy) {
            enemy = this.settlementController.StrategyController.SelectEnemy();
        }
        
        if (enemy) {
            this.settlementController.Log(MiraLogLevel.Debug, "selected " + enemy.toString() + " as an enemy. proceeding to attack")
            this.settlementController.StrategyController.AttackEnemy();
            return true;
        }
        else {
            this.settlementController.Log(MiraLogLevel.Info, "no enemies left. we are victorious!")
            return false;
        }
    }
}