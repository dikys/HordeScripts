import { COMPONENT_TYPE } from "../../Components/IComponent";
import { SpawnEvent } from "../../Components/SpawnEvent";
import { IAttackingUnit } from "../IAttacingUnit";
import { OpCfgUidToCfg } from "../IConfig";

export class Config_Mercenary_Swordmen extends IAttackingUnit {
    public static CfgUid      : string = "#CastleFight_Mercenary_Swordmen";
    public static BaseCfgUid  : string = "#UnitConfig_Barbarian_Swordmen";
    public static spawnCount  : number = 60;

    constructor() { super(); }

    public static InitEntity() {
        IAttackingUnit.InitEntity.call(this);

        this.Entity.components.set(COMPONENT_TYPE.SPAWN_EVENT, new SpawnEvent(this.CfgUid, -1, this.spawnCount - 1));
        this.Entity.components.delete(COMPONENT_TYPE.BUFFABLE_COMPONENT);
    }

    public static InitConfig() {
        IAttackingUnit.InitConfig.call(this);

        ScriptUtils.SetValue(OpCfgUidToCfg[this.CfgUid], "Name", "Рыцарь");
        ScriptUtils.SetValue(OpCfgUidToCfg[this.CfgUid], "MaxHealth", 1000);
        ScriptUtils.SetValue(OpCfgUidToCfg[this.CfgUid], "Shield", 0);
        ScriptUtils.SetValue(OpCfgUidToCfg[this.CfgUid].MainArmament.ShotParams, "Damage", 500);
        ScriptUtils.SetValue(OpCfgUidToCfg[this.CfgUid].CostResources, "Gold", 400);
        ScriptUtils.SetValue(OpCfgUidToCfg[this.CfgUid], "ProductionTime", 250);
        ScriptUtils.SetValue(OpCfgUidToCfg[this.CfgUid], "Description",
            OpCfgUidToCfg[this.CfgUid].Description
            + (OpCfgUidToCfg[this.CfgUid].Description == "" ? "" : "\n")
            + "Теймуровцы не верят в нашу веру, поэтому святые духи на них не действуют."
            + "Нанять " + this.spawnCount + " рыцарей:\n"
        );
    }
}