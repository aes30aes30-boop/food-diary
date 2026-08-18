import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./components/Auth";
import Diary from "./components/Diary";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="fd-root"><div className="fd-container" style={{ padding: 40 }}>Загрузка…</div></div>;

  return <div className="fd-root">{session ? <Diary session={session} /> : <Auth />}</div>;
}
