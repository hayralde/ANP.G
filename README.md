# ANP Monitor — Plano de Ação

Aplicação web estática para monitoramento das atividades do **Plano de Ação ANP**.

## Funcionalidades

- **Dashboard estilo Power BI** com KPIs e gráficos (status, responsáveis, categorias)
- **Cards** de todas as atividades com filtros (status, responsável, categoria e busca)
- **Área administrativa** protegida por login para alterar status, responsável, pendência, tipo, previsão e observações
- Dados persistidos no `localStorage` do navegador
- Totalmente responsivo (mobile / tablet / desktop)
- Roda 100% em HTML + CSS + JavaScript (sem backend)

## Credenciais de Administrador

| Campo    | Valor     |
|----------|-----------|
| Usuário  | `admin`   |
| Senha    | `admin123`|

## Como ativar o GitHub Pages

1. Neste repositório vá em **Settings → Pages**
2. Em **Source** escolha:
   - Branch: `main`
   - Folder: `/ (root)`
3. Aguarde 1–2 minutos e acesse:

**https://hayralde.github.io/ANP.G/**

## Estrutura de arquivos

```
├── index.html          # Dashboard + cards
├── admin.html          # Login + edição de atividades
├── css/
│   └── style.css       # Estilos modernos
├── js/
│   ├── data.js         # Dados padrão + localStorage
│   ├── app.js          # Lógica do dashboard
│   └── admin.js        # Lógica da administração
└── README.md
```

## Tecnologias utilizadas

- **HTML5** — estrutura semântica
- **CSS3** — layout moderno, responsivo, variáveis CSS, flex/grid
- **JavaScript (Vanilla)** — interatividade, filtros, gráficos
- **Chart.js** (CDN) — gráficos estilo Power BI
- **localStorage** — persistência das alterações do admin
- **GitHub Pages** — hospedagem estática gratuita

## Observação importante

Como a aplicação é 100% estática (exigência do GitHub Pages gratuito), as alterações feitas no painel admin ficam salvas **apenas no navegador** de quem as editou. Para um ambiente multi-usuário com dados compartilhados seria necessário um backend (Firebase, Supabase, etc.).

## Autor

Projeto gerado a partir da planilha **PLANO DE AÇÃO ANP - web.xlsx**
