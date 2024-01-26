
/**
 * Пример работы с игроками
 */
function example_playerWorks() {
    logi('> Запущен пример', '"' + arguments.callee.name + '"');

    // Глобальная переменная "players" - это массив с API для доступа к каждому игроку
    logi('  Количество игроков:', '"' + players.length + '"');

    for(var i in players) {
        player = players[i];

        // Т.к. API ещё не разработано, ВРЕМЕННО прокинул реальный объект игрока
        // Здесь и далее в функии выполняется работа с реальными объектами (не API)
        var realPlayer = player.GetRealPlayer();
        logi(`  Игрок ${i}:`, `${realPlayer.Nickname}`);

        // Поселение игрока
        var realSettlement = realPlayer.GetRealSettlement();
        logi(`    Предводитель: ${realSettlement.LeaderName}`);
        // Подробнее см. в примерах работы с поселением

        // Объект для бота
        var realMasterMind = HordeUtils.getValue(realPlayer, "MasterMind");
        if (realMasterMind){
            logi(`    Характер:`, realMasterMind.Character.Description);
        } else {
            logi(`    Управляется игроком`);
        }
        // Подробнее см. в примерах к MasterMind

        // Отправить текстовое сообщение игроку (вернее поселению игрока)
        var messages = realSettlement.Messages;
        var msg = createGameMessageWithNoSound(`Привет, ${realPlayer.Nickname}!`);
        messages.AddMessage(msg);
        var msg = createGameMessageWithSound(`И вот тебе цветной текст со звуком`, createHordeColor(255, 150, 150, 255));
        messages.AddMessage(msg);
        // Можно ещё разукрашивать отдельные слова, но это покажу потом
    }
}
