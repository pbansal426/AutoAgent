"use client";

import { useEffect, useMemo, useState } from "react";

type Incoming =
  | { type: "hello"; message: string }
  | { type: "event"; event_type: string; message: string; created_at: string };

export default function RobotHome() {
  const [banner, setBanner] = useState<{ title: string; msg: string } | null>(null);
  const [events, setEvents] = useState<Incoming[]>([]);
  const wsUrl = useMemo(() => "ws://127.0.0.1:8000/ws", []);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (m) => {
      try {
        const data: Incoming = JSON.parse(m.data);

        setEvents((prev) => [data, ...prev].slice(0, 25));

        if (data.type === "event") {
          const title =
            data.event_type === "MED_DUE"
              ? "Medication Reminder"
              : data.event_type === "FALL_DETECTED"
              ? "Safety Alert"
              : "Alert";

          setBanner({ title, msg: data.message });

          // auto-hide after a bit
          setTimeout(() => setBanner(null), 9000);
        }
      } catch {}
    };

    ws.onerror = () => {};
    ws.onclose = () => {};

    return () => ws.close();
  }, [wsUrl]);

  return (
    <main style={styles.page}>
      {banner && (
        <div style={styles.banner}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{banner.title}</div>
          <div style={{ fontSize: 22, marginTop: 6 }}>{banner.msg}</div>
        </div>
      )}

      <div style={styles.header}>
        <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: 0.2 }}>Hello 👋</div>
        <div style={{ fontSize: 20, opacity: 0.8 }}>I’m here to help.</div>
      </div>

      <div style={styles.grid}>
        <section style={styles.card}>
          <div style={styles.cardTitle}>Next Up</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>Medication</div>
          <div style={{ fontSize: 20, opacity: 0.85, marginTop: 6 }}>We’ll show the next scheduled dose here.</div>

          <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <button style={styles.primaryBtn}>Taken</button>
            <button style={styles.secondaryBtn}>Snooze 10 min</button>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.cardTitle}>Call Someone</div>
          <div style={{ fontSize: 22, marginTop: 12, opacity: 0.9 }}>
            If you need help, you can call:
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <button style={styles.secondaryBtn}>Call Nurse</button>
            <button style={styles.secondaryBtn}>Call Family</button>
          </div>
          <div style={{ fontSize: 14, opacity: 0.6, marginTop: 14 }}>
            (Real calling will be added later — this is the interface.)
          </div>
        </section>

        <section style={{ ...styles.card, gridColumn: "1 / -1" }}>
          <div style={styles.cardTitle}>Recent Events</div>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {events.length === 0 ? (
              <div style={{ fontSize: 18, opacity: 0.7 }}>No events yet. Try a demo event.</div>
            ) : (
              events.map((e, idx) => (
                <div key={idx} style={styles.eventRow}>
                  <div style={{ fontWeight: 800 }}>{(e as any).type === "event" ? (e as any).event_type : "SYSTEM"}</div>
                  <div style={{ opacity: 0.85 }}>{(e as any).message || ""}</div>
                  <div style={{ opacity: 0.55, fontSize: 12 }}>{(e as any).created_at || ""}</div>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="http://127.0.0.1:8000/docs" style={styles.linkBtn} target="_blank">Open API Docs</a>
            <button
              style={styles.secondaryBtn}
              onClick={async () => {
                await fetch("http://127.0.0.1:8000/demo/med_due", { method: "POST" });
              }}
            >
              Demo: MED_DUE
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(900px 500px at 15% 10%, rgba(120,180,255,0.22), transparent), #0b0b10",
    color: "#e9e9f2",
    padding: 28,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },
  banner: {
    position: "fixed",
    top: 18,
    left: 18,
    right: 18,
    padding: 18,
    borderRadius: 18,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.16)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    zIndex: 50,
  },
  header: {
    marginTop: 32,
    marginBottom: 22,
  },
  grid: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    alignItems: "stretch",
  },
  card: {
    borderRadius: 20,
    padding: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  cardTitle: {
    fontSize: 14,
    opacity: 0.7,
    fontWeight: 800,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  primaryBtn: {
    fontSize: 20,
    padding: "12px 18px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(120,180,255,0.22)",
    color: "#e9e9f2",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryBtn: {
    fontSize: 18,
    padding: "12px 18px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.07)",
    color: "#e9e9f2",
    fontWeight: 700,
    cursor: "pointer",
  },
  linkBtn: {
    display: "inline-block",
    fontSize: 16,
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.07)",
    color: "#e9e9f2",
    fontWeight: 700,
    textDecoration: "none",
  },
  eventRow: {
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    display: "grid",
    gap: 6,
  },
};
