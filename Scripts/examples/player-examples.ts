import { createGameMessageWithNoSound, createGameMessageWithSound } from "library/common/messages";
import { createHordeColor } from "library/common/primitives";
import HordeExampleBase from "./base-example";

/**
 * Пример работы с игроками
 */
export class Example_PlayerWorks extends HordeExampleBase {

    public constructor() {
        super("Player works");
    }

    public onFirstRun() {
        this.logMessageOnRun();
            
        // Глобальная переменная "players" - это массив с API для доступа к каждому игроку
        this.log.info('Количество игроков:', '"' + players.length + '"');

        for(let i in players) {
            let player = players[i];

            // Т.к. API ещё не разработано, ВРЕМЕННО прокинул реальный объект игрока
            // Здесь и далее в функии выполняется работа с реальными объектами (не API)
            let realPlayer = player.GetRealPlayer();
            this.log.info(`Игрок ${i}:`, `${realPlayer.Nickname}`);

            // Поселение игрока
            let realSettlement = realPlayer.GetRealSettlement();
            this.log.info(`  Предводитель: ${realSettlement.LeaderName}`);
            // Подробнее см. в примерах работы с поселением

            // Объект для бота
            let realMasterMind = HordeUtils.getValue(realPlayer, "MasterMind");
            if (realMasterMind){
                this.log.info(`  Характер:`, realMasterMind.Character.Description);
            } else {
                this.log.info(`  Управляется игроком`);
            }
            // Подробнее см. в примерах к MasterMind

            // Отправить текстовое сообщение игроку (вернее поселению игрока)
            let messages = realSettlement.Messages;
            var msg = createGameMessageWithNoSound(`Привет, ${realPlayer.Nickname}!`);
            messages.AddMessage(msg);
            var msg = createGameMessageWithSound(`А вот цветной текст со звуком`, createHordeColor(255, 150, 150, 255));
            messages.AddMessage(msg);
            // Можно ещё разукрашивать отдельные слова, но это покажу потом
        }
    }
}
