import { useState, useEffect, useRef, useCallback } from "react";

// ─── Theme ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#07080F",
  surface: "#0F1019",
  card: "#161824",
  felt: "#08200F",
  feltMid: "#0C2914",
  feltLight: "#0F3319",
  gold: "#F0B429",
  goldLight: "#FFD166",
  goldDark: "#B8860B",
  emerald: "#00C973",
  emeraldDark: "#009950",
  red: "#E63950",
  redDark: "#B02535",
  white: "#F0F2F8",
  muted: "#5A6278",
  mutedLight: "#7A8299",
  border: "#1E2035",
  borderLight: "#282A45",
  neon: "#6C5CE7",
  neonLight: "#9B8EFF",
  cyan: "#00B4D8",
};

// ─── CSS Keyframes ──────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 0; height: 0; }

  @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:.35} }
  @keyframes pulseScale { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
  @keyframes slideUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
  @keyframes popIn      { 0%{opacity:0;transform:scale(.6)} 70%{transform:scale(1.12)} 100%{opacity:1;transform:scale(1)} }
  @keyframes float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes ripple     { 0%{transform:scale(0);opacity:.6} 100%{transform:scale(3.5);opacity:0} }
  @keyframes confettiFall {
    0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(700px) rotate(720deg); opacity: 0; }
  }
  @keyframes trickWin   { 0%{transform:scale(1)} 40%{transform:scale(1.3)} 100%{transform:scale(1)} }
  @keyframes glow       { 0%,100%{box-shadow:0 0 8px #F0B42944} 50%{box-shadow:0 0 24px #F0B42988,0 0 48px #F0B42933} }
  @keyframes cardDeal   { from{opacity:0;transform:translateY(-40px) rotate(-5deg) scale(.8)} to{opacity:1;transform:translateY(0) rotate(0deg) scale(1)} }
  @keyframes thinking   { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }

  .card-hover:hover { transform: translateY(-10px) scale(1.04) !important; z-index: 99 !important; }
  .card-hover { transition: transform .18s cubic-bezier(.34,1.56,.64,1) !important; cursor: pointer; }
  .btn-press:active { transform: scale(.96) !important; }
`;

// ─── Suit SVGs ──────────────────────────────────────────────────────────────
const SuitSVG = ({ suit, size = 14 }) => {
  const isRed = suit === "♥" || suit === "♦";
  const col = isRed ? C.red : "#1A1B2E";
  if (suit === "♠") return <svg width={size} height={size} viewBox="0 0 24 24" fill={col}><path d="M12 2C12 2 2.5 8.5 2.5 14.5a5.5 5.5 0 0 0 7.8 5V21H9v2h6v-2h-1.3v-1.5a5.5 5.5 0 0 0 7.8-5C21.5 8.5 12 2 12 2z"/></svg>;
  if (suit === "♥") return <svg width={size} height={size} viewBox="0 0 24 24" fill={col}><path d="M12 21.5l-1.6-1.45C4.6 15.2 1 11.9 1 7.9 1 4.6 3.6 2 6.9 2c1.9 0 3.8.9 5.1 2.3C13.3 2.9 15.2 2 17.1 2 20.4 2 23 4.6 23 7.9c0 4-3.6 7.3-9.4 12.15L12 21.5z"/></svg>;
  if (suit === "♦") return <svg width={size} height={size} viewBox="0 0 24 24" fill={col}><path d="M12 2L2 12l10 10 10-10L12 2z"/></svg>;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={col}><path d="M12 2a4 4 0 0 0-3 6.7A4 4 0 1 0 12 16h-.5l-1 5h3l-1-5H12a4 4 0 0 0 2.97-6.65A4 4 0 0 0 12 2z"/></svg>;
};

// ─── Playing Card ────────────────────────────────────────────────────────────
const PlayingCard = ({ rank, suit, small = false, faceDown = false, style = {}, onClick, selected, disabled }) => {
  const red = suit === "♥" || suit === "♦";
  const w = small ? 36 : 54;
  const h = small ? 50 : 74;
  const fs = small ? 10 : 14;

  if (faceDown) return (
    <div style={{
      width: w, height: h, borderRadius: 7,
      background: "linear-gradient(145deg,#1a1c35 0%,#12142a 40%,#0d1028 100%)",
      border: "1.5px solid #2A2D50",
      boxShadow: "0 3px 10px rgba(0,0,0,.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      ...style,
    }}>
      <div style={{
        width: w - 10, height: h - 10, borderRadius: 4,
        background: "repeating-linear-gradient(45deg,#1e2145 0,#1e2145 2px,#161830 2px,#161830 8px)",
        opacity: 0.7,
      }} />
    </div>
  );

  return (
    <div onClick={onClick} className={onClick ? "card-hover btn-press" : ""}
      style={{
        width: w, height: h, borderRadius: 7,
        background: selected ? "linear-gradient(160deg,#fffff8,#f5f0e8)" : "linear-gradient(160deg,#ffffff,#f8f6f0)",
        border: selected ? `2px solid ${C.gold}` : "1.5px solid rgba(0,0,0,.08)",
        display: "flex", flexDirection: "column", padding: "3px 4px",
        boxShadow: selected ? `0 0 0 3px ${C.gold}55, 0 6px 20px rgba(0,0,0,.6)` : "0 4px 14px rgba(0,0,0,.55), 0 1px 3px rgba(0,0,0,.3)",
        opacity: disabled ? 0.45 : 1,
        position: "relative",
        ...style,
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
        <span style={{ fontSize: fs, fontWeight: "800", color: red ? C.red : "#1A1B2E", lineHeight: 1, fontFamily: "Georgia, serif" }}>{rank}</span>
        <SuitSVG suit={suit} size={small ? 8 : 10} />
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SuitSVG suit={suit} size={small ? 14 : 22} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 1, transform: "rotate(180deg)" }}>
        <span style={{ fontSize: fs, fontWeight: "800", color: red ? C.red : "#1A1B2E", lineHeight: 1, fontFamily: "Georgia, serif" }}>{rank}</span>
        <SuitSVG suit={suit} size={small ? 8 : 10} />
      </div>
    </div>
  );
};

// ─── Fan Hand ────────────────────────────────────────────────────────────────
const FanHand = ({ cards, count = 8, faceDown = false, small = false, onPlay }) => {
  const list = cards || Array.from({ length: count }, () => ({ rank: "A", suit: "♠" }));
  const n = list.length;
  const spread = small ? 20 : 24;
  const totalW = (n - 1) * spread + (small ? 36 : 54);
  return (
    <div style={{ position: "relative", width: totalW, height: small ? 58 : 84, flexShrink: 0 }}>
      {list.map((c, i) => {
        const rot = (i - (n - 1) / 2) * 3;
        return (
          <div key={i} style={{
            position: "absolute", left: i * spread, bottom: 0, zIndex: i,
            transform: `rotate(${rot}deg)`, transformOrigin: "bottom center",
            animation: `cardDeal .3s ${i * 0.04}s both`,
          }}>
            <PlayingCard rank={c.rank} suit={c.suit} faceDown={faceDown} small={small}
              onClick={onPlay ? () => onPlay(c, i) : undefined} />
          </div>
        );
      })}
    </div>
  );
};

// ─── Thinking Dots ───────────────────────────────────────────────────────────
const ThinkingDots = () => (
  <div style={{ display: "flex", gap: 3 }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 5, height: 5, borderRadius: "50%", background: C.gold,
        animation: `thinking .9s ${i * 0.2}s ease-in-out infinite`,
      }} />
    ))}
  </div>
);

// ─── Avatar ──────────────────────────────────────────────────────────────────
const Avatar = ({ name, emoji, bid, tricks, active, isUser, size = 48, thinking }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
    <div style={{ position: "relative" }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: active
          ? `radial-gradient(circle at 35% 35%, ${C.goldLight}, ${C.goldDark})`
          : `radial-gradient(circle at 35% 35%, #2A2D48, #16182A)`,
        border: `2.5px solid ${active ? C.gold : C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.42,
        boxShadow: active ? `0 0 0 3px ${C.gold}33, 0 0 24px ${C.gold}55` : "0 3px 12px rgba(0,0,0,.6)",
        animation: active ? "glow 2s ease-in-out infinite" : "none",
        transition: "all .35s ease",
      }}>{emoji}</div>
      {thinking && (
        <div style={{
          position: "absolute", top: -24, left: "50%", transform: "translateX(-50%)",
          background: C.surface, borderRadius: 10, padding: "4px 8px",
          border: `1px solid ${C.border}`, display: "flex", gap: 3, alignItems: "center",
        }}><ThinkingDots /></div>
      )}
      {active && !thinking && (
        <div style={{
          position: "absolute", bottom: -2, right: -2,
          width: 14, height: 14, borderRadius: "50%",
          background: C.emerald, border: `2px solid ${C.bg}`,
          animation: "pulseScale 1s ease-in-out infinite",
        }} />
      )}
    </div>
    <span style={{ fontSize: 10, fontWeight: "700", color: active ? C.gold : C.mutedLight, letterSpacing: 0.5 }}>
      {isUser ? "YOU" : name}
    </span>
    <div style={{ display: "flex", gap: 3 }}>
      <div style={{
        background: bid === "NIL" ? C.red + "22" : C.neon + "22",
        border: `1px solid ${bid === "NIL" ? C.red + "66" : C.neon + "66"}`,
        borderRadius: 8, padding: "1px 6px", fontSize: 9,
        color: bid === "NIL" ? C.red : C.neonLight, fontWeight: "800",
      }}>{bid === "NIL" ? "NIL" : `BID ${bid}`}</div>
      <div style={{
        background: tricks > 0 ? C.emerald + "22" : "transparent",
        border: `1px solid ${tricks > 0 ? C.emerald + "55" : C.border}`,
        borderRadius: 8, padding: "1px 6px", fontSize: 9,
        color: tricks > 0 ? C.emerald : C.muted, fontWeight: "800",
        animation: tricks > 0 ? "trickWin .4s ease" : "none",
      }}>✓{tricks}</div>
    </div>
  </div>
);

// ─── Confetti ────────────────────────────────────────────────────────────────
const Confetti = () => {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.8,
    dur: 2.5 + Math.random() * 2,
    color: [C.gold, C.emerald, C.neonLight, C.red, C.cyan, C.goldLight][i % 6],
    size: 5 + Math.random() * 8,
    shape: Math.random() > 0.5 ? "50%" : "2px",
  }));
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 50 }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.left}%`, top: -20,
          width: p.size, height: p.size, background: p.color, borderRadius: p.shape,
          animation: `confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,
        }} />
      ))}
    </div>
  );
};

// ─── Ripple Button ───────────────────────────────────────────────────────────
const RippleBtn = ({ children, onClick, style = {}, disabled }) => {
  const [ripples, setRipples] = useState([]);
  const handle = (e) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(r => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600);
    onClick?.();
  };
  return (
    <button onClick={handle} disabled={disabled} className="btn-press"
      style={{ position: "relative", overflow: "hidden", cursor: disabled ? "not-allowed" : "pointer", border: "none", opacity: disabled ? 0.5 : 1, ...style }}>
      {ripples.map(rp => (
        <span key={rp.id} style={{
          position: "absolute", left: rp.x, top: rp.y,
          width: 8, height: 8, borderRadius: "50%",
          background: "rgba(255,255,255,.35)",
          transform: "translate(-50%,-50%)",
          animation: "ripple .6s ease-out forwards",
          pointerEvents: "none",
        }} />
      ))}
      {children}
    </button>
  );
};

// ─── Countdown ──────────────────────────────────────────────────────────────
const Countdown = ({ seconds = 30, onExpire }) => {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const t = setInterval(() => setLeft(l => {
      if (l <= 1) { clearInterval(t); onExpire?.(); return 0; }
      return l - 1;
    }), 1000);
    return () => clearInterval(t);
  }, []);
  const pct = (left / seconds) * 100;
  const col = left <= 10 ? C.red : left <= 20 ? C.gold : C.emerald;
  return (
    <div style={{ position: "relative", width: 36, height: 36 }}>
      <svg width="36" height="36" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="18" cy="18" r="14" fill="none" stroke={C.border} strokeWidth="3" />
        <circle cx="18" cy="18" r="14" fill="none" stroke={col} strokeWidth="3"
          strokeDasharray={`${2 * Math.PI * 14}`}
          strokeDashoffset={`${2 * Math.PI * 14 * (1 - pct / 100)}`}
          style={{ transition: "stroke-dashoffset 1s linear, stroke .3s" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: "800", color: col,
      }}>{left}</div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// LOBBY SCREEN
// ═══════════════════════════════════════════════════════════════════════════
const LobbyScreen = ({ onJoin }) => {
  const [tab, setTab] = useState("tournaments");

  const tournaments = [
    { id: 1, name: "Midnight Royale",   buy: "$2.50",  prize: "$500",    filled: 48, cap: 64,  starts: "Filling", hot: true,  icon: "🌙" },
    { id: 2, name: "Sunday Grand Prix", buy: "$10.00", prize: "$2,000",  filled: 22, cap: 128, starts: "2h 15m",  hot: false, icon: "🏎" },
    { id: 3, name: "Quick Blitz",       buy: "$1.00",  prize: "$100",    filled: 60, cap: 64,  starts: "Filling", hot: false, icon: "⚡" },
    { id: 4, name: "High Roller Elite", buy: "$50.00", prize: "$10,000", filled: 8,  cap: 32,  starts: "3h 00m",  hot: false, icon: "💎" },
  ];
  const cashGames = [
    { name: "2v2 Classic",    stake: "$0.50 / $1.00",  filled: 3, cap: 4, status: "join" },
    { name: "Partners Speed", stake: "$1.00 / $2.00",  filled: 2, cap: 4, status: "join" },
    { name: "High Roller",    stake: "$5.00 / $10.00", filled: 4, cap: 4, status: "full" },
    { name: "Casual Table",   stake: "$0.25 / $0.50",  filled: 1, cap: 4, status: "join" },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, overflowY: "auto" }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(160deg,#0E1528 0%,${C.bg} 100%)`,
        padding: "16px 18px 14px", borderBottom: `1px solid ${C.border}`,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -20, top: -20, fontSize: 140, opacity: 0.03, userSelect: "none" }}>♠</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: "900", color: C.white, letterSpacing: -0.8, fontFamily: "Georgia, serif" }}>♠ SPADES</span>
              <span style={{
                fontSize: 9, fontWeight: "800", color: C.gold, letterSpacing: 1.5,
                background: `linear-gradient(135deg,${C.gold}22,${C.goldDark}11)`,
                border: `1px solid ${C.gold}55`, borderRadius: 6, padding: "2px 7px",
              }}>ROYALE</span>
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>Skill-Based · Real Cash · Licensed</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>BALANCE</div>
            <div style={{ fontSize: 22, fontWeight: "900", color: C.emerald, letterSpacing: -0.5 }}>$47.50</div>
            <RippleBtn onClick={() => {}} style={{
              background: `linear-gradient(135deg,${C.emerald},${C.emeraldDark})`,
              color: C.bg, fontSize: 9, fontWeight: "800", letterSpacing: 0.5,
              borderRadius: 8, padding: "4px 10px", marginTop: 4,
            }}>+ DEPOSIT</RippleBtn>
          </div>
        </div>
        {/* Stats */}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {[
            { label: "Win Rate", val: "68%", color: C.emerald },
            { label: "Earnings", val: "+$214", color: C.gold },
            { label: "Rank", val: "#847", color: C.neonLight },
            { label: "Streak", val: "3🔥", color: C.red },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: C.surface, borderRadius: 10, padding: "7px 6px",
              border: `1px solid ${C.border}`, textAlign: "center",
            }}>
              <div style={{ fontSize: 13, fontWeight: "800", color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {[
          { key: "tournaments", label: "🏆 Tournaments" },
          { key: "cash", label: "💵 Cash" },
          { key: "practice", label: "🎯 Practice" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: "11px 4px", border: "none", cursor: "pointer",
            fontSize: 10, fontWeight: "800", letterSpacing: 0.3,
            background: tab === t.key ? C.bg : "transparent",
            color: tab === t.key ? C.gold : C.muted,
            borderBottom: tab === t.key ? `2px solid ${C.gold}` : "2px solid transparent",
            transition: "all .2s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Lists */}
      <div style={{ flex: 1, padding: "14px 14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>

        {tab === "tournaments" && tournaments.map((t, ti) => {
          const pct = Math.round((t.filled / t.cap) * 100);
          const filling = t.starts === "Filling";
          return (
            <RippleBtn key={t.id} onClick={onJoin} style={{
              background: t.hot ? `linear-gradient(145deg,#1C1A08,${C.card})` : C.card,
              borderRadius: 16, padding: 14, textAlign: "left", width: "100%",
              border: `1px solid ${t.hot ? C.gold + "55" : C.border}`,
              boxShadow: t.hot ? `0 4px 24px ${C.gold}18` : "0 2px 8px rgba(0,0,0,.4)",
              animation: `slideUp .3s ${ti * .06}s both`,
            }}>
              {t.hot && (
                <div style={{
                  position: "absolute", top: 0, right: 0,
                  background: `linear-gradient(135deg,${C.red},${C.redDark})`,
                  color: "white", fontSize: 8, fontWeight: "800", letterSpacing: 0.5,
                  padding: "4px 10px", borderBottomLeftRadius: 10, borderTopRightRadius: 15,
                }}>🔥 HOT</div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, fontSize: 20,
                    background: C.surface, display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${C.border}`,
                  }}>{t.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: "800", color: C.white }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                      Buy-in: <span style={{ color: C.gold, fontWeight: "700" }}>{t.buy}</span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: "900", color: C.emerald, letterSpacing: -0.5 }}>{t.prize}</div>
                  <div style={{ fontSize: 9, color: C.muted }}>PRIZE POOL</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <span style={{ fontSize: 10, color: C.muted }}>👥 {t.filled}/{t.cap} players</span>
                <div style={{
                  background: filling
                    ? `linear-gradient(135deg,${C.emerald},${C.emeraldDark})`
                    : `linear-gradient(135deg,${C.neon},#4A35B8)`,
                  color: "white", fontSize: 10, fontWeight: "800",
                  borderRadius: 8, padding: "4px 12px", letterSpacing: 0.3,
                }}>
                  {filling ? "⚡ JOIN NOW" : `⏱ ${t.starts}`}
                </div>
              </div>
              <div style={{ marginTop: 10, background: C.border, borderRadius: 6, height: 5, overflow: "hidden" }}>
                <div style={{
                  width: `${pct}%`, height: "100%", borderRadius: 6,
                  background: pct > 80
                    ? `linear-gradient(90deg,${C.red},${C.redDark})`
                    : `linear-gradient(90deg,${t.hot ? C.gold : C.emerald},${t.hot ? C.goldDark : C.emeraldDark})`,
                  transition: "width .5s ease",
                }} />
              </div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 4, textAlign: "right" }}>{pct}% filled</div>
            </RippleBtn>
          );
        })}

        {tab === "cash" && cashGames.map((g, gi) => {
          const canJoin = g.status === "join";
          return (
            <RippleBtn key={gi} onClick={canJoin ? onJoin : undefined} style={{
              background: C.card, borderRadius: 14, padding: "12px 14px",
              border: `1px solid ${canJoin ? C.emerald + "44" : C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              opacity: canJoin ? 1 : 0.55, width: "100%", textAlign: "left",
              animation: `slideUp .3s ${gi * .06}s both`,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: "700", color: C.white }}>{g.name}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>
                  Stakes: <span style={{ color: C.gold, fontWeight: "700" }}>{g.stake}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
                  {Array.from({ length: g.cap }).map((_, i) => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < g.filled ? C.emerald : C.border }} />
                  ))}
                  <span style={{ fontSize: 9, color: C.muted }}>{g.filled}/{g.cap}</span>
                </div>
              </div>
              <div style={{
                background: canJoin ? `linear-gradient(135deg,${C.emerald},${C.emeraldDark})` : C.border,
                color: canJoin ? C.bg : C.muted,
                fontSize: 11, fontWeight: "800", borderRadius: 10, padding: "8px 16px", flexShrink: 0,
              }}>
                {canJoin ? "JOIN →" : "FULL"}
              </div>
            </RippleBtn>
          );
        })}

        {tab === "practice" && (
          <div style={{ animation: "slideUp .3s both" }}>
            <div style={{
              background: `linear-gradient(145deg,#0F1628,${C.card})`,
              borderRadius: 18, padding: 20, textAlign: "center",
              border: `1px solid ${C.neon}33`,
            }}>
              <div style={{ fontSize: 52, marginBottom: 10, animation: "float 3s ease-in-out infinite" }}>🎴</div>
              <div style={{ fontSize: 17, fontWeight: "800", color: C.white }}>Practice Mode</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>
                Play against AI opponents to sharpen your strategy.<br />No real money — just skill building.
              </div>
              <RippleBtn onClick={onJoin} style={{
                background: `linear-gradient(135deg,${C.neon},#4A35B8)`,
                color: "white", borderRadius: 14, padding: "13px 0",
                fontSize: 13, fontWeight: "800", width: "100%", marginTop: 18,
                boxShadow: `0 6px 24px ${C.neon}44`,
              }}>PLAY VS AI →</RippleBtn>
            </div>
            <div style={{ marginTop: 12, background: C.card, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, fontWeight: "700", color: C.white, marginBottom: 10 }}>YOUR STATS</div>
              {[
                { label: "Games Played", val: "142" },
                { label: "Tricks Won", val: "847" },
                { label: "Nil Successes", val: "23/28" },
                { label: "Bags Taken", val: "14" },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{s.label}</span>
                  <span style={{ fontSize: 12, fontWeight: "700", color: C.white }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// BIDDING SCREEN
// ═══════════════════════════════════════════════════════════════════════════
const BiddingScreen = ({ onBid }) => {
  const [bid, setBid] = useState(null);
  const [mode, setMode] = useState(null); // null | 'nil' | 'blind'

  const userCards = [
    { rank: "A", suit: "♠" }, { rank: "K", suit: "♠" }, { rank: "Q", suit: "♠" },
    { rank: "J", suit: "♠" }, { rank: "9", suit: "♠" }, { rank: "A", suit: "♥" },
    { rank: "K", suit: "♥" }, { rank: "6", suit: "♦" }, { rank: "3", suit: "♦" },
    { rank: "8", suit: "♣" }, { rank: "5", suit: "♣" }, { rank: "2", suit: "♣" },
    { rank: "4", suit: "♦" },
  ];

  const others = [
    { name: "Mike",   emoji: "👨", bid: 3,    done: true },
    { name: "Monika", emoji: "👩", bid: null,  done: false },
    { name: "Luke",   emoji: "🧑", bid: null,  done: false },
  ];

  const selectNum = (n) => { setBid(n); setMode(null); };
  const selectMode = (m) => { setMode(m); setBid(null); };

  const ready = mode !== null || bid !== null;
  const label = mode === "nil" ? "NIL" : mode === "blind" ? "BLIND NIL" : bid !== null ? bid : "—";

  const tip = bid !== null && !mode
    ? bid <= 3 ? "Conservative — safe but lower scoring."
    : bid <= 6 ? "Balanced — solid mid-range play."
    : bid <= 9 ? "Aggressive — high risk, high reward."
    : "Bold — you'll need every single trick!"
    : null;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.felt, overflowY: "auto" }}>
      {/* Header */}
      <div style={{
        background: C.surface + "F5", backdropFilter: "blur(12px)",
        padding: "10px 16px", borderBottom: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: "800", color: C.white }}>Midnight Royale</div>
          <div style={{ fontSize: 10, color: C.muted }}>Round 1 · Bidding Phase</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: C.muted }}>POT</div>
            <div style={{ fontSize: 14, fontWeight: "900", color: C.gold }}>$10.00</div>
          </div>
          <Countdown seconds={30} />
        </div>
      </div>

      {/* Others' bids */}
      <div style={{ background: "#071510", padding: "10px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: C.muted, marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" }}>Other Bids</div>
        <div style={{ display: "flex", gap: 8 }}>
          {others.map(p => (
            <div key={p.name} style={{
              flex: 1, background: C.card, borderRadius: 10, padding: "8px",
              border: `1px solid ${p.done ? C.emerald + "44" : C.border}`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <span style={{ fontSize: 18 }}>{p.emoji}</span>
              <span style={{ fontSize: 10, color: C.white, fontWeight: "600" }}>{p.name}</span>
              {p.done ? <span style={{ fontSize: 11, fontWeight: "800", color: C.neonLight }}>BID {p.bid}</span> : <ThinkingDots />}
            </div>
          ))}
        </div>
      </div>

      {/* Hand */}
      <div style={{ padding: "12px 14px 0", flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: C.gold, fontWeight: "800", letterSpacing: 1, textAlign: "center", marginBottom: 10, textTransform: "uppercase" }}>
          YOUR HAND
        </div>
        <div style={{
          background: C.feltMid, borderRadius: 14, padding: "10px 8px",
          border: "1px solid rgba(255,255,255,.04)",
          display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center",
        }}>
          {userCards.map((c, i) => (
            <PlayingCard key={i} rank={c.rank} suit={c.suit} small style={{ animation: `cardDeal .3s ${i * 0.04}s both` }} />
          ))}
        </div>
      </div>

      {/* Bid Selector */}
      <div style={{ padding: "12px 14px 20px", flex: 1 }}>
        <div style={{ fontSize: 10, color: C.mutedLight, textAlign: "center", marginBottom: 10, letterSpacing: 0.5 }}>
          HOW MANY TRICKS WILL YOU WIN?
        </div>

        {/* Special bids */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[
            { key: "nil",   label: "🚫 NIL",       sub: "+$2 bonus", col: C.red },
            { key: "blind", label: "🙈 BLIND NIL",  sub: "+$5 bonus", col: C.neonLight },
          ].map(m => (
            <button key={m.key} onClick={() => selectMode(m.key)} className="btn-press" style={{
              flex: 1, padding: "9px 6px", borderRadius: 12, cursor: "pointer",
              background: mode === m.key ? m.col + "25" : C.card,
              border: `1.5px solid ${mode === m.key ? m.col : C.border}`,
              color: mode === m.key ? m.col : C.muted,
              fontSize: 11, fontWeight: "800",
              transition: "all .2s",
              boxShadow: mode === m.key ? `0 0 14px ${m.col}44` : "none",
            }}>
              {m.label}
              <div style={{ fontSize: 8, color: mode === m.key ? m.col + "AA" : C.muted, fontWeight: "600", marginTop: 2 }}>{m.sub}</div>
            </button>
          ))}
        </div>

        {/* 1–13 grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {Array.from({ length: 13 }, (_, i) => i + 1).map(n => {
            const sel = bid === n && !mode;
            return (
              <button key={n} onClick={() => selectNum(n)} className="btn-press" style={{
                height: 44, borderRadius: 11, cursor: "pointer",
                background: sel ? `linear-gradient(145deg,${C.goldLight},${C.gold},${C.goldDark})` : C.card,
                color: sel ? C.bg : C.white,
                border: sel ? "none" : `1px solid ${C.border}`,
                fontSize: 17, fontWeight: "900", fontFamily: "Georgia, serif",
                boxShadow: sel ? `0 3px 14px ${C.gold}66` : "none",
                transform: sel ? "scale(1.08)" : "scale(1)",
                transition: "all .15s cubic-bezier(.34,1.56,.64,1)",
              }}>{n}</button>
            );
          })}
        </div>

        {/* Strategy tip */}
        {tip && (
          <div style={{
            marginTop: 10, background: C.neon + "15", borderRadius: 10, padding: "8px 12px",
            border: `1px solid ${C.neon}33`, animation: "popIn .25s ease",
          }}>
            <div style={{ fontSize: 10, color: C.neonLight, fontWeight: "700" }}>💡 {tip}</div>
          </div>
        )}

        {/* Confirm */}
        <RippleBtn
          onClick={() => ready && onBid(mode || bid)}
          disabled={!ready}
          style={{
            marginTop: 12, width: "100%", padding: "14px",
            background: ready ? `linear-gradient(135deg,${C.goldLight},${C.gold},${C.goldDark})` : C.border,
            color: ready ? C.bg : C.muted,
            borderRadius: 14, fontSize: 14, fontWeight: "900", letterSpacing: 0.5,
            boxShadow: ready ? `0 6px 24px ${C.gold}55` : "none",
            transition: "all .3s ease",
          }}
        >
          {ready ? `LOCK IN: ${label} →` : "SELECT A BID"}
        </RippleBtn>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// GAME SCREEN
// ═══════════════════════════════════════════════════════════════════════════
const GameScreen = ({ onExit }) => {
  const [trickNum, setTrickNum] = useState(4);
  const [scores, setScores] = useState({ us: 120, them: 90 });
  const [showHint, setShowHint] = useState(false);
  const [activePlayer, setActivePlayer] = useState(2);
  const [selectedCard, setSelectedCard] = useState(null);
  const [trickWinner, setTrickWinner] = useState(null);

  const [playedCards, setPlayedCards] = useState([
    { rank: "Q", suit: "♥", player: 1 },
    { rank: "4", suit: "♥", player: 0 },
    { rank: "10", suit: "♥", player: 3 },
  ]);

  const [userCards, setUserCards] = useState([
    { rank: "A", suit: "♠" }, { rank: "K", suit: "♠" }, { rank: "9", suit: "♠" },
    { rank: "A", suit: "♥" }, { rank: "6", suit: "♦" }, { rank: "3", suit: "♦" },
    { rank: "8", suit: "♣" }, { rank: "5", suit: "♣" }, { rank: "2", suit: "♣" },
    { rank: "4", suit: "♦" },
  ]);

  const players = [
    { name: "Mike",   emoji: "👨", bid: 3, tricks: 1 },
    { name: "Luke",   emoji: "🧑", bid: 2, tricks: 0 },
    { name: "You",    emoji: "😎", bid: 4, tricks: 2, isUser: true },
    { name: "Monika", emoji: "👩", bid: 4, tricks: 0 },
  ];

  const playCard = (card, idx) => {
    if (activePlayer !== 2) return;
    setSelectedCard(idx);
    setTimeout(() => {
      setPlayedCards(prev => [...prev, { ...card, player: 2 }]);
      setUserCards(prev => prev.filter((_, i) => i !== idx));
      setSelectedCard(null);
      setTrickWinner("You");
      setTrickNum(t => t + 1);
      setScores(s => ({ ...s, us: s.us + 10 }));
      setTimeout(() => { setTrickWinner(null); setActivePlayer(0); }, 1400);
    }, 280);
  };

  const cardOffsets = [
    { x: 0, y: -34 }, { x: -34, y: 0 }, { x: 0, y: 34 }, { x: 34, y: 0 },
  ];

  const spread = userCards.length > 1 ? Math.min(24, 290 / (userCards.length - 1)) : 0;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.felt, position: "relative" }}>
      {/* Score Header */}
      <div style={{
        background: C.surface + "F2", backdropFilter: "blur(14px)",
        padding: "8px 14px", display: "flex", alignItems: "center",
        gap: 10, borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        <button onClick={onExit} className="btn-press" style={{
          width: 30, height: 30, borderRadius: "50%",
          border: `1px solid ${C.border}`, background: "transparent",
          cursor: "pointer", color: C.muted, fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>✕</button>
        <div style={{ flex: 1, display: "flex", gap: 8, justifyContent: "center" }}>
          {[
            { label: "US", score: scores.us, bid: "BID 7", color: C.emerald },
            { label: "THEM", score: scores.them, bid: "BID 6", color: C.red },
          ].map(s => (
            <div key={s.label} style={{
              background: C.card, borderRadius: 10, padding: "4px 18px",
              border: `1px solid ${s.color}33`, textAlign: "center",
            }}>
              <div style={{ fontSize: 8, color: C.muted, letterSpacing: 0.5 }}>{s.label} · {s.bid}</div>
              <div style={{ fontSize: 18, fontWeight: "900", color: s.color }}>{s.score}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: C.muted }}>TRICK {trickNum}/13</div>
          <div style={{ fontSize: 12, fontWeight: "800", color: C.gold }}>$10 POT</div>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>

        {/* Trick winner banner */}
        {trickWinner && (
          <div style={{
            position: "absolute", top: 6, left: 0, right: 0, zIndex: 30,
            display: "flex", justifyContent: "center", pointerEvents: "none",
          }}>
            <div style={{
              background: `linear-gradient(135deg,${C.gold},${C.goldDark})`,
              color: C.bg, fontSize: 13, fontWeight: "900", borderRadius: 20,
              padding: "6px 20px", animation: "popIn .3s ease",
              boxShadow: `0 4px 20px ${C.gold}66`,
            }}>
              🏆 {trickWinner} wins the trick!
            </div>
          </div>
        )}

        {/* Top player (Mike - partner) */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 6px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <FanHand count={10} faceDown small />
            <Avatar {...players[0]} active={activePlayer === 0} thinking={activePlayer === 0} />
          </div>
        </div>

        {/* Middle row */}
        <div style={{ display: "flex", alignItems: "center", flex: 1, paddingInline: 10 }}>
          {/* Left (Luke - opponent) */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Avatar {...players[1]} active={activePlayer === 1} thinking={activePlayer === 1} />
            <FanHand count={8} faceDown small />
          </div>

          {/* Center table felt */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{
              width: 185, height: 130,
              background: `radial-gradient(ellipse at 40% 40%, ${C.feltLight} 0%, ${C.feltMid} 50%, ${C.felt} 100%)`,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,.05)",
              boxShadow: "inset 0 4px 24px rgba(0,0,0,.4), 0 8px 32px rgba(0,0,0,.5)",
              position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ position: "absolute", fontSize: 40, opacity: 0.04, userSelect: "none" }}>♠</div>
              {playedCards.slice(-4).map((c, i) => (
                <div key={i} style={{
                  position: "absolute", left: "50%", top: "50%",
                  transform: `translate(calc(-50% + ${cardOffsets[i]?.x || 0}px), calc(-50% + ${cardOffsets[i]?.y || 0}px))`,
                  animation: "popIn .25s ease", zIndex: i + 1,
                }}>
                  <PlayingCard rank={c.rank} suit={c.suit} small />
                </div>
              ))}
            </div>

            <button onClick={() => setShowHint(h => !h)} style={{
              marginTop: 6, width: 28, height: 28, borderRadius: "50%",
              background: showHint ? C.gold : C.card,
              border: `1px solid ${showHint ? C.gold : C.border}`,
              color: showHint ? C.bg : C.muted, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>💡</button>

            {showHint && (
              <div style={{
                background: "white", borderRadius: 12, padding: "7px 12px",
                marginTop: 4, fontSize: 10, fontWeight: "800", color: "#1A1B2E",
                textAlign: "center", boxShadow: "0 4px 16px rgba(0,0,0,.3)",
                animation: "popIn .2s ease", maxWidth: 160,
              }}>
                SPADES ALWAYS TRUMP ♠
              </div>
            )}
          </div>

          {/* Right (Monika - opponent) */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Avatar {...players[3]} active={activePlayer === 3} thinking={activePlayer === 3} />
            <FanHand count={9} faceDown small />
          </div>
        </div>

        {/* Bottom - user */}
        <div style={{ padding: "6px 14px 10px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <Avatar {...players[2]} active={activePlayer === 2} isUser />
          </div>

          {activePlayer === 2 && (
            <div style={{
              textAlign: "center", marginBottom: 6, fontSize: 10,
              color: C.gold, fontWeight: "800", letterSpacing: 0.5,
              animation: "pulse 1.2s ease-in-out infinite",
            }}>↑ TAP A CARD TO PLAY ↑</div>
          )}

          {/* Playable hand */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{
              position: "relative",
              width: userCards.length > 0 ? (userCards.length - 1) * spread + 54 : 54,
              height: 84,
            }}>
              {userCards.map((c, i) => (
                <div key={`${c.rank}${c.suit}${i}`}
                  onClick={() => playCard(c, i)}
                  className={activePlayer === 2 ? "card-hover" : ""}
                  style={{
                    position: "absolute",
                    left: i * spread,
                    bottom: 0,
                    zIndex: selectedCard === i ? 50 : i,
                    transition: "all .2s cubic-bezier(.34,1.56,.64,1)",
                  }}
                >
                  <PlayingCard rank={c.rank} suit={c.suit} selected={selectedCard === i} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// RESULTS SCREEN
// ═══════════════════════════════════════════════════════════════════════════
const ResultsScreen = ({ onBack }) => {
  const [show, setShow] = useState(false);
  const [counter, setCounter] = useState(0);
  const target = 4.50;

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
    let v = 0;
    const step = target / 45;
    const t = setInterval(() => {
      v += step;
      if (v >= target) { setCounter(target); clearInterval(t); }
      else setCounter(parseFloat(v.toFixed(2)));
    }, 38);
    return () => clearInterval(t);
  }, []);

  const breakdown = [
    { label: "Tricks bonus (11 made vs bid 7)", val: "+$2.00", col: C.emerald },
    { label: "Team synergy bonus",               val: "+$1.50", col: C.emerald },
    { label: "Nil bid success",                  val: "+$2.00", col: C.gold },
    { label: "Tournament buy-in",                val: "-$2.50", col: C.red },
    { label: "House fee (5%)",                   val: "-$0.50", col: C.muted },
  ];

  return (
    <div style={{ height: "100%", overflowY: "auto", position: "relative", background: C.bg }}>
      <Confetti />

      <div style={{ padding: "24px 20px 36px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontSize: 70, textAlign: "center", marginBottom: 4, animation: "float 3s ease-in-out infinite", filter: `drop-shadow(0 8px 24px ${C.gold}55)` }}>
          🏆
        </div>

        <div style={{
          fontSize: 30, fontWeight: "900", color: C.white, letterSpacing: -1,
          fontFamily: "Georgia, serif", animation: show ? "popIn .4s .2s both" : "none",
        }}>YOU WON!</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Midnight Royale · Round 1</div>

        {/* Winnings */}
        <div style={{
          marginTop: 20, textAlign: "center",
          background: `radial-gradient(ellipse at 50% 0%, ${C.gold}18, transparent 70%)`,
          padding: "20px 48px", borderRadius: 24,
          border: `1px solid ${C.gold}44`,
          animation: show ? "slideUp .5s .3s both" : "none",
        }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Net Winnings</div>
          <div style={{
            fontSize: 52, fontWeight: "900", color: C.emerald, letterSpacing: -2,
            fontFamily: "Georgia, serif", textShadow: `0 0 30px ${C.emerald}55`,
          }}>+${counter.toFixed(2)}</div>
          <div style={{ fontSize: 10, color: C.emeraldDark, marginTop: 4, fontWeight: "700" }}>✓ Added to balance</div>
        </div>

        {/* Score comparison */}
        <div style={{ display: "flex", gap: 16, marginTop: 20, width: "100%", animation: show ? "slideUp .5s .4s both" : "none" }}>
          {[
            { side: "US", score: 520, info: "7 bid · 11 made", color: C.emerald, win: true },
            { side: "THEM", score: 430, info: "6 bid · 5 made", color: C.red, win: false },
          ].map(s => (
            <div key={s.side} style={{
              flex: 1, background: s.win ? `linear-gradient(145deg,${C.emerald}18,${C.card})` : C.card,
              borderRadius: 16, padding: "14px 12px",
              border: `1px solid ${s.win ? C.emerald + "55" : C.border}`,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 9, color: s.color, fontWeight: "800", letterSpacing: 1 }}>{s.side}</div>
              <div style={{ fontSize: 36, fontWeight: "900", color: s.color, letterSpacing: -1, fontFamily: "Georgia, serif" }}>{s.score}</div>
              <div style={{ fontSize: 9, color: C.muted }}>{s.info}</div>
              {s.win && <div style={{ fontSize: 14, marginTop: 6 }}>🏆</div>}
            </div>
          ))}
        </div>

        {/* Breakdown */}
        <div style={{
          width: "100%", background: C.card, borderRadius: 16, padding: 16,
          border: `1px solid ${C.border}`, marginTop: 16,
          animation: show ? "slideUp .5s .5s both" : "none",
        }}>
          <div style={{ fontSize: 11, fontWeight: "800", color: C.white, marginBottom: 12 }}>EARNINGS BREAKDOWN</div>
          {breakdown.map((b, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "7px 0", borderBottom: i < breakdown.length - 1 ? `1px solid ${C.border}` : "none",
            }}>
              <span style={{ fontSize: 12, color: C.muted }}>{b.label}</span>
              <span style={{ fontSize: 12, fontWeight: "800", color: b.col }}>{b.val}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTop: `2px solid ${C.border}` }}>
            <span style={{ fontSize: 13, fontWeight: "800", color: C.white }}>NET</span>
            <span style={{ fontSize: 16, fontWeight: "900", color: C.emerald }}>+${target.toFixed(2)}</span>
          </div>
        </div>

        {/* Share */}
        <div style={{
          width: "100%", background: C.neon + "15", borderRadius: 14, padding: "12px 14px",
          border: `1px solid ${C.neon}33`, marginTop: 12,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          animation: show ? "slideUp .5s .6s both" : "none",
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: "700", color: C.neonLight }}>Share your win 🎉</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Challenge friends to beat your score</div>
          </div>
          <RippleBtn onClick={() => {}} style={{
            background: `linear-gradient(135deg,${C.neon},#4A35B8)`,
            color: "white", borderRadius: 10, padding: "8px 16px", fontSize: 11, fontWeight: "800",
          }}>SHARE</RippleBtn>
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 10, marginTop: 16, width: "100%", animation: show ? "slideUp .5s .7s both" : "none" }}>
          <RippleBtn onClick={onBack} style={{
            flex: 1, padding: 14, border: `1px solid ${C.border}`,
            background: C.card, color: C.white, borderRadius: 14, fontSize: 12, fontWeight: "800",
          }}>HOME</RippleBtn>
          <RippleBtn onClick={onBack} style={{
            flex: 2, padding: 14,
            background: `linear-gradient(135deg,${C.goldLight},${C.gold},${C.goldDark})`,
            color: C.bg, borderRadius: 14, fontSize: 13, fontWeight: "900",
            boxShadow: `0 6px 24px ${C.gold}55`,
          }}>PLAY AGAIN →</RippleBtn>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════════════════════════════════════
export default function SpadesRoyale() {
  const [screen, setScreen] = useState("lobby");
  const [transitioning, setTransitioning] = useState(false);

  const nav = (to) => {
    setTransitioning(true);
    setTimeout(() => { setScreen(to); setTransitioning(false); }, 220);
  };

  const screens = {
    lobby:   <LobbyScreen   onJoin={() => nav("bidding")} />,
    bidding: <BiddingScreen onBid={() => nav("game")} />,
    game:    <GameScreen    onExit={() => nav("results")} />,
    results: <ResultsScreen onBack={() => nav("lobby")} />,
  };

  const navItems = [
    { icon: "🏠", label: "Home",    s: "lobby" },
    { icon: "🏆", label: "Rank",    s: null },
    { icon: "💰", label: "Cash",    s: null },
    { icon: "👤", label: "Profile", s: null },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#030308",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{GLOBAL_CSS}</style>

      {/* Ambient glow */}
      <div style={{
        position: "absolute", width: 500, height: 900,
        background: `radial-gradient(ellipse, ${C.neon}14 0%, transparent 70%)`,
        borderRadius: "50%", filter: "blur(50px)", pointerEvents: "none",
      }} />

      {/* Phone frame */}
      <div style={{
        width: 390, height: 800, background: C.bg, borderRadius: 50,
        overflow: "hidden",
        border: "8px solid #181A30",
        outline: "1px solid #2A2D50",
        boxShadow: `0 0 0 1px #0D0E1C, 0 60px 120px rgba(0,0,0,.95), 0 0 80px ${C.neon}18`,
        display: "flex", flexDirection: "column",
        transition: "opacity .22s ease",
        opacity: transitioning ? 0 : 1,
      }}>
        {/* Status bar */}
        <div style={{
          background: C.surface, padding: "10px 26px 6px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, fontWeight: "700", color: C.white }}>9:41</span>
          <div style={{ width: 100, height: 22, background: "#000", borderRadius: 14, border: `1px solid ${C.border}` }} />
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
              {[3, 5, 7].map((h, i) => (
                <div key={i} style={{ width: 3, height: h, background: C.white, borderRadius: 1, opacity: 0.8 }} />
              ))}
            </div>
            <div style={{ width: 20, height: 11, border: `1.5px solid ${C.white}88`, borderRadius: 3, padding: 1, display: "flex" }}>
              <div style={{ flex: 1, background: C.emerald, borderRadius: 1 }} />
              <div style={{ width: 2, height: "100%", background: C.white + "44", marginLeft: 1 }} />
            </div>
          </div>
        </div>

        {/* Screen */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ height: "100%", animation: "slideUp .3s ease" }} key={screen}>
            {screens[screen]}
          </div>
        </div>

        {/* Bottom nav */}
        <div style={{
          background: C.surface, borderTop: `1px solid ${C.border}`,
          padding: "8px 20px 18px",
          display: "flex", justifyContent: "space-around", flexShrink: 0,
        }}>
          {navItems.map(item => {
            const active = item.s === screen;
            return (
              <button key={item.label} onClick={() => item.s && nav(item.s)} style={{
                background: active ? C.gold + "18" : "transparent",
                border: "none", cursor: item.s ? "pointer" : "default",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "4px 14px", borderRadius: 12, transition: "all .2s",
              }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ fontSize: 9, fontWeight: "800", color: active ? C.gold : C.muted }}>
                  {item.label}
                </span>
                {active && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.gold }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Screen switcher */}
      <div style={{
        position: "absolute", right: "calc(50% - 240px)", top: "50%", transform: "translateY(-50%)",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {["lobby","bidding","game","results"].map(s => (
          <button key={s} onClick={() => nav(s)} className="btn-press" style={{
            background: screen === s ? C.gold : C.card,
            color: screen === s ? C.bg : C.mutedLight,
            border: `1px solid ${screen === s ? C.gold : C.border}`,
            borderRadius: 10, padding: "7px 16px",
            fontSize: 10, fontWeight: "800", cursor: "pointer",
            textTransform: "capitalize", letterSpacing: 0.5,
            transition: "all .2s",
            boxShadow: screen === s ? `0 3px 12px ${C.gold}44` : "none",
          }}>
            {screen === s ? "▶ " : ""}{s}
          </button>
        ))}
      </div>
    </div>
  );
}
