import { describe, it, expect } from "vitest";
import { movimentacoesParaCsv } from "./movimentacoes.js";

describe("movimentacoesParaCsv", () => {
  it("gera cabeçalho + uma linha por movimentação, com rótulo pt-BR do tipo", () => {
    const csv = movimentacoesParaCsv([
      {
        id: "MOV-001", tipo: "saida", produtoNome: "Luvas M", quantidade: -10,
        setorOrigemNome: "HO", setorDestinoNome: "CEO", retiradoPor: "Dr. Rafael",
        data: "2026-06-20T10:00:00.000Z",
      },
    ]);
    const linhas = csv.split("\r\n");
    // BOM no começo do arquivo (acentos no Excel).
    expect(csv.startsWith("﻿")).toBe(true);
    expect(linhas[0]).toContain("Quando;Tipo;Produto;Quantidade;Origem;Destino;Retirado por");
    expect(linhas[1]).toContain("Saída");
    expect(linhas[1]).toContain("Luvas M");
    expect(linhas[1]).toContain("-10");
    expect(linhas[1]).toContain("Dr. Rafael");
  });

  it("escapa campos com separador, aspas ou quebra de linha (RFC 4180)", () => {
    const csv = movimentacoesParaCsv([
      {
        id: "MOV-002", tipo: "entrada", produtoNome: 'Gaze 7,5cm "estéril"', quantidade: 50,
        setorOrigemNome: "HO", setorDestinoNome: null, retiradoPor: null,
        data: "2026-06-19T09:00:00.000Z",
      },
    ]);
    // O produto tem vírgula e aspas → deve vir entre aspas, com aspas internas dobradas.
    expect(csv).toContain('"Gaze 7,5cm ""estéril"""');
    // Destino/retirante nulos viram célula vazia (sem "null").
    expect(csv).not.toContain("null");
  });

  it("lista vazia gera só o cabeçalho", () => {
    const csv = movimentacoesParaCsv([]);
    expect(csv.replace("﻿", "").split("\r\n")).toHaveLength(1);
  });
});
