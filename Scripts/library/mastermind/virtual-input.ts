
export const VirtualSelectUnitsMode = HordeEngine.HordeResurrection.Engine.Logic.Battle.InputSystem.Enums.VirtualSelectUnitsMode;
export const AssignOrderMode = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.AssignOrderMode;


export class VirtualInput {
	public static selectUnits(player, cellStart, cellEnd, selectMode = VirtualSelectUnitsMode.Select) {
		if(!this._checkPlayerIsLocal(player))
			return;
	
		let VirtualSelectUnits = HordeEngine.HordeResurrection.Engine.Logic.Battle.InputSystem.InputItems.VirtualSelectUnits;
		let vii = host.newObj(VirtualSelectUnits, player, selectMode, cellStart, cellEnd);
		this._inputPush(vii);
	}
	
	public static selectUnitsById(player, ids, selectMode = VirtualSelectUnitsMode.Select) {
		if(!this._checkPlayerIsLocal(player))
			return;
	
		let UnitIdLabel = HCL.HordeClassLibrary.World.Objects.Units.UnitIdLabel;
		let csIds = host.newArr(UnitIdLabel, ids.length);
		for(let i = 0; i < ids.length; i++) {
			csIds[i] = host.newObj(UnitIdLabel, ids[i], player.GetRealSettlement().Uid);
		}
	
		let VirtualSelectUnitsById = HordeEngine.HordeResurrection.Engine.Logic.Battle.InputSystem.InputItems.VirtualSelectUnitsById;
		let vii = host.newObj(VirtualSelectUnitsById, player, selectMode, csIds);
		this._inputPush(vii);
	}
	
	public static smartClick(player, cell, assignMode = AssignOrderMode.Replace) {
		if(!this._checkPlayerIsLocal(player))
			return;
	
		let VirtualSmartMouseClick = HordeEngine.HordeResurrection.Engine.Logic.Battle.InputSystem.InputItems.VirtualSmartMouseClick;
		let vii = host.newObj(VirtualSmartMouseClick, player, cell, assignMode);
		this._inputPush(vii);
	}
	
	public static pointBasedCommand(player, cell, cmd, assignMode = AssignOrderMode.Replace) {
		if(!this._checkPlayerIsLocal(player))
			return;
	
		let VirtualPointBasedCommand = HordeEngine.HordeResurrection.Engine.Logic.Battle.InputSystem.InputItems.VirtualPointBasedCommand;
		let vii = host.newObj(VirtualPointBasedCommand, player, cell, cmd, assignMode);
		this._inputPush(vii);
	}
	
	public static oneClickCommand(player, cmd, assignMode = AssignOrderMode.Replace) {
		if(!this._checkPlayerIsLocal(player))
			return;
	
		let VirtualOneClickCommand = HordeEngine.HordeResurrection.Engine.Logic.Battle.InputSystem.InputItems.VirtualOneClickCommand;
		let vii = host.newObj(VirtualOneClickCommand, player, cmd, assignMode);
		this._inputPush(vii);
	}
	
	public static produceBuildingCommand(player, productCfg, cellStart, cellEnd, assignMode = AssignOrderMode.Replace) {
		if(!this._checkPlayerIsLocal(player))
			return;
	
		let VirtualProduceBuildingCommand = HordeEngine.HordeResurrection.Engine.Logic.Battle.InputSystem.InputItems.VirtualProduceBuildingCommand;
		let vii = host.newObj(VirtualProduceBuildingCommand, player);
		vii.CellStart = cellStart;
		vii.CellEnd = cellEnd;
		vii.ProductUnitConfigUid = productCfg;
		vii.AssignOrderMode = assignMode;
		if (cellEnd) {vii.CompoundStopOnNumber = 100;}
		this._inputPush(vii);
	}
	
	public static produceUnitCommand(player, productCfg, count, assignMode= AssignOrderMode.Replace) {
		if(!this._checkPlayerIsLocal(player))
			return;
	
		let VirtualProduceUnitCommand = HordeEngine.HordeResurrection.Engine.Logic.Battle.InputSystem.InputItems.VirtualProduceUnitCommand;
		let vii = host.newObj(VirtualProduceUnitCommand, player);
		vii.ProductUnitConfigUid = productCfg;
		vii.Count = count;
		vii.AssignOrderMode = assignMode;
		this._inputPush(vii);
	}
	
	private static _checkPlayerIsLocal(player) {
		return player.PlayerOrigin.ToString() == "Local";
	}

	private static _inputPush(vii) {
		HordeUtils.call(vii.InitiatorPlayer.VirtualInput, "AddLocalInput", vii);
	}
}
