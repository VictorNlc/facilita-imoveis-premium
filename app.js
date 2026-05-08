// ===== NAVBAR SCROLL =====
window.addEventListener('scroll',()=>{
  const nb=document.getElementById('navbar');
  const bt=document.getElementById('backToTop');
  if(nb) {
    if(window.scrollY > 60) {
      nb.classList.add('navbar--scrolled');
      nb.classList.remove('navbar--top');
    } else {
      nb.classList.add('navbar--top');
      nb.classList.remove('navbar--scrolled');
    }
  }
  if(bt) {
    if(window.scrollY > 400) bt.classList.add('show');
    else bt.classList.remove('show');
  }
});

function toggleMenu(){
  const nl=document.getElementById('navLinks');
  if(nl) nl.classList.toggle('open');
}

function scrollToTop(){window.scrollTo({top:0,behavior:'smooth'})}

// ===== SEARCH TABS =====
let searchMode='comprar';
function setTab(btn,mode){
  document.querySelectorAll('.s-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  searchMode=mode;
}

function buscar(){
  const tipo=document.getElementById('tipo-imovel')?.value||'';
  const bairro=document.getElementById('bairro')?.value||'';
  const preco=document.getElementById('preco')?.value||'';
  
  if(searchMode==='alugar'){
    window.location.href=`locacao.html?tipo=${encodeURIComponent(tipo)}&bairro=${encodeURIComponent(bairro)}&preco=${encodeURIComponent(preco)}`;
  } else {
    window.location.href=`vendas.html?tipo=${encodeURIComponent(tipo)}&bairro=${encodeURIComponent(bairro)}&preco=${encodeURIComponent(preco)}`;
  }
}

// ===== COUNTER ANIMATION =====
function animateCounters(){
  document.querySelectorAll('.stat-num').forEach(el=>{
    const target=parseInt(el.dataset.target)||0;
    const dur=2000;
    const step=target/60;
    let cur=0;
    const t=setInterval(()=>{
      cur=Math.min(cur+step,target);
      el.textContent=Math.floor(cur).toLocaleString('pt-BR');
      if(cur>=target)clearInterval(t);
    },dur/60);
  });
}
const statsObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){animateCounters();statsObs.disconnect()}});
},{threshold:0.5});
const heroEl=document.querySelector('.hero');
const statsEl=document.querySelector('.stats-bar');
if(heroEl)statsObs.observe(heroEl);
if(statsEl)statsObs.observe(statsEl);

// ===== FORMAT CURRENCY =====
function fmt(v){
  return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0,maximumFractionDigits:0});
}

// ===== FAVORITOS (LOCALSTORAGE) =====
function getFavs() {
  return JSON.parse(localStorage.getItem('facilitaFavs')) || [];
}

function saveFavs(favs) {
  localStorage.setItem('facilitaFavs', JSON.stringify(favs));
  updateFavBadge();
}

function toggleFav(id, el){
  let favs = getFavs();
  const icon = el.querySelector('i');
  
  if(favs.includes(id)) {
    // Remover
    favs = favs.filter(f => f !== id);
    el.classList.remove('saved');
    icon.classList.remove('fa-solid');
    icon.classList.add('fa-regular');
  } else {
    // Adicionar
    favs.push(id);
    el.classList.add('saved');
    icon.classList.remove('fa-regular');
    icon.classList.add('fa-solid');
  }
  saveFavs(favs);
}

function updateFavBadge() {
  const count = getFavs().length;
  // Se quiser adicionar um badge de notificação no menu depois
}

// ===== RENDER PROPERTY CARDS =====
function renderCards(items,gridId,mode){
  const grid=document.getElementById(gridId);
  if(!grid)return;
  
  const favs = getFavs();
  
  grid.innerHTML=items.map(im=>{
    const isFav = favs.includes(im.id);
    const favClass = isFav ? 'saved' : '';
    const favIcon = isFav ? 'fa-solid' : 'fa-regular';
    const badgeClass=mode==='venda'?'badge-venda':'badge-aluguel';
    const badgeText=mode==='venda'?'Venda':'Aluguel';
    const priceLabel=mode==='aluguel'?'/mês':'';

    return `
      <div class="prop-card">
        <div class="prop-img">
          <img src="${im.img}" alt="${im.titulo}" loading="lazy">
          <span class="prop-badge ${badgeClass}">${badgeText}</span>
          <button class="prop-save ${favClass}" onclick="toggleFav(${im.id}, this)" title="Salvar imóvel">
            <i class="${favIcon} fa-heart"></i>
          </button>
        </div>
        <div class="prop-body">
          <div class="prop-type">${im.tipo}</div>
          <h3 class="prop-title">${im.titulo}</h3>
          <div class="prop-loc"><i class="fa-solid fa-location-dot"></i> ${im.bairro}, Taquara/RS</div>
          
          <div class="prop-feats">
            ${im.quartos>0?`<div class="prop-feat"><i class="fa-solid fa-bed"></i> ${im.quartos}</div>`:''}
            ${im.banheiros>0?`<div class="prop-feat"><i class="fa-solid fa-shower"></i> ${im.banheiros}</div>`:''}
            ${im.area?`<div class="prop-feat"><i class="fa-solid fa-ruler-combined"></i> ${im.area}</div>`:''}
          </div>
          
          <div class="prop-footer">
            <div class="prop-price">
              ${fmt(im.preco)}
              ${priceLabel?`<small>${priceLabel}</small>`:''}
            </div>
            <a href="detalhes.html?id=${im.id}&modo=${mode}" class="btn btn-outline btn-sm">Ver Detalhes</a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Init cards home
const vendasGrid=document.getElementById('vendas-grid');
if(vendasGrid && typeof vendas!=='undefined') renderCards(vendas.slice(0,6),'vendas-grid','venda');

// ===== MAPA LEAFLET INTERATIVO =====
let mapInstance = null;
let markers = [];

function toggleView(viewType) {
  const grid = document.querySelector('.props-grid');
  const mapCont = document.getElementById('map-view');
  const btns = document.querySelectorAll('.v-btn');
  
  btns.forEach(b => b.classList.remove('active'));
  
  if(viewType === 'grid') {
    btns[0].classList.add('active');
    grid.style.display = 'grid';
    if(mapCont) mapCont.style.display = 'none';
  } else {
    btns[1].classList.add('active');
    grid.style.display = 'none';
    if(mapCont) {
      mapCont.style.display = 'block';
      if(mapInstance) {
        mapInstance.invalidateSize(); // Fix leafet render issue when hidden
      } else {
        initMap();
      }
    }
  }
}

function initMap() {
  if(typeof L === 'undefined') return;
  // Centro de Taquara
  mapInstance = L.map('map-view').setView([-29.6500, -50.7800], 14);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap & CartoDB'
  }).addTo(mapInstance);
}

function updateMapMarkers(items, mode) {
  if(!mapInstance) return;
  
  // Limpar markers
  markers.forEach(m => mapInstance.removeLayer(m));
  markers = [];
  
  items.forEach(im => {
    if(im.lat && im.lng) {
      const priceLabel=mode==='aluguel'?'/mês':'';
      const m = L.marker([im.lat, im.lng]).addTo(mapInstance);
      m.bindPopup(`
        <div style="width:200px">
          <img src="${im.img}" style="width:100%;height:120px;object-fit:cover;border-radius:4px;margin-bottom:8px">
          <strong style="display:block;font-size:1rem;color:#1a5c35">${fmt(im.preco)}${priceLabel}</strong>
          <span style="display:block;font-size:0.8rem">${im.titulo}</span>
          <a href="detalhes.html?id=${im.id}&modo=${mode}" style="display:block;margin-top:8px;color:#c9a84c;font-weight:bold;text-decoration:none">Ver Detalhes</a>
        </div>
      `);
      markers.push(m);
    }
  });
}


// ===== SIMULADOR =====
function updateEntrada(){
  const v=document.getElementById('sim-entrada')?.value;
  const lbl=document.getElementById('entrada-label');
  if(lbl) lbl.textContent=v+'%';
}

function parseMoeda(str){
  return parseFloat(str.replace(/[^\d,]/g,'').replace(',','.')) || 0;
}

function simular(){
  const valorStr=document.getElementById('sim-valor')?.value||'300000';
  const valor=parseMoeda(valorStr)||300000;
  const pct=parseInt(document.getElementById('sim-entrada')?.value||20)/100;
  const prazo=parseInt(document.getElementById('sim-prazo')?.value||240);
  const taxaAnual=parseFloat(document.getElementById('sim-taxa')?.value||9.5)/100;
  
  const taxa = Math.pow(1 + taxaAnual, 1/12) - 1;
  const entrada=valor*pct;
  const financiado=valor-entrada;
  
  const parcela=financiado>0&&taxa>0
    ?(financiado*taxa*Math.pow(1+taxa,prazo))/(Math.pow(1+taxa,prazo)-1)
    :financiado/prazo;

  const fmtFull=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const setEl=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
  
  setEl('res-entrada',fmtFull(entrada));
  setEl('res-financiado',fmtFull(financiado));
  setEl('res-parcela',fmtFull(parcela));
}

const simValor=document.getElementById('sim-valor');
if(simValor){
  simValor.addEventListener('blur',()=>{
    const n=parseMoeda(simValor.value)||300000;
    simValor.value=n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
    simular();
  });
}
simular();

document.getElementById('sim-entrada')?.addEventListener('input', () => {
  updateEntrada();
  simular();
});
document.getElementById('sim-prazo')?.addEventListener('change', simular);
document.getElementById('sim-taxa')?.addEventListener('input', simular);


// ===== CONTACT FORMS =====
function enviarMensagem(e){
  e.preventDefault();
  const nome=document.getElementById('nome')?.value||'';
  const telefone=document.getElementById('telefone')?.value||'';
  const interesse=document.getElementById('interesse')?.value||'';
  const mensagem=document.getElementById('mensagem')?.value||'';
  const msg=`Olá! Meu nome é ${nome}.%0AInteresse: ${interesse}%0ATelefone: ${telefone}%0AMensagem: ${mensagem}`;
  window.open(`https://api.whatsapp.com/send/?phone=5198936637&text=${msg}`,'_blank');
  document.getElementById('contactForm')?.reset();
  const successEl = document.getElementById('form-success');
  if(successEl) {
    successEl.style.display='block';
    setTimeout(()=>{successEl.style.display='none';},5000);
  }
}

// Lead Magnet
function enviarAvaliacao(e){
  e.preventDefault();
  const end=document.getElementById('lm-end')?.value||'';
  const tel=document.getElementById('lm-tel')?.value||'';
  const msg=`Olá! Gostaria de receber uma avaliação gratuita do meu imóvel.%0AEndereço: ${end}%0ATelefone: ${tel}`;
  window.open(`https://api.whatsapp.com/send/?phone=5198936637&text=${msg}`,'_blank');
}

// ===== FAQ =====
function toggleFaq(el){
  el.classList.toggle('open');
}
