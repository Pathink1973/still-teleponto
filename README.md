# Still — Teleponto pessoal

[Abrir a aplicação](https://still-teleponto.vercel.app/) · [Código no GitHub](https://github.com/Pathink1973/still-teleponto)

Aplicação local em português de Portugal, com Vite + React + TypeScript e CSS simples. Sem servidor de dados, contas, telemetria, sincronização, chamadas a APIs externas ou segredos. Não é necessário um ficheiro `.env`.

## Iniciar

Requer Node.js 20.19+ ou 22.12+.

```sh
npm install
npm run dev
```

Abre o endereço local indicado pelo Vite. Para gerar e testar a versão de produção:

```sh
npm run build
npm run preview
```

## Biblioteca

Inclui um texto de exemplo em português. Cria textos, altera o título para lhes mudar o nome e escreve na área de texto simples. O corpo é guardado automaticamente quando sais do campo, mudas de texto ou abres o teleponto. A eliminação pede confirmação e não pode ser anulada.

Os textos ficam no `localStorage`, na chave `still.scripts`, com o formato `{id, title, body, updatedAt}`. A data `updatedAt` corresponde a milissegundos desde a época Unix. As definições ficam em `still.settings`. Os dados pertencem a este navegador e endereço, incluindo a porta. Limpar os dados do navegador elimina os textos; a navegação privada pode não os conservar. Mantém uma cópia dos textos importantes.

A atualização para português substitui apenas o exemplo original em inglês, se o título e o conteúdo ainda estiverem intactos. Os textos pessoais e as definições são preservados. Uma biblioteca vazia continua vazia depois de atualizar a página.

## Teleponto

«Abrir teleponto» ocupa a área da aplicação. Usa «Ecrã inteiro» ou F para ocupar o ecrã. A leitura começa em pausa. O deslocamento usa `requestAnimationFrame` e o tempo decorrido, com velocidade em píxeis por segundo. Intervalos longos num separador em segundo plano são limitados para evitar saltos. A leitura para no fim. O temporizador conta o tempo de reprodução, independentemente dos saltos.

Podes ajustar a velocidade (5–200 px/s), o tamanho da letra, a entrelinha, a largura do texto, a linha de leitura e a opacidade da câmara. Todas as definições, incluindo o modo espelhado, ficam guardadas. Só o texto é espelhado; os controlos mantêm-se legíveis.

Os controlos desaparecem após três segundos sem movimento do rato durante a leitura. Mover o rato, tocar no ecrã ou usar o teclado volta a mostrá-los. Os controlos com foco de teclado permanecem visíveis.

| Tecla | Ação |
| --- | --- |
| Barra de espaços | Iniciar / pausa |
| Seta para cima | Aumentar a velocidade em 5 px/s |
| Seta para baixo | Diminuir a velocidade em 5 px/s |
| Seta para a esquerda | Recuar 3 segundos à velocidade atual |
| Seta para a direita | Avançar 3 segundos à velocidade atual |
| R | Voltar ao início e repor o temporizador |
| M | Ativar / desativar o texto espelhado |
| F | Entrar / sair do ecrã inteiro |
| Esc | Sair do teleponto para a biblioteca |

Os campos mantêm o funcionamento normal do teclado. A barra de espaços ativa um botão com foco. O navegador pode consumir o primeiro Esc para sair do ecrã inteiro; nesse caso, carrega novamente para voltar à biblioteca.

## Câmara e gravação

**O acesso à câmara e ao microfone requer localhost ou HTTPS**, suporte do navegador e autorização. Usa «Ligar câmara + microfone» para ativar a pré-visualização, sem som, por trás do texto. A opacidade só afeta essa pré-visualização. Se o acesso falhar, a aplicação mantém um fundo liso e mostra uma mensagem discreta, uma vez por sessão de página.

«Gravar câmara» usa `MediaRecorder` diretamente no fluxo da câmara e do microfone, num formato WebM suportado. O texto, o espelho, a linha de leitura e os controlos não são incluídos na gravação. Usa «Parar gravação» e depois «Guardar gravação .webm».

Desligar a câmara ou sair do teleponto para todas as faixas de áudio e vídeo e termina a gravação. Se saíres durante uma gravação, volta a abrir o teleponto para a guardar. As gravações ficam na memória até serem guardadas ou a página ser fechada. Uma nova gravação substitui a anterior; gravações longas consomem memória. O controlo não aparece quando `MediaRecorder` não existe; formatos WebM indisponíveis são assinalados.

## Acompanhamento por voz experimental

Só aparece se o navegador disponibilizar `SpeechRecognition` ou `webkitSpeechRecognition`. Começa sempre desligado. Usa português de Portugal (`pt-PT`), compara frases reconhecidas com as próximas 65 palavras e aproxima o texto da palavra encontrada. Tolera uma diferença de um carácter em palavras mais longas. R também repõe a posição de procura no texto. É uma função experimental: erros ou silêncio podem parar o reconhecimento; podes voltar a ativá-lo.

**A aplicação não faz chamadas a APIs externas, mas o reconhecimento de voz do navegador pode enviar áudio do microfone para o serviço do respetivo fornecedor.** Este aviso aparece junto da opção experimental. Mantém esta opção desligada para utilização estritamente sem Internet. A biblioteca, o deslocamento, a pré-visualização e a gravação não dependem de serviços remotos. As permissões de reconhecimento de voz e de câmara/microfone são separadas e dependem do navegador.

## Organizar ao colar

O interruptor «Organizar ao colar» começa desligado e a preferência fica guardada localmente. Desligado, a colagem funciona normalmente. Ao ligar, organiza imediatamente o texto que já está no editor e ativa a organização das próximas colagens. O botão «Organizar texto agora» permite repetir a organização sem ter de voltar a colar. Limpa espaços repetidos, junta linhas partidas e coloca cada frase num parágrafo. Nas frases longas, aproveita pausas existentes na pontuação para criar blocos de leitura. Conserva as palavras, a pontuação, os títulos separados por parágrafos, títulos Markdown, linhas em maiúsculas e marcadores de listas. Não impõe um número fixo de caracteres por linha nem reescreve o conteúdo. É uma organização por regras locais: revê sempre textos com estrutura complexa, tabelas ou poesia.

Depois de organizar o texto atual ou uma nova colagem, «Desfazer organização» recupera o conteúdo colado original, incluindo os espaços e as quebras de linha. Fica disponível até voltares a editar esse texto. A organização incide apenas no conteúdo colado, respeitando a seleção atual.

## Telemóvel, iPad e instalação

Na primeira utilização em telemóvel, a letra começa em 44 px e o texto ocupa 88% da largura; no computador, começa em 64 px e 76%. As tuas definições guardadas têm sempre prioridade.

A biblioteca adapta-se a ecrãs pequenos, com botões tácteis e lista horizontal de textos. No teleponto, «Definições e gravação» abre os controlos adicionais sem os manter sempre sobre a leitura. Inclui botões para avançar e recuar 3 segundos sem teclado. As margens respeitam as zonas seguras do ecrã e a altura adapta-se às barras do navegador.

A app inclui `public/manifest.json`, ícones PNG de 192 e 512 píxeis, ícone maskable, ícone Apple, favicon SVG/ICO e um service worker gerado na compilação de produção. O service worker guarda apenas os ficheiros da aplicação, nunca os teus textos ou gravações. Depois da primeira abertura bem-sucedida da versão de produção, a biblioteca e a leitura podem voltar a abrir sem Internet. O reconhecimento de voz poderá continuar a precisar de rede.

- **iPhone/iPad:** abre a ligação HTTPS no Safari → Partilhar → Adicionar ao ecrã principal.
- **Android:** abre no Chrome e escolhe «Instalar app», quando disponível, ou usa o menu do navegador.
- **Computador:** usa «Instalar app» num navegador compatível.

A instalação depende do navegador. O modo de desenvolvimento não regista o service worker; testa a instalação e o funcionamento sem rede com `npm run build` e `npm run preview`, ou na versão HTTPS publicada. Atualizações do service worker aguardam o fecho dos separadores antigos; fecha e volta a abrir a app para carregar uma nova versão.

**Cada dispositivo tem os seus próprios textos.** Publicar o código no GitHub e alojar a aplicação na Vercel não publica nem sincroniza os textos guardados no navegador. A versão instalada e o navegador também podem usar áreas de armazenamento distintas, conforme o sistema. Os dados do endereço localhost não são transferidos automaticamente para o endereço público.

## Publicar na Vercel

Importa o repositório GitHub público na Vercel. A configuração `vercel.json` declara Vite, `npm run build` e a pasta de saída `dist`. Não são necessárias variáveis de ambiente. Os commits no ramo de produção passam a gerar novas publicações quando a integração Git está ativa. Não atives Analytics ou Speed Insights se quiseres manter a aplicação sem telemetria incorporada.

## Verificações

```sh
npm test
npm run build
```

Os testes cobrem conservação de palavras e pontuação, limpeza de espaços, parágrafos, listas, abreviaturas, URLs e texto vazio. A câmara, microfone, gravação e instalação devem também ser experimentados nos dispositivos reais, porque o suporte depende do navegador.
