# ⚔️ Registro de Resolução de Conflito

Este documento detalha a experiência de identificação e resolução de um conflito de mesclagem (merge conflict), conforme exigido pelo requisito **R4** da atividade.

### 🔍 Contexto do Conflito
* **Arquivo:** `projeto/prototipo.js`
* **Localização:** Linha 94
* **Branches envolvidas:** `feat/melhoria-layout-A` e `feat/melhoria-layout-B`

**Causa:**
O conflito ocorreu devido à alteração simultânea da linha 94 em ambas as branches, que foram criadas a partir do mesmo commit base na `main`. Cada branch propunha uma nomenclatura diferente para o produto inicial do catálogo do Centro de Especialidades Odontológicas (CEO-UFPE).

---

### 🛡️ Processo de Resolução

#### 1. Decisão da Versão
Optei por manter a versão da **Branch A** (`"Lidocaína 2% (Premium)"`). 

**Critério de escolha:**
A nomenclatura da Branch A apresentava maior precisão técnica ao incluir a concentração da substância, o que está mais alinhado à identidade visual e aos requisitos de segurança do sistema de estoque hospitalar.

#### 2. Ações Tomadas
Para solucionar o impasse, segui os seguintes passos técnicos:
1. **Identificação:** Localizei as marcações de conflito (`<<<<<<<`, `=======`, `>>>>>>>`) geradas pelo Git.
2. **Edição Manual:** Utilizei o **VS Code** para limpar as marcações e consolidar o código final, removendo a proposta descartada da Branch B.
3. **Finalização:** Salvei o arquivo e utilizei o comando de commit (via GitHub Desktop) para concluir o processo de merge e estabilizar a branch `main`.

---
*Este registro serve como evidência de competência em trabalho colaborativo e controle de versão profissional.*