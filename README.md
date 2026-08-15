# ANP Monitor — Plano de Ação

Aplicação web estática para monitoramento das atividades do **Plano de Ação ANP**.

## Funcionalidades

- Dashboard estilo Power BI (KPIs + gráficos)
- Cards de atividades com filtros
- Área admin com login
- **Persistência no GitHub**: alterações do admin são gravadas em `data/activities.json` via GitHub API (todos veem)

## Credenciais de Administrador

| Campo    | Valor     |
|----------|-----------|
| Usuário  | `admin`   |
| Senha    | `admin123`|

## Como o admin salva no GitHub

1. Crie um **Personal Access Token** (fine-grained):
   https://github.com/settings/tokens?type=beta
   - Repository access: só `hayralde/ANP.G`
   - Permissions → Contents: **Read and write**
2. Entre em **Administração** (`admin` / `admin123`)
3. Cole o token no campo e clique em **Guardar token na sessão**
4. Edite as atividades e clique em **Salvar no GitHub**

O arquivo `data/activities.json` é atualizado no repositório. O dashboard lê esse arquivo (pode levar 1–2 min por causa do cache do GitHub Pages).

**Segurança:** o token fica só no `sessionStorage` do navegador (não no código). Não compartilhe o token.

## Site

**https://hayralde.github.io/ANP.G/**

## Estrutura

```
├── index.html
├── admin.html
├── data/activities.json   # fonte da verdade (editada pelo admin)
├── css/style.css
└── js/
    ├── data.js            # load + save via GitHub API
    ├── app.js
    └── admin.js
```
