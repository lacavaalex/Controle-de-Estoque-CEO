// =============================================================================
// Seed do banco v2 — CEO-UFPE
// Dados realistas derivados de DS-prototype/src/data/data.js, remodelados para
// o domínio v2 (Produto × Lote, Setor como entidade, Pedido + ItemDoPedido).
//
// As validades são posicionadas em relação à data REAL de hoje para exercitar
// RN05 (vencido/vencendo/atenção) e RN17 (lote segregado). Há, de propósito:
//   - 1 lote VENCIDO (validade no passado),
//   - lotes VENCENDO (<=30d) e em ATENÇÃO (31–60d),
//   - 1 lote SEGREGADO (sala de biossegurança),
//   - 1 produto SEM lotes (caso "Não Tem"),
//   - pedidos cobrindo status pendente / aguardando_reposicao / atendido.
//
// Idempotente: limpa as tabelas (TRUNCATE ... RESTART IDENTITY CASCADE) e
// repopula. Rode com: npm run db:seed
// =============================================================================
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, pool } from "./client.js";
import {
  setor,
  usuario,
  produto,
  lote,
  pedido,
  itemDoPedido,
  movimentacao,
} from "./schema.js";
import { gerarHashSenha } from "../auth/senha.js";

// Senha de DESENVOLVIMENTO para todos os usuários do seed (somente local).
// Em produção, usuários nascem com senha provisória via provisionamento.
const SENHA_DEV = "ceoufpe2026";

// Helper: data ISO (YYYY-MM-DD) deslocada N dias a partir de hoje.
function emDias(dias: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

async function seed() {
  console.log("Limpando tabelas...");
  await db.execute(sql`
    TRUNCATE TABLE
      ${movimentacao}, ${itemDoPedido}, ${pedido},
      ${lote}, ${produto}, ${usuario}, ${setor}
    RESTART IDENTITY CASCADE
  `);

  // ─── Setores ──────────────────────────────────────────────────────────────
  console.log("Inserindo setores...");
  const [ho, ceo] = await db
    .insert(setor)
    .values([
      { nome: "HO", tipo: "almoxarifado", emailInstitucional: "almoxarifado@ufpe.br" },
      { nome: "CEO", tipo: "destinatario", emailInstitucional: "ceo@ufpe.br" },
    ])
    .returning();

  if (!ho || !ceo) throw new Error("Falha ao inserir setores");

  // ─── Usuários (3 perfis) ────────────────────────────────────────────────
  console.log("Inserindo usuários...");
  const senhaHash = await gerarHashSenha(SENHA_DEV);
  const [gestorHo, almoxarife, solicitanteCeo, gestorCeo] = await db
    .insert(usuario)
    .values([
      {
        nome: "Dra. Ana Beatriz Costa",
        email: "ana.costa@ufpe.br",
        cargo: "Coordenadora de Gestão",
        perfil: "gestor",
        setorId: ho.id,
        avatar: "AB",
        senhaHash,
      },
      {
        nome: "João Carlos Silva",
        email: "joao.silva@ufpe.br",
        cargo: "Almoxarife",
        perfil: "almoxarife",
        setorId: ho.id,
        avatar: "JC",
        senhaHash,
      },
      {
        nome: "Dr. Rafael Henrique Moura",
        email: "rafael.moura@ufpe.br",
        cargo: "Cirurgião-Dentista (solicitante CEO)",
        perfil: "solicitante",
        setorId: ceo.id,
        avatar: "RH",
        senhaHash,
      },
      {
        nome: "Profa. Helena Lima",
        email: "helena.lima@ufpe.br",
        cargo: "Gestora do CEO",
        perfil: "gestor",
        setorId: ceo.id,
        avatar: "HL",
        senhaHash,
      },
    ])
    .returning();

  if (!gestorHo || !almoxarife || !solicitanteCeo || !gestorCeo) {
    throw new Error("Falha ao inserir usuários");
  }

  // ─── Produtos (catálogo) ─────────────────────────────────────────────────
  // Derivados dos ITEMS do protótipo (que misturavam produto+lote). Aqui o
  // produto é só o catálogo; os lotes vêm depois.
  console.log("Inserindo produtos...");
  const produtosSeed: Array<{
    nome: string;
    categoria:
      | "EPI"
      | "Anestésico"
      | "Material Restaurador"
      | "Instrumentais"
      | "Higienização"
      | "Material Cirúrgico"
      | "Equipamento"
      | "Outros";
    unidade:
      | "caixa"
      | "tubo"
      | "seringa"
      | "kit"
      | "pacote"
      | "rolo"
      | "unidade"
      | "frasco"
      | "bastão"
      | "folha"
      | "par";
    estoqueMinimo: number;
    estoqueMaximo: number;
    localizacao: string;
    fornecedor: string;
  }> = [
    { nome: "Luvas Descartáveis P", categoria: "EPI", unidade: "caixa", estoqueMinimo: 200, estoqueMaximo: 1000, localizacao: "Prateleira A-1", fornecedor: "DistribMed Ltda" },
    { nome: "Luvas Descartáveis M", categoria: "EPI", unidade: "caixa", estoqueMinimo: 200, estoqueMaximo: 1000, localizacao: "Prateleira A-1", fornecedor: "DistribMed Ltda" },
    { nome: "Luvas Descartáveis G", categoria: "EPI", unidade: "caixa", estoqueMinimo: 200, estoqueMaximo: 1000, localizacao: "Prateleira A-1", fornecedor: "DistribMed Ltda" },
    { nome: "Máscaras Cirúrgicas", categoria: "EPI", unidade: "caixa", estoqueMinimo: 300, estoqueMaximo: 1000, localizacao: "Prateleira A-2", fornecedor: "SafeMed Produtos" },
    { nome: "Anestésico Lidocaína 2%", categoria: "Anestésico", unidade: "tubo", estoqueMinimo: 50, estoqueMaximo: 200, localizacao: "Armário B-1", fornecedor: "DFL Indústria" },
    { nome: "Resina Composta A2", categoria: "Material Restaurador", unidade: "seringa", estoqueMinimo: 10, estoqueMaximo: 60, localizacao: "Armário B-2", fornecedor: "3M ESPE" },
    { nome: "Resina Composta A3", categoria: "Material Restaurador", unidade: "seringa", estoqueMinimo: 10, estoqueMaximo: 60, localizacao: "Armário B-2", fornecedor: "3M ESPE" },
    { nome: "Cimento Ionômero de Vidro", categoria: "Material Restaurador", unidade: "kit", estoqueMinimo: 10, estoqueMaximo: 40, localizacao: "Armário B-2", fornecedor: "GC Corporation" },
    { nome: "Algodão em Rolo", categoria: "Material Cirúrgico", unidade: "pacote", estoqueMinimo: 100, estoqueMaximo: 500, localizacao: "Prateleira C-1", fornecedor: "Johnson & Johnson" },
    { nome: "Fio Dental 100m", categoria: "Higienização", unidade: "rolo", estoqueMinimo: 30, estoqueMaximo: 150, localizacao: "Prateleira C-2", fornecedor: "Oral-B" },
    { nome: "Sugadores Descartáveis", categoria: "Material Cirúrgico", unidade: "unidade", estoqueMinimo: 200, estoqueMaximo: 600, localizacao: "Prateleira C-3", fornecedor: "Maquira Odonto" },
    { nome: "Ácido Fosfórico 37%", categoria: "Material Restaurador", unidade: "seringa", estoqueMinimo: 8, estoqueMaximo: 30, localizacao: "Armário B-3", fornecedor: "Biodinâmica Química" },
    { nome: "Gaze Estéril", categoria: "Material Cirúrgico", unidade: "pacote", estoqueMinimo: 150, estoqueMaximo: 500, localizacao: "Prateleira D-1", fornecedor: "Johnson & Johnson" },
    { nome: "Broca Carbide 1014", categoria: "Instrumentais", unidade: "unidade", estoqueMinimo: 50, estoqueMaximo: 200, localizacao: "Armário D-2", fornecedor: "KG Sorensen" },
    { nome: "Curetas Periodontais", categoria: "Instrumentais", unidade: "unidade", estoqueMinimo: 20, estoqueMaximo: 80, localizacao: "Armário D-2", fornecedor: "Hu-Friedy" },
    { nome: "Clorexidina 2%", categoria: "Higienização", unidade: "frasco", estoqueMinimo: 40, estoqueMaximo: 120, localizacao: "Armário F-1", fornecedor: "Maquira Odonto" },
    { nome: "Hipoclorito de Sódio", categoria: "Higienização", unidade: "frasco", estoqueMinimo: 60, estoqueMaximo: 200, localizacao: "Armário F-1", fornecedor: "FGM Produtos" },
    { nome: "Selante de Fóssulas", categoria: "Material Restaurador", unidade: "seringa", estoqueMinimo: 10, estoqueMaximo: 50, localizacao: "Armário B-4", fornecedor: "3M ESPE" },
    // Caso "Não Tem" (RN07): produto de catálogo sem nenhum lote.
    { nome: "Papel Articular", categoria: "Outros", unidade: "folha", estoqueMinimo: 50, estoqueMaximo: 300, localizacao: "Prateleira E-1", fornecedor: "BK Produtos" },
    // Categoria Equipamento (RN02): isenta de status de quantidade.
    { nome: "Fotopolimerizador LED", categoria: "Equipamento", unidade: "unidade", estoqueMinimo: 0, estoqueMaximo: 9999, localizacao: "Sala de equipamentos", fornecedor: "Gnatus" },
  ];

  const produtos = await db.insert(produto).values(produtosSeed).returning();
  const P = (nome: string) => {
    const p = produtos.find((x) => x.nome === nome);
    if (!p) throw new Error(`Produto não encontrado no seed: ${nome}`);
    return p.id;
  };

  // ─── Lotes no HO ───────────────────────────────────────────────────────────
  // Validades posicionadas para exercitar RN05/RN06/RN17. "Papel Articular" e
  // "Fotopolimerizador" propositalmente sem lote ativo de consumível.
  console.log("Inserindo lotes (HO)...");
  const lotesHo = await db
    .insert(lote)
    .values([
      // Normal (validade longe)
      { produtoId: P("Luvas Descartáveis P"), setorId: ho.id, numeroLote: "LT-2024-001", fabricacao: emDias(-400), validade: emDias(120), quantidade: 850, estado: "ativo" },
      // Baixo (qtd <= min*1.5)
      { produtoId: P("Luvas Descartáveis M"), setorId: ho.id, numeroLote: "LT-2024-002", fabricacao: emDias(-380), validade: emDias(140), quantidade: 120, estado: "ativo" },
      { produtoId: P("Luvas Descartáveis G"), setorId: ho.id, numeroLote: "LT-2024-003", fabricacao: emDias(-360), validade: emDias(70), quantidade: 310, estado: "ativo" },
      // VENCENDO (<=30d) — exercita RN05
      { produtoId: P("Máscaras Cirúrgicas"), setorId: ho.id, numeroLote: "LT-2024-004", fabricacao: emDias(-300), validade: emDias(21), quantidade: 980, estado: "ativo" },
      // Crítico (qtd <= min)
      { produtoId: P("Anestésico Lidocaína 2%"), setorId: ho.id, numeroLote: "LT-2025-010", fabricacao: emDias(-120), validade: emDias(180), quantidade: 45, estado: "ativo" },
      // VENCIDO (validade no passado) — exercita RN05/RN06. estado=vencido (RN17)
      { produtoId: P("Resina Composta A2"), setorId: ho.id, numeroLote: "LT-2025-020", fabricacao: emDias(-200), validade: emDias(-16), quantidade: 18, estado: "vencido" },
      // ATENÇÃO (31–60d)
      { produtoId: P("Resina Composta A3"), setorId: ho.id, numeroLote: "LT-2025-021", fabricacao: emDias(-150), validade: emDias(40), quantidade: 12, estado: "ativo" },
      { produtoId: P("Cimento Ionômero de Vidro"), setorId: ho.id, numeroLote: "LT-2025-022", fabricacao: emDias(-90), validade: emDias(250), quantidade: 8, estado: "ativo" },
      { produtoId: P("Algodão em Rolo"), setorId: ho.id, numeroLote: "LT-2024-030", fabricacao: emDias(-300), validade: emDias(320), quantidade: 250, estado: "ativo" },
      { produtoId: P("Fio Dental 100m"), setorId: ho.id, numeroLote: "LT-2024-031", fabricacao: emDias(-280), validade: emDias(160), quantidade: 60, estado: "ativo" },
      // Excessivo (qtd >= max*0.95)
      { produtoId: P("Sugadores Descartáveis"), setorId: ho.id, numeroLote: "LT-2024-032", fabricacao: emDias(-250), validade: emDias(90), quantidade: 580, estado: "ativo" },
      // Crítico + vencendo
      { produtoId: P("Ácido Fosfórico 37%"), setorId: ho.id, numeroLote: "LT-2025-040", fabricacao: emDias(-100), validade: emDias(10), quantidade: 5, estado: "ativo" },
      { produtoId: P("Gaze Estéril"), setorId: ho.id, numeroLote: "LT-2024-033", fabricacao: emDias(-200), validade: emDias(120), quantidade: 600, estado: "ativo" },
      { produtoId: P("Broca Carbide 1014"), setorId: ho.id, numeroLote: "LT-2025-050", fabricacao: emDias(-60), validade: emDias(420), quantidade: 80, estado: "ativo" },
      // Crítico
      { produtoId: P("Curetas Periodontais"), setorId: ho.id, numeroLote: "LT-2025-051", fabricacao: emDias(-50), validade: emDias(500), quantidade: 15, estado: "ativo" },
      { produtoId: P("Clorexidina 2%"), setorId: ho.id, numeroLote: "LT-2025-080", fabricacao: emDias(-90), validade: emDias(28), quantidade: 90, estado: "ativo" },
      { produtoId: P("Hipoclorito de Sódio"), setorId: ho.id, numeroLote: "LT-2025-081", fabricacao: emDias(-70), validade: emDias(53), quantidade: 180, estado: "ativo" },
      { produtoId: P("Selante de Fóssulas"), setorId: ho.id, numeroLote: "LT-2025-090", fabricacao: emDias(-40), validade: emDias(680), quantidade: 22, estado: "ativo" },
      // SEGREGADO (RN17) — sala de biossegurança, fora do estoque ativo
      { produtoId: P("Resina Composta A2"), setorId: ho.id, numeroLote: "LT-2024-099", fabricacao: emDias(-500), validade: emDias(-120), quantidade: 6, estado: "segregado", dataSegregacao: emDias(-110), observacaoSegregacao: "Carga inicial — material já estava na sala de biossegurança." },
    ])
    .returning();

  // ─── Lotes no CEO ──────────────────────────────────────────────────────────
  console.log("Inserindo lotes (CEO)...");
  await db.insert(lote).values([
    { produtoId: P("Luvas Descartáveis P"), setorId: ceo.id, numeroLote: "LT-2024-001", fabricacao: emDias(-400), validade: emDias(120), quantidade: 40, estado: "ativo" },
    { produtoId: P("Luvas Descartáveis M"), setorId: ceo.id, numeroLote: "LT-2024-002", fabricacao: emDias(-380), validade: emDias(140), quantidade: 8, estado: "ativo" },
    { produtoId: P("Máscaras Cirúrgicas"), setorId: ceo.id, numeroLote: "LT-2024-004", fabricacao: emDias(-300), validade: emDias(21), quantidade: 25, estado: "ativo" },
    { produtoId: P("Anestésico Lidocaína 2%"), setorId: ceo.id, numeroLote: "LT-2025-010", fabricacao: emDias(-120), validade: emDias(180), quantidade: 12, estado: "ativo" },
    { produtoId: P("Algodão em Rolo"), setorId: ceo.id, numeroLote: "LT-2024-030", fabricacao: emDias(-300), validade: emDias(320), quantidade: 30, estado: "ativo" },
    { produtoId: P("Sugadores Descartáveis"), setorId: ceo.id, numeroLote: "LT-2024-032", fabricacao: emDias(-250), validade: emDias(90), quantidade: 60, estado: "ativo" },
    { produtoId: P("Clorexidina 2%"), setorId: ceo.id, numeroLote: "LT-2025-080", fabricacao: emDias(-90), validade: emDias(28), quantidade: 14, estado: "ativo" },
    { produtoId: P("Hipoclorito de Sódio"), setorId: ceo.id, numeroLote: "LT-2025-081", fabricacao: emDias(-70), validade: emDias(53), quantidade: 20, estado: "ativo" },
  ]);

  // ─── Pedidos (cabeçalho + itens) cobrindo status ────────────────────────────
  console.log("Inserindo pedidos...");
  await db.insert(pedido).values([
    { id: "PED-001", setorOrigemId: ceo.id, setorDestinoId: ho.id, solicitanteId: solicitanteCeo.id, justificativa: "Estoque do CEO zerado para a semana de atendimento.", status: "pendente" },
    { id: "PED-002", setorOrigemId: ceo.id, setorDestinoId: ho.id, solicitanteId: solicitanteCeo.id, justificativa: "Sem estoque no CEO para condicionamento em restaurações — demanda represada.", status: "aguardando_reposicao" },
    { id: "PED-003", setorOrigemId: ceo.id, setorDestinoId: ho.id, solicitanteId: solicitanteCeo.id, justificativa: "Reposição mensal de material restaurador para endodontia.", status: "atendido_integral" },
  ]);

  // PED-001: pendente, com item de catálogo
  await db.insert(itemDoPedido).values([
    { pedidoId: "PED-001", produtoId: P("Luvas Descartáveis M"), qtdSolicitada: 100, unidade: "caixa", statusItem: "pendente" },
    // Linha livre (RN18 / INV07): sem produto_id, com descricao_livre.
    { pedidoId: "PED-001", descricaoLivre: "Evidenciador de biofilme (fora do catálogo)", qtdSolicitada: 5, unidade: "frasco", statusItem: "pendente" },
  ]);

  // PED-002: item indisponível -> aguardando_reposicao (RN08 invertida)
  await db.insert(itemDoPedido).values([
    { pedidoId: "PED-002", produtoId: P("Ácido Fosfórico 37%"), qtdSolicitada: 5, unidade: "seringa", statusItem: "aguardando_reposicao" },
  ]);

  // PED-003: atendido integral, com lote expedido e movimentações (RN11/RN19)
  const loteResinaA2 = lotesHo.find(
    (l) => l.numeroLote === "LT-2025-020" && l.estado === "vencido",
  );
  // Para o pedido atendido, usamos um lote ATIVO de resina A3 como exemplo de expedição.
  const loteResinaA3 = lotesHo.find((l) => l.numeroLote === "LT-2025-021");
  if (!loteResinaA3) throw new Error("Lote de expedição não encontrado no seed");

  const [itemAtendido] = await db
    .insert(itemDoPedido)
    .values([
      {
        pedidoId: "PED-003",
        produtoId: P("Resina Composta A3"),
        qtdSolicitada: 10,
        qtdExpedida: 10,
        loteExpedidoId: loteResinaA3.id,
        unidade: "seringa",
        statusItem: "atendido_integral",
        processadoPorId: almoxarife.id,
        dataProcessamento: new Date(),
      },
    ])
    .returning();

  if (!itemAtendido) throw new Error("Falha ao inserir item atendido");

  // RN19: expedição p/ CEO gera 2 movimentações (saída HO + entrada CEO).
  console.log("Inserindo movimentações (auditoria)...");
  await db.insert(movimentacao).values([
    {
      id: "MOV-001",
      tipo: "saida",
      loteId: loteResinaA3.id,
      produtoId: P("Resina Composta A3"),
      quantidade: -10,
      setorOrigemId: ho.id,
      setorDestinoId: ceo.id,
      responsavelId: almoxarife.id,
      pedidoId: "PED-003",
      observacao: "Expedição do pedido PED-003 (saída no HO).",
    },
    {
      id: "MOV-002",
      tipo: "entrada",
      loteId: loteResinaA3.id,
      produtoId: P("Resina Composta A3"),
      quantidade: 10,
      setorOrigemId: ho.id,
      setorDestinoId: ceo.id,
      responsavelId: almoxarife.id,
      pedidoId: "PED-003",
      observacao: "Entrada-CEO automática via expedição (RN19).",
    },
    // Segregação (RN17): movimentação que tirou o lote vencido do estoque ativo.
    ...(loteResinaA2
      ? [
          {
            id: "MOV-003",
            tipo: "segregacao" as const,
            loteId: loteResinaA2.id,
            produtoId: P("Resina Composta A2"),
            quantidade: 0,
            setorOrigemId: ho.id,
            responsavelId: almoxarife.id,
            observacao: "Lote vencido movido para a sala de biossegurança.",
          },
        ]
      : []),
  ]);

  console.log("Seed concluído com sucesso.");
}

seed()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Erro no seed:", err);
    await pool.end();
    process.exit(1);
  });
