
/**
 * Плагин, который создаёт декорацию-метку в том месте на карте, где был зафиксирован Attention-клик (alt-клик)
 */
class AttentionOnSurfacePlugin extends HordePluginBase {
    private realScena: Scena;
    private smokeDecorationCfg: VisualEffectConfig;


    public constructor() {
        super("Attention on Surface");
        this.smokeDecorationCfg = HordeContent.GetVisualEffectConfig("#VisualEffectConfig_AttentionMark");
        this.realScena = scena.GetRealScena();
    }


    public onFirstRun() {
        // Обработчик alt-кликов
        this._setupAttentionClicksHandler();

        // Обработчик приёме alt-сообщений
        this._setupAttentionReceiver();
    }


    public onEveryTick(gameTickNum: number) {
        // Do nothing
    }


    private _setupAttentionClicksHandler() {
        if (AttentionOnSurface_Globals.attentionClickHandler) {
            AttentionOnSurface_Globals.attentionClickHandler.disconnect();
        }

        var AllUIModules = HordeUtils.GetTypeByName("HordeResurrection.Game.UI.AllUIModules, HordeResurrection.Game");
        var MouseScript = HordeUtils.getValue(AllUIModules, 'MouseScript');

        var that = this;
        AttentionOnSurface_Globals.attentionClickHandler = MouseScript.AttentionClick.connect((sender, args) => that._attentionHandler(sender, args));
    }


    private _setupAttentionReceiver() {
        if (AttentionOnSurface_Globals.attentionReceivedHandler) {
            AttentionOnSurface_Globals.attentionReceivedHandler.disconnect();
        }

        var AllUIModules = HordeUtils.GetTypeByName("HordeResurrection.Game.UI.AllUIModules, HordeResurrection.Game");
        var BattleUI = HordeUtils.getValue(AllUIModules, 'BattleUI');

        var that = this;
        AttentionOnSurface_Globals.attentionReceivedHandler = BattleUI.AttentionReceived.connect((sender, args) => that._attentionHandler(sender, args));
    }


    private _attentionHandler(sender, args) {
        try {
            var info: AttentionClickInfo = {
                tick: BattleController.GameTimer.GameFramesCounter,
                player: args.InitiatorPlayer,
                cell: args.Cell
            };

            this._createDecoration(info);
        } catch (ex) {
            logExc(ex);
        }
    }


    private _createDecoration(attentionInfo: AttentionClickInfo) {
        var position = createPoint(attentionInfo.cell.X * WorldConstants.CellSize + WorldConstants.HalfCellSize,
                                   attentionInfo.cell.Y * WorldConstants.CellSize + WorldConstants.HalfCellSize);
        var decoration = spawnDecoration(this.realScena, this.smokeDecorationCfg, position);
        decoration.TintColor = attentionInfo.player.GetRealSettlement().SettlementColor;
        decoration.ScaleX = 2;
        decoration.ScaleY = 2;
        decoration.IgnoreFogOfWar = true;
    }
}


/**
 * Данные Attention-клика.
 */
type AttentionClickInfo = {
    tick: number,
    player: any,
    cell: any
}

/**
 * Переменные, которые должны остаться при hotreload
 */
namespace AttentionOnSurface_Globals {
    var attentionClickHandler: (any, any) => void;
    var attentionReceivedHandler: (any, any) => void;
}
