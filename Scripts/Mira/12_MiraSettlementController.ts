
/* 
    Class that controls the entire life of a single settlement
*/

class MiraSettlementController {
    public Settlement: any;
    public MasterMind: any;
    public Player: any;

    public MiningController: MiningSubcontroller;
    public BuildingController: BuildingSubcontroller;
    public TrainingController: TrainingSubcontroller;
    public StrategyController: StrategySubcontroller;
    
    private subcontrollers: Array<MiraSubcontroller> = [];
    private state: MiraSettlementControllerState;
    private nextState: MiraSettlementControllerState;
    private currentUnitComposition: Map<string, number>;

    constructor (controlledSettlement, settlementMM, controlledPlayer) {
        this.Settlement = controlledSettlement;
        this.Player = controlledPlayer;
        this.MasterMind = settlementMM;

        if (!this.MasterMind.IsWorkMode) {
            this.Log(MiraLogLevel.Debug, "engaging MasterMind");
            this.MasterMind.IsWorkMode = true;
        }

        this.subcontrollers = [];

        this.MiningController = new MiningSubcontroller(this);
        this.subcontrollers.push(this.MiningController);

        this.BuildingController = new BuildingSubcontroller(this);
        this.subcontrollers.push(this.BuildingController);

        this.TrainingController = new TrainingSubcontroller(this);
        this.subcontrollers.push(this.TrainingController);

        this.StrategyController = new StrategySubcontroller(this);
        this.subcontrollers.push(this.StrategyController);

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

    GetCurrentEconomyComposition(): Map<string, number> {
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
}