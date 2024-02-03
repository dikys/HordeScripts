
// ===================================================
// --- Глобальные переменные

BattleController = HordeEngine.HordeResurrection.Engine.Logic.Battle.BattleController;
AllContent = HCL.HordeClassLibrary.HordeContent.AllContent;


// ===================================================
// --- Тайлы

// Unknown, Grass, Forest, Water, Marsh, Sand, Mounts, Road, Ice
TileType = HCL.HordeClassLibrary.HordeContent.Configs.Tiles.Stuff.TileType;
// None, Gold, Metal
ResourceTileType = HCL.HordeClassLibrary.World.Objects.Tiles.ResourceTileType;


// ===================================================
// --- Снаряды

BaseBullet = HCL.HordeClassLibrary.World.Objects.Bullets.BaseBullet;
BulletState = HCL.HordeClassLibrary.World.Objects.Bullets.BulletState;  // Unknown, Flying, Collided, OutOfScena, ReachedTheGoal
ScriptBullet = HCL.HordeClassLibrary.World.Objects.Bullets.Implementations.Other.ScriptBullet;


// ===================================================
// --- Конфиг юнита

UnitConfig = HCL.HordeClassLibrary.HordeContent.Configs.Units.UnitConfig;

BuildingConfig = HCL.HordeClassLibrary.HordeContent.Configs.Units.BuildingConfig;
UnitTechConfig = HCL.HordeClassLibrary.HordeContent.Configs.Units.UnitTechConfig;


// ===================================================
// --- Различные типы связанные с юнитами

BulletCombatParams = HCL.HordeClassLibrary.World.Objects.Bullets.BulletCombatParams;
DelegateWork = HCL.HordeClassLibrary.UnitComponents.Workers.Interfaces.AUnitWorkerCommon.DelegateWork;
Unit = HCL.HordeClassLibrary.World.Objects.Units.Unit;
KnownUnit = HCL.HordeClassLibrary.World.Objects.Units.KnownUnit;


// ===================================================
// --- Перечисления связанные с юнитами

CanNotAttackCause = HCL.HordeClassLibrary.UnitComponents.Enumerations.CanNotAttackCause;
CanNotBuildReason = HCL.HordeClassLibrary.UnitComponents.Enumerations.CanNotBuildReason;
CaptureCondition = HCL.HordeClassLibrary.UnitComponents.Enumerations.CaptureCondition;
CompoundPart = HCL.HordeClassLibrary.UnitComponents.Enumerations.CompoundPart;
PatternUnitFeature = HCL.HordeClassLibrary.UnitComponents.Enumerations.PatternUnitFeature;
ResourceItemType = HCL.HordeClassLibrary.UnitComponents.Enumerations.ResourceItemType;
UnitDeathType = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitDeathType;
UnitDirection = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitDirection;
UnitAnimDirection = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitAnimDirection;
UnitAnimState = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitAnimState;
UnitEffectFlag = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitEffectFlag;
UnitEventFlag = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitEventFlag;
UnitFlags = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitFlags;
UnitHealthLevel = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitHealthLevel;
UnitLifeState = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitLifeState;
UnitMapLayer = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitMapLayer;
UnitQueryFlag = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitQueryFlag;
UnitSpecification = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitSpecification;
UnitState = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitState;
UnitStateSpecial = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitStateSpecial;
UnitVisibility = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitVisibility;


// ===================================================
// --- Команды и приказы

UnitCommand = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.UnitCommand;

OneClickCommandArgs = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.CommandArgs.OneClickCommandArgs;  // (UnitCommand, AssignOrderMode)
PointCommandArgs = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.CommandArgs.PointCommandArgs;  // (Point2D, UnitCommand, AssignOrderMode)
ProduceAtCommandArgs = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.CommandArgs.ProduceAtCommandArgs;  // (AssignOrderMode, UnitConfig, Point2D, Point2D?, int?)
ProduceCommandArgs = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.CommandArgs.ProduceCommandArgs;  // (AssignOrderMode, UnitConfig, int)

OrderAttackParameters = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderAttackParameters;
OrderAttackUnit = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderAttackUnit;
OrderBuildingAttackUnit = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderBuildingAttackUnit;
OrderCapture = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderCapture;
OrderDeath = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderDeath;
OrderDestroySelf = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderDestroySelf;
OrderDoNothing = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderDoNothing;
OrderHarvestLumber = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderHarvestLumber;
OrderHoldPosition = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderHoldPosition;
OrderMine = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderMine;
OrderMoveAway = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderMoveAway;
OrderMoveOut = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderMoveOut;
OrderMoveToPoint = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderMoveToPoint;
OrderMoveToStock = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderMoveToStock;
OrderPanikMoving = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderPanikMoving;
OrderPanikStupor = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderPanikStupor;
OrderStepAwayImmediate = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderStepAwayImmediate;
OrderStepAwayWaiting = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderStepAwayWaiting;
OrderTurn = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderTurn;

OrderBuild = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderBuild;
OrderBuildParameters = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderBuildParameters;
OrderBuildSelf = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderBuildSelf;
OrderPreBuild = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderPreBuild;
OrderPreBuildParameters = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderPreBuildParameters;
OrderProduce = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderProduce;
OrderProduceAt = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderProduceAt;
OrderRepair = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderRepair;
OrderRepairParameters = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderRepairParameters;
OrderRepairSelf = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderRepairSelf;
