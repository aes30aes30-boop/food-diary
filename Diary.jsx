import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Pencil, X, ChevronLeft, ChevronRight, CalendarDays, Utensils, Droplet, LogOut,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { CATEGORIES, MEALS, MEAL_TARGETS, DEFAULT_WATER_TARGET_ML, categoryByKey, fmt } from "../lib/portions";
import Ring from "./Ring";
import EntryForm from "./EntryForm";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
function prettyDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const s = dt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", weekday: "short" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Bar({ value, target, color }) {
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  const over = target > 0 && value > target;
  return (
    <div className="bar-track">
      <div className="bar-fill" style={{ width: `${pct * 100}%`, background: over ? "#B4443C" : color }} />
    </div>
  );
}

export default function Diary({ session }) {
  const userId = session.user.id;
  const [date, setDate] = useState(todayStr());
  const [entries, setEntries] = useState([]);
  const [water, setWater] = useState([]);
  const [waterTarget, setWaterTarget] = useState(DEFAULT_WATER_TARGET_ML);
  const [waterInput, setWaterInput] = useState("");
  const [datesList, setDatesList] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 1800); };

  const loadDates = useCallback(async () => {
    const { data, error } = await supabase
      .from("entries")
      .select("entry_date")
      .eq("user_id", userId);
    if (!error && data) {
      const uniq = Array.from(new Set(data.map((r) => r.entry_date))).sort().reverse();
      setDatesList(uniq);
    }
  }, [userId]);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase
      .from("user_settings")
      .select("water_target_ml")
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.water_target_ml) setWaterTarget(data.water_target_ml);
  }, [userId]);

  const loadDay = useCallback(async (d) => {
    setLoading(true);
    const [entriesRes, waterRes] = await Promise.all([
      supabase.from("entries").select("*").eq("user_id", userId).eq("entry_date", d).order("time", { ascending: true }),
      supabase.from("water_logs").select("*").eq("user_id", userId).eq("entry_date", d).order("time", { ascending: true }),
    ]);
    setEntries(entriesRes.data || []);
    setWater(waterRes.data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadDates(); loadSettings(); }, [loadDates, loadSettings]);
  useEffect(() => { loadDay(date); }, [date, loadDay]);

  const handleSave = async (entry) => {
    const payload = {
      user_id: userId,
      entry_date: date,
      meal: entry.meal,
      time: entry.time,
      dish: entry.dish,
      category: entry.category,
      subtype: entry.subtype,
      quantity: entry.quantity,
      unit: entry.unit,
      portions: entry.portions,
      note: entry.note,
    };
    let error;
    if (entry.id) {
      ({ error } = await supabase.from("entries").update(payload).eq("id", entry.id).eq("user_id", userId));
    } else {
      ({ error } = await supabase.from("entries").insert(payload));
    }
    if (error) { showToast("Не удалось сохранить: " + error.message); return; }
    setModal(null);
    showToast(entry.id ? "Запись обновлена" : "Запись добавлена");
    loadDay(date);
    loadDates();
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("entries").delete().eq("id", id).eq("user_id", userId);
    if (error) { showToast("Не удалось удалить: " + error.message); return; }
    showToast("Запись удалена");
    loadDay(date);
    loadDates();
  };

  const addWater = async () => {
    const ml = parseFloat(String(waterInput).replace(",", "."));
    if (!ml || ml <= 0) return;
    const { error } = await supabase.from("water_logs").insert({
      user_id: userId, entry_date: date, amount_ml: ml,
      time: new Date().toTimeString().slice(0, 5),
    });
    if (error) { showToast("Не удалось сохранить воду: " + error.message); return; }
    setWaterInput("");
    loadDay(date);
  };

  const deleteWater = async (id) => {
    await supabase.from("water_logs").delete().eq("id", id).eq("user_id", userId);
    loadDay(date);
  };

  const updateWaterTarget = async (val) => {
    setWaterTarget(val);
    await supabase.from("user_settings").upsert({ user_id: userId, water_target_ml: val });
  };

  // Итоги
  const dayTotals = {};
  CATEGORIES.forEach((c) => (dayTotals[c.key] = 0));
  entries.forEach((e) => { dayTotals[e.category] = (dayTotals[e.category] || 0) + Number(e.portions); });
  const waterTotal = water.reduce((s, w) => s + Number(w.amount_ml), 0);

  const mealTotals = (meal) => {
    const t = {};
    Object.keys(MEAL_TARGETS[meal]).forEach((k) => (t[k] = 0));
    entries.filter((e) => e.meal === meal).forEach((e) => { if (e.category in t) t[e.category] += Number(e.portions); });
    return t;
  };

  return (
    <div className="fd-container">
      <div className="fd-header">
        <div className="fd-title"><Utensils size={22} /> Дневник питания</div>
        <div style={{ display: "flex", gap: 4 }}>
          <button className="icon-btn" onClick={() => setShowCalendar((s) => !s)} title="Календарь"><CalendarDays size={20} /></button>
          <button className="icon-btn" onClick={() => supabase.auth.signOut()} title="Выйти"><LogOut size={20} /></button>
        </div>
      </div>

      <div className="date-nav" style={{ marginBottom: 14 }}>
        <button onClick={() => setDate(addDays(date, -1))}><ChevronLeft size={18} /></button>
        <div className="date-label">{prettyDate(date)}</div>
        <button onClick={() => setDate(addDays(date, 1))}><ChevronRight size={18} /></button>
        {date !== todayStr() && (
          <button style={{ fontSize: 12, color: "var(--accent)" }} onClick={() => setDate(todayStr())}>Сегодня</button>
        )}
      </div>

      {showCalendar && (
        <div className="cal-panel">
          <div className="cal-row">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <span style={{ fontSize: 12, color: "var(--muted)" }}>перейти к дате</span>
          </div>
          <div className="cal-dates">
            {datesList.length === 0 && <span className="cal-empty">Пока нет сохранённых дней</span>}
            {datesList.map((d) => (
              <span key={d} className={`cal-chip ${d === date ? "active" : ""}`} onClick={() => setDate(d)}>
                {d.slice(8, 10)}.{d.slice(5, 7)}.{d.slice(0, 4)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="summary-card">
        <div className="summary-title">Итого за день</div>
        <div className="rings">
          {CATEGORIES.map((c) => (
            <Ring key={c.key} value={dayTotals[c.key]} target={c.dayTarget} color={c.color} label={c.label}
              sub={c.dayTargetLabel || fmt(c.dayTarget)} />
          ))}
        </div>
      </div>

      <div className="meal-card">
        <div className="meal-head">
          <div className="meal-name" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Droplet size={17} color="#6E85A0" /> Вода
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input className="text-input" style={{ width: 90, padding: "6px 8px" }} type="number" min="0" step="50"
              placeholder="мл" value={waterInput} onChange={(e) => setWaterInput(e.target.value)} />
            <button className="add-btn" onClick={addWater}><Plus size={15} /> Добавить</button>
          </div>
        </div>
        <div className="bar-row" style={{ marginBottom: 10 }}>
          <span className="bar-cat" style={{ color: "#6E85A0" }}>Вода</span>
          <Bar value={waterTotal} target={waterTarget} color="#6E85A0" />
          <span className="bar-val">{waterTotal}/{waterTarget} мл</span>
        </div>
        <div className="entry-list">
          {water.length === 0 && <div className="empty-note">Пока нет записей</div>}
          {water.map((w) => (
            <div className="entry-row" key={w.id}>
              <div className="entry-time">{w.time || "—"}</div>
              <div className="entry-body"><div className="entry-dish">{w.amount_ml} мл</div></div>
              <button className="icon-btn" onClick={() => deleteWater(w.id)}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
          Дневная норма:{" "}
          <input type="number" min="0" step="100" value={waterTarget}
            onChange={(e) => updateWaterTarget(Number(e.target.value) || 0)}
            style={{ width: 70, border: "1px solid var(--line)", borderRadius: 6, padding: "2px 6px", fontFamily: "inherit" }} />{" "}
          мл
        </div>
      </div>

      {!loading && MEALS.map((meal) => {
        const totals = mealTotals(meal);
        const mealEntries = entries.filter((e) => e.meal === meal);
        return (
          <div className="meal-card" key={meal}>
            <div className="meal-head">
              <div className="meal-name">{meal}</div>
              <button className="add-btn" onClick={() => setModal({ meal })}><Plus size={15} /> Добавить</button>
            </div>

            <div className="meal-bars">
              {Object.keys(MEAL_TARGETS[meal]).map((k) => (
                <div className="bar-row" key={k}>
                  <span className="bar-cat" style={{ color: categoryByKey(k).color }}>{k}</span>
                  <Bar value={totals[k]} target={MEAL_TARGETS[meal][k]} color={categoryByKey(k).color} />
                  <span className="bar-val">{fmt(totals[k])}/{fmt(MEAL_TARGETS[meal][k])}</span>
                </div>
              ))}
            </div>

            <div className="entry-list">
              {mealEntries.length === 0 && <div className="empty-note">Пока нет записей</div>}
              {mealEntries.map((e) => (
                <div className="entry-row" key={e.id}>
                  <div className="entry-time">{e.time || "—"}</div>
                  <div className="entry-body">
                    <div className="entry-dish">{e.dish}</div>
                    <div className="entry-note">{e.quantity} {e.unit} · {fmt(e.portions)} порц.{e.note ? " · " + e.note : ""}</div>
                  </div>
                  <div className="entry-actions">
                    <button className="icon-btn" onClick={() => setModal({ meal, editing: e })}><Pencil size={14} /></button>
                    <button className="icon-btn" onClick={() => handleDelete(e.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {modal && (
        <EntryForm meal={modal.meal} initial={modal.editing} onSave={handleSave} onCancel={() => setModal(null)} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
