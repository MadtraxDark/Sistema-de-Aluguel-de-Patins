
Sistema de Aluguel de Patins — Versão Multi-páginas
===================================================

Como usar
---------
1) Abra `index.html` e faça login (admin / 123456).
2) Você será redirecionado para `aluguel.html`.
3) Use o menu no topo para navegar entre as páginas (Novo Aluguel, Ativos, Devolução, Caixa).

Armazenamento
-------------
- Tudo fica no `localStorage`: patins, aluguéis, caixa e sessão do usuário.
- O estado inicial inclui alguns patins disponíveis e valores padrão (R$ 15/h e taxa de dano R$ 20).

Observações
-----------
- O CPF é validado apenas no momento de CONFIRMAR o aluguel.
- A página "Ativos" atualiza automaticamente a cada 5 segundos (se estiver visível).
- O botão "Sair" limpa apenas a sessão (os dados continuam no navegador).
