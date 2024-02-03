
class AttentionSmokePlugin extends HordePluginBase {

    public constructor(name: String) {
        super(name);
    }

	public onFirstRun() {
		logi('AttentionSmokePlugin is in development now');
	}

	public everyTick(gameTickNum: number) {

	}

}
