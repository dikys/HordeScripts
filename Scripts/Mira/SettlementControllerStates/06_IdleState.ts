
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
    OnEntry(): void {
        this.refreshAttackersList();
        this.settlementController.TacticalController.Defend();
    }

    OnExit(): void {
        
    }

    Tick(tickNumber: number): void {
        if (tickNumber % 50 !== 0) {
            if (!this.settlementController.IsUnderAttack()) {
                this.settlementController.Log(MiraLogLevel.Debug, `Attack countered`);
                this.settlementController.State = new DevelopingState(this.settlementController);
                return;
            }
            else {
                this.refreshAttackersList();
            }
        }
    }

    private refreshAttackersList(): void {
        this.settlementController.AttackingSquads = [];
        let processedUnitIds = new Set<number>();

        //TODO: add enemy detection around expands
        let castle = this.settlementController.Settlement.Units.Professions.MainBuildings.First();
        let attackers = this.settlementController.GetEnemiesInArea(castle.Cell, this.settlementController.ENEMY_SEARCH_RADIUS);

        for (let unit of attackers) {
            if (processedUnitIds.has(unit.Id)) {
                continue;
            }

            let enemySquad = this.constructSquad(unit, processedUnitIds);
            this.settlementController.AttackingSquads.push(enemySquad);
        }
    }

    private constructSquad(unit: any, processedUnitIds: Set<number>): MiraSquad {
        const UNIT_SEARCH_RADIUS = 5;
        
        let enemies = this.settlementController.GetEnemiesInArea(unit.Cell, UNIT_SEARCH_RADIUS);
        let enemySettlement = unit.Owner;
        
        let newEnemies = enemies.filter((unit) => {return unit.Owner === enemySettlement});
        let currentEnemies = [];
        enemies = [];

        do {
            enemies.push(...newEnemies);
            currentEnemies = [...newEnemies];
            newEnemies = [];

            for (let enemy of currentEnemies) {
                if (processedUnitIds.has(enemy.Id)) {
                    continue;
                }

                processedUnitIds.add(enemy.Id);

                let friends = this.settlementController.GetEnemiesInArea(enemy.Cell, UNIT_SEARCH_RADIUS);
                friends.filter((unit) => {return unit.Owner === enemySettlement && !processedUnitIds.has(unit.Id)});

                newEnemies.push(...friends);
            }
        }
        while (newEnemies.length > 0);

        return new MiraSquad(enemies);
    }
}