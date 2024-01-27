
/* 
    Class that controls the entire life of a single settlement
*/

class MiraSettlementController {
    public readonly ENEMY_SEARCH_RADIUS = 24;
    
    public Settlement: any;
    public MasterMind: any;
    public Player: any;

    public MiningController: MiningSubcontroller;
    public ProductionController: ProductionSubcontroller;
    public StrategyController: StrategySubcontroller;
    public TacticalController: TacticalSubcontroller;
    
    public AttackingSquads: Array<MiraSquad> = [];
    
    private subcontrollers: Array<MiraSubcontroller> = [];
    private state: MiraSettlementControllerState;
    private nextState: MiraSettlementControllerState;
    private currentUnitComposition: UnitComposition;

    constructor (controlledSettlement, settlementMM, controlledPlayer) {
        this.Settlement = controlledSettlement;
        this.Player = controlledPlayer;
        this.MasterMind = settlementMM;

        if (!this.MasterMind.IsWorkMode) {
            this.Log(MiraLogLevel.Debug, "Engaging MasterMind");
            this.MasterMind.IsWorkMode = true;
        }

        this.subcontrollers = [];

        this.MiningController = new MiningSubcontroller(this);
        this.subcontrollers.push(this.MiningController);

        this.ProductionController = new ProductionSubcontroller(this);
        this.subcontrollers.push(this.ProductionController);

        this.StrategyController = new StrategySubcontroller(this);
        this.subcontrollers.push(this.StrategyController);

        this.TacticalController = new TacticalSubcontroller(this);
        this.subcontrollers.push(this.TacticalController);

        this.State = new DevelopingState(this);
    }

    public get State(): MiraSettlementControllerState {
        return this.State;
    }
    
    public set State(value: MiraSettlementControllerState) {
        this.nextState = value;
    }
    
    Tick(tickNumber: number): void {
        this.currentUnitComposition = undefined;
        
        if (this.nextState) {
            if (this.state) {
                this.Log(MiraLogLevel.Debug, "Leaving state " + this.state.constructor.name);
                this.state.OnExit();
            }
            
            this.state = this.nextState;
            this.nextState = null;
            this.Log(MiraLogLevel.Debug, "Entering state " + this.state.constructor.name);
            this.state.OnEntry();
        }
        
        for (var subcontroller of this.subcontrollers) {
            subcontroller.Tick(tickNumber);
        }

        this.state.Tick(tickNumber);
    }

    Log(level: MiraLogLevel, message: string): void {
        var logMessage = `[${this.Player.Nickname}] ${message}`;
        Mira.Log(level, logMessage);
    }

    GetCurrentEconomyComposition(): UnitComposition {
        if (!this.currentUnitComposition) {
            this.currentUnitComposition = new Map<string, number>();
        
            var units = enumerate(this.Settlement.Units);
            var unit;
            
            while ((unit = eNext(units)) !== undefined) {
                MiraUtils.IncrementMapItem(this.currentUnitComposition, unit.Cfg.Uid);
            }
        }

        return new Map(this.currentUnitComposition);
    }

    IsUnderAttack(): boolean {
        //TODO: add enemy detection around expands
        let castle = this.Settlement.Units.Professions.MainBuildings.First();
        let enemies = this.GetEnemiesInArea(castle.Cell, this.ENEMY_SEARCH_RADIUS);
        
        return enemies.length > 0;
    }

    GetEnemiesInArea(cell, radius): Array<any> {
        let units = MiraUtils.GetUnitsInArea(cell, radius);
        let enemies = units.filter((unit) => {return this.StrategyController.EnemySettlements.indexOf(unit.Owner) > -1});

        return enemies;
    }
}