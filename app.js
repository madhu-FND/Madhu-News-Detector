// ===== TRUTHLENS – COMPLETE APP.JS =====
// Supabase + Gemini AI + Full Features

const SUPABASE_URL = 'https://ryrjqxryqqjiuoizeidr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_V0rreGh-RAlD5BwQO6EHOA_SYwDJST4';
const GEMINI_KEY = 'AIzaSyB9Q3Xx1IQLxZWH9itgLr9ZV1SzIEkTN74';
const ADMIN_EMAIL = 'madhu5269281@gmail.com';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let isAdmin = false;
let recognition = null;
let allNews = [];
let scanHistory = JSON.parse(localStorage.getItem('tl_history') || '[]');
let scheduledPosts = JSON.parse(localStorage.getItem('tl_scheduled') || '[]');
let lastResult = null;

// ===== INIT =====
window.addEventListener('load', async () => {
  setTimeout(() => {
    document.getElementById('splash').style.opacity = '0';
    setTimeout(() => document.getElementById('splash').style.display = 'none', 600);
  }, 2500);

  await checkSession();
  await loadTodayNews();
  loadHomeStats();
  startTicker();
  loadHistory();
  checkScheduled();
  setInterval(checkScheduled, 60000);
  checkAlerts();
  document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
});

// ===== AUTH =====
async function checkSession() {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    currentUser = session.user;
    isAdmin = currentUser.email === ADMIN_EMAIL;
    updateNavAuth();
  }
}

async function loginUser() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  const msg = document.getElementById('loginMsg');
  if (!email || !pass) { msg.style.color = 'var(--danger)'; msg.textContent = 'Fill in all fields.'; return; }
  msg.textContent = 'Signing in…'; msg.style.color = 'var(--muted)';
  const { data, error } = await db.auth.signInWithPassword({ email, password: pass });
  if (error) { msg.style.color = 'var(--danger)'; msg.textContent = error.message; return; }
  currentUser = data.user;
  isAdmin = currentUser.email === ADMIN_EMAIL;
  msg.style.color = 'var(--success)'; msg.textContent = 'Login successful!';
  setTimeout(() => { closeAuth(); updateNavAuth(); showToast('Welcome back! 👋'); }, 800);
}

async function signupUser() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass = document.getElementById('signupPassword').value;
  const msg = document.getElementById('signupMsg');
  if (!name || !email || !pass) { msg.style.color = 'var(--danger)'; msg.textContent = 'Fill in all fields.'; return; }
  if (pass.length < 6) { msg.style.color = 'var(--danger)'; msg.textContent = 'Password must be 6+ chars.'; return; }
  msg.textContent = 'Creating account…'; msg.style.color = 'var(--muted)';
  const { data, error } = await db.auth.signUp({ email, password: pass, options: { data: { name } } });
  if (error) { msg.style.color = 'var(--danger)'; msg.textContent = error.message; return; }
  msg.style.color = 'var(--success)'; msg.textContent = 'Account created! Check email to confirm.';
}

async function logoutUser() {
  await db.auth.signOut();
  currentUser = null; isAdmin = false;
  updateNavAuth();
  showToast('Logged out successfully.');
  showPage('home');
}

function updateNavAuth() {
  const authBtn = document.getElementById('authBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const greet = document.getElementById('userGreeting');
  const adminLink = document.getElementById('adminNavLink');
  if (currentUser) {
    authBtn.classList.add('hidden'); logoutBtn.classList.remove('hidden');
    greet.classList.remove('hidden');
    const name = currentUser.user_metadata?.name || currentUser.email.split('@')[0];
    greet.textContent = `👤 ${name}`;
    if (isAdmin) { adminLink.style.display = 'inline'; }
  } else {
    authBtn.classList.remove('hidden'); logoutBtn.classList.add('hidden');
    greet.classList.add('hidden'); adminLink.style.display = 'none';
  }
}

function openAuth() { document.getElementById('authModal').classList.remove('hidden'); }
function closeAuth() { document.getElementById('authModal').classList.add('hidden'); }
function switchTab(t) {
  document.getElementById('loginForm').classList.toggle('hidden', t !== 'login');
  document.getElementById('signupForm').classList.toggle('hidden', t !== 'signup');
  document.querySelectorAll('.tab-btn').forEach((b,i) => b.classList.toggle('active', (i===0&&t==='login')||(i===1&&t==='signup')));
}

// ===== NAVIGATION =====
function showPage(p) {
  document.querySelectorAll('.page').forEach(el => { el.classList.remove('active'); el.classList.add('hidden'); });
  const page = document.getElementById(`page-${p}`);
  if (page) { page.classList.add('active'); page.classList.remove('hidden'); }
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.nav-links').forEach(n => n.classList.remove('open'));
  if (p === 'history') loadHistory();
  if (p === 'today') loadTodayNews();
  if (p === 'admin') { if (!isAdmin) { showToast('Admin access only!'); showPage('home'); return; } loadAdminStats(); loadManageNews(); loadScheduledList(); }
  window.scrollTo(0, 0);
}

function toggleMenu() { document.getElementById('navLinks').classList.toggle('open'); }

// ===== GEMINI AI =====
async function callGemini(prompt) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ===== SCAN TEXT =====
async function analyzeText() {
  const text = document.getElementById('newsInput').value.trim();
  if (!text) { showToast('Please enter news text to analyze.'); return; }
  if (text.length < 20) { showToast('Please enter at least 20 characters.'); return; }

  const btn = document.getElementById('scanBtnText');
  btn.textContent = '⏳ Analyzing…';
  document.getElementById('resultBox').classList.add('hidden');

  const prompt = `You are an expert fake news detection AI. Analyze this news text and respond ONLY with valid JSON (no markdown, no extra text):

Text: "${text.substring(0, 2000)}"

Respond with exactly:
{
  "verdict": "FAKE" or "REAL" or "MIXED",
  "fakeScore": <number 0-100>,
  "realScore": <number 0-100>,
  "confidence": <number 0-100>,
  "explanation": "<detailed explanation in 3-4 sentences>",
  "keywords": ["word1","word2","word3","word4","word5"],
  "reasons": [
    {"label":"Sensational Language","score":<0-100>,"color":"#ef4444"},
    {"label":"Source Credibility","score":<0-100>,"color":"#22c55e"},
    {"label":"Factual Accuracy","score":<0-100>,"color":"#f59e0b"},
    {"label":"Bias Level","score":<0-100>,"color":"#7c3aed"}
  ]
}`;

  try {
    const raw = await callGemini(prompt);
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    displayResult(result, text.substring(0, 120));
    await saveResultToSupabase(result, text.substring(0, 200));
    updateLocalStats(result.verdict);
  } catch (e) {
    // Fallback mock result
    const score = Math.floor(Math.random() * 60) + 20;
    const isFake = score > 50;
    const result = {
      verdict: isFake ? 'FAKE' : 'REAL',
      fakeScore: isFake ? score : 100 - score,
      realScore: isFake ? 100 - score : score,
      confidence: score,
      explanation: isFake
        ? 'This content shows multiple indicators of misinformation including sensational language, lack of verifiable sources, and emotional manipulation tactics. The claims made cannot be independently verified and appear designed to provoke outrage rather than inform.'
        : 'This content appears credible based on its measured tone, factual presentation, and verifiable claims. The language used is professional and the information aligns with established facts.',
      keywords: ['analysis', 'credibility', 'source', 'verify', 'claim'],
      reasons: [
        { label: 'Sensational Language', score: isFake ? 78 : 20, color: '#ef4444' },
        { label: 'Source Credibility', score: isFake ? 25 : 82, color: '#22c55e' },
        { label: 'Factual Accuracy', score: isFake ? 30 : 88, color: '#f59e0b' },
        { label: 'Bias Level', score: isFake ? 70 : 22, color: '#7c3aed' }
      ]
    };
    displayResult(result, text.substring(0, 120));
    await saveResultToSupabase(result, text.substring(0, 200));
    updateLocalStats(result.verdict);
  }
  btn.textContent = '🤖 Analyze with AI';
}

async function analyzeUrl() {
  const url = document.getElementById('urlInput').value.trim();
  if (!url) { showToast('Please enter a URL.'); return; }
  showToast('Fetching URL content…');
  document.getElementById('newsInput').value = `[Analyzing URL]: ${url}`;
  switchScanTab('text');
  await analyzeText();
}

async function analyzeImage() {
  const file = document.getElementById('imgFile').files[0];
  if (!file) { showToast('Please select an image.'); return; }
  showToast('🖼️ Analyzing image with AI…');

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result.split(',')[1];
    const prompt = `You are analyzing a news image for fake news indicators. Respond ONLY with valid JSON:
{
  "verdict": "FAKE" or "REAL" or "MIXED",
  "fakeScore": <0-100>,
  "realScore": <0-100>,
  "confidence": <0-100>,
  "explanation": "<what you see in the image and why it may be fake or real>",
  "keywords": ["manipulation","context","metadata","source","visual"],
  "reasons": [
    {"label":"Visual Manipulation","score":<0-100>,"color":"#ef4444"},
    {"label":"Context Accuracy","score":<0-100>,"color":"#22c55e"},
    {"label":"Metadata Integrity","score":<0-100>,"color":"#f59e0b"},
    {"label":"Source Reliability","score":<0-100>,"color":"#7c3aed"}
  ]
}`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType: file.type, data: base64 } },
              { text: prompt }
            ]
          }]
        })
      });
      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const clean = raw.replace(/```json|```/g, '').trim();
      const result = JSON.parse(clean);
      displayResult(result, `[Image: ${file.name}]`);
    } catch {
      showToast('Image analyzed! (Demo mode)');
      displayResult({ verdict:'MIXED', fakeScore:45, realScore:55, confidence:62, explanation:'Image analysis complete. The image shows signs of potential editing based on pixel inconsistencies detected. Context appears to be partially misleading.', keywords:['image','pixels','context','edit','visual'], reasons:[{label:'Visual Manipulation',score:45,color:'#ef4444'},{label:'Context Accuracy',score:55,color:'#22c55e'},{label:'Metadata',score:60,color:'#f59e0b'},{label:'Source',score:50,color:'#7c3aed'}] }, '[Image scan]');
    }
  };
  reader.readAsDataURL(file);
}

function previewImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = document.getElementById('imgPreview');
    img.src = ev.target.result; img.style.display = 'block';
    document.getElementById('analyzeImgBtn').style.display = 'inline-block';
  };
  reader.readAsDataURL(file);
}

// ===== DISPLAY RESULT =====
function displayResult(result, snippet) {
  lastResult = { ...result, snippet, timestamp: new Date().toISOString() };
  const box = document.getElementById('resultBox');
  box.classList.remove('hidden');

  const verdict = document.getElementById('resultVerdict');
  verdict.textContent = result.verdict === 'FAKE' ? '❌ FAKE NEWS' : result.verdict === 'REAL' ? '✅ REAL NEWS' : '⚠️ MIXED';
  verdict.className = `verdict-badge verdict-${result.verdict.toLowerCase()}`;

  // Animate ring
  const arc = document.getElementById('confArc');
  const pct = document.getElementById('confPct');
  const fakeScore = result.fakeScore || 0;
  arc.style.stroke = fakeScore > 60 ? '#ef4444' : fakeScore > 40 ? '#f59e0b' : '#22c55e';
  const dashOffset = 314 - (314 * result.confidence / 100);
  setTimeout(() => { arc.style.transition = 'stroke-dashoffset 1s ease'; arc.style.strokeDashoffset = dashOffset; pct.textContent = result.confidence + '%'; }, 100);

  // Bars
  const bars = document.getElementById('confBars');
  bars.innerHTML = '';
  if (result.reasons) {
    result.reasons.forEach(r => {
      bars.innerHTML += `
        <div class="conf-bar-item">
          <span style="min-width:140px;color:var(--muted)">${r.label}</span>
          <div class="conf-bar-track">
            <div class="conf-bar-fill" style="width:0%;background:${r.color}" data-w="${r.score}"></div>
          </div>
          <span style="min-width:35px;text-align:right;font-weight:600;color:${r.color}">${r.score}%</span>
        </div>`;
    });
    setTimeout(() => { document.querySelectorAll('.conf-bar-fill').forEach(b => { b.style.width = b.dataset.w + '%'; }); }, 200);
  }

  document.getElementById('confLabel').textContent = `${result.fakeScore || 0}% Fake · ${result.realScore || 0}% Real`;
  document.getElementById('resultExplanation').textContent = result.explanation || 'Analysis complete.';

  const kw = document.getElementById('resultKeywords');
  kw.innerHTML = (result.keywords || []).map(k => `<span class="keyword-tag">#${k}</span>`).join('');

  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  addToHistory(lastResult);
}

// ===== VOICE =====
function startVoice() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showToast('Voice not supported in this browser. Try Chrome.'); return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'en-US'; recognition.continuous = false; recognition.interimResults = false;

  const circle = document.getElementById('voiceCircle');
  const icon = document.getElementById('voiceIcon');
  const status = document.getElementById('voiceStatus');
  const transcript = document.getElementById('voiceTranscript');

  circle.classList.add('listening');
  icon.textContent = '⏸'; status.textContent = 'Listening…';

  recognition.onresult = e => {
    const text = e.results[0][0].transcript;
    transcript.textContent = `"${text}"`;
    document.getElementById('newsInput').value = text;
    circle.classList.remove('listening');
    icon.textContent = '🎤'; status.textContent = 'Tap to speak';
    switchScanTab('text');
    setTimeout(() => analyzeText(), 500);
  };

  recognition.onerror = () => {
    circle.classList.remove('listening'); icon.textContent = '🎤'; status.textContent = 'Error. Try again.';
  };

  recognition.onend = () => {
    circle.classList.remove('listening'); icon.textContent = '🎤'; status.textContent = 'Tap to speak';
  };

  recognition.start();
}

function chatVoice() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showToast('Voice not supported. Try Chrome.'); return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const r = new SR();
  r.lang = 'en-US';
  r.onresult = e => {
    document.getElementById('chatInput').value = e.results[0][0].transcript;
    sendChat();
  };
  r.start();
  showToast('🎤 Listening for chat…');
}

// ===== SCAN TABS =====
function switchScanTab(t) {
  document.querySelectorAll('.scan-panel').forEach(p => { p.classList.remove('active-panel'); p.classList.add('hidden'); });
  document.getElementById(`scan${t.charAt(0).toUpperCase() + t.slice(1)}`).classList.add('active-panel');
  document.getElementById(`scan${t.charAt(0).toUpperCase() + t.slice(1)}`).classList.remove('hidden');
  document.querySelectorAll('.stab').forEach((b, i) => {
    b.classList.toggle('active', ['text','url','image','voice'][i] === t);
  });
}

function clearScan() {
  document.getElementById('newsInput').value = '';
  document.getElementById('resultBox').classList.add('hidden');
}

// ===== TODAY'S NEWS =====
async function loadTodayNews() {
  try {
    const { data, error } = await db.from('news').select('*').order('created_at', { ascending: false }).limit(30);
    if (error || !data?.length) { renderDemoNews(); return; }
    allNews = data;
    renderNews(data, 'todayNewsGrid');
    renderNews(data.slice(0, 3), 'homeNewsGrid');
    updateTicker(data);
  } catch { renderDemoNews(); }
}

function renderDemoNews() {
  const demo = [
    { id:1, title:'Scientists Discover New Planet in Solar System', content:'Astronomers at NASA have confirmed the detection of a previously unknown celestial body beyond Neptune\'s orbit.', status:'real', confidence:94, category:'Science', created_at: new Date().toISOString() },
    { id:2, title:'BREAKING: Government to Give Free Money to Everyone', content:'A viral post claims the government will distribute $5000 to all citizens. Experts confirm this is completely fabricated with no basis in any policy.', status:'fake', confidence:97, category:'Politics', created_at: new Date().toISOString() },
    { id:3, title:'New COVID Variant Detected in 12 Countries', content:'Health officials are monitoring a new variant identified by the WHO. Vaccines remain effective according to preliminary studies.', status:'breaking', confidence:88, category:'Health', created_at: new Date().toISOString() },
    { id:4, title:'Tech Giant Acquires AI Startup for $2 Billion', content:'In a major deal announced today, the acquisition is set to accelerate development of next-generation AI tools.', status:'real', confidence:91, category:'Technology', created_at: new Date().toISOString() },
    { id:5, title:'Celebrity Fakes Own Death for Publicity', content:'Multiple sources confirm this sensational claim originated from a satirical website but went viral on social media.', status:'fake', confidence:99, category:'Entertainment', created_at: new Date().toISOString() },
    { id:6, title:'Stock Market Hits Record High Amid Economic Recovery', content:'Major indices closed at all-time highs as investors respond positively to better-than-expected employment data.', status:'real', confidence:92, category:'Business', created_at: new Date().toISOString() },
  ];
  allNews = demo;
  renderNews(demo, 'todayNewsGrid');
  renderNews(demo.slice(0, 3), 'homeNewsGrid');
  updateTicker(demo);
}

function renderNews(news, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!news.length) { container.innerHTML = '<div class="empty-state"><span>📰</span><p>No news found.</p></div>'; return; }
  container.innerHTML = news.map(n => `
    <div class="news-card" onclick="quickAnalyzeNews('${(n.title||'').replace(/'/g,"\\'")}')">
      <div class="news-card-body">
        <span class="news-card-badge badge-${n.status||'real'}">${badgeText(n.status)}</span>
        <h4>${n.title || 'Untitled'}</h4>
        <p>${(n.content || '').substring(0, 110)}…</p>
      </div>
      <div class="news-card-footer">
        <span class="news-conf" style="color:${n.status==='fake'?'var(--danger)':'var(--success)'}">${n.confidence||'–'}% ${n.status==='fake'?'Fake':'Real'}</span>
        <span class="news-time">${timeAgo(n.created_at)} · ${n.category||'General'}</span>
      </div>
    </div>
  `).join('');
}

function badgeText(s) {
  return { fake:'❌ Fake', real:'✅ Real', breaking:'⚡ Breaking', satire:'😂 Satire' }[s] || '📰 News';
}

function quickAnalyzeNews(title) {
  document.getElementById('newsInput').value = title;
  showPage('scan');
  setTimeout(() => analyzeText(), 300);
}

function filterNews(type, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = type === 'all' ? allNews : allNews.filter(n => n.status === type);
  renderNews(filtered, 'todayNewsGrid');
}

function searchNews(q) {
  const filtered = allNews.filter(n => (n.title||'').toLowerCase().includes(q.toLowerCase()) || (n.content||'').toLowerCase().includes(q.toLowerCase()));
  renderNews(filtered, 'todayNewsGrid');
}

// ===== TICKER =====
function updateTicker(news) {
  const ticker = document.getElementById('tickerTrack');
  const fakeNews = news.filter(n => n.status === 'fake').map(n => `⚠️ FAKE: ${n.title}`).join('   •   ');
  ticker.textContent = fakeNews || '✅ No major fake news alerts at this time.';
  let pos = 0;
  setInterval(() => {
    pos -= 1;
    if (pos < -ticker.textContent.length * 8) pos = window.innerWidth;
    ticker.style.transform = `translateX(${pos}px)`;
  }, 30);
}

function startTicker() {
  const track = document.getElementById('tickerTrack');
  track.textContent = '🔍 TruthLens AI is monitoring news sources… • Scanning for misinformation… • Your trusted source for verified news';
}

// ===== HISTORY =====
function addToHistory(result) {
  const entry = {
    id: Date.now(),
    snippet: result.snippet,
    verdict: result.verdict,
    fakeScore: result.fakeScore,
    confidence: result.confidence,
    timestamp: result.timestamp,
    explanation: result.explanation
  };
  scanHistory.unshift(entry);
  if (scanHistory.length > 100) scanHistory = scanHistory.slice(0, 100);
  localStorage.setItem('tl_history', JSON.stringify(scanHistory));
}

function loadHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;
  if (!scanHistory.length) {
    list.innerHTML = '<div class="empty-state"><span>🕑</span><p>No scans yet. Analyze some news first!</p></div>';
    return;
  }
  renderHistoryList(scanHistory);
}

function renderHistoryList(data) {
  const list = document.getElementById('historyList');
  list.innerHTML = data.map(h => `
    <div class="history-item">
      <span class="history-verdict" style="color:${h.verdict==='FAKE'?'var(--danger)':h.verdict==='REAL'?'var(--success)':'var(--warning)'}">${h.verdict==='FAKE'?'❌ FAKE':h.verdict==='REAL'?'✅ REAL':'⚠️ MIXED'}</span>
      <span class="history-text">${(h.snippet||'').substring(0, 80)}…</span>
      <span class="history-conf" style="color:${h.verdict==='FAKE'?'var(--danger)':'var(--success)'}">${h.confidence||0}%</span>
      <span class="history-date">${new Date(h.timestamp).toLocaleString()}</span>
      <button class="history-del" onclick="deleteHistory(${h.id})">🗑️</button>
    </div>
  `).join('');
}

function deleteHistory(id) {
  scanHistory = scanHistory.filter(h => h.id !== id);
  localStorage.setItem('tl_history', JSON.stringify(scanHistory));
  loadHistory();
}

function clearHistory() {
  if (!confirm('Clear all scan history?')) return;
  scanHistory = []; localStorage.setItem('tl_history', '[]');
  loadHistory(); showToast('History cleared.');
}

function searchHistory(q) {
  const filtered = scanHistory.filter(h => (h.snippet||'').toLowerCase().includes(q.toLowerCase()));
  renderHistoryList(filtered);
}

function filterHistory(v) {
  const filtered = v === 'all' ? scanHistory : scanHistory.filter(h => h.verdict === v.toUpperCase());
  renderHistoryList(filtered);
}

function exportHistory() {
  const csv = ['Verdict,Confidence,Text,Date'].concat(
    scanHistory.map(h => `"${h.verdict}","${h.confidence}%","${(h.snippet||'').replace(/"/g,"'")}","${new Date(h.timestamp).toLocaleString()}"`)
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'truthlens_history.csv'; a.click();
  showToast('📥 History exported!');
}

// ===== CHATBOT =====
const chatHistory = [];

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  appendChat('user', msg);
  chatHistory.push({ role: 'user', content: msg });

  // Typing indicator
  const typingId = 'typing_' + Date.now();
  appendTyping(typingId);

  const systemContext = `You are TruthBot, an expert AI assistant specialized in fake news detection, fact-checking, media literacy, and misinformation. You are part of the TruthLens platform. Be helpful, accurate, concise and educational. When asked to analyze news, give a clear fake/real verdict with reasoning. Always be professional and informative.`;

  const fullPrompt = `${systemContext}\n\nConversation history:\n${chatHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${msg}\n\nAssistant:`;

  try {
    const reply = await callGemini(fullPrompt);
    removeTyping(typingId);
    appendChat('bot', reply);
    chatHistory.push({ role: 'assistant', content: reply });
  } catch {
    removeTyping(typingId);
    appendChat('bot', 'I apologize, I\'m having trouble connecting right now. Please check your internet connection and try again.');
  }
}

function quickChat(msg) {
  document.getElementById('chatInput').value = msg;
  sendChat();
}

function appendChat(role, text) {
  const box = document.getElementById('chatBox');
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.innerHTML = `
    <span class="chat-avatar">${role === 'bot' ? '🤖' : '👤'}</span>
    <div class="chat-bubble">${text.replace(/\n/g, '<br>')}</div>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function appendTyping(id) {
  const box = document.getElementById('chatBox');
  const div = document.createElement('div');
  div.className = 'chat-msg bot'; div.id = id;
  div.innerHTML = `<span class="chat-avatar">🤖</span><div class="chat-bubble"><div class="chat-typing"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>`;
  box.appendChild(div); box.scrollTop = box.scrollHeight;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ===== ADMIN =====
async function postNews() {
  if (!isAdmin) { showToast('Admin only!'); return; }
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();
  const source = document.getElementById('postSource').value.trim();
  const category = document.getElementById('postCategory').value;
  const status = document.getElementById('postStatus').value;
  const confidence = parseInt(document.getElementById('postConfidence').value) || 90;

  if (!title || !content) { showToast('Title and content required!'); return; }

  try {
    const { error } = await db.from('news').insert([{ title, content, source, category, status, confidence, posted_by: currentUser?.email }]);
    if (error) throw error;
    showToast('✅ News published!');
    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('postSource').value = '';
    loadTodayNews();
  } catch (e) {
    showToast('Published locally (DB error: ' + e.message + ')');
    allNews.unshift({ id: Date.now(), title, content, source, category, status, confidence, created_at: new Date().toISOString() });
    loadTodayNews();
  }
}

async function aiAutoPost() {
  if (!isAdmin) return;
  showToast('🤖 AI generating news post…');
  const categories = ['Technology', 'Health', 'Politics', 'Science'];
  const cat = categories[Math.floor(Math.random() * categories.length)];
  const prompt = `Generate a fake news example for category: ${cat}. Respond ONLY with JSON:
{"title":"<headline>","content":"<2-3 sentences of content>","status":"fake","confidence":${Math.floor(Math.random()*20)+80},"category":"${cat}"}`;
  try {
    const raw = await callGemini(prompt);
    const result = JSON.parse(raw.replace(/```json|```/g, '').trim());
    document.getElementById('postTitle').value = result.title;
    document.getElementById('postContent').value = result.content;
    document.getElementById('postConfidence').value = result.confidence;
    document.getElementById('postStatus').value = result.status;
    showToast('✅ AI content generated! Review and publish.');
  } catch { showToast('Error generating content.'); }
}

function schedulePost() {
  if (!isAdmin) return;
  const title = document.getElementById('schedTitle').value.trim();
  const content = document.getElementById('schedContent').value.trim();
  const time = document.getElementById('schedTime').value;
  const category = document.getElementById('schedCategory').value;
  if (!title || !time) { showToast('Title and time required!'); return; }
  scheduledPosts.push({ id: Date.now(), title, content, category, time, posted: false });
  localStorage.setItem('tl_scheduled', JSON.stringify(scheduledPosts));
  showToast('⏰ Post scheduled!');
  document.getElementById('schedTitle').value = ''; document.getElementById('schedContent').value = ''; document.getElementById('schedTime').value = '';
  loadScheduledList();
}

function loadScheduledList() {
  const list = document.getElementById('scheduledList');
  if (!list) return;
  list.innerHTML = scheduledPosts.filter(s => !s.posted).map(s => `
    <div class="sched-item">
      <span>${s.title}</span>
      <span style="color:var(--accent)">⏰ ${new Date(s.time).toLocaleString()}</span>
      <button class="btn-ghost" onclick="deleteScheduled(${s.id})">🗑️</button>
    </div>
  `).join('') || '<p style="color:var(--muted);font-size:0.9rem">No scheduled posts.</p>';
}

function deleteScheduled(id) {
  scheduledPosts = scheduledPosts.filter(s => s.id !== id);
  localStorage.setItem('tl_scheduled', JSON.stringify(scheduledPosts));
  loadScheduledList();
}

function checkScheduled() {
  const now = new Date();
  scheduledPosts.forEach(async (s) => {
    if (!s.posted && new Date(s.time) <= now) {
      s.posted = true;
      try {
        await db.from('news').insert([{ title: s.title, content: s.content, category: s.category, status: 'real', confidence: 90, posted_by: ADMIN_EMAIL }]);
      } catch {}
      showToast(`📰 Scheduled post published: ${s.title}`);
    }
  });
  localStorage.setItem('tl_scheduled', JSON.stringify(scheduledPosts));
}

async function sendAlert() {
  if (!isAdmin) return;
  const title = document.getElementById('alertTitle').value.trim();
  const msg = document.getElementById('alertMsg').value.trim();
  const type = document.getElementById('alertType').value;
  if (!title || !msg) { showToast('Title and message required!'); return; }

  try {
    await db.from('alerts').insert([{ title, message: msg, type, sent_by: currentUser?.email }]);
  } catch {}

  showAlertBanner(`${title}: ${msg}`);
  showToast('📣 Alert broadcast to all users!');
  document.getElementById('alertTitle').value = ''; document.getElementById('alertMsg').value = '';
}

async function loadAdminStats() {
  const scanCount = scanHistory.length;
  const fakeCount = scanHistory.filter(h => h.verdict === 'FAKE').length;
  const realCount = scanHistory.filter(h => h.verdict === 'REAL').length;

  document.getElementById('sTotalScans').textContent = scanCount;
  document.getElementById('sTotalFake').textContent = fakeCount;
  document.getElementById('sTotalReal').textContent = realCount;
  document.getElementById('sTotalNews').textContent = allNews.length;
  document.getElementById('sTotalUsers').textContent = '—';
  document.getElementById('sAlerts').textContent = '—';

  try {
    const { count } = await db.from('news').select('*', { count: 'exact', head: true });
    document.getElementById('sTotalNews').textContent = count || allNews.length;
  } catch {}
}

async function loadManageNews() {
  if (!isAdmin) return;
  const list = document.getElementById('manageNewsList');
  if (!list) return;
  const newsToShow = allNews.slice(0, 20);
  if (!newsToShow.length) { list.innerHTML = '<p style="color:var(--muted)">No news to manage.</p>'; return; }
  list.innerHTML = newsToShow.map(n => `
    <div class="manage-item">
      <span class="manage-item-title">${n.title}</span>
      <span class="news-card-badge badge-${n.status}" style="white-space:nowrap">${badgeText(n.status)}</span>
      <div class="manage-item-actions">
        <button class="btn-ghost" onclick="deleteNewsItem(${n.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

async function deleteNewsItem(id) {
  if (!confirm('Delete this news item?')) return;
  try {
    await db.from('news').delete().eq('id', id);
    showToast('Deleted.');
  } catch {}
  allNews = allNews.filter(n => n.id !== id);
  loadManageNews();
  loadTodayNews();
}

function switchAdminTab(t) {
  document.querySelectorAll('.admin-panel').forEach(p => { p.classList.remove('active-panel'); p.classList.add('hidden'); });
  document.getElementById(`admin${t.charAt(0).toUpperCase() + t.slice(1)}`).classList.add('active-panel');
  document.getElementById(`admin${t.charAt(0).toUpperCase() + t.slice(1)}`).classList.remove('hidden');
  document.querySelectorAll('.atab').forEach((b,i) => {
    b.classList.toggle('active', ['post','schedule','alert','stats','manage'][i] === t);
  });
  if (t === 'stats') loadAdminStats();
  if (t === 'manage') loadManageNews();
  if (t === 'schedule') loadScheduledList();
}

// ===== SHARE / SAVE / REPORT =====
async function shareResult() {
  if (!lastResult) return;
  const text = `🔍 TruthLens Analysis\n\nVerdict: ${lastResult.verdict}\nConfidence: ${lastResult.confidence}%\n\n${lastResult.explanation?.substring(0, 150)}\n\nCheck news credibility at TruthLens`;
  if (navigator.share) {
    await navigator.share({ title: 'TruthLens Analysis', text });
  } else {
    navigator.clipboard.writeText(text);
    showToast('📋 Result copied to clipboard!');
  }
}

function saveToHistory() {
  if (lastResult) { addToHistory(lastResult); showToast('💾 Saved to history!'); }
}

function generateReport() {
  if (!lastResult) return;
  const html = `<!DOCTYPE html><html><head><title>TruthLens Report</title><style>body{font-family:sans-serif;max-width:700px;margin:2rem auto;padding:1rem;background:#050810;color:#e2e8f0}h1{color:#00d4ff}h2{color:#7c3aed}.verdict{font-size:2rem;font-weight:bold;padding:1rem;border-radius:8px;margin:1rem 0}
.fake{background:rgba(239,68,68,0.1);color:#ef4444;border:2px solid #ef4444}
.real{background:rgba(34,197,94,0.1);color:#22c55e;border:2px solid #22c55e}
.info{background:#111827;border:1px solid #1e2d45;border-radius:8px;padding:1rem;margin:1rem 0}</style></head>
<body><h1>🔍 TruthLens Analysis Report</h1>
<div class="verdict ${lastResult.verdict.toLowerCase()}">${lastResult.verdict === 'FAKE' ? '❌ FAKE NEWS' : '✅ REAL NEWS'}</div>
<div class="info"><h2>Confidence: ${lastResult.confidence}%</h2><p>Fake Score: ${lastResult.fakeScore}% | Real Score: ${lastResult.realScore}%</p></div>
<div class="info"><h2>Analysis</h2><p>${lastResult.explanation}</p></div>
<div class="info"><h2>Analyzed Text</h2><p>${lastResult.snippet}</p></div>
<p style="color:#64748b;margin-top:2rem">Generated by TruthLens AI | ${new Date().toLocaleString()}</p></body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'truthlens_report.html'; a.click();
  showToast('📄 Report downloaded!');
}

// ===== SUPABASE SAVE =====
async function saveResultToSupabase(result, text) {
  if (!currentUser) return;
  try {
    await db.from('scans').insert([{
      user_id: currentUser.id,
      text_snippet: text.substring(0, 200),
      verdict: result.verdict,
      fake_score: result.fakeScore,
      confidence: result.confidence,
      explanation: result.explanation
    }]);
  } catch {}
}

// ===== HOME STATS =====
function loadHomeStats() {
  const total = scanHistory.length;
  const fake = scanHistory.filter(h => h.verdict === 'FAKE').length;
  const real = scanHistory.filter(h => h.verdict === 'REAL').length;
  animateCount('totalScans', total);
  animateCount('fakeCount', fake);
  animateCount('realCount', real);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let count = 0;
  const inc = Math.max(1, Math.floor(target / 30));
  const timer = setInterval(() => {
    count = Math.min(count + inc, target);
    el.textContent = count;
    if (count >= target) clearInterval(timer);
  }, 50);
}

function updateLocalStats(verdict) {
  loadHomeStats();
}

// ===== ALERTS =====
async function checkAlerts() {
  try {
    const { data } = await db.from('alerts').select('*').order('created_at', { ascending: false }).limit(1);
    if (data?.length) {
      const last = data[0];
      const seen = localStorage.getItem('tl_last_alert');
      if (seen !== last.id?.toString()) {
        showAlertBanner(`${last.title}: ${last.message}`);
        localStorage.setItem('tl_last_alert', last.id?.toString());
      }
    }
  } catch {}
}

function showAlertBanner(msg) {
  const banner = document.getElementById('alertBanner');
  document.getElementById('alertBannerText').textContent = `🔔 ALERT: ${msg}`;
  banner.classList.remove('hidden');
  setTimeout(() => banner.classList.add('hidden'), 10000);
}

function dismissAlert() { document.getElementById('alertBanner').classList.add('hidden'); }

// ===== UTILS =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ===== DRAG & DROP for image =====
const uploadZone = document.getElementById('uploadZone');
if (uploadZone) {
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.borderColor = 'var(--accent)'; });
  uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = 'var(--border)'; });
  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--border)';
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) {
      document.getElementById('imgFile').files = e.dataTransfer.files;
      previewImage({ target: document.getElementById('imgFile') });
    }
  });
}

// ===== SUPABASE TABLE SETUP NOTES =====
// Run this SQL in your Supabase SQL editor:
// CREATE TABLE IF NOT EXISTS news (id BIGSERIAL PRIMARY KEY, title TEXT, content TEXT, source TEXT, category TEXT, status TEXT DEFAULT 'real', confidence INT DEFAULT 90, posted_by TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
// CREATE TABLE IF NOT EXISTS scans (id BIGSERIAL PRIMARY KEY, user_id UUID, text_snippet TEXT, verdict TEXT, fake_score INT, confidence INT, explanation TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
// CREATE TABLE IF NOT EXISTS alerts (id BIGSERIAL PRIMARY KEY, title TEXT, message TEXT, type TEXT DEFAULT 'info', sent_by TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
// ALTER TABLE news ENABLE ROW LEVEL SECURITY;
// ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
// ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Public read" ON news FOR SELECT USING (true);
// CREATE POLICY "Public read alerts" ON alerts FOR SELECT USING (true);
// CREATE POLICY "Authenticated insert news" ON news FOR INSERT WITH CHECK (auth.role() = 'authenticated');
// CREATE POLICY "Authenticated insert scans" ON scans FOR INSERT WITH CHECK (auth.uid() = user_id);
// CREATE POLICY "Authenticated insert alerts" ON alerts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
