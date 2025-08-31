Autores: Thyago Azevedo Serpa da Silva (06006260) e Whendel Esmi da Silva (06006072)

--------------------------------------------------------------------------------
1) VISÃO GERAL
--------------------------------------------------------------------------------
Aplicação web para controle de aluguel de patins com:
- Login e sessão do atendente;
- Criação de aluguel por CPF e número do calçado;
- Painel de aluguéis ativos com estatísticas e atualização periódica;
- Devolução com cálculo automático (hora cheia) e taxa por dano;
- Fechamento de caixa por forma de pagamento (Dinheiro, Cartão, Pix);
- Armazenamento local (localStorage) — não requer servidor.

--------------------------------------------------------------------------------
2) FUNCIONALIDADES POR PÁGINA
--------------------------------------------------------------------------------
• LOGIN (index.html)
  - Autentica o atendente (usuário/senha fixos para fins acadêmicos);
  - Armazena a sessão (nome e horário do login) no `localStorage`;
  - Redireciona para `aluguel.html` após sucesso.

• NOVO ALUGUEL (aluguel.html)
  - Campos: CPF do cliente e número do calçado;
  - Busca patins disponíveis pelo número;
  - Seleção do patins, exibe resumo (CPF, patins, início, valor/hora, atendente);
  - Confirmação do aluguel:
      • Cria registro com `horaInicio` (ISO 8601) e status "ativo";
      • Marca o patins como "indisponivel";
      • Persiste no `localStorage`;
      • Redireciona para `ativos.html`.

• ALUGUÉIS ATIVOS (ativos.html)
  - Lista cartões com dados do aluguel (CPF, patins, início, tempo decorrido);
  - Estatísticas:
      • Total de ativos;
      • Receita prevista (horas de cobrança * valorHora);
      • Tempo médio (em horas, arredondado);
  - Atualização automática a cada 5s (se a página estiver visível).

• DEVOLUÇÃO (devolucao.html)
  - Busca aluguel ativo pelo ID do patins (ex.: P003);
  - Mostra resumo (CPF, patins, número, início, atendentes);
  - Escolha de estado do patins (bom/danificado) e forma de pagamento;
  - Cálculo do valor total:
      • Horas de cobrança = arredondamento para hora cheia (mínimo 1h);
      • Taxa por dano adicionada quando aplicável;
  - Encerramento do aluguel:
      • Atualiza status para "encerrado", `horaFim`, `valorTotal`;
      • Libera o patins (status "disponivel");
      • Soma o valor ao caixa na forma de pagamento escolhida;
      • Redireciona para `caixa.html`.

• FECHAMENTO DE CAIXA (caixa.html)
  - Mostra data/hora e totais por forma (Dinheiro, Cartão, Pix) e total consolidado;
  - Ações:
      • "Gerar Relatório" → recalcula e atualiza a tela;
      • "Confirmar Fechamento" → zera o caixa para o próximo dia;
      • "Salvar TXT" → baixa um arquivo .txt com o relatório;
      • "Enviar por Email" → abre `mailto:` com assunto/corpo preenchidos.

--------------------------------------------------------------------------------
3) FUNCIONALIDADES GERAIS
--------------------------------------------------------------------------------
- PERSISTÊNCIA
  • Chave do estado: `patins_app_state_v1` (localStorage).
  • Chave da sessão:  `usuarioLogado` (localStorage).

- SESSÃO
  • Após login, o nome do atendente aparece no topo das páginas;
  • Botão "Sair" remove apenas a sessão (dados do caixa/alugueis continuam).

- FORMATAÇÃO/VALIDAÇÃO DE CPF
  • Digite com ou sem máscara (ex.: 18435799794 ou 184.357.997-94);
  • Validação pelo algoritmo oficial (módulo 11, 2 dígitos verificadores).

- CÁLCULO DE TEMPO/VALOR
  • `horaInicio` sempre em ISO 8601 (ex.: `2025-08-31T13:45:00.000Z`);
  • Horas de cobrança: ceil((agora - início) / 1h) com mínimo de 1h;
  • `valorHora` (padrão R$ 15,00) e `taxaDano` (padrão R$ 20,00) configuráveis.

- EMAIL
  • Envio por `mailto:` abre o cliente de email do usuário com campos preenchidos.
--------------------------------------------------------------------------------
4) ESTRUTURAS DE DADOS
--------------------------------------------------------------------------------
Patins
------
{ id: string, numero: number, status: 'disponivel' | 'indisponivel' }

Aluguel
-------
{
  id: number,
  cpf: string,
  patinsId: string,
  numeroPatins: number,
  horaInicio: string (ISO 8601),
  status: 'ativo' | 'encerrado',
  valor: number,             // valor por hora no momento da criação
  atendente: string,
  // preenchidos no encerramento:
  horaFim?: string (ISO 8601),
  valorTotal?: number,
  estadoPatins?: 'bom' | 'danificado',
  formaPagamento?: 'dinheiro' | 'cartao' | 'pix'
}

Caixa
-----
{ dinheiro: number, cartao: number, pix: number }

--------------------------------------------------------------------------------
5) CONFIGURAÇÃO RÁPIDA
--------------------------------------------------------------------------------
- Alterar preço por hora / taxa de dano:
  • Edite `assets/js/app.js` nas chaves `valorHora` e `taxaDano` dentro de `defaultState()`.

- Adicionar/ajustar patins iniciais:
  • Edite o array `patins` em `defaultState()`.

- Resetar TUDO (estado + sessão) no navegador:
  • Abra o console (F12) e execute:
    localStorage.removeItem('patins_app_state_v1');
    localStorage.removeItem('usuarioLogado');
  • Recarregue a página.

--------------------------------------------------------------------------------
6) CRÉDITOS
--------------------------------------------------------------------------------
Feito por **Thyago Azevedo Serpa da Silva (06006260)** e
**Whendel Esmi da Silva (06006072)**.
