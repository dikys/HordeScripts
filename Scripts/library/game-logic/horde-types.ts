
// ===================================================
// --- Глобальные переменные

export const BattleController = HordeEngine.HordeResurrection.Engine.Logic.Battle.BattleController;
export const AllContent = HCL.HordeClassLibrary.HordeContentApi.AllContent;
export const WorldConstants = HCL.HordeClassLibrary.World.Const.WorldConstants;


// ===================================================
// --- Сцена

export const Scena = HCL.HordeClassLibrary.World.ScenaComponents.Scena;


// ===================================================
// --- Тайлы

// Unknown, Grass, Forest, Water, Marsh, Sand, Mounts, Road, Ice
export const TileType = HCL.HordeClassLibrary.HordeContentApi.Configs.Tiles.Stuff.TileType;

// None, Gold, Metal
export const ResourceTileType = HCL.HordeClassLibrary.World.Objects.Tiles.ResourceTileType;

// None, Scorched, Chopped, Exploded, ...
export const TilePayload = HCL.HordeClassLibrary.HordeContentApi.Configs.Tiles.Stuff.TilePayload;

// ===================================================
// --- Снаряды

export const BaseBullet = HCL.HordeClassLibrary.World.Objects.Bullets.BaseBullet;
export const BulletState = HCL.HordeClassLibrary.World.Objects.Bullets.BulletState;  // Unknown, Flying, Collided, OutOfScena, ReachedTheGoal
export const ScriptBullet = HCL.HordeClassLibrary.World.Objects.Bullets.Implementations.Other.ScriptBullet;


// ===================================================
// --- Конфиг юнита

export const UnitConfig = HCL.HordeClassLibrary.HordeContentApi.Configs.Units.UnitConfig;

export const BuildingConfig = HCL.HordeClassLibrary.HordeContentApi.Configs.Units.BuildingConfig;
export const UnitTechConfig = HCL.HordeClassLibrary.HordeContentApi.Configs.Units.UnitTechConfig;


// ===================================================
// --- Различные типы связанные с юнитами

export const Unit = HCL.HordeClassLibrary.World.Objects.Units.Unit;
export const KnownUnit = HCL.HordeClassLibrary.World.Objects.Units.KnownUnit;
export const UnitArmament = HCL.HordeClassLibrary.UnitComponents.BattleSystem.UnitArmament;
export const BulletCombatParams = HCL.HordeClassLibrary.World.Objects.Bullets.BulletCombatParams;


// ===================================================
// --- Перечисления связанные с юнитами

export const CanNotAttackCause = HCL.HordeClassLibrary.UnitComponents.Enumerations.CanNotAttackCause;
export const CanNotBuildReason = HCL.HordeClassLibrary.UnitComponents.Enumerations.CanNotBuildReason;
export const CaptureCondition = HCL.HordeClassLibrary.UnitComponents.Enumerations.CaptureCondition;
export const CompoundPart = HCL.HordeClassLibrary.UnitComponents.Enumerations.CompoundPart;
export const PatternUnitFeature = HCL.HordeClassLibrary.UnitComponents.Enumerations.PatternUnitFeature;
export const ResourceItemType = HCL.HordeClassLibrary.UnitComponents.Enumerations.ResourceItemType;
export const UnitDeathType = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitDeathType;
export const UnitDirection = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitDirection;
export const UnitAnimDirection = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitAnimDirection;
export const UnitAnimState = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitAnimState;
export const UnitEffectFlag = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitEffectFlag;
export const UnitEventFlag = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitEventFlag;
export const UnitFlags = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitFlags;
export const UnitHealthLevel = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitHealthLevel;
export const UnitLifeState = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitLifeState;
export const UnitMapLayer = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitMapLayer;
export const UnitQueryFlag = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitQueryFlag;
export const UnitSpecification = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitSpecification;
export const UnitState = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitState;
export const UnitStateSpecial = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitStateSpecial;
export const UnitVisibility = HCL.HordeClassLibrary.UnitComponents.Enumerations.UnitVisibility;


// ===================================================
// --- Команды и приказы

export const UnitCommand = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.UnitCommand;

export const OneClickCommandArgs = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.CommandArgs.OneClickCommandArgs;  // (UnitCommand, AssignOrderMode)
export const PointCommandArgs = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.CommandArgs.PointCommandArgs;  // (Point2D, UnitCommand, AssignOrderMode)
export const ProduceAtCommandArgs = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.CommandArgs.ProduceAtCommandArgs;  // (AssignOrderMode, UnitConfig, Point2D, Point2D?, int?)
export const ProduceCommandArgs = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.CommandArgs.ProduceCommandArgs;  // (AssignOrderMode, UnitConfig, int)

export const OrderAttackParameters = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderAttackParameters;
export const OrderAttackUnit = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderAttackUnit;
export const OrderBuildingAttackUnit = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderBuildingAttackUnit;
export const OrderCapture = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderCapture;
export const OrderDeath = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderDeath;
export const OrderDestroySelf = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderDestroySelf;
export const OrderDoNothing = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderDoNothing;
export const OrderHarvestLumber = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderHarvestLumber;
export const OrderHoldPosition = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderHoldPosition;
export const OrderMine = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderMine;
export const OrderMoveAway = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderMoveAway;
export const OrderMoveOut = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderMoveOut;
export const OrderMoveToPoint = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderMoveToPoint;
export const OrderMoveToStock = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderMoveToStock;
export const OrderPanikMoving = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderPanikMoving;
export const OrderPanikStupor = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderPanikStupor;
export const OrderStepAwayImmediate = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderStepAwayImmediate;
export const OrderStepAwayWaiting = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderStepAwayWaiting;
export const OrderTurn = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderTurn;

export const OrderBuild = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderBuild;
export const OrderBuildParameters = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderBuildParameters;
export const OrderBuildSelf = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderBuildSelf;
export const OrderPreBuild = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderPreBuild;
export const OrderPreBuildParameters = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderPreBuildParameters;
export const OrderProduce = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderProduce;
export const OrderProduceAt = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderProduceAt;
export const OrderRepair = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderRepair;
export const OrderRepairParameters = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderRepairParameters;
export const OrderRepairSelf = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Orders.OrderRepairSelf;

export const StateMotion = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Motions.StateMotion;

export const AMotionBase = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Motions.AMotionBase;
export const MotionHit = HCL.HordeClassLibrary.UnitComponents.OrdersSystem.Motions.MotionHit;

// Обработчики
export const ScriptUnitWorkerState = HCL.HordeClassLibrary.UnitComponents.Workers.Script.ScriptUnitWorkerState;
export const ScriptUnitWorkerEveryTick = HCL.HordeClassLibrary.UnitComponents.Workers.Script.ScriptUnitWorkerEveryTick;

// ===================================================
// --- Конфиги

export const BulletConfig = HCL.HordeClassLibrary.HordeContentApi.Configs.Bullets.BulletConfig;
export const Force = HCL.HordeClassLibrary.HordeContentApi.Configs.Army.Force;
export const RuleConfig = HCL.HordeClassLibrary.HordeContentApi.Configs.Rules.RuleConfig;
export const SoundEffectConfig = HCL.HordeClassLibrary.HordeContentApi.Configs.SoundEffects.SoundEffectConfig;
export const SoundsCatalog = HCL.HordeClassLibrary.HordeContentApi.Configs.ViewResourceCatalogs.Audio.SoundsCatalog;
export const BackgroundAnimationsCatalog = HCL.HordeClassLibrary.HordeContentApi.Configs.ViewResourceCatalogs.Graphics.Specialization.BackgroundAnimationsCatalog;
export const BulletAnimationsCatalog = HCL.HordeClassLibrary.HordeContentApi.Configs.ViewResourceCatalogs.Graphics.Specialization.BulletAnimationsCatalog;
export const ButtonAnimationsCatalog = HCL.HordeClassLibrary.HordeContentApi.Configs.ViewResourceCatalogs.Graphics.Specialization.ButtonAnimationsCatalog;
export const DecayAnimationsCatalog = HCL.HordeClassLibrary.HordeContentApi.Configs.ViewResourceCatalogs.Graphics.Specialization.DecayAnimationsCatalog;
export const FontCatalog = HCL.HordeClassLibrary.HordeContentApi.Configs.ViewResourceCatalogs.Graphics.Specialization.FontCatalog;
export const SimpleAnimationsCatalog = HCL.HordeClassLibrary.HordeContentApi.Configs.ViewResourceCatalogs.Graphics.Specialization.SimpleAnimationsCatalog;
export const UnitAnimationsCatalog = HCL.HordeClassLibrary.HordeContentApi.Configs.ViewResourceCatalogs.Graphics.Specialization.UnitAnimationsCatalog;
export const VisualEffectConfig = HCL.HordeClassLibrary.HordeContentApi.Configs.VisualEffects.VisualEffectConfig;
export const UnitCommandConfig = HCL.HordeClassLibrary.HordeContentApi.Configs.UnitCommandConfig;
export const MindCharacterConfig = HCL.HordeClassLibrary.HordeContentApi.Configs.MasterMind.MindCharacterConfig;


// ===================================================
// --- Прочее

export const AnimatorScriptTasks = HCL.HordeClassLibrary.HordeContentApi.ViewResources.Graphics.InternalLogic.Tasks.AnimatorScriptTasks;

