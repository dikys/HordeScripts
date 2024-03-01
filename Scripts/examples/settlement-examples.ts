import { createGameMessageWithSound } from "library/common/messages";
import { createResourcesAmount } from "library/common/primitives";
import HordeExampleBase from "./base-example";


/**
 * Работа с поселением
 */
export class Example_SettlementWorks extends HordeExampleBase {

    public constructor() {
        super("Settlement works");
    }

    public onFirstRun() {
        this.logMessageOnRun();
        
        let realPlayer = players["0"].GetRealPlayer();
        let realSettlement = realPlayer.GetRealSettlement();

        // Дипломатия
        let diplomacy = realSettlement.Diplomacy;
        let otherSettlement = players["1"].GetRealPlayer().GetRealSettlement();
        if (diplomacy.IsWarStatus(otherSettlement)) {
            this.log.info(`${realSettlement.LeaderName} ВОЮЕТ с ${otherSettlement.LeaderName}!`);
        } else {
            this.log.info(`${realSettlement.LeaderName} НЕ воюет с ${otherSettlement.LeaderName}!`);
        }

        // Модуль вИдения
        // Примеры см. в "Example_ScenaWorks"
        // let vision = realSettlement.Vision;

        // Юниты поселения
        let units = realSettlement.Units;
        this.log.info(`Количество юнитов:`, units.Count);
        // Здесь можно получать юнитов только по идентификатору, а по координатам см. через сцену.
        let unit = HordeUtils.call(units, "GetById", 0);
        if (unit) {
            this.log.info(`У ${realPlayer.Nickname} обнаружен юнит с id=0: ${unit.ToString()}`);
        }

        // Перечисление юнитов этого поселения
        let enumerator = units.GetEnumerator();
        while(enumerator.MoveNext()) {
            this.log.info('Первый юнит:', enumerator.Current.ToString());
            break;  // Через ForEach пока что нельзя делать break, а через использование enumerator'а можно
        }
        enumerator.Dispose();

        // Объявить поражение
        let existence = realSettlement.Existence;
        // Убрать false и тогда этому поселению будет засчитано поражение
        if (false) { existence.ForceTotalDefeat(); }
    }
}


/**
 * Работа с ресурсами поселения
 */
export class Example_SettlementResources extends HordeExampleBase {

    public constructor() {
        super("Settlement resources");
    }

    public onFirstRun() {
        this.logMessageOnRun();
        
        let realPlayer = players["0"].GetRealPlayer();
        let realSettlement = realPlayer.GetRealSettlement();

        // Высокоуровневый объект для управления ресурсами поселения
        let settlementResources = realSettlement.Resources;
        this.log.info("Ресурсы:", settlementResources.ToString());
        // let resoucesAmount = HordeUtils.getValue(settlementResources, "Resources");

        // Прибавим ресурсы
        let addRes = createResourcesAmount(100, 100, 100, 10);
        settlementResources.AddResources(addRes);

        // Отнимем ресуры
        let subRes = createResourcesAmount(90, 300, 90, 9);
        if(!settlementResources.TakeResourcesIfEnough(subRes)) {
            this.log.info("Ресурсов недостаточно!");
        }
        this.log.info("Теперь ресурсов:", settlementResources.ToString());

        // Ещё у settlementResources есть следующие методы:
        //   TakeResources - забрать без проверки количества
        //   SetResources - установить значение
    }
}


/**
 * Ещё один пример работы с ресурсами послеения.
 * Устанавливает фиксированное количество ресурсов игрокам заданным в "settlements".
 */
export class Example_SettlementResources_2 extends HordeExampleBase {
    private settlements: Array<string>;

    private gold: number;
    private metal: number;
    private lumber: number;
    private people: number;

    public constructor() {
        super("Set resources");

        this.settlements = ["0"];

        this.gold = 50;
        this.metal = 50;
        this.lumber = 10;
        this.people = 0;
    }

    public onFirstRun() {
        this.logMessageOnRun();
        
        let scenaSettlements = scena.GetRealScena().Settlements;
        for (let settlementId of this.settlements) {
            let settlement = scenaSettlements.GetByUid(settlementId);
            let amount = createResourcesAmount(this.gold, this.metal, this.lumber, this.people);
            settlement.Resources.SetResources(amount);

            let msg = createGameMessageWithSound(`[${this.exampleDisplayName}] Установлены ресуры: ${amount.ToString()}`);
            settlement.Messages.AddMessage(msg);
        }
    }

    public onEveryTick(gameTickNum: number) {
        // Do nothing
    }
}


/**
 * Информация о юнитах поселения
 */
export class Example_SettlementUnitsInfo extends HordeExampleBase {

    public constructor() {
        super("Settlement units info");
    }

    public onFirstRun() {
        this.logMessageOnRun();
        
        let realPlayer = players["0"].GetRealPlayer();
        let realSettlement = realPlayer.GetRealSettlement();
        let that = this;

        // Юниты разных типов
        let professionCenter = realSettlement.Units.Professions;
        this.log.info('Выбор юнита по типу:');
        let logUnit = function(str, u) { that.log.info(str+':', u ? u.ToString() : '<None>') };
        logUnit('- Первый в MainBuildings', professionCenter.MainBuildings.First());
        logUnit('- Первый в Barracks', professionCenter.Barracks.First());
        logUnit('- Первый в Factories', professionCenter.Factories.First());
        logUnit('- Первый в Stables', professionCenter.Stables.First());
        logUnit('- Первый в Sawmills', professionCenter.Sawmills.First());
        logUnit('- Первый в MetalStocks', professionCenter.MetalStocks.First());
        logUnit('- Первый в Workers', professionCenter.Workers.First());
        logUnit('- Первый в FreeWorkers', professionCenter.FreeWorkers.First());
        logUnit('- Первый в AllUnitsExceptPassive', professionCenter.AllUnitsExceptPassive.First());
        logUnit('- Первый в ProducingUnits', professionCenter.ProducingUnits.First());
        logUnit('- Первый в ProducingBuildings', professionCenter.ProducingBuildings.First());
        logUnit('- Первый в ActiveBuildings', professionCenter.ActiveBuildings.First());
        logUnit('- Первый в DevelopmentBoosterBuildings', professionCenter.DevelopmentBoosterBuildings.First());
        logUnit('- Первый в MaxGrowthSpeedIncreaseBuildings', professionCenter.MaxGrowthSpeedIncreaseBuildings.First());
        logUnit('- Первый в Harmless', professionCenter.Harmless.First());

        // Информация о производстве
        let settlementProduction = realSettlement.Production;
        let catapultCfg = HordeContent.GetUnitConfig("#UnitConfig_Slavyane_Catapult");
        this.log.info('В данный момент катапульт имеется:', professionCenter.CountUnitsOfType(catapultCfg));
        this.log.info('В данный момент катапульт производится:', settlementProduction.CountProducingNowUnits(catapultCfg));
    }
}
