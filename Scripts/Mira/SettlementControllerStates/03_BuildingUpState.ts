
class BuildingUpState extends ProductionState {
    protected getTargetUnitsComposition(): UnitComposition {
        let enemy = this.settlementController.StrategyController.CurrentEnemy
        
        if (!enemy) {
            enemy = this.settlementController.StrategyController.SelectEnemy();
            this.settlementController.Log(MiraLogLevel.Debug, `Selected '${enemy.TownName}' as an enemy.`);
        }

        if (enemy) {
            this.settlementController.Log(MiraLogLevel.Debug, `Proceeding to build-up against '${enemy.TownName}'.`);
            return this.settlementController.StrategyController.GetArmyComposition();
        }
        else {
            return new Map<string, number>();
        }
    }

    protected onTargetCompositionReached(): void {
        this.settlementController.State = new ExterminatingState(this.settlementController);
    }
}

class RebuildState extends ProductionState {
    protected getTargetUnitsComposition(): UnitComposition {
        let lastUnitsComposition = this.settlementController.TargetUnitsComposition;
        let unitsComposition = new Map<string, number>();

        lastUnitsComposition.forEach((value, key, map) => {
            let config = MiraUtils.GetUnitConfig(key);

            if (
                config.BuildingConfig != null ||
                MiraUtils.IsProducerConfig(key)
            ) {
                unitsComposition.set(key, value);
            }
        });

        return unitsComposition;
    }

    protected onTargetCompositionReached(): void {
        this.settlementController.State = new BuildingUpState(this.settlementController);
    }
}