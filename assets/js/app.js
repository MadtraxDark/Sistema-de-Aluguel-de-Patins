
/* ======= Estado & Utilidades ======= */
const STORAGE_KEY = 'patins_app_state_v1';
const USER_KEY = 'usuarioLogado';
const usuarioPadrao = { usuario: 'admin', senha: '123456', nome: 'Administrador' };

function defaultState() {
  return {
    patins: [
      {id: 'P001', numero: 38, status: 'disponivel'},
      {id: 'P002', numero: 38, status: 'disponivel'},
      {id: 'P003', numero: 39, status: 'disponivel'},
      {id: 'P004', numero: 40, status: 'disponivel'},
      {id: 'P005', numero: 41, status: 'disponivel'},
      {id: 'P006', numero: 42, status: 'disponivel'},
      {id: 'P007', numero: 37, status: 'disponivel'},
      {id: 'P008', numero: 43, status: 'disponivel'}
    ],
    alugueis: [],
    caixa: { dinheiro: 0, cartao: 0, pix: 0 },
    valorHora: 15.00,
    taxaDano: 20.00
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const st = defaultState();
    saveState(st);
    return st;
  }
  try { return JSON.parse(raw); }
  catch(e) { const st = defaultState(); saveState(st); return st; }
}
function saveState(st) { localStorage.setItem(STORAGE_KEY, JSON.stringify(st)); }

function BRL(v){ return 'R$ ' + Number(v || 0).toFixed(2); }
function parseDateFlex(v){
  if(!v) return null;
  if(v instanceof Date) return v;
  if(typeof v === 'number') return new Date(v);
  let d = new Date(v);
  if(!isNaN(d)) return d;
  d = new Date(String(v).replace(' ','T'));
  if(!isNaN(d)) return d;
  return null;
}
function tempoHumanizado(inicio){
  const ms = Date.now() - inicio.getTime();
  const h = Math.floor(ms/3600000);
  const m = Math.floor((ms%3600000)/60000);
  return {h,m};
}
function horasParaCobranca(inicio){
  const h = Math.ceil((Date.now() - inicio.getTime())/3600000);
  return Math.max(h,1);
}

/* ======= Auth ======= */
function currentUser(){
  const raw = localStorage.getItem(USER_KEY);
  if(!raw) return null;
  try { return JSON.parse(raw); } catch(e) { return null; }
}
function login(usuario, senha){
  if(usuario === usuarioPadrao.usuario && senha === usuarioPadrao.senha){
    localStorage.setItem(USER_KEY, JSON.stringify({usuario, nome: usuarioPadrao.nome, loginTime: new Date().toISOString()}));
    return true;
  }
  return false;
}
function logout(){
  localStorage.removeItem(USER_KEY);
  window.location.href = 'index.html';
}
function requireAuth(){
  const u = currentUser();
  if(!u){ window.location.href = 'index.html'; return null; }
  const span = document.getElementById('usuarioLogado');
  if(span) span.textContent = u.nome;
  return u;
}

/* ======= CPF ======= */
function formatarCPFInput(input){
  let value = input.value.replace(/\D/g, '');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d{1,2})/, '$1-$2');
  input.value = value;
}
function validarCPF(cpf){
  cpf = (cpf || '').toString().replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
  let resto = soma % 11;
  const dig1 = (resto < 2) ? 0 : 11 - resto;
  if (dig1 !== Number(cpf[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
  resto = soma % 11;
  const dig2 = (resto < 2) ? 0 : 11 - resto;
  return dig2 === Number(cpf[10]);
}

/* ======= UI Helpers ======= */
function msg(el, text, kind='info'){
  const box = document.getElementById(el);
  if(!box) return;
  const cls = kind==='error' ? 'alert-error' : kind==='success' ? 'alert-success' : 'alert-info';
  box.innerHTML = `<div class="alert ${cls}">${text}</div>`;
  setTimeout(()=> box.innerHTML='', 5000);
}
function setActiveNav(id){
  const link = document.getElementById(id);
  if(link) link.classList.add('active');
}

/* ======= Page Inits ======= */
function initLoginPage(){
  // if already logged, go to aluguel
  if(currentUser()) { window.location.href = 'aluguel.html'; return; }
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value;
    if(login(usuario, senha)){
      window.location.href = 'aluguel.html';
    }else{
      msg('mensagemLogin','Usuário ou senha incorretos.','error');
    }
  });
}

function initLayout(page){ // shared header on every authenticated page
  const u = requireAuth(); if(!u) return;
  document.querySelectorAll('[data-logout]').forEach(b=> b.addEventListener('click', logout));
  setActiveNav(page);
}

function initAluguelPage(){
  initLayout('nav-aluguel');
  const st = loadState();
  const cpfEl = document.getElementById('cpfcliente');
  cpfEl.addEventListener('input', ()=> formatarCPFInput(cpfEl));
  document.getElementById('buscarPatins').addEventListener('click', ()=>{
    const numero = document.getElementById('numerocalcado').value;
    const grid = document.getElementById('patinsGrid');
    grid.innerHTML = '';
    const disponiveis = st.patins.filter(p=> p.numero == numero && p.status==='disponivel');
    if(disponiveis.length===0){
      msg('mensagemAluguel',`Não há patins disponíveis no número ${numero}.`,'error');
      document.getElementById('patinsDisponiveis').classList.add('hidden');
      return;
    }
    disponiveis.forEach(item=>{
      const div = document.createElement('div');
      div.className = 'patins-item';
      div.innerHTML = `<h4>ID: ${item.id}</h4><p>Número: ${item.numero}</p><p class="small">Clique para selecionar</p>`;
      div.onclick = ()=> selecionarPatins(item, st);
      grid.appendChild(div);
    });
    document.getElementById('patinsDisponiveis').classList.remove('hidden');
    msg('mensagemAluguel',`Encontrados ${disponiveis.length} patins disponíveis.`,'success');
  });
  document.getElementById('limparAluguel').addEventListener('click', ()=>{
    document.getElementById('numerocalcado').value='';
    document.getElementById('cpfcliente').value='';
    document.getElementById('patinsDisponiveis').classList.add('hidden');
    document.getElementById('dadosAluguel').innerHTML='';
    document.getElementById('confirmarAluguel').classList.add('hidden');
  });
}
function selecionarPatins(item, st){
  const cpf = document.getElementById('cpfcliente').value;
  if(!cpf) return msg('mensagemAluguel','Informe o CPF.','error');
  if(!validarCPF(cpf)) return msg('mensagemAluguel','CPF inválido.','error');
  const u = currentUser();
  const agora = new Date();
  document.getElementById('dadosAluguel').innerHTML = `
    <div class="grid cols-2">
      <div><div class="small">CPF</div><b>${cpf}</b></div>
      <div><div class="small">Patins</div><b>${item.id} (nº ${item.numero})</b></div>
      <div><div class="small">Início</div>${agora.toLocaleString('pt-BR')}</div>
      <div><div class="small">Valor/Hora</div>${BRL(st.valorHora)}</div>
      <div><div class="small">Atendente</div>${u.nome}</div>
    </div>`;
  document.getElementById('confirmarAluguel').classList.remove('hidden');
  document.getElementById('btnConfirmarAluguel').onclick = ()=>{
    const novo = {
      id: (st.alugueis[0]?.id || 0) + st.alugueis.length + 1,
      cpf,
      patinsId: item.id,
      numeroPatins: item.numero,
      horaInicio: new Date().toISOString(),
      status: 'ativo',
      valor: st.valorHora,
      atendente: u.nome
    };
    st.alugueis.push(novo);
    st.patins = st.patins.map(p=> p.id===item.id ? {...p, status:'indisponivel'} : p);
    saveState(st);
    msg('mensagemAluguel',`Aluguel #${novo.id} criado.`, 'success');
    setTimeout(()=> window.location.href='ativos.html', 400);
  };
  document.getElementById('btnCancelarAluguel').onclick = ()=>{
    document.getElementById('dadosAluguel').innerHTML='';
    document.getElementById('confirmarAluguel').classList.add('hidden');
  };
}

function initAtivosPage(){
  initLayout('nav-ativos');
  function render(){
    const st = loadState();
    const ativos = st.alugueis.filter(a=> a.status==='ativo');
    const grid = document.getElementById('alugueisAtivosGrid');
    const empty = document.getElementById('emptyState');
    // Stats
    document.getElementById('totalAtivos').textContent = ativos.length;
    document.getElementById('totalPatinsAlugados').textContent = ativos.length;
    let receitaPrevista = 0, tempoTotal = 0;
    grid.innerHTML='';
    ativos.forEach(a=>{
      const inicio = parseDateFlex(a.horaInicio);
      const hCob = horasParaCobranca(inicio);
      receitaPrevista += hCob * st.valorHora;
      const ms = Date.now()-inicio.getTime();
      tempoTotal += Math.ceil(ms/3600000);
      const {h,m}= tempoHumanizado(inicio);
      const valorAtual = hCob * st.valorHora;
      const card = document.createElement('div');
      card.className='aluguel-ativo-card';
      card.innerHTML = `
        <div class="aluguel-header"><div class="aluguel-id">Aluguel #${a.id}</div><div class="status-badge">ATIVO</div></div>
        <div class="aluguel-details">
          <div class="detail-item"><div class="detail-label">CPF</div><div class="detail-value">${a.cpf}</div></div>
          <div class="detail-item"><div class="detail-label">Patins</div><div class="detail-value">${a.patinsId}</div></div>
          <div class="detail-item"><div class="detail-label">Número</div><div class="detail-value">${a.numeroPatins}</div></div>
          <div class="detail-item"><div class="detail-label">Atendente</div><div class="detail-value">${a.atendente || 'N/A'}</div></div>
          <div class="detail-item"><div class="detail-label">Início</div><div class="detail-value">${inicio.toLocaleDateString('pt-BR')} ${inicio.toLocaleTimeString('pt-BR')}</div></div>
          <div class="detail-item"><div class="detail-label">Valor/Hora</div><div class="detail-value">${BRL(st.valorHora)}</div></div>
        </div>
        <div class="tempo-decorrido">
          <div class="small">Tempo Decorrido</div>
          <div class="tempo-valor">${h}h ${m}min</div>
        </div>
        <div class="valor-atual">
          <div class="small">Valor Atual</div>
          <div class="valor-atual-numero">${BRL(valorAtual)}</div>
          <div class="small">(${hCob}h de cobrança)</div>
        </div>`;
      grid.appendChild(card);
    });
    const tempoMedio = ativos.length ? Math.round(tempoTotal/ativos.length) : 0;
    document.getElementById('receitaPrevista').textContent = BRL(receitaPrevista);
    document.getElementById('tempoMedio').textContent = `${tempoMedio}h`;
    if(ativos.length===0){ empty.classList.remove('hidden'); grid.innerHTML=''; } else { empty.classList.add('hidden'); }
  }
  render();
  setInterval(()=>{
    if(document.visibilityState==='visible') render();
  }, 5000);
}

function initDevolucaoPage(){
  initLayout('nav-devolucao');
  const buscar = document.getElementById('buscarAluguel');
  const limpar = document.getElementById('limparDevolucao');
  const selEstado = document.getElementById('estadopatins');
  buscar.addEventListener('click', ()=>{
    const id = document.getElementById('numeropatins').value.trim().toUpperCase();
    const st = loadState();
    const aluguel = st.alugueis.find(a=> a.patinsId===id && a.status==='ativo');
    const box = document.getElementById('aluguelAtivo');
    if(!aluguel){
      msg('mensagemDevolucao','Aluguel não encontrado ou já encerrado.','error');
      box.classList.add('hidden'); return;
    }
    const inicio = parseDateFlex(aluguel.horaInicio);
    const u = currentUser();
    box.classList.remove('hidden');
    box.dataset.aluguelId = String(aluguel.id);
    document.getElementById('dadosAluguelAtivo').innerHTML = `
      <div class="info-item"><div class="small">CPF</div><div>${aluguel.cpf}</div></div>
      <div class="info-item"><div class="small">Patins</div><div>${aluguel.patinsId}</div></div>
      <div class="info-item"><div class="small">Número</div><div>${aluguel.numeroPatins}</div></div>
      <div class="info-item"><div class="small">Início</div><div>${inicio.toLocaleString('pt-BR')}</div></div>
      <div class="info-item"><div class="small">Atendente Inicial</div><div>${aluguel.atendente || 'N/A'}</div></div>
      <div class="info-item"><div class="small">Atendente Atual</div><div>${u.nome}</div></div>`;
    calcularValorTotal();
  });
  selEstado.addEventListener('change', calcularValorTotal);
  document.getElementById('btnEncerrar').addEventListener('click', encerrarAluguel);
  limpar.addEventListener('click', ()=>{
    document.getElementById('numeropatins').value='';
    document.getElementById('aluguelAtivo').classList.add('hidden');
    document.getElementById('dadosAluguelAtivo').innerHTML='';
  });
}
function calcularValorTotal(){
  const st = loadState();
  const box = document.getElementById('aluguelAtivo');
  const id = Number(box?.dataset?.aluguelId || 0);
  const aluguel = st.alugueis.find(a=> a.id===id);
  if(!aluguel) return;
  const inicio = parseDateFlex(aluguel.horaInicio);
  const h = horasParaCobranca(inicio);
  let total = h * st.valorHora;
  const estado = document.getElementById('estadopatins').value;
  if(estado === 'danificado') total += st.taxaDano;
  document.getElementById('valorTotal').innerHTML = `
    <div class="small">Cálculo</div>
    <div>Horas: <b>${h}</b> × ${BRL(st.valorHora)} ${estado==='danificado' ? ` + Taxa (${BRL(st.taxaDano)})` : ''}</div>
    <div style="margin-top:6px"><b>Total: ${BRL(total)}</b></div>`;
}
function encerrarAluguel(){
  const st = loadState();
  const box = document.getElementById('aluguelAtivo');
  const id = Number(box?.dataset?.aluguelId || 0);
  const aluguelIdx = st.alugueis.findIndex(a=> a.id===id);
  if(aluguelIdx<0) return;
  const inicio = parseDateFlex(st.alugueis[aluguelIdx].horaInicio);
  const h = horasParaCobranca(inicio);
  let total = h * st.valorHora;
  const estado = document.getElementById('estadopatins').value;
  const forma = document.getElementById('formapagamento').value;
  if(estado==='danificado') total += st.taxaDano;
  st.alugueis[aluguelIdx] = {...st.alugueis[aluguelIdx], status:'encerrado', horaFim: new Date().toISOString(), valorTotal: total, estadoPatins: estado, formaPagamento: forma};
  st.patins = st.patins.map(p=> p.id===st.alugueis[aluguelIdx].patinsId ? {...p, status:'disponivel'} : p);
  st.caixa[forma] += total;
  saveState(st);
  msg('mensagemDevolucao',`Aluguel #${id} encerrado. Total: ${BRL(total)}`,'success');
  setTimeout(()=> window.location.href='caixa.html', 500);
}

function initCaixaPage(){
  initLayout('nav-caixa');
  function render(){
    const st = loadState();
    const agora = new Date();
    document.getElementById('dataFechamento').textContent = `${agora.toLocaleDateString('pt-BR')} - ${agora.toLocaleTimeString('pt-BR')}`;
    let total = 0; let html = '';
    for(const [k,v] of Object.entries(st.caixa)){
      total += v;
      html += `<div class="row" style="justify-content:space-between;border-bottom:1px dashed var(--border);padding:6px 0"><span>${k[0].toUpperCase()+k.slice(1)}:</span><span>${BRL(v)}</span></div>`;
    }
    document.getElementById('totaisPagamento').innerHTML = html;
    document.getElementById('totalConsolidado').textContent = BRL(total);
  }
  render();
  document.getElementById('btnGerar').addEventListener('click', render);
  document.getElementById('btnConfirmar').addEventListener('click', ()=>{
    const st = loadState();
    st.caixa = {dinheiro:0, cartao:0, pix:0};
    saveState(st);
    msg('mensagemCaixa', 'Fechamento confirmado. Caixa zerado.','success');
    render();
  });
  document.getElementById('btnSalvar').addEventListener('click', ()=>{
    const st = loadState();
    const agora = new Date();
    const nome = `fechamento_${agora.getFullYear()}_${String(agora.getMonth()+1).padStart(2,'0')}_${String(agora.getDate()).padStart(2,'0')}.txt`;
    let txt = `RELATÓRIO DE FECHAMENTO DE CAIXA\nData: ${agora.toLocaleDateString('pt-BR')}\nHora: ${agora.toLocaleTimeString('pt-BR')}\nResponsável: ${currentUser().nome}\n\n`;
    let total = 0;
    for(const [k,v] of Object.entries(st.caixa)){ txt += `${k[0].toUpperCase()+k.slice(1)}: ${BRL(v)}\n`; total+=v; }
    txt+=`\nTOTAL CONSOLIDADO: ${BRL(total)}\n`;
    const blob = new Blob([txt], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nome; a.click(); URL.revokeObjectURL(url);
  });
  document.getElementById('btnEmail').addEventListener('click', ()=>{
    const st = loadState(); let total = 0; for(const v of Object.values(st.caixa)) total += v;
    const agora = new Date();
    const assunto = `Fechamento de Caixa - ${agora.toLocaleDateString('pt-BR')}`;
    const corpo = `Relatório de fechamento de caixa.\nResponsável: ${currentUser().nome}\nTotal do dia: ${BRL(total)}`;
    window.open(`mailto:proprietario@patins.com?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`);
  });
}

/* Expose in global scope */
window.initLoginPage = initLoginPage;
window.initAluguelPage = initAluguelPage;
window.initAtivosPage = initAtivosPage;
window.initDevolucaoPage = initDevolucaoPage;
window.initCaixaPage = initCaixaPage;
window.logout = logout;
