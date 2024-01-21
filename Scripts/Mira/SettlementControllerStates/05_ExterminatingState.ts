
class ExterminatingState extends MiraSettlementControllerState {
    private readonly COMBATIVITY_THRESHOLD = 0.5;
    
    OnEntry(): void {
        this.settlementController.ProductionController.CancelAllProduction();
        
        if (!this.selectAndAttackEnemy()) {
            this.settlementController.Log(MiraLogLevel.Info, "No enemies left. We are victorious!")
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

        var combativityIndex = this.settlementController.StrategyController.CurrentCombativityIndex;

        if (combativityIndex >= this.COMBATIVITY_THRESHOLD) {   
            var enemy = this.settlementController.StrategyController.CurrentEnemy;
            
            if (!enemy) {
                if (!this.selectAndAttackEnemy()) {
                    this.settlementController.State = new IdleState(this.settlementController);
                    return;
                }
            }
        }
        else {
            this.settlementController.Log(MiraLogLevel.Debug, `Current combativity index '${combativityIndex}' is too low. Retreating...`);
            this.settlementController.StrategyController.Pullback();
            this.settlementController.State = new DevelopingState(this.settlementController);
        }
    }

    private selectAndAttackEnemy(): boolean {
        var enemy = this.settlementController.StrategyController.CurrentEnemy;
        
        if (!enemy) {
            enemy = this.settlementController.StrategyController.SelectEnemy();
        }
        
        if (enemy) {
            this.settlementController.Log(MiraLogLevel.Debug, `Selected '${enemy.TownName}' as an enemy. Proceeding to attack`)
            this.settlementController.StrategyController.AttackEnemy();
            return true;
        }
        else {
            this.settlementController.Log(MiraLogLevel.Info, "No enemies left. We are victorious!")
            return false;
        }
    }
}