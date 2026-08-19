import React, { useState, useEffect, useRef } from "react";
import { X, Check } from "lucide-react";
import { CATEGORIES, categoryByKey, calcPortions, fmt, LEGUMES_GRAMS_PER_HALF_PORTION } from "./portions";

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

function uid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch (e) { /* fall through */ }
  return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
}

const LEGUMES_KEY = "__legumes__";

export default function EntryForm({ meal, initial, onSave, onCancel }) {
  const [dish, setDish] = useState(initial?.dish || "");
  const [time, setTime] = useState(initial?.time || nowTime());
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0].key);
  const [subtype, setSubtype] = useState(
    initial?.subtype || categoryByKey(initial?.category || CATEGORIES[0].key)?.subtypes[0]?.key
  );
  const [quantity, setQuantity] = useState(initial?.quantity ?? "");
  const [note, setNote] = useState(initial?.note || "");
  const firstRef = useRef(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  // При смене категории — подбираем безопасный подтип
  useEffect(() => {
    if (category === LEGUMES_KEY) return;
    const cat = categoryByKey(category);
    if (cat && !cat.subtypes.some((s) => s.key === subtype)) {
      setSubtype(cat.subtypes[0].key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const isLegumes = category === LEGUMES_KEY;
  const cat = !isLegumes ? categoryByKey(category) : null;
  // Защита от рассинхронизации category/subtype между рендерами
  const sub = !isLegumes ? (cat?.subtypes.find((s) => s.key === subtype) || cat?.subtypes[0]) : null;

  const qtyNum = parseFloat(String(quantity).replace(",", ".")) || 0;
  const portions = !isLegumes && sub ? calcPortions(category, sub.key, qtyNum) : 0;

  const half = qtyNum / 2;
  const legumesPortion = Math.round((half / LEGUMES_GRAMS_PER_HALF_PORTION) * 10) / 10;

  const submit = (e) => {
    e.preventDefault();
    if (!dish.trim() || qtyNum <= 0) return;

    if (isLegumes) {
      // Бобовые: одна запись превращается в две — белок и углеводы
      const base = { meal, time: time || null, note: note.trim() || null };
      onSave([
        {
          id: initial?.id,
          ...base,
          dish: dish.trim() + " (белок)",
          category: "Белки",
          subtype: "plant",
          quantity: half,
          unit: "г",
          portions: legumesPortion,
        },
        {
          id: initial?.id ? uid() : undefined,
          ...base,
          dish: dish.trim() + " (углеводы)",
          category: "Углеводы",
          subtype: "grain",
          quantity: half,
          unit: "г",
          portions: legumesPortion,
        },
      ]);
      return;
    }

    onSave({
      id: initial?.id,
      meal,
      dish: dish.trim(),
      time: time || null,
      category,
      subtype: sub.key,
      quantity: qtyNum,
      unit: sub.unit,
      portions,
      note: note.trim() || null,
    });
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <span className="modal-title">{initial ? "Изменить запись" : "Новая запись"} · {meal}</span>
          <button type="button" className="icon-btn" onClick={onCancel}><X size={18} /></button>
        </div>

        <label className="field-label">Блюдо</label>
        <input ref={firstRef} className="text-input" value={dish} onChange={(e) => setDish(e.target.value)}
          placeholder="Например: Куриная грудка" required />

        <div className="row-2">
          <div>
            <label className="field-label">Время</label>
            <input type="time" className="text-input" value={time || ""} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Группа</label>
            <select className="text-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              <option value={LEGUMES_KEY}>Бобовые (белок + углеводы)</option>
            </select>
          </div>
        </div>

        {!isLegumes && cat && cat.subtypes.length > 1 && (
          <>
            <label className="field-label">Тип</label>
            <select className="text-input" value={sub?.key} onChange={(e) => setSubtype(e.target.value)}>
              {cat.subtypes.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </>
        )}

        <label className="field-label">
          {isLegumes ? "Количество (г, сухой/готовый вес)" : `Количество (${sub?.unit})`}
        </label>
        <input
          type="number" step="0.5" min="0" className="text-input" value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={isLegumes ? "Вес в г" : `Вес в ${sub?.unit}`}
          required
        />

        {isLegumes ? (
          <div className="calc-hint" style={{ color: "#A6553C" }}>
            ≈ {fmt(legumesPortion)} порц. белков + {fmt(legumesPortion)} порц. углеводов
            <br />({half || 0} г белков + {half || 0} г углеводов, по {LEGUMES_GRAMS_PER_HALF_PORTION} г = 1 порция)
          </div>
        ) : (
          <div className="calc-hint" style={{ color: cat?.color }}>
            ≈ {fmt(portions)} порц. ({sub?.unitsPerPortion} {sub?.unit} = 1 порция)
          </div>
        )}

        <label className="field-label">Комментарий</label>
        <input className="text-input" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="Например: съела лишнее, было вкусно и т.п." />

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>Отмена</button>
          <button type="submit" className="btn-primary"><Check size={16} /> Сохранить</button>
        </div>
      </form>
    </div>
  );
}
