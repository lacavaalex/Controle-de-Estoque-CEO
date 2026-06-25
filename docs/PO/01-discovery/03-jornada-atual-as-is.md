# Discovery — Jornada Atual (As-Is)

**Documento:** 03-jornada-atual-as-is
**Última atualização:** 07/05/2026

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
Dentista percebe falta ─▶ Pede verbalmente / por bilhete ao almoxarife
                       └─▶ Em casos urgentes, vai pessoalmente à Dispensação
                              └─▶ Almoxarife procura, entrega ou nega
```

- Pedido **sem registro formal** na maioria das vezes.
- Sem fila visível: pedidos urgentes "furam" a ordem dos pedidos antigos.
- Sem histórico: não dá para saber quanto cada dentista consome no mês.
- Não dá pra saber onde itens relevantes estão

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
| Dentista CEO | Pede material por bilhete | "Vai esquecer? Será que entrega hoje?" |
| Almoxarife | Recebe três pedidos verbais ao mesmo tempo | "Qual era o primeiro mesmo? Pediram 10 ou 15?" |
| Almoxarife | Lança planilha no fim do dia | "Esqueci o que saiu de manhã, vou ter que conferir o caderno." |
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
│ Solicitar    │ Liga / WhatsApp /     │ Anota num post-it     │ Sem registro     │
│              │ caminha até a Disp.   │                       │ formal           │
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

A operação atual depende fortemente de **conhecimento tácito** (saber a quem pedir, quem está de plantão, onde fica cada caixa) e de **artefatos físicos** que não escalam (caderno, post-it, conversa). O sistema digital deve substituir esses artefatos sem aumentar a fricção operacional do almoxarife — caso contrário, ele será abandonado.

Esse diagnóstico fundamenta o desenho do To-Be em [03-personas-jornadas/02-jornadas-to-be.md](../03-personas-jornadas/02-jornadas-to-be.md) e a priorização do MVP em [02-visao-escopo/02-escopo-mvp.md](../02-visao-escopo/02-escopo-mvp.md).
