import React, { useState, useEffect, useRef } from "react";
import { X, Check } from "lucide-react";
import { CATEGORIES, categoryByKey, subtypeByKey, calcPortions, fmt } from "../lib/portions";

export default function EntryForm({ meal, initial, onSave, onCancel }) {
  const [dish, setDish] = useState(initial?.dish || "");
  const [time, setTime] = useState(initial?.time || "");
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0].key);
  const [subtype, setSubtype] = useState(
    initial?.subtype || categoryByKey(initial?.category || CATEGORIES[0].key).subtypes[0].key
  );
  const [quantity, setQuantity] = useState(initial?.quantity ?? "");
  const [note, setNote] = useState(initial?.note || "");
  const firstRef = useRef(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  // При смене категории — сбрасываем подтип на первый доступный
  useEffect(() => {
    const cat = categoryByKey(category);
    if (!cat.subtypes.some((s) => s.key === subtype)) {
      setSubtype(cat.subtypes[0].key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const cat = categoryByKey(category);
  const sub = subtypeByKey(category, subtype);
  const qtyNum = parseFloat(String(quantity).replace(",", ".")) || 0;
  const portions = calcPortions(category, subtype, qtyNum);

  const submit = (e) => {
    e.preventDefault();
    if (!dish.trim() || qtyNum <= 0) return;
    onSave({
      id: initial?.id,
      meal,
      dish: dish.trim(),
      time: time || null,
      category,
      subtype,
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
            </select>
          </div>
        </div>

        {cat.subtypes.length > 1 && (
          <>
            <label className="field-label">Тип</label>
            <select className="text-input" value={subtype} onChange={(e) => setSubtype(e.target.value)}>
              {cat.subtypes.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </>
        )}

        <label className="field-label">Количество ({sub.unit})</label>
        <input
          type="number" step="0.5" min="0" className="text-input" value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={`Вес в ${sub.unit}`}
          required
        />
        <div className="calc-hint" style={{ color: cat.color }}>
          ≈ {fmt(portions)} порц. ({sub.unitsPerPortion} {sub.unit} = 1 порция)
        </div>

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
