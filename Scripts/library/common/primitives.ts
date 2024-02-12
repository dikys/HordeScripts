
// ===================================================
// --- Простые объекты

var Primitives = primitives.HordeResurrection.Basic.Primitives;
Point2D = Primitives.Geometry.Point2D;
Rect2D = Primitives.Geometry.Rect2D;
Box3D = Primitives.Geometry.Box3D;
PreciseFraction = Primitives.PreciseFraction;
HordeColor = Primitives.HordeColor;


/**
 * Создаёт объект HordeColor.
 * ClearScript почему-то не увидел имеющийся конструктор, где все цвета задаются аргументами, поэтому сделал через присваивание полей.
 */
function createHordeColor(a: number, r: number, g: number, b: number) {
    var color = host.newObj(HordeColor);
    color.A = a;
    color.R = r;
    color.G = g;
    color.B = b;
    return color;
}

/**
 * Создаёт объект Point2D
 */
function createPoint(x: number, y: number) {
    return host.newObj(Point2D, x, y);
}

/**
 * Создаёт объект Rect2D
 */
function createRect(x: number, y: number, w: number, h: number) {
    return host.newObj(Rect2D, x, y, w, h);
}

/**
 * Создаёт объект Box3D
 */
function createBox(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
    return host.newObj(Box3D, x1, y1, z1, x2, y2, z2);
}

/**
 * Создаёт объект PreciseFraction
 * Это дробные числа с определенной, не плавающей точностью (сейчас это 3 знака после запятой)
 */
function createPF(i: number, f: number) {
    return host.newObj(PreciseFraction, i, f);
}

// ===================================================
// --- Игровые объекты

ResourcesAmount = HCL.HordeClassLibrary.World.Simple.ResourcesAmount;

/**
 * Создаёт объект ResourcesAmount, в котором задано количество ресурсов.
 */
function createResourcesAmount(gold: number, metal: number, lumber: number, people: number) {
    return host.newObj(ResourcesAmount, gold, metal, lumber, people);
}
