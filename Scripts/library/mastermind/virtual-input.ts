
VirtualSelectUnitsMode = HordeEngine.HordeResurrection.Engine.Logic.Battle.InputSystem.Enums.VirtualSelectUnitsMode;
AssignOrderMode = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.AssignOrderMode;

function inputSelectUnits(player, cellStart, cellEnd, selectMode) {
    if(!_checkPlayerIsLocal(player))
        return;

	var VirtualSelectUnits = HordeEngine.HordeResurrection.Engine.Logic.Battle.InputSystem.InputItems.VirtualSelectUnits;
	if (selectMode === undefined) { selectMode = VirtualSelectUnitsMode.Select; }

	var vii = host.newObj(VirtualSelectUnits, player, selectMode, cellStart, cellEnd);
	_inputPush(vii);
}

function inputSelectUnitsById(player, ids, selectMode) {
    if(!_checkPlayerIsLocal(player))
        return;

	var UnitIdLabel = HCL.HordeClassLibrary.World.Objects.Units.UnitIdLabel;
	var VirtualSelectUnitsById = HordeEngine.HordeResurrection.Engine.Logic.Battle.InputSystem.InputItems.VirtualSelectUnitsById;
	if (selectMode === undefined) { selectMode = VirtualSelectUnitsMode.Select; }

    var csIds = host.newArr(UnitIdLabel, ids.length);
    for(var i = 0; i < ids.length; i++) {
    	csIds[i] = host.newObj(UnitIdLabel, ids[i], player.GetRealSettlement().Uid);
    }

	var vii = host.newObj(VirtualSelectUnitsById, player, selectMode, csIds);
	_inputPush(vii);
}

function inputSmartClick(player, cell, assignMode) {
    if(!_checkPlayerIsLocal(player))
        return;

	var VirtualSmartMouseClick = HordeEngine.HordeResurrection.Engine.Logic.Battle.InputSystem.InputItems.VirtualSmartMouseClick;
	if (assignMode === undefined) { assignMode = AssignOrderMode.Replace; }

	var vii = host.newObj(VirtualSmartMouseClick, player, cell, assignMode);
	_inputPush(vii);
}

function inputPointBasedCommand(player, cell, cmd, assignMode) {
    if(!_checkPlayerIsLocal(player))
        return;

	var VirtualPointBasedCommand = HordeEngine.HordeResurrection.Engine.Logic.Battle.InputSystem.InputItems.VirtualPointBasedCommand;
	if (assignMode === undefined) { assignMode = AssignOrderMode.Replace; }

	var vii = host.newObj(VirtualPointBasedCommand, player, cell, cmd, assignMode);
	_inputPush(vii);
}

function inputOneClickCommand(player, cmd, assignMode) {
    if(!_checkPlayerIsLocal(player))
        return;

	var VirtualOneClickCommand = HordeEngine.HordeResurrection.Engine.Logic.Battle.InputSystem.InputItems.VirtualOneClickCommand;
	if (assignMode === undefined) { assignMode = AssignOrderMode.Replace; }
	
	var vii = host.newObj(VirtualOneClickCommand, player, cmd, assignMode);
	_inputPush(vii);
}

function inputProduceBuildingCommand(player, productCfg, cellStart, cellEnd, assignMode) {
    if(!_checkPlayerIsLocal(player))
        return;

	var VirtualProduceBuildingCommand = HordeEngine.HordeResurrection.Engine.Logic.Battle.InputSystem.InputItems.VirtualProduceBuildingCommand;
	if (assignMode === undefined) { assignMode = AssignOrderMode.Replace; }
	
	var vii = host.newObj(VirtualProduceBuildingCommand, player);
	vii.CellStart = cellStart;
	vii.CellEnd = cellEnd;
	vii.ProductUnitConfigUid = productCfg;
	vii.AssignOrderMode = assignMode;
	if (cellEnd) {vii.CompoundStopOnNumber = 100;}
	_inputPush(vii);
}

function inputProduceUnitCommand(player, productCfg, count, assignMode) {
    if(!_checkPlayerIsLocal(player))
        return;

	var VirtualProduceUnitCommand = HordeEngine.HordeResurrection.Engine.Logic.Battle.InputSystem.InputItems.VirtualProduceUnitCommand;
	if (assignMode === undefined) { assignMode = AssignOrderMode.Replace; }
	
	var vii = host.newObj(VirtualProduceUnitCommand, player);
	vii.ProductUnitConfigUid = productCfg;
	vii.Count = count;
	vii.AssignOrderMode = assignMode;
	_inputPush(vii);
}



function _checkPlayerIsLocal(player) {
    return player.PlayerOrigin.ToString() == "Local";
}

function _inputPush(vii) {
	HordeUtils.call(vii.InitiatorPlayer.VirtualInput, "AddLocalInput", vii);
}
