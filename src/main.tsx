import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { organizeText } from "./organize.js";
import { InstallApp } from "./InstallApp";
type Script = { id: string; title: string; body: string; updatedAt: number };
type Settings = {
  speed: number;
  fontSize: number;
  lineHeight: number;
  width: number;
  mirror: boolean;
  opacity: number;
  marker: number;
};
const defaults: Settings = {
  speed: 45,
  fontSize: window.matchMedia("(max-width: 650px)").matches ? 44 : 64,
  lineHeight: 1.6,
  width: window.matchMedia("(max-width: 650px)").matches ? 88 : 76,
  mirror: false,
  opacity: 30,
  marker: 35,
};
const sample: Script = {
  id: "welcome",
  title: "Um momento para respirar",
  updatedAt: Date.now(),
  body: "Respira fundo.\n\nNão precisas de acertar em todas as palavras. Só precisas de começar.\n\nEste é o teu espaço para encontrares o teu ritmo. Um lugar onde podes transformar palavras escritas numa mensagem com a tua voz.\n\nMantém o olhar perto da linha de leitura. Deixa que as palavras venham até ti. Se precisares de um momento, carrega na barra de espaços para fazer uma pausa.\n\nAbranda. Levanta o olhar. Deixa algum espaço entre as tuas ideias.\n\nAs melhores histórias nem sempre são as que fazem mais barulho. Às vezes, são as que se contam com um pouco mais de cuidado.\n\nComeça quando te sentires preparado.",
};
function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
const originalSample =
  "Take a breath.\n\nYou don’t have to get every word perfect. You just have to begin.\n\nThis is your space to find your rhythm. A place to turn a few written words into something that sounds like you.\n\nKeep your eyes near the reading line. Let the words come to you. If you need a moment, press space to pause.\n\nSlow down. Look up. Leave a little room between your thoughts.\n\nThe best stories aren’t always the loudest. Sometimes, they’re the ones told with a little more care.\n\nReady when you are.";
function loadScripts() {
  const data = read<Script[]>("still.scripts", [sample]);
  return Array.isArray(data)
    ? data
        .filter(
          (s) =>
            s &&
            typeof s.id === "string" &&
            typeof s.title === "string" &&
            typeof s.body === "string" &&
            typeof s.updatedAt === "number",
        )
        .map((script) =>
          script.id === "welcome" &&
          script.title === "A little room to breathe" &&
          script.body === originalSample
            ? { ...script, title: sample.title, body: sample.body }
            : script,
        )
    : [sample];
}
function loadSettings() {
  const saved = read<Partial<Settings>>("still.settings", {});
  const s = { ...defaults };
  for (const k of Object.keys(defaults) as (keyof Settings)[])
    if (typeof saved?.[k] === typeof defaults[k]) (s as any)[k] = saved[k];
  for (const [k, min, max] of [
    ["speed", 5, 200],
    ["fontSize", 28, 120],
    ["lineHeight", 1.1, 2.4],
    ["width", 35, 95],
    ["opacity", 0, 100],
    ["marker", 15, 75],
  ] as const)
    s[k] = Math.max(
      min,
      Math.min(max, Number.isFinite(s[k]) ? s[k] : defaults[k]),
    );
  return s;
}
const tokenize = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
function fuzzy(a: string, b: string) {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4 || Math.abs(a.length - b.length) > 1)
    return false;
  let i = 0,
    j = 0,
    n = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else {
      if (++n > 1) return false;
      if (a.length >= b.length) i++;
      if (b.length >= a.length) j++;
    }
  }
  return n + a.length - i + b.length - j <= 1;
}
const Speech =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
function App() {
  const [scripts, setScripts] = useState(loadScripts),
    [id, setId] = useState(() => loadScripts()[0]?.id || "");
  const script = scripts.find((s) => s.id === id);
  const [draft, setDraft] = useState(script?.body || "");
  const [autoPaste, setAutoPaste] = useState(
    () => read<boolean>("still.autoPaste", false) === true,
  );
  const [pasteUndo, setPasteUndo] = useState<{
    id: string;
    original: string;
    organized: string;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem("still.autoPaste", JSON.stringify(autoPaste));
    } catch {
      setNotice("Não foi possível guardar o modo de colagem.");
    }
  }, [autoPaste]);
  const [s, setS] = useState(loadSettings),
    [prompt, setPrompt] = useState(false),
    [playing, setPlaying] = useState(false),
    [hidden, setHidden] = useState(false),
    [notice, setNotice] = useState("");
  const [camera, setCamera] = useState(false),
    [recording, setRecording] = useState(false),
    [download, setDownload] = useState(""),
    [voice, setVoice] = useState(false),
    [elapsed, setElapsed] = useState(0);
  const viewport = useRef<HTMLDivElement>(null),
    text = useRef<HTMLDivElement>(null),
    video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    recorder = useRef<MediaRecorder | null>(null),
    recognition = useRef<any>(null),
    idle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    denied = useRef(false),
    request = useRef(0),
    cursor = useRef(0),
    live = useRef(s),
    position = useRef(0);
  live.current = s;
  function save() {
    if (script && draft !== script.body)
      setScripts((p) =>
        p.map((x) =>
          x.id === id ? { ...x, body: draft, updatedAt: Date.now() } : x,
        ),
      );
  }
  useEffect(() => {
    try {
      localStorage.setItem("still.scripts", JSON.stringify(scripts));
    } catch {
      setNotice(
        "O armazenamento está indisponível ou cheio. Copia o teu texto antes de fechar.",
      );
    }
  }, [scripts]);
  useEffect(() => {
    try {
      localStorage.setItem("still.settings", JSON.stringify(s));
    } catch {
      setNotice("Não foi possível guardar as definições neste navegador.");
    }
  }, [s]);
  useEffect(
    () => () => {
      request.current++;
      stream.current?.getTracks().forEach((t) => t.stop());
      recognition.current?.stop();
      clearTimeout(idle.current);
    },
    [],
  );
  useEffect(
    () => () => {
      if (download) URL.revokeObjectURL(download);
    },
    [download],
  );
  function wake() {
    setHidden(false);
    clearTimeout(idle.current);
    if (playing) idle.current = setTimeout(() => setHidden(true), 3000);
  }
  useEffect(() => {
    wake();
    return () => clearTimeout(idle.current);
  }, [playing]);
  useEffect(() => {
    if (!prompt || !playing) return;
    let frame = 0,
      last = 0,
      written = viewport.current?.scrollTop || 0;
    position.current = written;
    function tick(now: number) {
      const el = viewport.current;
      if (last && el) {
        if (el.scrollTop !== written) position.current = el.scrollTop;
        const dt = Math.min((now - last) / 1000, 0.1);
        position.current += live.current.speed * dt;
        el.scrollTop = position.current;
        written = el.scrollTop;
        setElapsed((e) => e + dt);
        if (el.scrollTop >= el.scrollHeight - el.clientHeight - 1) {
          setPlaying(false);
          return;
        }
      }
      last = now;
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [prompt, playing]);
  function jump(delta: number) {
    const el = viewport.current;
    if (el) {
      el.scrollTop += delta;
      position.current = el.scrollTop;
    }
  }
  function reset() {
    if (viewport.current) viewport.current.scrollTop = 0;
    position.current = 0;
    cursor.current = 0;
    setElapsed(0);
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setNotice("O ecrã inteiro não está disponível neste navegador.");
    }
  }
  function stopCamera() {
    request.current++;
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setCamera(false);
  }
  async function startCamera() {
    const token = ++request.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw Error();
      const media = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (token !== request.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      setCamera(true);
    } catch {
      if (!denied.current) {
        denied.current = true;
        setNotice("Sem acesso à câmara ou ao microfone. A usar um fundo liso.");
      }
    }
  }
  useEffect(() => {
    if (video.current) video.current.srcObject = camera ? stream.current : null;
  }, [camera]);
  function record() {
    if (recorder.current?.state === "recording") {
      recorder.current.stop();
      return;
    }
    if (!stream.current || !window.MediaRecorder) return;
    try {
      const mime = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ].find((x) => MediaRecorder.isTypeSupported(x));
      if (!mime) {
        setNotice("A gravação em WebM não está disponível neste navegador.");
        return;
      }
      const chunks: BlobPart[] = [];
      const rec = new MediaRecorder(stream.current, { mimeType: mime });
      recorder.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = () => {
        setRecording(false);
        setDownload(URL.createObjectURL(new Blob(chunks, { type: mime })));
      };
      rec.onerror = () => {
        setRecording(false);
        setNotice("Ocorreu um erro no navegador durante a gravação.");
      };
      rec.start(1000);
      setRecording(true);
    } catch {
      setNotice("Não foi possível iniciar a gravação.");
    }
  }
  function stopVoice() {
    setVoice(false);
    const rec = recognition.current;
    recognition.current = null;
    if (rec) {
      rec.onend = null;
      rec.stop();
    }
  }
  function startVoice() {
    if (!Speech) return;
    const rec = new Speech();
    recognition.current = rec;
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "pt-PT";
    rec.onresult = (event: any) => {
      const heard = tokenize(
        Array.from(event.results)
          .slice(event.resultIndex)
          .map((r: any) => r[0].transcript)
          .join(" "),
      );
      const spans = Array.from(
        text.current?.querySelectorAll<HTMLElement>("[data-token]") || [],
      );
      let best = -1,
        score = 0;
      for (
        let i = cursor.current;
        i < Math.min(spans.length, cursor.current + 65);
        i++
      ) {
        let hits = 0;
        for (let j = 0; j < heard.length && i + j < spans.length; j++)
          if (fuzzy(heard[j], spans[i + j].dataset.token!)) hits++;
        if (hits > score) {
          score = hits;
          best = i + heard.length - 1;
        }
      }
      if (
        heard.length >= 2 &&
        score >= Math.min(3, heard.length) &&
        spans[best] &&
        viewport.current
      ) {
        cursor.current = best + 1;
        const el = viewport.current;
        const distance =
          spans[best].getBoundingClientRect().top -
          (el.clientHeight * live.current.marker) / 100;
        jump(
          Math.max(
            -el.clientHeight / 3,
            Math.min(el.clientHeight / 3, distance * 0.45),
          ),
        );
      }
    };
    rec.onend = () => setVoice(false);
    rec.onerror = () => {
      stopVoice();
      setNotice(
        "O acompanhamento por voz parou. Podes continuar a deslocar o texto manualmente.",
      );
    };
    try {
      rec.start();
      setVoice(true);
    } catch {
      setNotice("Não foi possível iniciar o acompanhamento por voz.");
    }
  }
  function exit() {
    setPlaying(false);
    stopVoice();
    stopCamera();
    setPrompt(false);
    if (document.fullscreenElement) void document.exitFullscreen();
  }
  useEffect(() => {
    if (!prompt) return;
    function key(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) && e.key !== "Escape")
        return;
      if (["BUTTON", "A"].includes(tag) && e.key === " ") return;
      let handled = true;
      switch (e.key.toLowerCase()) {
        case " ":
          setPlaying((p) => !p);
          break;
        case "arrowup":
          setS((v) => ({ ...v, speed: Math.min(200, v.speed + 5) }));
          break;
        case "arrowdown":
          setS((v) => ({ ...v, speed: Math.max(5, v.speed - 5) }));
          break;
        case "arrowleft":
          jump(-live.current.speed * 3);
          break;
        case "arrowright":
          jump(live.current.speed * 3);
          break;
        case "r":
          reset();
          break;
        case "m":
          setS((v) => ({ ...v, mirror: !v.mirror }));
          break;
        case "f":
          void fullscreen();
          break;
        case "escape":
          exit();
          break;
        default:
          handled = false;
      }
      if (handled) {
        e.preventDefault();
        wake();
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [prompt, playing]);
  function slider(
    label: string,
    k: Exclude<keyof Settings, "mirror">,
    min: number,
    max: number,
    step = 1,
    suffix = "",
  ) {
    return (
      <label className="slider">
        <span>
          {label}
          <b>
            {s[k].toLocaleString("pt-PT")}
            {suffix}
          </b>
        </span>
        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={s[k]}
          onChange={(e) => setS((v) => ({ ...v, [k]: +e.target.value }))}
        />
      </label>
    );
  }
  const count = tokenize(draft).length;
  return (
    <>
      {!prompt ? (
        <div className="workspace">
          <aside>
            <div className="brand">
              <span>▰</span> still<i>.</i>
            </div>
            <div className="library-heading">
              A TUA BIBLIOTECA{" "}
              <span>{String(scripts.length).padStart(2, "0")}</span>
            </div>
            <button
              className="new"
              onClick={() => {
                save();
                const x = {
                  id: crypto.randomUUID(),
                  title: "Texto sem título",
                  body: "",
                  updatedAt: Date.now(),
                };
                setScripts((p) => [x, ...p]);
                setId(x.id);
                setDraft("");
              }}
            >
              ＋ Novo texto
            </button>
            <nav>
              {scripts.map((x) => (
                <button
                  key={x.id}
                  className={"script " + (x.id === id ? "selected" : "")}
                  onClick={() => {
                    save();
                    setId(x.id);
                    setDraft(x.body);
                  }}
                >
                  <span className="doc">▤</span>
                  <span>
                    <strong>{x.title || "Texto sem título"}</strong>
                    <small>
                      {tokenize(x.body).length} palavras ·{" "}
                      {new Date(x.updatedAt).toLocaleDateString("pt-PT", {
                        month: "short",
                        day: "numeric",
                      })}
                    </small>
                  </span>
                  {x.id === id && <i>•</i>}
                </button>
              ))}
            </nav>
            <div className="local">
              <em /> Guardado neste dispositivo
              <small>Os teus textos ficam no teu navegador.</small>
            </div>
          </aside>
          <main>
            <header>
              <div>
                <span className="eyebrow">O TEU TELEPONTO LOCAL</span>
                <p>Cabeça tranquila. Voz segura.</p>
              </div>
              <div className="header-actions">
                <span className="badge">◉ &nbsp; Privado por natureza</span>
                <InstallApp />
              </div>
            </header>
            {script ? (
              <>
                <div className="editor-heading">
                  <div className="breadcrumb">
                    Biblioteca <span>/</span> Editor de texto
                  </div>
                  <div className="title-row">
                    <input
                      className="title"
                      aria-label="Título do texto"
                      value={script.title}
                      onChange={(e) =>
                        setScripts((p) =>
                          p.map((x) =>
                            x.id === id
                              ? {
                                  ...x,
                                  title: e.target.value,
                                  updatedAt: Date.now(),
                                }
                              : x,
                          ),
                        )
                      }
                    />
                    <button
                      className="delete"
                      onClick={() => {
                        if (
                          !confirm(
                            `Eliminar «${script.title}»? Esta ação não pode ser anulada.`,
                          )
                        )
                          return;
                        const rest = scripts.filter((x) => x.id !== id);
                        setScripts(rest);
                        setId(rest[0]?.id || "");
                        setDraft(rest[0]?.body || "");
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                  <div className="meta">
                    <span>{count} palavras</span>
                    <span>
                      ~{Math.max(1, Math.ceil(count / 130))} min de leitura
                    </span>
                    <span>
                      {draft === script.body
                        ? "✓ Alterações guardadas"
                        : "A editar · guarda ao sair do campo"}
                    </span>
                  </div>
                </div>
                <section className="editor">
                  <div className="toolbar">
                    <span>
                      <em /> TEXTO
                    </span>
                    <span>Só as tuas palavras. Sem distrações.</span>
                  </div>
                  <div className="paste-options">
                    <label className="paste-toggle">
                      <input
                        type="checkbox"
                        role="switch"
                        checked={autoPaste}
                        onChange={(event) => setAutoPaste(event.target.checked)}
                      />
                      <span className="switch-track" aria-hidden="true" />
                      <span>Organizar ao colar</span>
                    </label>
                    <p id="paste-help">
                      {autoPaste
                        ? "Junta linhas partidas e cria blocos de leitura. Mantém as tuas palavras."
                        : "Mantém o texto tal como o colas. Organiza-o à tua maneira."}
                    </p>
                  </div>
                  <textarea
                    aria-label="Corpo do texto"
                    aria-describedby="paste-help"
                    onPaste={(event) => {
                      if (!autoPaste) {
                        setPasteUndo(null);
                        return;
                      }
                      const pasted = event.clipboardData.getData("text/plain");
                      if (!pasted) return;
                      event.preventDefault();
                      const field = event.currentTarget;
                      const start = field.selectionStart,
                        end = field.selectionEnd;
                      const arranged = organizeText(pasted);
                      const original =
                        draft.slice(0, start) + pasted + draft.slice(end);
                      const organized =
                        draft.slice(0, start) + arranged + draft.slice(end);
                      setDraft(organized);
                      setPasteUndo(
                        original !== organized
                          ? { id, original, organized }
                          : null,
                      );
                      requestAnimationFrame(() =>
                        field.setSelectionRange(
                          start + arranged.length,
                          start + arranged.length,
                        ),
                      );
                    }}
                    placeholder="Todas as boas histórias têm um princípio…"
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      setPasteUndo(null);
                    }}
                    onBlur={save}
                  />
                  <footer>
                    {pasteUndo?.id === id && pasteUndo.organized === draft ? (
                      <button
                        className="undo-paste"
                        onClick={() => {
                          setDraft(pasteUndo.original);
                          setScripts((items) =>
                            items.map((item) =>
                              item.id === id
                                ? {
                                    ...item,
                                    body: pasteUndo.original,
                                    updatedAt: Date.now(),
                                  }
                                : item,
                            ),
                          );
                          setPasteUndo(null);
                        }}
                      >
                        ↶ Desfazer organização
                      </button>
                    ) : (
                      <span>Dá-lhe a tua voz.</span>
                    )}
                    <span>Texto simples · Guarda ao sair do campo</span>
                  </footer>
                </section>
                <div className="launch">
                  <p>✧ &nbsp; Respira fundo. Começa ao teu ritmo.</p>
                  <button
                    className="primary"
                    onClick={() => {
                      save();
                      setPrompt(true);
                      setPlaying(false);
                      setElapsed(0);
                      cursor.current = 0;
                    }}
                  >
                    Abrir teleponto <span>↗</span>
                  </button>
                </div>
                <div className="tips">
                  <div>
                    <kbd>espaço</kbd>
                    <span>
                      Encontra o teu ritmo
                      <small>Faz uma pausa quando precisares.</small>
                    </span>
                  </div>
                  <div>
                    <kbd>↑ ↓</kbd>
                    <span>
                      Escolhe o teu ritmo
                      <small>Ajusta a velocidade durante a leitura.</small>
                    </span>
                  </div>
                  <div>
                    <kbd>M</kbd>
                    <span>
                      Espelha o teu texto
                      <small>Pronto para o espelho do teleponto.</small>
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty">
                <h1>Um espaço para a tua próxima história.</h1>
                <p>Cria um texto para começar.</p>
              </div>
            )}
            <div className="bottom">
              SEM NUVEM. SEM CONTAS. SÓ TU E AS TUAS PALAVRAS.
              <span>STILL / 01</span>
            </div>
          </main>
        </div>
      ) : (
        <div
          className={"prompter " + (hidden ? "hidden" : "")}
          onMouseMove={wake}
          onTouchStart={wake}
          onKeyDownCapture={wake}
        >
          <video
            aria-hidden="true"
            className="camera"
            ref={video}
            autoPlay
            muted
            playsInline
            style={{ opacity: s.opacity / 100 }}
          />
          <div className="marker" style={{ top: s.marker + "%" }}>
            <span>▶</span>
          </div>
          <div className="viewport" ref={viewport}>
            <div
              className="prompt-text"
              ref={text}
              style={{
                fontSize: s.fontSize,
                lineHeight: s.lineHeight,
                width: s.width + "%",
                transform: s.mirror ? "scaleX(-1)" : undefined,
                paddingTop: s.marker + "dvh",
              }}
            >
              {(script?.body || "").split(/(\s+)/).map((part, i) =>
                /\s/.test(part) ? (
                  part
                ) : (
                  <span key={i} data-token={tokenize(part)[0]}>
                    {part}
                  </span>
                ),
              )}
            </div>
          </div>
          <div className="prompt-top controls">
            <button onClick={exit}>← Biblioteca</button>
            <span>{script?.title}</span>
            <button onClick={fullscreen}>⛶ Ecrã inteiro</button>
          </div>
          <div className="panel controls" onFocus={wake}>
            <div className="transport">
              <button onClick={reset} title="Voltar ao início (R)">
                ↺
              </button>
              <button className="primary" onClick={() => setPlaying((p) => !p)}>
                {playing ? "Ⅱ Pausa" : "▶ Iniciar"} <kbd>espaço</kbd>
              </button>
              <span>
                {Math.floor(elapsed / 60)}:
                {String(Math.floor(elapsed % 60)).padStart(2, "0")}
              </span>
              <button
                aria-pressed={s.mirror}
                onClick={() => setS((v) => ({ ...v, mirror: !v.mirror }))}
              >
                ↔ Espelhar
              </button>
            </div>
            <button
              className="settings-toggle"
              aria-expanded={showSettings}
              onClick={() => setShowSettings((value) => !value)}
            >
              ⚙ {showSettings ? "Ocultar definições" : "Definições e gravação"}
            </button>
            <div
              className={"prompt-options " + (showSettings ? "expanded" : "")}
            >
              <div className="touch-seek">
                <button onClick={() => jump(-live.current.speed * 3)}>
                  ← Recuar 3 s
                </button>
                <button onClick={() => jump(live.current.speed * 3)}>
                  Avançar 3 s →
                </button>
              </div>
              <div className="sliders">
                {slider("Velocidade", "speed", 5, 200, 1, " px/s")}
                {slider("Tamanho da letra", "fontSize", 28, 120, 1, " px")}
                {slider("Entrelinha", "lineHeight", 1.1, 2.4, 0.1)}
                {slider("Largura do texto", "width", 35, 95, 1, "%")}
                {slider("Linha de leitura", "marker", 15, 75, 1, "%")}
                {slider("Opacidade da câmara", "opacity", 0, 100, 1, "%")}
              </div>
              <div className="media">
                <button
                  aria-pressed={camera}
                  onClick={() => (camera ? stopCamera() : void startCamera())}
                >
                  {camera ? "◉ Câmara ligada" : "○ Ligar câmara + microfone"}
                </button>
                {camera && typeof MediaRecorder !== "undefined" && (
                  <button
                    className={recording ? "recording" : ""}
                    onClick={record}
                  >
                    {recording ? "■ Parar gravação" : "● Gravar câmara"}
                  </button>
                )}
                {download && (
                  <a href={download} download="still-gravacao.webm">
                    ↓ Guardar gravação .webm
                  </a>
                )}
                {Speech && (
                  <label className="voice">
                    <input
                      type="checkbox"
                      checked={voice}
                      onChange={() => (voice ? stopVoice() : startVoice())}
                    />{" "}
                    Acompanhamento por voz{" "}
                    <small>
                      experimental · o serviço de voz do navegador pode usar a
                      Internet
                    </small>
                  </label>
                )}
              </div>
            </div>
            <div className="shortcuts">
              ESPAÇO iniciar / pausa · ↑ ↓ velocidade · ← → saltar 3 s · R
              início · M espelhar · F ecrã inteiro · ESC sair
            </div>
          </div>
        </div>
      )}
      {notice && (
        <div className="notice" role="status">
          {notice}
          <button aria-label="Fechar mensagem" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);

// Only the production build installs the offline application shell.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Online app remains available. */
    });
  });
}
