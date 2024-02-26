import { broadcastMessage } from "library/common/messages";
import { createPF, createPoint, createHordeColor } from "library/common/primitives";
import { spawnBullet } from "library/game-logic/bullet-spawn";
import { BulletCombatParams, UnitMapLayer } from "library/game-logic/horde-types";
import HordeExampleBase from "./base-example";


/**
 * Пример создания большого количества снарядов
 */
export class Example_SpawnBulletsRain extends HordeExampleBase {

    public constructor() {
        super("Spawn bullets rain");
    }

    public onFirstRun() {
        this.logMessageOnRun();
        this._spawnBulletsRain();
    }

    private _spawnBulletsRain() {
        let realScena = scena.GetRealScena();
        let settlement_0 = realScena.Settlements.Item.get('0');  // Олег

        // Любой юнит, от имени которого будет отправлена стрела
        let someUnit = settlement_0.Units.GetCastleOrAnyUnit();

        // Конфиги снарядов
        let arrowCfg = HordeContent.GetBulletConfig("#BulletConfig_Arrow");
        let bombCfg = HordeContent.GetBulletConfig("#BulletConfig_CatapultBomb");

        // Характеристики выстрела
        let combatParams = BulletCombatParams.CreateInstance();
        HordeUtils.setValue(combatParams, "Damage", 4);
        HordeUtils.setValue(combatParams, "AdditiveBulletSpeed", createPF(0, 0));

        // Функция-обертка для упрощения создания снарядов
        let createBull = function(cfg, start, finish) {
            let bull = spawnBullet(
                someUnit,
                null,
                null,
                cfg,
                combatParams,
                start,
                finish,
                UnitMapLayer.Main
            );
            return bull;
        }
        
        // Рандомизатор
        let rnd = realScena.Context.Randomizer;

        // Функция для создания снаряда со случайным полетом
        let createBullRnd = function(cfg) {
            // Старт снаряда генерируем наверху карты
            let start = createPoint(rnd.RandomNumber(0,32*48), rnd.RandomNumber(0,32));

            // Цель снаряда в квадрате (16; 16) - (32; 32)
            let end = createPoint(rnd.RandomNumber(32*16,32*32), rnd.RandomNumber(32*16,32*32));

            // Создание снаряда
            return createBull(cfg, start, end);
        }

        // А теперь развлекаемся!
        broadcastMessage("Внимание! По прогнозу дождь из стрел, местами град! O_O", createHordeColor(255, 255, 50, 10));
        let n = 0;
        for (let i = 0; i < 200; i++) {
            createBullRnd(arrowCfg);
            n++;
        }
        for (let i = 0; i < 20; i++) {
            createBullRnd(bombCfg);
            n++;
        }
        this.logi('Создано', n, 'снарядов');
    }
}
