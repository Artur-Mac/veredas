let activeModal = null;
let previousFocus = null;
let investigationTimer;
let selectedProperty = 'solar';
const input = document.getElementById('targetUrlInput');

function navTo(screenId) {
  const target = document.getElementById(screenId);
  if (!target) return;
  clearTimeout(investigationTimer);
  document.querySelectorAll('.app-screen').forEach(s => { s.classList.toggle('active', s === target); });
  const tabs = {'screen-home':'home','screen-dossier':'dossier','screen-loading':'home','screen-checklist':'checklist','screen-compare':'compare','screen-saved':'saved','screen-pauliceia':'dossier'};
  document.querySelectorAll('.nav-tab').forEach(t => {
    const active = t.id === `tab-${tabs[screenId]}`;
    t.classList.toggle('active', active);
    if (active) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  });
  document.getElementById('appContextBadge').textContent = {'screen-home':'São Paulo','screen-dossier':'Solar dos Franceses','screen-pauliceia':'Pauliceia','screen-checklist':'Sua vistoria','screen-compare':'Comparação','screen-saved':'Minha busca','screen-loading':'Análise do imóvel'}[screenId];
  document.querySelector('.skip-link').href = `#${screenId}`;
  target.setAttribute('tabindex', '-1');
  target.scrollTop = 0;
  target.focus({preventScroll:true});
  window.scrollTo({top:0, behavior:'instant'});
}
function runInvestigation() {
  const error = document.getElementById('inputError');
  let valid = false;
  try { const url = new URL(input.value.trim()); valid = ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.'); } catch {}
  error.hidden = valid;
  input.setAttribute('aria-invalid', String(!valid));
  if (!valid) { error.textContent = 'Cole um link completo, começando com https://, ou selecione “Preencher link”.'; input.focus(); return; }
  navTo('screen-loading');
  // This is a prototype transition, not progress for a remote data request.
  document.getElementById('telemetryProgressBar').style.width = '100%';
  investigationTimer = setTimeout(() => { selectedProperty = 'solar'; navTo('screen-dossier'); }, 900);
}
function viewProperty(key) { selectedProperty = key; navTo(key === 'pauliceia' ? 'screen-pauliceia' : 'screen-dossier'); }
function loadSampleLink() {
  input.value = 'https://quintoandar.com.br/imovel/894120-rua-bela-cintra';
  input.removeAttribute('aria-invalid'); document.getElementById('inputError').hidden = true; input.focus();
}
function openModal(id) {
  if (activeModal) closeModal(activeModal.id);
  previousFocus = document.activeElement;
  activeModal = document.getElementById(id);
  activeModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.querySelectorAll('.device-shell > :not(.modal-backdrop)').forEach(e => e.inert = true);
  const dialog = activeModal.querySelector('[role="dialog"]');
  const heading = dialog.querySelector('h3'); heading.id ||= `${id}Title`; dialog.setAttribute('aria-labelledby', heading.id);
  dialog.focus();
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open'); activeModal = null;
  document.body.style.overflow = '';
  document.querySelectorAll('.device-shell > :not(.modal-backdrop)').forEach(e => e.inert = false);
  previousFocus?.focus();
}
function closeOnBackdrop(e, id) { if (e.target.id === id) closeModal(id); }
document.addEventListener('keydown', e => {
  if (activeModal) {
    if (e.key === 'Escape') { e.preventDefault(); closeModal(activeModal.id); return; }
    if (e.key === 'Tab') {
      const focusable = [...activeModal.querySelectorAll('button, a[href], input, [tabindex="0"]')].filter(el => !el.disabled);
      const first = focusable[0], last = focusable.at(-1);
      if (e.shiftKey && (document.activeElement === first || document.activeElement.getAttribute('role') === 'dialog')) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"]')) { e.preventDefault(); e.target.click(); }
  if (e.key === 'Enter' && e.target === input) runInvestigation();
});
function handleChecklistUpdate() {
  const checks = [...document.querySelectorAll('#screen-checklist input[type="checkbox"]')];
  const count = checks.filter(c => c.checked).length;
  document.getElementById('checklistProgressText').textContent = `${count} de ${checks.length} checados (${Math.round(count / checks.length * 100)}%)`;
  try { localStorage.setItem('vereda-impeccable-checklist', JSON.stringify(checks.map(c => c.checked))); } catch {}
}
async function copyWhatsAppPayload() {
  const label = document.getElementById('btnCopyLabel');
  const payload = document.getElementById('messagePayload');
  try { await navigator.clipboard.writeText((payload.innerText || payload.textContent).trim()); label.textContent = 'Mensagem copiada'; }
  catch {
    label.textContent = 'Selecione a mensagem e copie com Ctrl+C';
    const range = document.createRange(); range.selectNodeContents(payload);
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
  }
}
document.querySelectorAll('svg').forEach(svg => { if (!svg.closest('.chart-container')) svg.setAttribute('aria-hidden', 'true'); });
document.getElementById('checklistProgressText').setAttribute('aria-live', 'polite');
try {
  const saved = JSON.parse(localStorage.getItem('vereda-impeccable-checklist'));
  if (Array.isArray(saved)) document.querySelectorAll('#screen-checklist input[type="checkbox"]').forEach((c,i) => { c.checked = saved[i] === true; });
} catch {}
handleChecklistUpdate();
document.getElementById('tab-home').setAttribute('aria-current', 'page');
