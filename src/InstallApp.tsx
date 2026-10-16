import { useEffect, useState } from "react";
type InstallEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function InstallApp() {
  const [offer, setOffer] = useState<InstallEvent | null>(null);
  const [help, setHelp] = useState(false);
  const [installed, setInstalled] = useState(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
  );
  useEffect(() => {
    const before = (event: Event) => {
      event.preventDefault();
      setOffer(event as InstallEvent);
    };
    const done = () => {
      setInstalled(true);
      setOffer(null);
      setHelp(false);
    };
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", before);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  if (installed) return <span className="installed-note">✓ App instalada</span>;
  return (
    <div className="install-app">
      <button
        onClick={async () => {
          if (offer) {
            await offer.prompt();
            const choice = await offer.userChoice;
            if (choice.outcome === "accepted") setHelp(false);
            setOffer(null);
          } else setHelp((value) => !value);
        }}
        aria-expanded={help}
      >
        ↓ Instalar app
      </button>
      {help && (
        <div className="install-help" role="status">
          <strong>Leva o Still contigo</strong>
          <p>
            No iPhone ou iPad, abre no Safari e escolhe Partilhar → Adicionar ao
            ecrã principal.
          </p>
          <p>
            No Android ou computador, procura «Instalar aplicação» ou «Adicionar
            ao ecrã principal» no menu do navegador.
          </p>
          <small>
            A instalação precisa de HTTPS ou localhost e de um navegador
            compatível. No navegador integrado, abre primeiro a ligação no
            Safari ou Chrome.
          </small>
          <button
            onClick={() => setHelp(false)}
            aria-label="Fechar instruções de instalação"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
