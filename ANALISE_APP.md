# Análise de falhas e melhorias do app

## Escopo da análise
- Verificação estática com ESLint (`npm run lint`).
- Revisão manual de componentes/pontos críticos de autenticação, API e parsing.

## Falhas encontradas (objetivas)

### 1) Build/lint quebrando (11 erros)
O app atualmente não passa no lint e isso tende a bloquear CI/CD e release confiável.

Principais erros:
- Uso de função impura em render (`Math.random`) na tela de acervo.
- Uso de `any` em rotas/API e auth callbacks.
- Texto com aspas não escapadas em JSX.
- Variável `let` que deveria ser `const`.

Impacto: risco de regressões, baixa previsibilidade de renderização e perda de segurança de tipos.

### 2) Não-idempotência de UI no Acervo
A função `randomTag()` é executada durante render, mudando visual a cada rerender sem mudança real de dados.

Impacto: UX inconsistente, cards “piscando” semanticamente, e warning de pureza React.

### 3) Tipagem fraca em autenticação e sessão
Há casting com `any` para `session.user` e `token` em pontos centrais de auth.

Impacto: aumenta chance de bugs em tempo de execução (campos ausentes/renomeados), reduz segurança de refactors.

### 4) APIs sem validação robusta de payload
`PATCH /api/profile` desserializa JSON e aplica dados com validação mínima de formato/tamanho.

Impacto: risco de dados inconsistentes, payload inesperado e manutenção mais difícil.

### 5) Lint warnings de fonte e import não utilizado
- Uso de `<link>`/font em páginas específicas gera warning de estratégia de carregamento de fontes.
- Import `signOut` não utilizado.

Impacto: débito técnico e possível impacto de performance/consistência visual.

## Melhorias recomendadas (priorizadas)

## Prioridade Alta (corrigir primeiro)
1. **Zerar erros de lint**
   - Remover `Math.random` do render (ex.: tag derivada deterministicamente de `song.id`/`title`).
   - Substituir `any` por tipos explícitos (session/jwt augmentation do NextAuth + tipos Prisma).
   - Escapar aspas em JSX e ajustar `prefer-const`.
2. **Adicionar validação de entrada nas rotas**
   - Usar `zod` nos endpoints (`/api/profile`, `/api/register`) para validar shape/tamanho.
   - Retornar 400 com mensagens padronizadas para input inválido.
3. **Fortalecer contrato de autenticação**
   - Declarar tipos de `Session` e `JWT` via module augmentation do NextAuth para `id` e `role`.

## Prioridade Média
4. **Melhorar observabilidade de erros**
   - Trocar `console.error` solto por logger com contexto (rota, userId, requestId).
   - Padronizar resposta de erro `{ error, code, details? }`.
5. **UX resiliente no fetch do client**
   - Exibir estados de erro vazios amigáveis (não só fallback silencioso para lista vazia).
   - Cancelar requisições antigas com `AbortController` no debounce de busca.
6. **Aprimorar internacionalização e consistência de idioma**
   - Há mistura de português/inglês em labels e mensagens. Definir padrão único.

## Prioridade Baixa
7. **Qualidade de dados musicais**
   - No parser de título, registrar métricas de fallback e acurácia para iterar regras.
8. **Cobertura de testes**
   - Incluir testes de integração para `/api/profile`, `/api/register`, `/api/stats`.
   - Incluir testes unitários do parser (`fallbackParse`) com casos reais.

## Plano de execução sugerido (1 sprint curta)
1. Dia 1: corrigir lint blocking issues + tipagem auth.
2. Dia 2: validação zod nas rotas críticas + padronização de erros.
3. Dia 3: UX de erro/loading + melhorias de observabilidade.
4. Dia 4: testes mínimos de integração e unitários.

## Critérios de pronto
- `npm run lint` sem erros.
- Rotas principais com schema validation.
- Session/JWT sem `any` nos pontos críticos.
- Estados de erro visíveis em telas de dashboard/acervo.
- Testes cobrindo fluxos de sucesso e falha de profile/register.
