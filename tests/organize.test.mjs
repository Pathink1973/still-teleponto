import { test } from "node:test";
import assert from "node:assert/strict";
import { organizeText } from "../src/organize.js";
const compact = (value) => value.replace(/\s+/gu, "");
test("junta linhas partidas e limpa espaços sem alterar palavras", () => {
  const original =
    "Olá,  mundo!\r\nEsta é uma frase\r\npartida a meio.\r\n\r\nOutro parágrafo.";
  const result = organizeText(original);
  assert.equal(
    result,
    "Olá, mundo!\n\nEsta é uma frase partida a meio.\n\nOutro parágrafo.",
  );
  assert.equal(compact(result), compact(original));
});
test("preserva títulos, marcadores, numeração e pontuação", () => {
  const original =
    "INTRODUÇÃO\nVamos começar.\n\nNotas:\n- Primeiro ponto\n- Segundo ponto\n1. Primeiro passo\n2. Segundo passo\n\n# Conclusão\nAté breve!";
  const result = organizeText(original);
  assert.equal(compact(result), compact(original));
  for (const marker of [
    "INTRODUÇÃO",
    "Notas:",
    "- Primeiro ponto",
    "- Segundo ponto",
    "1. Primeiro passo",
    "2. Segundo passo",
    "# Conclusão",
  ])
    assert.ok(result.split("\n\n").includes(marker));
});
test("divide prosa longa apenas entre frases e respeita abreviaturas", () => {
  const original =
    "O Sr. António chegou às 10h30. " +
    Array(12)
      .fill(
        "Esta frase mantém todas as palavras e todos os sinais de pontuação.",
      )
      .join(" ");
  const result = organizeText(original);
  assert.equal(compact(result), compact(original));
  assert.ok(result.includes("\n\n"));
  assert.ok(result.includes("O Sr. António"));
  assert.equal(organizeText(result), result);
});
test("não corta frases longas, palavras hifenizadas, URLs ou decimais", () => {
  const original =
    "Visita https://exemplo.pt/a-b e usa 3,5 unidades — disse-me ele. " +
    "palavra ".repeat(60) +
    "fim.";
  assert.equal(compact(organizeText(original)), compact(original));
  assert.ok(organizeText(original).includes("https://exemplo.pt/a-b"));
});
test("texto vazio e espaços", () => {
  assert.equal(organizeText(" \r\n\t "), "");
});

test("texto corrido curto ganha um parágrafo por frase", () => {
  const original = "Esta é a primeira ideia. Esta é a segunda ideia. E esta é a conclusão.";
  assert.equal(organizeText(original), "Esta é a primeira ideia.\n\nEsta é a segunda ideia.\n\nE esta é a conclusão.");
});
test("frase longa usa pausas existentes sem perder pontuação", () => {
  const original = "Este é um texto longo que queremos apresentar com muita calma e clareza, sem alterar as palavras que o autor escolheu para apresentar a sua mensagem, respeitando sempre o ritmo da leitura e o sentido de tudo o que está escrito.";
  const result = organizeText(original);
  assert.equal(compact(result), compact(original));
  assert.ok(result.includes(",\n\n"));
  assert.equal(organizeText(result), result);
});
