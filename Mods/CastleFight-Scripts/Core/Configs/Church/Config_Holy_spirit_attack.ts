import { createHordeColor } from "library/common/primitives";
import { IConfig, OpCfgUidToCfg } from "../IConfig";
import { BUFF_TYPE } from "../../Components/BuffableComponent";
import { BuffComponent } from "../../Components/BuffComponent";
import { COMPONENT_TYPE } from "../../Components/IComponent";
import { UnitComponent } from "../../Components/UnitComponent";

export class Config_Holy_spirit_attack extends IConfig {
    public static CfgUid      : string = "#CastleFight_Holy_spirit_attack";
    public static BaseCfgUid  : string = "#UnitConfig_Slavyane_Raider";

    constructor() { super(); }

    public static InitEntity() {
        IConfig.InitEntity.call(this);

        this.Entity.components.set(COMPONENT_TYPE.UNIT_COMPONENT, new UnitComponent(null, this.CfgUid));
        this.Entity.components.set(COMPONENT_TYPE.BUFF_COMPONENT, new BuffComponent(BUFF_TYPE.ATTACK));
    }

    public static InitConfig() {
        IConfig.InitConfig.call(this);

        // имя
        ScriptUtils.SetValue(OpCfgUidToCfg[this.CfgUid], "Name", "Святой дух атаки");
        // описание
        // ScriptUtils.SetValue(OpCfgUidToCfg[this.CfgUid], "Description", "Тот кого ударит данный дух, получит его силу\n" +
        //     "Увеличение урона в 5 раз (макс 1 000)\n" +
        //     "Для дальнего боя:\n" +
        //     "Увеличение дальности атаки, видимости на 2 (макс 13)\n" +
        //     "Увеличение снарядов на 2 (макс 5)"
        // );
        ScriptUtils.SetValue(OpCfgUidToCfg[this.CfgUid], "Description", "Тот кого ударит данный дух, получит его силу\n" +
            "Ближники: урон х5\n" +
            "Дальники: урон х5 (макс 1000), число снарядов +2 (макс 5)\n" +
            "Маги и техника: урон x5 (макс 1000)\n"
        );
        // здоровье
        ScriptUtils.SetValue(OpCfgUidToCfg[this.CfgUid], "MaxHealth", 1);
        // делаем урон = 0
        ScriptUtils.SetValue(OpCfgUidToCfg[this.CfgUid].MainArmament.ShotParams, "Damage", 0);
        // меняем цвет
        ScriptUtils.SetValue(OpCfgUidToCfg[this.CfgUid], "TintColor", createHordeColor(150, 150, 0, 0));
        // время постройки
        ScriptUtils.SetValue(OpCfgUidToCfg[this.CfgUid], "ProductionTime", 1500);
    }
}