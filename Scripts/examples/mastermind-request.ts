import HordeExampleBase from "./base-example";

/**
 * Пример работы с MasterMind
 */
export class Example_MasterMindRequest extends HordeExampleBase {

    public constructor() {
        super("Request for MasterMind");
    }

    public onFirstRun() {
        this.logMessageOnRun();
        
        let realPlayer = players["1"].GetRealPlayer();
        let masterMind = HordeUtils.getValue(realPlayer, "MasterMind");
        if (!masterMind) {
            this.logi('Выбранный игрок не управляется MasterMind.');
            return;
        }

        // Активация бота, если отключен
        if (!masterMind.IsWorkMode) {
            this.logi('Включение режима работы MasterMind для', realPlayer.Nickname);
            masterMind.IsWorkMode = true;
        }

        // Создадим запрос на производство катапульты
        let productionDepartament = masterMind.ProductionDepartment;
        let catapultCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Catapult");
        if (!productionDepartament.AddRequestToProduce(catapultCfg, 1)) {
            this.logi('Не удалось добавить запрос на создание катапульты.');
        } else {
            this.logi('Добавлен запрос на создание 1 катапульты.');
        }

        // Проверяем запросы
        let requests = masterMind.Requests;
        this.logi('Запросов в обработке:', requests.Count);
        ForEach(requests, item => {
            this.logi('-', item.ToString());
        });
    }
}
