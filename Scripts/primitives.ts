
var Primitives = primitives.HordeResurrection.Basic.Primitives;

/**
 * Создаёт объект HordeColor.
 * ClearScript почему-то не увидел имеющийся конструктор, где все цвета задаются аргументами, поэтому сделал через присваивание полей.
 */
function createHordeColor(a: number, r: number, g: number, b: number) {
    var color = host.newObj(Primitives.HordeColor);
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
    return host.newObj(Primitives.Geometry.Point2D, x, y);
}

/**
 * Создаёт объект Rect2D
 */
function createRect(x: number, y: number, w: number, h: number) {
    return host.newObj(Primitives.Geometry.Rect2D, x, y, w, h);
}

/**
 * Создаёт объект PreciseFraction
 * Это дробные числа с определенной, не плавающей точностью (сейчас это 3 знака после запятой)
 */
function createPF(i: number, f: number) {
    return host.newObj(Primitives.PreciseFraction, i, f);
}
