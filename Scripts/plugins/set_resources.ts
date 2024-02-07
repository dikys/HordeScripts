
/**
 * Плагин для отладки. Устанавливает фиксированное количество ресурсов игроку.
 */
class SetResourcesPlugin extends HordePluginBase {
    private settlements: Array<number>;

    private gold: number;
    private metal: number;
    private lumber: number;
    private people: number;

    public constructor() {
        super("Set resources");

        this.settlements = [0];

        this.gold = 50;
        this.metal = 50;
        this.lumber = 10;
        this.people = 0;
    }

    public onFirstRun() {
        var scenaSettlements = scena.GetRealScena().Settlements;
        for (var settlNum of this.settlements) {
            var settlement = scenaSettlements.GetByUid(`${settlNum}`);
            var amount = createResourcesAmount(this.gold, this.metal, this.lumber, this.people);
            settlement.Resources.SetResources(amount);

            var msg = createGameMessageWithSound(`[SetResourcesPlugin] Установлены ресуры: ${amount.ToString()}`);
            settlement.Messages.AddMessage(msg);
        }
    }

    public onEveryTick(gameTickNum: number) {
        // Do nothing
    }
}
