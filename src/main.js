const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const config = {
  demoMode: import.meta.env?.VITE_DEMO_MODE !== 'false',
  url: import.meta.env?.VITE_TIDECLOAK_URL,
  realm: import.meta.env?.VITE_TIDECLOAK_REALM,
  clientId: import.meta.env?.VITE_TIDECLOAK_CLIENT_ID,
};

let iam = null;
let ttlTimer = null;
let approvals = new Set();
let scenario = 'standard';

const scenarios = {
  standard: {
    title: 'Routine traffic investigation', camera: 'A', ticket: 'INC-2026-001',
    user: 'Maya Le', role: 'Security operator', initials: 'ML', button: 'Request scoped access',
  },
  denied: {
    title: 'Restricted command-zone request', camera: 'B', ticket: 'INC-2026-002',
    user: 'Maya Le', role: 'Security operator', initials: 'ML', button: 'Test policy boundary',
  },
  override: {
    title: 'Administrative force-unlock attempt', camera: 'B', ticket: 'OVR-2026-004',
    user: 'Alex Morgan', role: 'System administrator', initials: 'AM', button: 'Force unlock all cameras',
  },
};

function flash(message, tone = '') {
  const toast = $('#toast');
  toast.textContent = message;
  toast.className = `toast show ${tone}`;
  setTimeout(() => toast.className = 'toast', 3400);
}

function setBadge(text, tone) {
  $('#request-state').textContent = text;
  $('#request-state').className = `micro-badge ${tone}`;
}

function addAudit(title, detail, tone = '') {
  const now = new Date();
  const time = now.toLocaleTimeString('en-GB', { hour12: false });
  const seed = `${title}${detail}${now.getTime()}`;
  let hash = 0;
  for (const char of seed) hash = ((hash << 5) - hash + char.charCodeAt(0)) >>> 0;
  const row = document.createElement('div');
  row.className = 'audit-row new';
  row.innerHTML = `<time>${time}</time><span class="event-dot ${tone}"></span><p><b>${title}</b><small>${detail}</small></p><code>${hash.toString(16).padStart(8, '0')}…seal</code>`;
  $('#audit-list').prepend(row);
}

function resetView() {
  clearInterval(ttlTimer);
  $('#video').classList.add('encrypted-view');
  $('#video').classList.remove('denied-view');
  $('#video-lock').innerHTML = '<div class="lock-glyph">⌁</div><b>Encrypted at source</b><span>Waiting for scoped decryption authority</span>';
  $('#key-value').textContent = 'No key material issued';
  $('#ttl').textContent = '—';
  setBadge('Draft', 'neutral');
  approvals = new Set();
  $$('.approvers button').forEach((button) => button.classList.remove('approved'));
  updateMeter();
}

function selectScenario(name) {
  scenario = name;
  resetView();
  const data = scenarios[name];
  $$('.scenario').forEach((button) => button.classList.toggle('active', button.dataset.scenario === name));
  $('#scenario-title').textContent = data.title;
  $('#camera').value = data.camera;
  $('#ticket').value = data.ticket;
  $('#user-name').textContent = data.user;
  $('#user-role').textContent = data.role;
  $('#operator').value = `${data.user} · ${data.role}`;
  $('#avatar').textContent = data.initials;
  $('#request-btn').innerHTML = `${data.button} <span>→</span>`;
  const restricted = data.camera === 'B';
  $('#camera-name').textContent = restricted ? 'ZONE B · CIVIC COMMAND' : 'ZONE A · MARKET SQUARE';
  $('#acl-copy').textContent = restricted ? `${data.role} → no Zone B scope` : 'Traffic Ops → Zone A';
  $('#check-acl').textContent = restricted ? '×' : '✓';
  $('#check-acl').className = restricted ? 'check fail' : 'check';
  $('#check-quorum').textContent = name === 'override' ? '!' : '—';
  $('#check-quorum').className = name === 'override' ? 'check pending' : 'check muted';
  $('#quorum-copy').textContent = name === 'override' ? '2 of 3 independent signatures' : 'Not required for standard zone';
}

function grantAccess(label = 'Policy approved') {
  $('#video').classList.remove('encrypted-view', 'denied-view');
  $('#video-lock').innerHTML = '<div class="access-seal">✓</div><b>Scoped view unlocked</b><span>Local decryption · synthetic stream</span>';
  $('#key-value').textContent = 'epk_zone-a_7F2A · DPoP bound';
  setBadge('Granted', 'success');
  let remaining = 15 * 60;
  const tick = () => {
    const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
    const seconds = String(remaining % 60).padStart(2, '0');
    $('#ttl').textContent = `${minutes}:${seconds}`;
    if (remaining-- <= 0) resetView();
  };
  tick(); ttlTimer = setInterval(tick, 1000);
  addAudit(label, `${$('#ticket').value} · ${$('#camera-name').textContent} · 15m ephemeral key`, 'green');
  flash('Ephemeral key issued for this camera and device only.', 'success');
}

function denyAccess() {
  $('#video').classList.add('denied-view');
  $('#video-lock').innerHTML = '<div class="deny-seal">×</div><b>Access denied</b><span>Identity is valid · camera scope is not</span>';
  $('#key-value').textContent = 'Key release refused by policy';
  setBadge('Denied', 'danger');
  addAudit('Scoped access denied', `${$('#ticket').value} · ACL mismatch · no key issued`, 'red');
  flash('Denied: this identity has no Zone B camera scope.', 'danger');
}

function openQuorum() {
  setBadge('Pending', 'warning');
  addAudit('Admin override captured', `${$('#ticket').value} · force unlock blocked · 0/2 approvals`, 'amber');
  $('#quorum-modal').classList.add('open');
  $('#quorum-modal').setAttribute('aria-hidden', 'false');
  $('.modal-close').focus();
}

function closeQuorum() {
  $('#quorum-modal').classList.remove('open');
  $('#quorum-modal').setAttribute('aria-hidden', 'true');
}

function updateMeter() {
  const count = approvals.size;
  $('#meter-count').textContent = `${count} of 2 approvals`;
  $('#meter-fill').style.width = `${Math.min(count / 2, 1) * 100}%`;
  const button = $('#attempt-unlock');
  button.disabled = count < 2;
  button.textContent = count < 2 ? 'Denied · waiting for other admins' : 'Other admins approved · issue scoped key';
}

async function initTideCloak() {
  if (config.demoMode || !config.url || !config.realm || !config.clientId) return;
  try {
    const { IAMService } = await import('@tidecloak/js');
    iam = new IAMService();
    await iam.initIAM({ url: config.url, realm: config.realm, clientId: config.clientId });
    $('#auth-state').innerHTML = '<span class="status-dot"></span> TideCloak connected';
    $('#login-btn').textContent = 'Sign in';
  } catch (error) {
    console.error('TideCloak initialization failed', error);
    flash('Live realm unavailable. The self-contained demo remains active.', 'danger');
  }
}

$('#login-btn').addEventListener('click', async () => {
  if (iam?.login) await iam.login();
  else flash('Demo realm active. Add .env credentials to connect a live TideCloak realm.');
});

$$('.scenario').forEach((button) => button.addEventListener('click', () => selectScenario(button.dataset.scenario)));
$('#camera').addEventListener('change', (event) => selectScenario(event.target.value === 'B' ? 'denied' : 'standard'));
$('#request-btn').addEventListener('click', () => {
  if (!$('#ticket').value.trim()) {
    $('#check-purpose').className = 'check fail'; $('#check-purpose').textContent = '×';
    flash('An incident ticket is required by policy.', 'danger'); return;
  }
  setBadge('Evaluating', 'warning');
  $('#request-btn').disabled = true;
  setTimeout(() => {
    $('#request-btn').disabled = false;
    if (scenario === 'standard') grantAccess();
    else if (scenario === 'denied') denyAccess();
    else openQuorum();
  }, 650);
});
$('#reset-btn').addEventListener('click', () => selectScenario(scenario));
$('#modal-close').addEventListener('click', closeQuorum);
$('.modal-backdrop').addEventListener('click', closeQuorum);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeQuorum(); });

$$('.approvers button').forEach((button) => button.addEventListener('click', () => {
  const name = button.dataset.approver;
  if (approvals.has(name)) approvals.delete(name); else approvals.add(name);
  button.classList.toggle('approved', approvals.has(name));
  button.querySelector('i').textContent = approvals.has(name) ? 'Remote signature received ✓' : 'Simulate remote approval';
  addAudit(approvals.has(name) ? 'Quorum signature recorded' : 'Quorum signature withdrawn', `${name} · request ${$('#ticket').value}`, approvals.has(name) ? 'blue' : '');
  updateMeter();
}));

$('#attempt-unlock').addEventListener('click', () => {
  if (approvals.size < 2) return;
  closeQuorum();
  $('#camera-name').textContent = 'ZONE B · CIVIC COMMAND';
  grantAccess('Quorum-authorized access');
  $('#key-value').textContent = 'epk_zone-b_QEA9 · 2/3 sealed';
});

setInterval(() => {
  $('#timestamp').textContent = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(',', '') + ' ICT';
}, 1000);

selectScenario('standard');
initTideCloak();

function runGuidedTour() {
  const caption = $('#tour-caption');
  const steps = [
    { at: 0, no: '01', title: 'The possibility', copy: 'CivicShield gives investigators useful CCTV access without giving any administrator, cloud, or vendor a master key.', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { at: 12, no: '02', title: 'The trust constraint', copy: 'Today, one privileged account can bypass policy and expose an entire city. That makes centralised surveillance too powerful to trust.', action: () => $('#workspace').scrollIntoView({ behavior: 'smooth', block: 'start' }) },
    { at: 24, no: '03', title: 'Authorized access', copy: 'Maya presents an OIDC identity, incident purpose, Zone A scope, and a DPoP device proof. All four conditions align.', action: () => selectScenario('standard') },
    { at: 32, no: '04', title: 'A key for one context', copy: 'TideCloak releases a 15-minute ephemeral key bound to this camera and this device. The cloud still holds only ciphertext.', action: () => $('#request-btn').click() },
    { at: 45, no: '05', title: 'Scope beats privilege', copy: 'The same authenticated operator requests restricted Zone B. Authentication alone is not authority.', action: () => selectScenario('denied') },
    { at: 52, no: '06', title: 'No key is released', copy: 'The camera ACL fails, access is denied, and the attempted request becomes a sealed audit event.', action: () => $('#request-btn').click() },
    { at: 64, no: '07', title: 'The god-mode test', copy: 'A system administrator tries to force-unlock all cameras. In a conventional system, this is where policy can be bypassed.', action: () => selectScenario('override') },
    { at: 71, no: '08', title: 'TideCloak denies unilateral control', copy: 'The requesting administrator cannot approve their own override. Two other admins must respond from separate TideCloak sessions.', action: () => $('#request-btn').click() },
    { at: 80, no: '09', title: 'One remote approval is not enough', copy: 'The Security Director approves from their own device. The requesting admin remains blocked because the threshold is not met.', action: () => $$('.approvers button')[0].click() },
    { at: 88, no: '10', title: 'A second admin completes quorum', copy: 'Civil Oversight independently approves from another session. Only now may the requesting admin issue one scoped key.', action: () => $$('.approvers button')[1].click() },
    { at: 96, no: '11', title: 'Scoped access, never global power', copy: 'The quorum can issue one temporary Zone B key. Every signature and key release is recorded.', action: () => $('#attempt-unlock').click() },
    { at: 104, no: '12', title: 'Accountability by default', copy: 'The event chain preserves approvals, denials, and access windows. An override attempt cannot disappear inside an admin console.', action: () => $('#audit').scrollIntoView({ behavior: 'smooth', block: 'center' }) },
    { at: 114, no: '13', title: 'What changes', copy: 'With TideCloak, the city can protect people without asking them to blindly trust whoever holds the master password.', action: () => document.querySelector('.closing').scrollIntoView({ behavior: 'smooth', block: 'center' }) },
  ];
  document.body.classList.add('tour-mode');
  caption.classList.add('show');
  steps.forEach((step) => setTimeout(() => {
    $('#tour-step').textContent = step.no;
    $('#tour-title').textContent = step.title;
    $('#tour-copy').textContent = step.copy;
    step.action();
  }, step.at * 1000));
  setTimeout(() => caption.classList.remove('show'), 119500);
}

if (new URLSearchParams(location.search).get('tour') === '1') setTimeout(runGuidedTour, 800);
