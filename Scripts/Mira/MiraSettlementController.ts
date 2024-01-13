
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
    
    private subcontrollers: Array<MiraSubcontroller>;
    private state: MiraSettlementControllerState;

    constructor (controlledSettlement, settlementMM, controlledPlayer) {
        this.Settlement = controlledSettlement;
        this.Player = controlledPlayer;
        this.MasterMind = settlementMM;

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
        if (this.state) {
            this.Log(MiraLogLevel.Debug, "Leaving state " + this.state.toString())
            this.state.OnExit();
        }
        
        this.Log(MiraLogLevel.Debug, "Entering state " + this.state.toString())
        this.state = value;
        this.state.OnEntry();
    }
    
    Tick(tickNumber: number): void {
        this.state.Tick(tickNumber);

        for (var subcontroller of this.subcontrollers) {
            subcontroller.Tick(tickNumber);
        }
    }

    Log(level: MiraLogLevel, message: string): void {
        var logMessage = "[Settlement '" + this.Player.Nickname + "'] " + message;
        Mira.Log(level, logMessage);
    }

    GetCurrentEconomyComposition(): Map<string, number> {
        var currentComposition: Map<string, number>;
        
        var units = enumerate(this.Settlement.Units);
        var unit;
        
        while ((unit = eNext(units)) !== undefined) {
            currentComposition[unit.Cfg.Uid]++;
        }

        return currentComposition;
    }
}