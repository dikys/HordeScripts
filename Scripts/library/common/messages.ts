
export const GameMessage = HCL.HordeClassLibrary.World.Simple.GameMessage;

/**
 * Создать игровое сообщение без звука.
 */
export function createGameMessageWithNoSound(text: string, color=null) {
    return GameMessage.CreateWithNoSound(text, color);
}

/**
 * Создать игровое сообщение со звуком.
 */
export function createGameMessageWithSound(text: string, color=null) {
    return GameMessage.CreateWithDefaultSound(text, color);
}

/**
 * Отобразить сообщение для всех поселений на карте.
 */
export function broadcastMessage(text: string, color: HordeColor) {
    ForEach(scena.GetRealScena().Settlements, (settlement: Settlement) => {
        let msg = createGameMessageWithSound(text, color);
        settlement.Messages.AddMessage(msg);
    });
}
