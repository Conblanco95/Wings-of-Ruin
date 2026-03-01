import { useState, useEffect, useRef, useCallback } from "react";

// ─── SYSTEM PROMPT BUILDER ────────────────────────────────────────────────────
const buildSystemPrompt = (playerName) => `You are the narrator of an immersive Choose Your Own Adventure game set in the Empyrean series by Rebecca Yarros — Fourth Wing, Iron Flame, and Onyx Storm.

THE PLAYER CHARACTER:
Name: ${playerName}. Use this name THROUGHOUT — narration, dialogue, Tairn's mental speech. Never say "the player."
They are a rider cadet at Basgiath War College. They bond with Tairn (ancient obsidian dragon) and later Andarna (small golden Irid dragon — unprecedented double bond). Their signet: lightning, like their mother General Lilith Sorrengail.

KEY CHARACTERS:
- TAIRN: Ancient obsidian dragon. Gold eyes. 6-ton, scarred. Formal, sardonic. Speaks in ${playerName}'s mind. Addresses ${playerName} by name. Has not chosen a rider in 60+ years.
- ANDARNA: Small golden Irid dragon, last of her kind. Young, fierce, curious. Can briefly stop time.
- XADEN RIORSON: Wingleader. Dark hair, silver relic streaks. Shadow signet. Cold exterior, deeply loyal. Romantic tension with ${playerName}. Rides Sgaeyl.
- SGAEYL: Xaden's dragon. Blue-black, iridescent. Mated to Tairn — creates involuntary secondary bond between Xaden and ${playerName}.
- RHIANNON MATTHIAS: ${playerName}'s closest friend. Smart, fierce, loyal, funny. Rides Feirge.
- DAIN AETOS: Childhood friend. Memory-reading signet. Believes in the system. Rides Cath.
- IMOGEN CARDULO: Rebellion-marked. Lightning-fast. Dry humor. Secret ally.
- GARRICK TAVIS: Xaden's best friend. Enormous, blunt, gentle.
- LIAM MAIRI: Rebellion-marked, assigned to protect ${playerName}. Kind, fierce. His death carries enormous weight.
- GENERAL LILITH SORRENGAIL: ${playerName}'s mother. Commandant. Lightning signet. Knows about venin/ward failures.
- BRENNAN SORRENGAIL: ${playerName}'s brother — officially dead, actually alive in Aretia.
- MIRA SORRENGAIL: ${playerName}'s sister. Protective rider.
- JACK BARLOWE: Antagonist cadet. Ruthless, becomes venin-touched.

KEY LORE:
VENIN: Draw power from the land ("rot source"). Black eyes. Drain life. Command wyvern. Killed by dragon fire or silver weapons.
THE WARDS: Ancient barriers protecting Navarre. Powered by dragon-rider bonds. Failing because venin drain the land-source. The Senatum conceals this.
SIGNETS: Unique magical power from dragon bond. Lightning (${playerName}), Shadow (Xaden), Memory-reading (Dain).
BASGIATH: Rider training academy. The Parapet — narrow bridge over fatal drop — is the first test.
ARETIA: Hidden mountain city. Rebellion survivors. Ward research led by Brennan.
THE SENATUM: Navarre's governing body. Knows about venin. Sacrifices riders to power ward anchors.
POROMIEL: Neighboring nation. Also faces venin threat. Not the true enemy.
THE ARCHIPELAGO: Islands with ancient ward-stone knowledge. Site of the convergence event.
MATING BOND: Tairn/Sgaeyl mating creates involuntary bond between ${playerName} and Xaden.

OUTPUT FORMAT — CRITICAL:
Respond with ONLY valid JSON. No markdown fences. No text before or after. Start with { end with }.

{
"title": "Scene title (2-5 evocative words)",
"location": "Specific location",
"mood": "crimson|shadow|gold|storm|ancient|ash|emerald|void",
"text": "3-4 paragraphs. Rich literary prose. Second-person present tense. Use **bold** for emphasis, *italics* for thoughts and Tairn's speech. Use ${playerName}'s name naturally. Be vivid but concise — every sentence earns its place.",
"choices": [
  {"text": "Choice description (1-2 sentences)", "path_hint": "trust|resist|sacrifice|investigate|confront|flee|ally|deceive"},
  {"text": "Second choice", "path_hint": "direction"},
  {"text": "Optional third choice", "path_hint": "direction"}
],
"is_ending": false,
"ending_type": null,
"chapter": 1,
"story_flags": {}
}

ENDINGS (around 12-20 choices): Set is_ending: true, choices: [], ending_type to one of:
- "resistance_dawn": Fought for truth, sealed wards through alliance, survived with Xaden
- "sacrifice": Gave life-force to seal wards permanently — Tairn survives but grieves
- "corruption": Drew from the wrong source — darkness took hold
- "exile": Chose Aretia and freedom, wards unresolved
- "compromise": Stayed in the system, painful compromises
- "diplomatic": Brokered alliance between Navarre, Poromiel, and Archipelago
- "convergence": Survived the onyx storm, shattered venin command

Endings: 3-4 paragraphs referencing ${playerName}'s specific choices.

TONE: Dark, literary, emotionally resonant but CONCISE. Every sentence must earn its place. Deaths matter. Tairn's bond is reliable in an unreliable world. Xaden romance is charged, complicated, earned. Navarre is morally compromised. Venin encounters feel ancient and wrong. Warmth shines against darkness.

CHAPTERS: 1-3: Basgiath, Parapet, bonding. 4-6: Secrets, underground, venin lore. 7-9: Aretia, resistance, conspiracy. 10-12: Archipelago/border, escalation. 13+: Climax, ending.

Track story_flags for continuity.`;

// ─── MOOD THEMES — black & gold Empyrean aesthetic ──────────────────────────
const MOOD_THEMES = {
  crimson: { bg: "radial-gradient(ellipse at 50% 0%, #1a0808 0%, #100404 50%, #0a0204 100%)", accent: "#e0b840", accentSoft: "rgba(224,184,64,0.1)", accentBorder: "rgba(224,184,64,0.28)", particle: "#e0b84020", glow: "rgba(224,184,64,0.2)", secondary: "#c0392b", text: "#ede4c8", textMuted: "#a89868" },
  shadow:  { bg: "radial-gradient(ellipse at 30% 70%, #0c0610 0%, #080408 60%, #050206 100%)", accent: "#d8b440", accentSoft: "rgba(216,180,64,0.1)", accentBorder: "rgba(216,180,64,0.25)", particle: "#d8b44018", glow: "rgba(216,180,64,0.18)", secondary: "#9070c0", text: "#e8e0c4", textMuted: "#a09068" },
  gold:    { bg: "radial-gradient(ellipse at 60% 30%, #141008 0%, #0c0a04 60%, #080602 100%)", accent: "#e8c040", accentSoft: "rgba(232,192,64,0.12)", accentBorder: "rgba(232,192,64,0.3)", particle: "#e8c04020", glow: "rgba(232,192,64,0.22)", secondary: "#f0d060", text: "#ede4c8", textMuted: "#a89868" },
  storm:   { bg: "radial-gradient(ellipse at 50% 100%, #080a14 0%, #060810 60%, #040608 100%)", accent: "#d8b440", accentSoft: "rgba(216,180,64,0.1)", accentBorder: "rgba(216,180,64,0.25)", particle: "#d8b44018", glow: "rgba(216,180,64,0.18)", secondary: "#5090c0", text: "#e4dcc0", textMuted: "#988868" },
  ancient: { bg: "radial-gradient(ellipse at 40% 40%, #0a0a10 0%, #080810 60%, #060608 100%)", accent: "#d0b040", accentSoft: "rgba(208,176,64,0.1)", accentBorder: "rgba(208,176,64,0.25)", particle: "#d0b04018", glow: "rgba(208,176,64,0.16)", secondary: "#8898b8", text: "#e0d8bc", textMuted: "#988868" },
  ash:     { bg: "radial-gradient(ellipse at 50% 50%, #100e08 0%, #0a0806 60%, #060504 100%)", accent: "#d8b840", accentSoft: "rgba(216,184,64,0.1)", accentBorder: "rgba(216,184,64,0.25)", particle: "#d8b84018", glow: "rgba(216,184,64,0.16)", secondary: "#a89870", text: "#e4dcc0", textMuted: "#988860" },
  emerald: { bg: "radial-gradient(ellipse at 20% 20%, #080e08 0%, #060a04 60%, #040604 100%)", accent: "#d8b440", accentSoft: "rgba(216,180,64,0.1)", accentBorder: "rgba(216,180,64,0.25)", particle: "#d8b44018", glow: "rgba(216,180,64,0.16)", secondary: "#50a060", text: "#e0dcc0", textMuted: "#989468" },
  void:    { bg: "radial-gradient(ellipse at 50% 50%, #0c060c 0%, #080408 80%, #040204 100%)", accent: "#d8b040", accentSoft: "rgba(216,176,64,0.12)", accentBorder: "rgba(216,176,64,0.28)", particle: "#d8b04020", glow: "rgba(216,176,64,0.2)", secondary: "#9050a0", text: "#e4dcc4", textMuted: "#988868" },
};

const ENDING_LABELS = {
  resistance_dawn: "🌅 The Resistance's Dawn",
  sacrifice:       "⚡ The Final Sacrifice",
  corruption:      "🖤 The Darkness Reclaims",
  exile:           "🏔️ The Exile's Peace",
  compromise:      "⚖️ The Cost of Comfort",
  diplomatic:      "🌊 The Impossible Alliance",
  convergence:     "🌩️ After the Storm",
};

const LOADING_PHRASES = [
  "Tairn stirs in the bond…",
  "The wards pulse with old magic…",
  "Shadows shift in the quadrant…",
  "The dragons are watching…",
  "Fate weighs your choices…",
  "The east grows darker…",
  "Sgaeyl circles overhead…",
  "The Archive whispers…",
  "Lightning gathers in your blood…",
  "Andarna tilts her golden head…",
  "The ridgeline trembles…",
  "Ancient runes flare beneath stone…",
];

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { overflow-x: hidden; }

  @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
  @keyframes spinRune { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes flashFade { from{opacity:0.06} to{opacity:0} }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes choiceSlideIn { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
  @keyframes cursorPulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
  @keyframes glowPulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
  @keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
  @keyframes driftIn { from{opacity:0;transform:translateY(30px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes runeFloat { 0%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(180deg)} 100%{transform:translateY(0) rotate(360deg)} }
  @keyframes loadingBar { 0%{width:0%;margin-left:0} 50%{width:60%;margin-left:20%} 100%{width:0%;margin-left:100%} }

  ::selection { background: rgba(232,192,64,0.3); color: #ede4c8; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0a0804; }
  ::-webkit-scrollbar-thumb { background: rgba(232,192,64,0.22); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(232,192,64,0.4); }
`;

// ─── PARTICLE CANVAS ──────────────────────────────────────────────────────────
function ParticleField({ mood }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const moodRef = useRef(mood);
  useEffect(() => { moodRef.current = mood; }, [mood]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.3,
      vy: -(Math.random() * 0.35 + 0.06),
      vx: (Math.random() - 0.5) * 0.12,
      opacity: Math.random() * 0.45 + 0.1,
      pulse: Math.random() * Math.PI * 2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const theme = MOOD_THEMES[moodRef.current] || MOOD_THEMES.gold;
      particles.forEach(p => {
        p.y += p.vy;
        p.x += p.vx;
        p.pulse += 0.015;
        const op = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = theme.accent;
        ctx.globalAlpha = op * 0.28;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
    />
  );
}

// ─── LIGHTNING FLASH ──────────────────────────────────────────────────────────
function LightningFlash({ trigger }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!trigger) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 250);
    return () => clearTimeout(t);
  }, [trigger]);
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, pointerEvents: "none",
      background: "rgba(212,168,64,0.04)",
      animation: "flashFade 0.25s ease-out forwards"
    }} />
  );
}

// ─── TYPEWRITER HOOK ──────────────────────────────────────────────────────────
function useTypewriter(text, onDone, charsPerFrame = 10) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    indexRef.current = 0;
    clearInterval(intervalRef.current);
    if (!text) { setDone(true); onDoneRef.current?.(); return; }

    intervalRef.current = setInterval(() => {
      indexRef.current = Math.min(indexRef.current + charsPerFrame, text.length);
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(intervalRef.current);
        setDone(true);
        onDoneRef.current?.();
      }
    }, 16);
    return () => clearInterval(intervalRef.current);
  }, [text, charsPerFrame]);

  const skipToEnd = useCallback(() => {
    clearInterval(intervalRef.current);
    setDisplayed(text || "");
    setDone(true);
    onDoneRef.current?.();
  }, [text]);

  return { displayed, done, skipToEnd };
}

// ─── MARKDOWN RENDERER ───────────────────────────────────────────────────────
function renderMarkdown(text, theme) {
  if (!text) return null;
  return text.split(/\n\n+/).map((p, i) => {
    const html = p
      .replace(/\*\*(.+?)\*\*/g, `<strong style="color:${theme.accent};font-weight:600">$1</strong>`)
      .replace(/\*(.+?)\*/g, `<em style="color:${theme.secondary || theme.accent};font-style:italic">$1</em>`)
      .replace(/━{3,}/g, `<hr style="border:none;border-top:1px solid ${theme.accentBorder};margin:1.4em 0" />`);
    return (
      <p key={i} style={{
        margin: "0 0 1.15em",
        lineHeight: 1.9,
        animation: `fadeSlideUp 0.4s ease ${i * 0.05}s both`
      }} dangerouslySetInnerHTML={{ __html: html }} />
    );
  });
}

// ─── LOADING ORACLE ───────────────────────────────────────────────────────────
function LoadingOracle({ theme }) {
  const [dotCount, setDotCount] = useState(0);
  const phrase = useRef(LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)]).current;

  useEffect(() => {
    const t = setInterval(() => setDotCount(d => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: 240, gap: "1.8rem",
    }}>
      <div style={{
        fontSize: "1.8rem", color: theme.accent, opacity: 0.6,
        animation: "runeFloat 4s ease-in-out infinite",
        textShadow: `0 0 25px ${theme.glow}`,
      }}>✦</div>
      <div style={{
        fontFamily: "'Cormorant Garamond', 'Palatino Linotype', Palatino, serif",
        fontSize: "0.95rem", color: theme.accent, fontStyle: "italic",
        opacity: 0.7, letterSpacing: "0.06em",
      }}>
        {phrase}{"·".repeat(dotCount)}
      </div>
    </div>
  );
}

// ─── ORNAMENTAL DIVIDER ───────────────────────────────────────────────────────
function Divider({ theme, symbol = "✦" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right, transparent, ${theme.accentBorder})` }} />
      <div style={{ color: theme.accent, fontSize: "0.7rem", opacity: 0.4 }}>{symbol}</div>
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(to left, transparent, ${theme.accentBorder})` }} />
    </div>
  );
}

// ─── CHOICE BUTTON ────────────────────────────────────────────────────────────
function ChoiceButton({ choice, index, theme, visible, onChoose, disabled }) {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    if (clicked || disabled) return;
    setClicked(true);
    onChoose(choice.text, choice.path_hint || "unknown");
  };

  const labels = ["A", "B", "C", "D"];

  return (
    <button
      onClick={handleClick}
      disabled={clicked || disabled}
      onMouseEnter={() => !clicked && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: clicked ? "rgba(212,168,64,0.03)" : hovered ? theme.accentSoft : "rgba(212,168,64,0.04)",
        border: `1px solid ${clicked ? "rgba(212,168,64,0.08)" : hovered ? theme.accentBorder : "rgba(212,168,64,0.1)"}`,
        borderRadius: "2px",
        color: clicked ? "#6a5a38" : hovered ? theme.accent : theme.text || "#ede4c8",
        padding: "1rem 1.25rem",
        textAlign: "left",
        cursor: (clicked || disabled) ? "default" : "pointer",
        fontFamily: "'Crimson Pro', 'Palatino Linotype', Palatino, serif",
        fontSize: "clamp(0.9rem, 2.2vw, 1rem)",
        lineHeight: 1.65,
        display: "flex", alignItems: "flex-start", gap: "1rem",
        transition: "all 0.2s ease",
        opacity: visible ? 1 : 0,
        animation: visible ? `choiceSlideIn 0.25s ease ${index * 0.06}s both` : "none",
        boxShadow: hovered ? `0 0 20px ${theme.glow}` : "none",
        width: "100%",
      }}
    >
      <span style={{
        color: hovered ? theme.accent : (theme.textMuted || "#a89868"),
        flexShrink: 0, marginTop: "0.1em",
        fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em",
        fontFamily: "'Cormorant Garamond', serif",
        transition: "color 0.2s",
        minWidth: "1rem", textAlign: "center",
      }}>
        {labels[index] || "◆"}
      </span>
      <span>{choice.text}</span>
    </button>
  );
}

// ─── SCENE DISPLAY ────────────────────────────────────────────────────────────
function SceneDisplay({ scene, theme, onChoice, playerName, onRestart, isLoading, selectedChoiceText }) {
  const [choicesVisible, setChoicesVisible] = useState(false);

  const handleTextDone = useCallback(() => {
    setTimeout(() => setChoicesVisible(true), 150);
  }, []);

  const { displayed, done, skipToEnd } = useTypewriter(scene.text || "", handleTextDone, 18);

  useEffect(() => {
    setChoicesVisible(false);
  }, [scene.title]);

  const handleChoose = (text, hint) => {
    onChoice(text, hint);
  };

  // ── LOADING OVERLAY — semi-transparent over previous scene ──
  const loadingOverlay = isLoading ? (
    <div style={{
      position: "absolute", inset: 0, zIndex: 10,
      background: "rgba(8,6,4,0.78)",
      backdropFilter: "blur(6px)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: 380, gap: "2rem",
      animation: "fadeSlideUp 0.3s ease",
      borderRadius: "2px",
    }}>
      <div style={{
        fontSize: "1.8rem", color: theme.accent, opacity: 0.6,
        animation: "runeFloat 4s ease-in-out infinite",
        textShadow: `0 0 25px ${theme.glow}`,
      }}>✦</div>

      {selectedChoiceText && (
        <div style={{
          textAlign: "center", maxWidth: 500, padding: "0 1rem",
        }}>
          <div style={{
            fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase",
            color: theme.textMuted || "#a89868", marginBottom: "0.8rem",
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 500,
          }}>
            Your choice
          </div>
          <div style={{
            fontSize: "1rem", color: theme.text || "#ede4c8",
            fontFamily: "'Crimson Pro', serif", fontStyle: "italic",
            lineHeight: 1.6, opacity: 0.8,
          }}>
            "{selectedChoiceText}"
          </div>
        </div>
      )}

      <LoadingOracle theme={theme} />

      <div style={{
        width: 200, height: 3, borderRadius: 2, overflow: "hidden",
        background: "rgba(212,168,64,0.1)",
      }}>
        <div style={{
          height: "100%", background: theme.accent, borderRadius: 2,
          animation: "loadingBar 2.5s ease-in-out infinite",
        }} />
      </div>
    </div>
  ) : null;

  return (
    <div style={{ position: "relative", animation: "driftIn 0.35s ease" }}>
      {loadingOverlay}
      {/* Location bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.8rem",
        marginBottom: "1.4rem", animation: "fadeSlideUp 0.4s ease"
      }}>
        <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right, transparent, ${theme.accentBorder})` }} />
        <div style={{
          fontSize: "0.58rem", letterSpacing: "0.35em", textTransform: "uppercase",
          color: theme.accent, opacity: 0.65, whiteSpace: "nowrap",
          fontFamily: "'Cormorant Garamond', serif", fontWeight: 500,
        }}>📍 {scene.location}</div>
        <div style={{ flex: 1, height: "1px", background: `linear-gradient(to left, transparent, ${theme.accentBorder})` }} />
      </div>

      {/* Title */}
      <h2 style={{
        fontSize: "clamp(1.3rem, 4vw, 2rem)",
        fontWeight: 300,
        letterSpacing: "0.06em",
        color: theme.accent,
        margin: "0 0 0.5rem",
        textShadow: `0 0 50px ${theme.glow}`,
        transition: "color 1.5s ease",
        fontFamily: "'Cormorant Garamond', 'Palatino Linotype', serif",
        animation: "fadeSlideUp 0.4s ease 0.1s both",
      }}>
        {scene.title}
      </h2>

      {/* Chapter badge */}
      <div style={{
        fontSize: "0.52rem", letterSpacing: "0.35em", textTransform: "uppercase",
        color: theme.textMuted || "#a89868", marginBottom: "2rem",
        fontFamily: "'Cormorant Garamond', serif", fontWeight: 500,
        animation: "fadeSlideUp 0.4s ease 0.15s both",
      }}>
        Chapter {scene.chapter || 1}
        {scene.is_ending && (
          <span style={{ marginLeft: "1.2rem", color: theme.accent }}>
            · {ENDING_LABELS[scene.ending_type] || "The End"}
          </span>
        )}
      </div>

      {/* Narrative text */}
      <div style={{
        fontSize: "clamp(0.92rem, 2.2vw, 1.05rem)",
        lineHeight: 1.9,
        color: theme.text || "#ede4c8",
        marginBottom: "0.5rem",
        minHeight: 120,
        fontFamily: "'Crimson Pro', 'Palatino Linotype', Palatino, serif",
      }}>
        {renderMarkdown(displayed, theme)}
        {!done && (
          <span style={{
            display: "inline-block", width: 2, height: "1.1em",
            background: theme.accent, marginLeft: 3,
            animation: "cursorPulse 0.9s ease infinite",
            verticalAlign: "text-bottom", borderRadius: 1,
          }} />
        )}
      </div>

      {/* Skip button */}
      {!done && (
        <button onClick={skipToEnd} style={{
          background: "transparent", border: "none",
          color: theme.textMuted || "#a89868", cursor: "pointer",
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "0.62rem", letterSpacing: "0.25em",
          textTransform: "uppercase", padding: "0.4rem 0",
          marginBottom: "0.5rem", transition: "color 0.2s",
        }}
          onMouseEnter={e => e.currentTarget.style.color = theme.accent}
          onMouseLeave={e => e.currentTarget.style.color = "#a89868"}
        >
          Skip ↓
        </button>
      )}

      {/* Choices section */}
      {done && !scene.is_ending && scene.choices?.length > 0 && (
        <div style={{
          marginTop: "2.2rem", paddingTop: "1.8rem",
          borderTop: `1px solid ${theme.accentBorder}`,
        }}>
          <div style={{
            fontSize: "0.58rem", letterSpacing: "0.35em", textTransform: "uppercase",
            color: theme.textMuted || "#a89868", marginBottom: "1.4rem", textAlign: "center",
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 500,
          }}>
            — What do you do, {playerName}? —
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {scene.choices.map((choice, i) => (
              <ChoiceButton
                key={`${scene.title}-${i}`}
                choice={choice} index={i} theme={theme}
                visible={choicesVisible}
                onChoose={handleChoose}
                disabled={isLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ending section */}
      {scene.is_ending && done && (
        <div style={{ marginTop: "3rem", animation: "fadeSlideUp 0.8s ease" }}>
          <Divider theme={theme} symbol="⚔" />
          <div style={{
            textAlign: "center", marginTop: "1.5rem", marginBottom: "1.5rem",
            color: theme.accent, fontSize: "1.1rem",
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 400,
            letterSpacing: "0.15em",
          }}>
            {ENDING_LABELS[scene.ending_type] || "The End"}
          </div>
          <div style={{ textAlign: "center" }}>
            <button onClick={onRestart} style={{
              background: theme.accentSoft,
              border: `1px solid ${theme.accentBorder}`,
              borderRadius: "2px",
              color: theme.accent,
              padding: "0.9rem 2rem",
              cursor: "pointer",
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "0.9rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              transition: "all 0.25s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = theme.accentBorder; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = theme.accentSoft; e.currentTarget.style.color = theme.accent; }}
            >
              ↺ Begin Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NAME SCREEN ──────────────────────────────────────────────────────────────
function NameScreen({ onStart }) {
  const [name, setName] = useState("");
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [shaking, setShaking] = useState(false);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) { setShaking(true); setTimeout(() => setShaking(false), 500); return; }
    onStart(trimmed);
  };

  const theme = MOOD_THEMES.gold;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "2rem",
      background: "radial-gradient(ellipse at 50% 35%, #141008 0%, #0c0a04 50%, #080602 100%)",
      position: "relative", overflow: "hidden",
    }}>
      <style>{GLOBAL_STYLES}</style>
      <ParticleField mood="gold" />

      <div style={{
        position: "relative", zIndex: 2, textAlign: "center",
        maxWidth: 540, width: "100%",
        animation: "driftIn 1s ease",
      }}>
        {/* Rune */}
        <div style={{
          fontSize: "2rem", marginBottom: "1.2rem", opacity: 0.7, color: "#e8c040",
          textShadow: "0 0 50px rgba(232,192,64,0.4)",
          animation: "breathe 4s ease-in-out infinite",
        }}>⚔</div>

        {/* Subtitle */}
        <div style={{
          fontSize: "0.6rem", letterSpacing: "0.5em", textTransform: "uppercase",
          color: "#b8a060", marginBottom: "0.6rem",
          fontFamily: "'Cormorant Garamond', serif", fontWeight: 500,
        }}>The Empyrean Chronicles</div>

        {/* Title */}
        <h1 style={{
          fontSize: "clamp(2.2rem, 7vw, 3.8rem)",
          fontWeight: 300,
          fontFamily: "'Cormorant Garamond', 'Book Antiqua', Palatino, serif",
          color: "#e8c040",
          margin: "0 0 0.3rem",
          textShadow: "0 0 80px rgba(232,192,64,0.35), 0 0 30px rgba(232,192,64,0.15), 0 2px 10px rgba(0,0,0,0.8)",
          letterSpacing: "0.1em",
          lineHeight: 1.1,
        }}>
          Wings of Ruin
        </h1>

        <div style={{
          fontSize: "0.6rem", letterSpacing: "0.35em", textTransform: "uppercase",
          color: "#a09058", marginBottom: "3rem",
          fontFamily: "'Cormorant Garamond', serif", fontWeight: 400,
        }}>An Infinite Adventure · Powered by Claude</div>

        <Divider theme={theme} />

        <p style={{
          fontFamily: "'Crimson Pro', 'Palatino Linotype', Palatino, serif",
          color: "#d0c498", fontSize: "1.05rem", lineHeight: 1.75,
          margin: "2rem 0 2.5rem", fontStyle: "italic",
        }}>
          The Parapet awaits. The dragons watch from their cliffs.<br />
          Before you cross, they must know your name.
        </p>

        {/* Input */}
        <div style={{ animation: shaking ? "shake 0.4s ease" : "none", marginBottom: "1.2rem" }}>
          <label style={{
            display: "block", fontSize: "0.58rem", letterSpacing: "0.35em",
            textTransform: "uppercase", color: "#b8a060", marginBottom: "0.7rem",
            textAlign: "left", fontFamily: "'Cormorant Garamond', serif", fontWeight: 500,
          }}>Your Name, Rider</label>
          <input
            type="text" value={name} maxLength={32}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Enter your name…"
            autoFocus
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(232,192,64,0.06)",
              border: `1px solid ${focused ? "rgba(232,192,64,0.5)" : "rgba(232,192,64,0.18)"}`,
              borderRadius: "2px",
              color: "#ede4c8",
              fontFamily: "'Crimson Pro', 'Palatino Linotype', serif",
              fontSize: "1.15rem",
              padding: "0.95rem 1.2rem",
              outline: "none",
              letterSpacing: "0.06em",
              transition: "border-color 0.3s, box-shadow 0.3s",
              boxShadow: focused ? "0 0 30px rgba(232,192,64,0.12)" : "none",
            }}
          />
        </div>

        {/* Submit button */}
        <button
          onClick={submit}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: "100%",
            background: hovered ? "rgba(232,192,64,0.18)" : "rgba(232,192,64,0.07)",
            border: `1px solid ${hovered ? "rgba(232,192,64,0.55)" : "rgba(232,192,64,0.22)"}`,
            borderRadius: "2px",
            color: hovered ? "#f0d860" : "#e0b840",
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1rem", fontWeight: 500,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            padding: "1rem",
            cursor: "pointer",
            transition: "all 0.25s ease",
            boxShadow: hovered ? "0 0 40px rgba(232,192,64,0.15)" : "none",
          }}
        >
          Cross the Parapet →
        </button>

        <div style={{
          marginTop: "3.5rem", fontSize: "0.5rem", color: "#6a5c40",
          letterSpacing: "0.25em", textTransform: "uppercase", lineHeight: 2,
          fontFamily: "'Cormorant Garamond', serif",
        }}>
          Based on the Empyrean Series by Rebecca Yarros<br />
          Fourth Wing · Iron Flame · Onyx Storm
        </div>
      </div>
    </div>
  );
}

// ─── MAIN GAME SCREEN ─────────────────────────────────────────────────────────
function GameScreen({ playerName, onRestart }) {
  const [messages, setMessages] = useState([]);
  const [currentScene, setCurrentScene] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flashTrigger, setFlashTrigger] = useState(0);
  const [storyFlags, setStoryFlags] = useState({});
  const [choiceCount, setChoiceCount] = useState(0);
  const [sceneHistory, setSceneHistory] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const contentRef = useRef(null);

  const mood = currentScene?.mood || "gold";
  const theme = MOOD_THEMES[mood] || MOOD_THEMES.gold;

  // ── Parse response ────────────────────────────────────────────────────────
  const parseScene = (raw) => {
    if (!raw || !raw.trim()) throw new Error("Empty response from API");
    // Strip markdown code fences and any preamble text
    let cleaned = raw
      .replace(/^[\s\S]*?```json\s*/i, "")
      .replace(/```[\s\S]*$/i, "")
      .trim();
    // If no fences were found, just use raw
    if (cleaned === raw.trim()) {
      cleaned = raw.trim();
    }
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) {
      console.error("Raw API response:", raw.slice(0, 500));
      throw new Error("The narrator lost the thread. Try again.");
    }
    let jsonStr = cleaned.slice(start, end + 1);
    // Fix common issues: trailing commas before } or ]
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error("JSON parse error:", e.message, "\nJSON string:", jsonStr.slice(0, 300));
      throw new Error("The narrator's words were garbled. Try again.");
    }
    // Validate and provide defaults
    if (!parsed.text) throw new Error("The scene arrived empty. Try again.");
    if (!parsed.title) parsed.title = "Untitled Scene";
    if (!parsed.location) parsed.location = "Unknown";
    if (!parsed.mood || !MOOD_THEMES[parsed.mood]) parsed.mood = "gold";
    if (!parsed.chapter) parsed.chapter = 1;
    if (!Array.isArray(parsed.choices)) parsed.choices = [];
    if (!parsed.story_flags) parsed.story_flags = {};
    return parsed;
  };

  // ── API call ──────────────────────────────────────────────────────────────
  const callAPI = useCallback(async (messageHistory) => {
    let response;
    try {
      response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          system: buildSystemPrompt(playerName),
          messages: messageHistory,
        }),
      });
    } catch (fetchErr) {
      throw new Error("Could not reach the narrator. Is the server running? (npm run dev)");
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonErr) {
      throw new Error("The narrator's response was unreadable. Try again.");
    }

    if (!response.ok || data.error) {
      const msg = data?.error?.message || `Something went wrong (${response.status})`;
      throw new Error(msg);
    }

    if (!data.content || !Array.isArray(data.content)) {
      throw new Error("The narrator returned an unexpected response. Try again.");
    }

    const rawText = data.content
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("");

    if (!rawText.trim()) {
      throw new Error("The narrator fell silent. Try again.");
    }

    return parseScene(rawText);
  }, [playerName]);

  // ── Scroll to top of content on new scene ─────────────────────────────────
  useEffect(() => {
    if (currentScene && contentRef.current) {
      contentRef.current.scrollTo?.({ top: 0, behavior: "smooth" });
      window.scrollTo?.({ top: 0, behavior: "smooth" });
    }
  }, [currentScene?.title]);

  // ── Load first scene ──────────────────────────────────────────────────────
  useEffect(() => {
    const firstMsg = {
      role: "user",
      content: `My name is ${playerName}. I am a new cadet arriving at Basgiath War College on Conscription Day. Begin my story at Chapter 1. I haven't crossed the Parapet yet. Use my name ${playerName} throughout the narration, dialogue, and Tairn's speech.`,
    };
    callAPI([firstMsg])
      .then(scene => {
        const assistantMsg = { role: "assistant", content: JSON.stringify(scene) };
        setMessages([firstMsg, assistantMsg]);
        setCurrentScene(scene);
        setStoryFlags(scene.story_flags || {});
        setSceneHistory([scene.title]);
        if (["storm", "crimson", "void"].includes(scene.mood)) setFlashTrigger(f => f + 1);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  // ── Handle choice ─────────────────────────────────────────────────────────
  const handleChoice = useCallback((choiceText, pathHint) => {
    const newCount = choiceCount + 1;
    setSelectedChoice(choiceText);
    setLoading(true);
    setError(null);

    const flagsSummary = Object.keys(storyFlags).length > 0
      ? ` Story flags: ${JSON.stringify(storyFlags)}.` : "";

    const chapterHint = Math.ceil(newCount / 2) + 1;
    let pacing = "";
    if (newCount >= 16) pacing = " Deliver a FULL ending scene now with is_ending: true.";
    else if (newCount >= 12) pacing = " Begin building toward the climax.";

    const userMsg = {
      role: "user",
      content: `${playerName} chooses: "${choiceText}" (path: ${pathHint}).${flagsSummary} Chapter ~${chapterHint}.${pacing} Use ${playerName}'s name throughout.`,
    };

    const newMessages = [...messages, userMsg];

    callAPI(newMessages)
      .then(scene => {
        const assistantMsg = { role: "assistant", content: JSON.stringify(scene) };
        setMessages([...newMessages, assistantMsg]);
        setCurrentScene(scene);
        setChoiceCount(newCount);
        setSelectedChoice(null);
        setStoryFlags(prev => ({ ...prev, ...(scene.story_flags || {}) }));
        setSceneHistory(h => [...h, scene.title]);
        if (["storm", "crimson", "void"].includes(scene.mood)) setFlashTrigger(f => f + 1);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); setSelectedChoice(null); });
  }, [messages, choiceCount, storyFlags, playerName, callAPI]);

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.bg,
      transition: "background 2s ease",
      position: "relative", overflow: "hidden",
      fontFamily: "'Crimson Pro', 'Palatino Linotype', Palatino, serif",
      color: "#ede4c8",
    }}>
      <style>{GLOBAL_STYLES}</style>
      <LightningFlash trigger={flashTrigger} />
      <ParticleField mood={mood} />

      {/* Film grain overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      {/* Corner ornaments */}
      {[
        { top: 16, left: 16 }, { top: 16, right: 16 },
        { bottom: 16, left: 16 }, { bottom: 16, right: 16 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "fixed", zIndex: 2, fontSize: "0.9rem",
          color: theme.accent, opacity: 0.3,
          transition: "color 2s ease", ...pos,
        }}>✦</div>
      ))}

      <div ref={contentRef} style={{
        position: "relative", zIndex: 3,
        maxWidth: 780, margin: "0 auto",
        padding: "1.5rem 1.25rem 5rem",
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "1.5rem", paddingBottom: "0.8rem",
          borderBottom: `1px solid ${theme.accentBorder}`,
          transition: "border-color 2s ease",
        }}>
          <div style={{
            fontSize: "0.75rem", letterSpacing: "0.35em", textTransform: "uppercase",
            color: theme.accent,
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 600,
          }}>✦ Wings of Ruin</div>
          <div style={{
            fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase",
            color: theme.text || "#ede4c8",
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 500,
          }}>
            {playerName} · Ch.{currentScene?.chapter || 1} · {choiceCount} {choiceCount === 1 ? "choice" : "choices"}
          </div>
          <button onClick={onRestart} style={{
            background: "transparent", border: "none",
            color: theme.text || "#ede4c8", cursor: "pointer",
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "0.75rem", letterSpacing: "0.15em",
            textTransform: "uppercase", padding: "0.2rem 0",
            transition: "color 0.2s", fontWeight: 500,
          }}
            onMouseEnter={e => e.currentTarget.style.color = theme.accent}
            onMouseLeave={e => e.currentTarget.style.color = theme.text || "#ede4c8"}
          >↺ Restart</button>
        </div>

        {/* Main card */}
        <div style={{
          background: "rgba(10,8,4,0.82)",
          border: `1px solid ${theme.accentBorder}`,
          borderRadius: "3px",
          backdropFilter: "blur(20px)",
          boxShadow: `0 16px 80px rgba(0,0,0,0.5), 0 0 60px ${theme.glow}, inset 0 1px 0 ${theme.accentSoft}`,
          flex: 1, overflow: "hidden",
          transition: "border-color 2s ease, box-shadow 2s ease",
        }}>
          <div style={{
            border: `1px solid ${theme.accentSoft}`,
            margin: "4px", borderRadius: "2px",
            padding: "clamp(1.5rem, 4vw, 2.8rem)",
            minHeight: 400,
            transition: "border-color 2s ease",
            background: "rgba(232,192,64,0.03)",
          }}>
            {/* Loading state */}
            {loading && !currentScene && <LoadingOracle theme={theme} />}

            {/* Error state */}
            {error && (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem", animation: "fadeSlideUp 0.4s ease" }}>
                <div style={{ fontSize: "1.4rem", marginBottom: "1.2rem", color: "#c87040" }}>⚠</div>
                <div style={{
                  marginBottom: "1.8rem", fontSize: "0.92rem", lineHeight: 1.7,
                  color: "#c8a080", fontFamily: "'Crimson Pro', serif",
                }}>
                  {error}
                </div>
                <button onClick={() => {
                  setError(null);
                  if (!currentScene) {
                    // Retry initial load
                    setLoading(true);
                    const firstMsg = {
                      role: "user",
                      content: `My name is ${playerName}. I am a new cadet arriving at Basgiath War College on Conscription Day. Begin my story at Chapter 1. I haven't crossed the Parapet yet. Use my name ${playerName} throughout the narration, dialogue, and Tairn's speech.`,
                    };
                    callAPI([firstMsg])
                      .then(scene => {
                        const assistantMsg = { role: "assistant", content: JSON.stringify(scene) };
                        setMessages([firstMsg, assistantMsg]);
                        setCurrentScene(scene);
                        setStoryFlags(scene.story_flags || {});
                        setSceneHistory([scene.title]);
                        if (["storm", "crimson", "void"].includes(scene.mood)) setFlashTrigger(f => f + 1);
                        setLoading(false);
                      })
                      .catch(err => { setError(err.message); setLoading(false); });
                  } else {
                    setLoading(false);
                  }
                }} style={{
                  background: "rgba(200,112,64,0.1)",
                  border: "1px solid rgba(200,112,64,0.25)",
                  borderRadius: "2px", color: "#c8a060",
                  padding: "0.7rem 1.5rem", cursor: "pointer",
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "0.85rem", letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  transition: "all 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(200,112,64,0.18)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(200,112,64,0.1)"}
                >Try Again</button>
              </div>
            )}

            {/* Scene display */}
            {!error && currentScene && (
              <SceneDisplay
                key={currentScene.title + "-" + choiceCount}
                scene={currentScene}
                theme={theme}
                onChoice={handleChoice}
                playerName={playerName}
                onRestart={onRestart}
                isLoading={loading && !!selectedChoice}
                selectedChoiceText={selectedChoice}
              />
            )}
          </div>
        </div>

        {/* Scene path trail */}
        {sceneHistory.length > 1 && (
          <div style={{
            marginTop: "1.2rem", padding: "0 0.25rem",
            display: "flex", flexWrap: "wrap",
            gap: "0.25rem 0.5rem", alignItems: "center",
          }}>
            <span style={{
              fontSize: "0.5rem", letterSpacing: "0.25em",
              textTransform: "uppercase", color: "#a89868",
              fontFamily: "'Cormorant Garamond', serif",
            }}>Path:</span>
            {sceneHistory.map((title, i) => (
              <span key={i} style={{
                fontSize: "0.5rem",
                color: i === sceneHistory.length - 1 ? theme.accent : "#a89868",
                transition: "color 2s ease",
                letterSpacing: "0.03em",
                fontFamily: "'Crimson Pro', serif",
              }}>
                {title}
                {i < sceneHistory.length - 1 && (
                  <span style={{ color: "#4a3a20", marginLeft: "0.5rem" }}>→</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── RANDOM NAME GENERATOR ────────────────────────────────────────────────────
const RIDER_FIRST_NAMES = [
  "Serana", "Caelum", "Isolde", "Theron", "Elara", "Cassian", "Neve", "Ronan",
  "Vesper", "Alaric", "Lirien", "Darius", "Ember", "Callen", "Astrid", "Kael",
  "Soraya", "Lucien", "Briar", "Tavian", "Eira", "Corvin", "Petra", "Soren",
  "Maren", "Gavin", "Aelara", "Valen", "Lysara", "Riven", "Selene", "Kellan",
];

function getRandomName() {
  return RIDER_FIRST_NAMES[Math.floor(Math.random() * RIDER_FIRST_NAMES.length)] + " Sorrengail";
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [playerName, setPlayerName] = useState(() => getRandomName());
  const [gameKey, setGameKey] = useState(0);

  const handleRestart = () => {
    setPlayerName(getRandomName());
    setGameKey(k => k + 1);
  };

  return <GameScreen key={`${gameKey}-${playerName}`} playerName={playerName} onRestart={handleRestart} />;
}