# Atividade: Debugging com Hipótese

**Equipe:** Grupo 5 — CEO Estoque UFPE (Gestão de Estoque CEO-UFPE)  
**Repositório:** https://github.com/lacavaalex/Controle-de-Estoque-CEO  
**Disciplina:** Desenvolvimento de Sistemas — UFPE  
**Data:** 01/06/2026

---

## Membros

| Membro | GitHub |
|--------|--------|
| Alex Lacava | — |
| Bruno Silva | https://github.com/SilvaaBruno |
| José Romildo | — |
| Kaique Bonfim | https://github.com/ksb3-dt |
| Luiz Taiguara | — |
| Vinícius Moreira | — |
| Wallyson Silva | https://github.com/ExeWall |

---

## Bug 1 — Falha de Idempotência e Concorrência DDL (Crash em Segunda Execução)

**Membro responsável:** Bruno Silva  
**Arquivo:** `projeto/backend/src/database/migrate.ts`  
**Localização do breakpoint:** linha 38 — início do bloco `catch` interno do laço `for`

### Trecho problemático

```typescript
catch (err) {
  await client.query("ROLLBACK"); // <-- Breakpoint
  throw new Error(`Falha na migration "${arquivo}": ${(err as Error).message}`);
}
```

### Hipótese (anotada antes de abrir o debugger)

O script `migrate.ts` lê sequencialmente os arquivos da pasta `migrations` e os executa no banco. O arquivo `001_create_enums.sql` utiliza comandos puros de criação (`CREATE TYPE ... AS ENUM`). A hipótese é que o script carece de idempotência — a capacidade de ser executado múltiplas vezes sem causar falhas. Se a execução for interrompida após criar os ENUMs mas antes de registrar o sucesso na tabela `_migrations`, o PostgreSQL rejeitará a instrução em uma segunda tentativa. Como o laço captura qualquer exceção com `throw new Error()`, a execução é imediatamente interrompida, deixando o sistema em estado inconsistente e abortando o processo via `process.exit(1)`.

### Procedimento de teste

1. Executamos o script pela primeira vez com o banco limpo (`npm run db:migrate`) para criar os tipos com sucesso.
2. Forçamos uma inconsistência apagando o registro de `001_create_enums.sql` da tabela `_migrations` diretamente via terminal do Postgres, simulando uma falha de sincronismo.
3. Executamos novamente `npm run db:migrate` com o debugger ativo para capturar a interrupção.

### Confirmação via stack trace / debugger

O laço foi interrompido imediatamente na primeira iteração. O painel *Variables* do debugger expôs o objeto de erro com as seguintes propriedades:

- `code`: `"42710"` (código nativo do Postgres para `duplicate_object`)
- `message`: `"type \"role_usuario\" already exists"`

```
Erro nas migrations: Falha na migration "001_create_enums.sql": type "role_usuario" already exists
    at migrate (projeto/backend/src/database/migrate.ts:39:15)
    at async file://projeto/backend/src/database/migrate.ts:51:1
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
Process finished with exit code 1
```

### Causa raiz

O PostgreSQL não suporta `CREATE TYPE IF NOT EXISTS` nativamente (ao contrário de `CREATE TABLE IF NOT EXISTS`). Um erro DDL em qualquer tipo paralisa toda a pipeline de migração.

### Correção

Envolver cada criação de tipo em um bloco procedural `DO` em PL/pgSQL que consulta `pg_type` antes de tentar criar:

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_usuario') THEN
    CREATE TYPE role_usuario AS ENUM ('gestao', 'almoxarife', 'dentista');
  END IF;
END $$;
```

---

## Bug 2 — Mascaramento de Exceção por Objeto Indefinido no Bloco Finally

**Membro responsável:** Bruno Silva  
**Arquivo:** `projeto/backend/src/database/migrate.ts`  
**Localização do breakpoint:** linha 44 — primeira linha do bloco `finally`

### Trecho problemático

```typescript
finally {
  client.release(); // <-- Breakpoint
  await closePool();
}
```

### Hipótese (anotada antes de abrir o debugger)

O bloco `finally` assume erroneamente que o objeto `client` sempre foi inicializado com sucesso. Caso ocorra uma falha de infraestrutura antes da atribuição da conexão — como indisponibilidade do banco ou erro na leitura de `DATABASE_URL` —, a função `pool.connect()` lançará uma exceção e `client` permanecerá `undefined`. Ao entrar no `finally`, a tentativa de chamar `client.release()` em um objeto indefinido causará um `TypeError` secundário, mascarando a falha real de conexão.

### Procedimento de teste

1. Alteramos temporariamente a porta de conexão no arquivo de configuração local para um valor incorreto, simulando indisponibilidade.
2. Iniciamos a execução de `migrate()` em modo de inspeção (debug).

### Confirmação via stack trace / debugger

Ao atingir o breakpoint no `finally`, inspecionou-se `client` no painel de escopo local — valor confirmado como `undefined`. Ao avançar um passo, o programa sofreu interrupção abrupta:

```
TypeError: Cannot read properties of undefined (reading 'release')
    at migrate (projeto/backend/src/database/migrate.ts:44:12)
    at async file://projeto/backend/src/database/migrate.ts:51:1
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
Process finished with exit code 1
```

### Causa raiz

O erro original de conexão foi completamente substituído por um `TypeError` do próprio Node.js, dificultando o diagnóstico real do problema.

### Correção

Verificar se `client` foi instanciado antes de chamar `release()`:

```typescript
finally {
  if (client) {
    client.release();
  }
  await closePool();
}
```

---

## Bug 3 — Callback com Chaves Impede Retorno Implícito no `.some()`

**Membro responsável:** Kaique Bonfim  
**Arquivo:** `backend/src/services/ItemService.ts`  
**Localização do breakpoint:** linha 51 — dentro da callback do `.some()`

### Trecho problemático

```typescript
const hasName = items.some((item) => { item.name === name })
```

### Hipótese (anotada antes de abrir o debugger)

A hipótese é que havia um problema na verificação de duplicidade de nome. O uso de chaves `{}` na arrow function faz o JavaScript esperar um `return` explícito — sem ele, a função retorna `undefined` em cada iteração, e `.some()` interpreta `undefined` como `false`. Assim, `hasName` nunca fica `true`, mesmo quando já existe um item com o mesmo nome.

### Procedimento de teste

Testes unitários com Vitest mostraram que ao tentar renomear o item 001 com o nome já existente do item 002, a renomeação era feita ao invés de lançar o erro esperado. Adicionou-se um breakpoint na linha 51 e depois dentro da callback para acompanhar cada iteração.

### Confirmação via stack trace / debugger

Acompanhando o stack trace, verificou-se que a função lia corretamente cada item, mas `hasName` permanecia `false` mesmo quando `item.name === name` era verdadeiro — pois a expressão não era retornada.

### Causa raiz

Arrow function com chaves `{}` sem `return` explícito retorna `undefined` implicitamente, fazendo `.some()` nunca encontrar correspondência.

### Correção

Remover as chaves para que o retorno seja implícito:

```typescript
const hasName = items.some((item) => item.name === name)
```

---

## Bug 4 — Retorno de Objeto Desatualizado Após Update

**Membro responsável:** José Romildo  
**Arquivo:** `backend/src/services/ItemService.ts`  
**Localização do breakpoint:** linhas 56 e 57

### Trecho problemático

```typescript
await this.itemRepository.updateItem(id, { name: name }) // linha 56
return item
```

### Hipótese (anotada antes de abrir o debugger)

O método atualiza o nome no banco via `updateItem()`, mas o objeto local `item` ainda carrega o nome antigo, pois nunca foi modificado em memória. Ao retornar `item`, o chamador recebe dados desatualizados, causando inconsistência entre o que foi salvo no banco e o que foi respondido pela API.

### Procedimento de teste

Uso do Vitest para verificação rápida e posteriormente do debugger e logs do console para atestar o ocorrido.

### Confirmação via stack trace / debugger

Ao atingir o breakpoint, inspecionou-se o estado da variável `item` no painel de escopo local, confirmando que o nome ainda era o original:

```
AssertionError: expected 'Luva Cirúrgica' to be 'Nome Novo'
    at ItemService.test.ts:101  expect(resultado.name).toBe('Nome Novo')
    at ItemService.changeItemName (src/services/ItemService.ts)

Leitura: o retorno trouxe o nome original 'Luva Cirúrgica'
mesmo após a atualização ser salva com 'Nome Novo'.
```

### Causa raiz

O objeto `item` é capturado antes da atualização e devolvido sem refletir o novo estado persistido no banco.

### Correção

Retornar o resultado do próprio `updateItem()`, que já traz o registro atualizado:

```typescript
return await this.itemRepository.updateItem(id, { name: name })
```

---

## Bug 5 — Status HTTP 200 em Vez de 201 na Criação de Recurso

**Membro responsável:** Alex Lacava  
**Arquivo:** `src/controller/ItemController.ts`  
**Método:** `createItem()`  
**Localização do breakpoint:** linha do `return` com `res.status(200)`

### Trecho problemático

```typescript
return res.status(200).json(createdItem)
```

### Hipótese (anotada antes de abrir o debugger)

O padrão HTTP define `200 (OK)` para operações de leitura ou atualização bem-sucedidas, e `201 (Created)` especificamente para criação de novos recursos. Usar `200` no `createItem` viola a semântica REST, podendo confundir clientes e ferramentas que dependem do status code para saber se um recurso foi criado.

### Procedimento de teste

Inspeção de código e verificação via terminal com o servidor em execução:

```bash
curl -s -o /dev/null -w '%{http_code}' -X POST /items -d '{...}'
# Retorna: 200  (esperado: 201)
```

### Confirmação via stack trace / debugger

Bug semântico — não gera exceção. O breakpoint na linha do `return` permite inspecionar o status code da resposta HTTP antes de ela ser enviada, confirmando o valor `200`.

### Causa raiz

Status code incorreto aplicado manualmente no controller — não há validação automática de semântica REST no Express.

### Correção

```typescript
return res.status(201).json(createdItem)
```

---

## Bug 6 — Valores `undefined` Passados como `null` para Query SQL

**Membro responsável:** Wallyson Silva  
**Arquivo:** `projeto/backend/src/repositories/PgEstoqueCeoRepo.ts`  
**Método:** `update()` — linha 67

### Trecho problemático

```typescript
const valores = [id, ...campos.map((c) => dados[c])];
```

### Hipótese (anotada antes de abrir o debugger)

`Object.keys(dados)` devolve todas as chaves presentes no objeto, inclusive aquelas cujo valor é `undefined`. Ao mapear esses valores para o array `valores`, um `undefined` acaba sendo passado como parâmetro para a query SQL. O driver `pg` converte `undefined` em `null` silenciosamente, sem lançar erro. O resultado é que o banco grava `NULL` em uma coluna que deveria ser atualizada com um valor real — a atualização parece bem-sucedida mas corrompeu o dado.

### Confirmação via stack trace / debugger

Ao pausar um breakpoint na linha 67 e inspecionar `valores` com `dados = { nome: "Resina A2", estoque_minimo: undefined }`, o array resulta em `[1, "Resina A2", undefined]`. A query enviada ao PostgreSQL recebe `$3 = null`, sobrescrevendo o valor existente na coluna `estoque_minimo`.

### Causa raiz

Propriedades opcionais com valor `undefined` não devem entrar na query. O filtro precisa excluí-las antes de montar `sets` e `valores`.

### Correção

```typescript
const campos = (Object.keys(dados) as (keyof typeof dados)[])
  .filter((c) => dados[c] !== undefined);
```

---

## Bug 7 — CAST sem Validação de Formato Quebra Geração de ID

**Membro responsável:** Wallyson Silva  
**Arquivo:** `projeto/backend/src/repositories/PgSolicitacaoRepo.ts`  
**Método:** `getNextId()` — linha 92

### Trecho problemático

```sql
SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 5) AS INT)), 0) AS max_num
FROM solicitacao
```

### Hipótese (anotada antes de abrir o debugger)

O `SUBSTRING(id FROM 5)` assume que todo id na tabela começa com exatamente `"SOL-"` (4 caracteres) e que o restante é sempre um inteiro puro. Se qualquer linha tiver um id inserido manualmente fora desse padrão (ex.: `"SOLICITACAO-001"`, `"SOL-TESTE"` ou uma string livre), o `CAST(...AS INT)` do PostgreSQL lança um erro de runtime e derruba a requisição inteira.

### Confirmação via stack trace / debugger

Ao inserir manualmente no banco um registro com `id = 'SOL-TESTE'` e chamar `getNextId()`, o PostgreSQL retorna:

```
ERROR: invalid input syntax for type integer: "TESTE"
CONTEXT: SQL function "getNextId"
```

O stack trace no Node.js sobe como uma `DatabaseError` não tratada, resultando em HTTP 500 para o cliente sem mensagem útil.

### Causa raiz

O método não valida o formato do id antes de fazer o cast. Qualquer dado inconsistente na coluna `id` quebra a geração do próximo identificador para todos os usuários.

### Correção

Filtrar apenas os ids que respeitam o padrão antes do cast:

```sql
SELECT COALESCE(
  MAX(CAST(SUBSTRING(id FROM 5) AS INT)),
  0
) AS max_num
FROM solicitacao
WHERE id ~ '^SOL-[0-9]+$'
```

---

*Documento produzido como parte da atividade de debugging com hipótese — Desenvolvimento de Sistemas, UFPE.*
