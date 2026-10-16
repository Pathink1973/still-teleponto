import { useRef } from "react";

export function Tutorial({
  onOpen,
  onExample,
}: {
  onOpen?: () => void;
  onExample?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        className="tutorial-trigger"
        aria-label="Como usar o teleponto"
        title="Como usar o teleponto"
        onClick={() => {
          onOpen?.();
          dialog.current?.showModal();
        }}
      >
        <span aria-hidden="true">i</span>
      </button>
      <dialog
        ref={dialog}
        className="tutorial-dialog"
        aria-labelledby="tutorial-title"
        onKeyDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < bounds.left ||
              event.clientX > bounds.right ||
              event.clientY < bounds.top ||
              event.clientY > bounds.bottom
            )
              dialog.current?.close();
          }
        }}
      >
        <div className="tutorial-header">
          <div>
            <span className="eyebrow">ACADEMIA crIA</span>
            <h2 id="tutorial-title">O teu primeiro vídeo, passo a passo</h2>
          </div>
          <button
            autoFocus
            aria-label="Fechar tutorial"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        <p className="tutorial-intro">
          Escreve, encontra o teu ritmo e fala com naturalidade. O Still
          acompanha-te na leitura.
        </p>
        <ol className="tutorial-steps">
          <li>
            <strong>Prepara o teu texto</strong>
            <p>
              Cria um «Novo texto», dá-lhe um título e escreve ou cola o guião.
              O texto é guardado quando sais do campo. O título é guardado à
              medida que o alteras.
            </p>
          </li>
          <li>
            <strong>Organiza a leitura</strong>
            <p>
              Liga «Organizar ao colar» para organizar o texto atual e as
              próximas colagens, ou usa «Organizar texto agora». As palavras e a
              pontuação são preservadas. «Desfazer organização» recupera a
              versão anterior enquanto não voltares a editar.
            </p>
          </li>
          <li>
            <strong>Abre o teleponto</strong>
            <p>
              Ajusta a velocidade, o tamanho da letra, a entrelinha e a largura
              do texto. Mantém o olhar junto da linha de leitura. Usa «Iniciar»
              e «Pausa» ao teu ritmo. No telemóvel, abre «Definições e gravação»
              para veres as opções.
            </p>
          </li>
          <li>
            <strong>Grava, se quiseres</strong>
            <p>
              «Ligar câmara + microfone» mostra a pré-visualização. «Gravar
              câmara» grava apenas a câmara e o áudio, sem o texto. Termina e
              guarda o ficheiro .webm. O acesso exige autorização e localhost ou
              HTTPS; o suporte depende do navegador.
            </p>
          </li>
        </ol>
        <section className="tutorial-shortcuts">
          <h3>Atalhos de teclado</h3>
          <dl>
            <dt>Espaço</dt>
            <dd>Iniciar / pausa</dd>
            <dt>↑ / ↓</dt>
            <dd>Aumentar / diminuir a velocidade</dd>
            <dt>← / →</dt>
            <dd>Recuar / avançar 3 segundos</dd>
            <dt>R</dt>
            <dd>Voltar ao início</dd>
            <dt>M</dt>
            <dd>Espelhar apenas o texto</dd>
            <dt>F</dt>
            <dd>Entrar / sair do ecrã inteiro</dd>
            <dt>Esc</dt>
            <dd>Fechar este tutorial ou sair do teleponto</dd>
          </dl>
          <p>
            Os campos mantêm os atalhos normais de edição. A primeira pressão em
            Esc pode sair apenas do ecrã inteiro.
          </p>
        </section>
        <section className="tutorial-extra">
          <h3>Leva a app contigo</h3>
          <p>
            No iPhone ou iPad, abre no Safari → Partilhar → Adicionar ao ecrã
            principal. No Android ou computador, usa «Instalar app» num
            navegador compatível.
          </p>
          <p>
            Os textos ficam apenas neste navegador e dispositivo, sem
            sincronização. Guarda uma cópia dos teus guiões importantes. O
            acompanhamento por voz é experimental e o serviço do navegador pode
            enviar áudio pela Internet.
          </p>
        </section>
        <div className="tutorial-footer">
          {onExample && (
            <button
              onClick={() => {
                onExample();
                dialog.current?.close();
              }}
            >
              Abrir texto de exemplo
            </button>
          )}
          <button className="primary" onClick={() => dialog.current?.close()}>
            Percebi, vamos começar
          </button>
        </div>
      </dialog>
    </>
  );
}
