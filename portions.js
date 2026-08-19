// Конфигурация групп питания и правил пересчёта в порции.
// unitsPerPortion — сколько единиц (граммов / штук / ложек) составляют 1 порцию.
// portions = количество / unitsPerPortion

export const CATEGORIES = [
  {
    key: "Белки",
    label: "Белки",
    color: "#A6553C",
    dayTarget: 10,
    subtypes: [
      { key: "animal", label: "Мясо, рыба, сыр", unit: "г", unitsPerPortion: 30 },
      { key: "cottage", label: "Творог", unit: "г", unitsPerPortion: 50 },
      { key: "yogurt", label: "Йогурт", unit: "баночка", unitsPerPortion: 1 },
      { key: "egg", label: "Яйцо", unit: "шт", unitsPerPortion: 1 },
      { key: "plant", label: "Растительный (тофу, орехи и т.п.)", unit: "г", unitsPerPortion: 70 },
    ],
  },
  {
    key: "Углеводы",
    label: "Углеводы",
    color: "#C99A46",
    dayTarget: 6.5,
    dayTargetLabel: "6–7",
    subtypes: [
      { key: "bread", label: "Хлеб", unit: "г", unitsPerPortion: 25 },
      { key: "grain", label: "Крупы / крахмалистые / бобовые", unit: "г", unitsPerPortion: 70 },
    ],
  },
  {
    key: "Фрукты",
    label: "Фрукты",
    color: "#C15B72",
    dayTarget: 4,
    subtypes: [
      { key: "fresh", label: "Свежие", unit: "г", unitsPerPortion: 100 },
      { key: "dried", label: "Сухофрукты", unit: "г", unitsPerPortion: 15 },
    ],
  },
  {
    key: "Овощи",
    label: "Овощи",
    color: "#5E7C4F",
    dayTarget: 5,
    subtypes: [{ key: "veg", label: "Овощи", unit: "г", unitsPerPortion: 100 }],
  },
  {
    key: "Жиры",
    label: "Жиры",
    color: "#8A6A3D",
    dayTarget: 3,
    subtypes: [
      { key: "nuts", label: "Орехи", unit: "г", unitsPerPortion: 15 },
      { key: "avocado", label: "Авокадо", unit: "шт", unitsPerPortion: 0.5 },
      { key: "butter", label: "Масло", unit: "ст.л.", unitsPerPortion: 1 },
    ],
  },
  {
    key: "Молоко",
    label: "Молоко",
    color: "#6E85A0",
    dayTarget: 1,
    dayTargetLabel: "0–2",
    subtypes: [{ key: "milk", label: "Молочные продукты", unit: "мл", unitsPerPortion: 100 }],
  },
];

export const MEALS = ["Завтрак", "Обед", "Перекус", "Ужин"];

// Норма по приёмам пищи (порции) — только для групп, где она была задана изначально
export const MEAL_TARGETS = {
  "Завтрак": { Белки: 3, Углеводы: 2, Фрукты: 1, Овощи: 0.5 },
  "Обед": { Белки: 3, Углеводы: 2, Фрукты: 1.5, Овощи: 2 },
  "Перекус": { Белки: 1, Углеводы: 1, Фрукты: 1.5, Овощи: 1 },
  "Ужин": { Белки: 3, Углеводы: 2, Овощи: 2 },
};

export const DEFAULT_WATER_TARGET_ML = 1500;

// Бобовые: одновременно белок и углевод. Вес делится пополам,
// каждая половина считается по своей норме (70 г = 1 порция).
export const LEGUMES_GRAMS_PER_HALF_PORTION = 70;

export function categoryByKey(key) {
  return CATEGORIES.find((c) => c.key === key);
}

export function subtypeByKey(catKey, subKey) {
  const cat = categoryByKey(catKey);
  return cat?.subtypes.find((s) => s.key === subKey);
}

// Округление до 0.1 порции по умолчанию
export function calcPortions(catKey, subKey, quantity) {
  const sub = subtypeByKey(catKey, subKey);
  if (!sub || !quantity || quantity <= 0) return 0;
  const raw = quantity / sub.unitsPerPortion;
  return Math.round(raw * 10) / 10;
}

export function fmt(n) {
  const r = Math.round(n * 10) / 10;
  const s = Number.isInteger(r) ? String(r) : String(r.toFixed(1));
  return s.replace(".", ",");
}
