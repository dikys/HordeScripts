
GameMessage = HCL.HordeClassLibrary.World.Simple.GameMessage;

/**
 * Отображает игровое сообщение без звука.
 */
function createGameMessageWithNoSound(text: number, color=null) {
    return GameMessage.CreateWithNoSound(text, color);
}

/**
 * Отображает игровое сообщение со звуком.
 */
function createGameMessageWithSound(text: number, color=null) {
    return GameMessage.CreateWithDefaultSound(text, color);
}

/**
 * Отобразить сообщение для всех поселений на карте.
 */
function broadcastMessage(text, color) {
    var settlements = enumerate(scena.GetRealScena().Settlements);

    var settlement;
    while ((settlement = eNext(settlements)) !== undefined) {
        var msg = createGameMessageWithSound(text, color);
        settlement.Messages.AddMessage(msg);
    } 
}
