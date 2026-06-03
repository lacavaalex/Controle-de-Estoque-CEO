# Discovery — Jornada Atual (As-Is)

**Documento:** 03-jornada-atual-as-is
**Última atualização:** 10/05/2026

---

## 1. Como o estoque é controlado hoje

### 1.1 Entrada de material na Dispensação

```
Fornecedor entrega ─▶ Almoxarife confere fisicamente ─▶ Lança em planilha Excel
                                                    
                                                          
```

- Conferência manual contra nota fiscal.
- Lote, validade e quantidade são anotados em planilha Excel local — sem padrão de nomenclatura.
- **Sintomas:** dupla digitação, divergências entre caderno e planilha, perda de informação se a planilha cai ou some.

### 1.2 Solicitação de material por dentista do CEO

```
Coordenação CEO envia e-mail ─▶ Almoxarife recebe lista de itens
                              └─▶ Cria ficha manual com: nome, qtd requerida,
                                  lote, validade, fabricação
                              └─▶ Anota em planilha A (controle de saída)
                              └─▶ Anota novamente em planilha B (controle geral)
                              └─▶ Separa fisicamente e entrega ou nega parcialmente
```

- Pedido via **e-mail estruturado** — não verbal, mas informal (fora de qualquer sistema).
- Uma mensagem de e-mail equivale a uma **lista de múltiplos itens** (não item a item).
- O almoxarife cria uma **ficha intermediária** anotando nome, quantidade requerida, lote, validade e fabricação — esse artefato físico não é preservado.
- **Dupla digitação:** o mesmo evento é lançado em duas planilhas Excel separadas. Confirmado pelo almoxarife João: "computo em duas planilhas".
- **Quantidade requerida ≠ quantidade enviada** na prática: o almoxarife corta quantidades por critério de prioridade clínica (racionalização — ver RN16). Essa diferença não é registrada em nenhum lugar.
- Sem fila visível: dentistas com urgência interferem na ordem de atendimento.
- Sem histórico: não dá para saber quanto cada dentista/setor consumiu no mês.

### 1.3 Reposição do estoque do CEO

- Almoxarife faz visitas periódicas ao CEO ou recebe lista informal por WhatsApp.
- Não há registro do que foi transferido entre Dispensação e CEO.
- O CEO não sabe quando vai chegar a próxima reposição.

### 1.4 Controle de validade

- Cabe ao almoxarife "lembrar" de checar.
- Conferência completa só ocorre em mutirões ocasionais (semestrais).
- **Resultado:** descarte recorrente de itens vencidos sem aviso prévio.

## 2. Mapa de pontos de dor

| Persona | Ação | Dor / Pensamento |
|---------|------|------------------|
| Dentista CEO | Inicia atendimento e percebe falta de anestésico | "De novo. Preciso parar a consulta para descer até a dispensação." |
| Coordenação CEO | Envia e-mail com lista de itens | "Mandei o e-mail, mas quando vai sair? Vão enviar tudo ou só uma parte?" |
| Almoxarife | Cria ficha manual a partir do e-mail | "São 12 itens nessa lista — vou ter que anotar tudo antes de separar." |
| Almoxarife | Lança em duas planilhas no fim do dia | "Já anotei na ficha, agora tenho que repetir nas duas planilhas." |
| Coordenação Dispensação | Recebe nota fiscal de fornecedor com tubo de anestésico vencendo em 30 dias | "Não sabia. Será que tem outro lote igual encalhado lá atrás?" |
| Coordenação CEO | Atende paciente especial e faltou material | "Como assim 'acabou'? Pedi semana passada." |
| Gestão | Reunião de orçamento — decidir compra | "Não tenho número, vou pedir um relatório que vai demorar dias." |

## 3. Métricas atuais (estimativas baseline)

> Coletadas em entrevistas com a Dr. Fred, Dra. Danielle em weeklys nas terças, e em uma reunião que incluiu Dra. Silvia e Dra. Renata a partir de março/2026. São números autorrelatados, **não medidos por sistema**, e servem para comparação com a meta após o piloto. As informações abaixo precisam ser validas ainda. 

| Indicador | Estado atual estimado |
|-----------|-----------------------|
| Tempo médio de resposta a uma solicitação | ~ x  dias úteis |
| % de solicitações com registro escrito | < x% |
| Itens descartados por vencimento / mês | ~ x a y itens |
| Divergência entre estoque físico e registro | Recorrente, não mensurada |
| Tempo para gerar relatório de consumo mensal | > 1 dia (compilação manual) |

## 4. Mapa do estado atual (Service Blueprint resumido)

```
┌──────────────┬───────────────────────┬───────────────────────┬──────────────────┐
│ Etapa        │ Dentista CEO          │ Almoxarife            │ Sistema/Suporte  │
├──────────────┼───────────────────────┼───────────────────────┼──────────────────┤
│ Identificar  │ Sente falta no        │ —                     │ Cadernos /       │
│ necessidade  │ atendimento           │                       │ Excel local      │
├──────────────┼───────────────────────┼───────────────────────┼──────────────────┤
│ Solicitar    │ Envia e-mail com      │ Cria ficha manual;    │ Sem registro     │
│              │ lista de itens        │ anota em 2 planilhas  │ formal integrado │
├──────────────┼───────────────────────┼───────────────────────┼──────────────────┤
│ Atender      │ Espera resposta       │ Procura no estoque,   │ Atualiza caderno │
│              │                       │ separa, entrega       │ (eventual)       │
├──────────────┼───────────────────────┼───────────────────────┼──────────────────┤
│ Recebimento  │ Recebe (ou não recebe │ Encerra mentalmente   │ Sem histórico    │
│              │ o pedido)             │                       │ por solicitante  │
├──────────────┼───────────────────────┼───────────────────────┼──────────────────┤
│ Gerir        │ —                     │ Relatório manual sob  │ Excel — sem      │
│ consumo      │                       │ demanda da gestão     │ consolidação     │
└──────────────┴───────────────────────┴───────────────────────┴──────────────────┘
```

## 5. Conclusão do diagnóstico

A operação atual depende fortemente de **conhecimento tácito** (saber a quem pedir, quem está de plantão, onde fica cada caixa) e de **artefatos físicos** que não escalam (ficha manual, duas planilhas Excel, e-mail solto). O fluxo real é: e-mail → ficha → dupla digitação — não verbal, mas igualmente frágil e sem rastreabilidade.

Dois fatores agravam a operação: (1) o almoxarifado funciona em **dois turnos com uma pessoa cada**, tornando o handoff crítico — o turno da tarde não sabe o que ficou pendente de manhã; (2) o **espaço físico reduzido** para o volume de materiais eleva a importância do campo `localização` e dos alertas de estoque excessivo (RN04). O sistema digital deve substituir esses artefatos sem aumentar a fricção operacional do almoxarife — caso contrário, ele será abandonado.

Esse diagnóstico fundamenta o desenho do To-Be em [03-personas-jornadas/02-jornadas-to-be.md](../03-personas-jornadas/02-jornadas-to-be.md) e a priorização do MVP em [02-visao-escopo/02-escopo-mvp.md](../02-visao-escopo/02-escopo-mvp.md).
