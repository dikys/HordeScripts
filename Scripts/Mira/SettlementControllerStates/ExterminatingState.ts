
class ExterminatingState extends MiraSettlementControllerState {
    OnEntry(): void {
        this.settlementController.BuildingController.ClearBuildList();
        this.settlementController.TrainingController.ClearTrainingList();
        
        if (!this.selectAndAttackEnemy()) {
            this.settlementController.State = new IdleState(this.settlementController);
            return;
        }
    }

    OnExit(): void {
        this.settlementController.StrategyController.ResetEnemy();
    }

    Tick(tickNumber: number): void {
        if (tickNumber % 10 > 0) {
            return;
        }
        
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
            this.settlementController.Log(MiraLogLevel.Debug, `Selected '${enemy.TownName}' as an enemy. proceeding to attack`)
            this.settlementController.StrategyController.AttackEnemy();
            return true;
        }
        else {
            this.settlementController.Log(MiraLogLevel.Info, "No enemies left. We are victorious!")
            return false;
        }
    }
}