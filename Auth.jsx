import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Utensils } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Регистрация прошла. Если включено подтверждение почты — проверьте email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message || "Что-то пошло не так");
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-title"><Utensils size={22} /> Дневник питания</div>
        <p className="auth-sub">{mode === "signin" ? "Вход в аккаунт" : "Создать аккаунт"}</p>

        <label className="field-label">Email</label>
        <input className="text-input" type="email" required value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />

        <label className="field-label">Пароль</label>
        <input className="text-input" type="password" required minLength={6} value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="не менее 6 символов" />

        {error && <div className="auth-error">{error}</div>}
        {info && <div className="auth-info">{info}</div>}

        <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} disabled={loading}>
          {loading ? "Подождите…" : mode === "signin" ? "Войти" : "Зарегистрироваться"}
        </button>

        <button type="button" className="auth-switch"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setInfo(""); }}>
          {mode === "signin" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
        </button>
      </form>
    </div>
  );
}
