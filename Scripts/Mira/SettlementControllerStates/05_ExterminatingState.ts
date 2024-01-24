
class ExterminatingState extends MiraSettlementControllerState {
    private readonly COMBATIVITY_THRESHOLD = 0.5;
    private currentTarget: any; //but actually Unit
    
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

        let combativityIndex = this.settlementController.TacticalController.CurrentCombativityIndex;

        if (combativityIndex >= this.COMBATIVITY_THRESHOLD) {   
            let enemy = this.settlementController.StrategyController.CurrentEnemy;
            
            if (!enemy) {
                if (!this.selectAndAttackEnemy()) {
                    this.settlementController.State = new IdleState(this.settlementController);
                    return;
                }
            }
            else {
                if (!this.currentTarget || this.currentTarget.IsDead) {
                    this.selectTarget(enemy);
                }
            }
        }
        else {
            this.settlementController.Log(MiraLogLevel.Debug, `Current combativity index '${combativityIndex}' is too low. Retreating...`);
            this.settlementController.TacticalController.Retreat();
            this.settlementController.State = new DevelopingState(this.settlementController);
            return;
        }
    }

    private selectAndAttackEnemy(): boolean {
        var enemy = this.settlementController.StrategyController.CurrentEnemy;
        
        if (!enemy) {
            enemy = this.settlementController.StrategyController.SelectEnemy();
        }
        
        if (enemy) {
            this.settlementController.Log(MiraLogLevel.Debug, `Selected '${enemy.TownName}' as an enemy. Proceeding to attack`);
            this.settlementController.TacticalController.ComposeSquads();
            this.selectTarget(enemy);
            return true;
        }
        else {
            this.settlementController.Log(MiraLogLevel.Info, "No enemies left. We are victorious!")
            return false;
        }
    }

    private selectTarget(enemy: any) {
        let target = this.settlementController.StrategyController.GetOffensiveTarget(enemy);
        this.currentTarget = target;
        this.settlementController.TacticalController.Attack(target);
    }
}