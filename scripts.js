/* scripts.js - control logic: loads local JSON, search, filter, play, particles, kpi animation */
const SNG = 'data/songs.json';
const PST = 'data/posts.json';
const STATS = 'data/stats.json'; // optional local stats file

document.getElementById('year').textContent = new Date().getFullYear();

// ------- particles (tsParticles) -------
window.addEventListener('DOMContentLoaded', () => {
  if (window.tsParticles) {
    tsParticles.load("tsparticles", {
      fpsLimit: 60,
      background: { color: "" },
      particles: {
        number: { value: 60, density: { enable: true, area: 800 } },
        color: { value: ["#00f7ff", "#a855f7", "#ff3da6"] },
        shape: { type: "circle" },
        opacity: { value: 0.12, random: true },
        size: { value: { min: 0.8, max: 3 } },
        move: { enable: true, speed: 0.6, direction: "top", outModes: "out" }
      },
      interactivity: {
        events: { onHover: { enable: true, mode: "repulse" } },
        modes: { repulse: { distance: 80 } }
      }
    });
  }
});

// ------- load stats (demo or data/stats.json) -------
async function loadStats(){
  try{
    const r = await fetch(STATS);
    if(r.ok){
      const s = await r.json();
      animateKPI('yt-subs', s.youtube || 0);
      animateKPI('sns-total', s.total || 0);
    } else {
      // fallback sample from conversation
      animateKPI('yt-subs', 34);
      animateKPI('sns-total', 34);
    }
  }catch(e){
    animateKPI('yt-subs', 34);
    animateKPI('sns-total', 34);
  }
}

function animateKPI(id, target){
  const el = document.getElementById(id);
  const start = 0;
  const duration = 1000;
  const stepTime = 16;
  const steps = Math.ceil(duration / stepTime);
  let current = start;
  const increment = (target - start) / steps;
  const t = setInterval(()=> {
    current += increment;
    el.textContent = formatCount(Math.round(current));
    if(current >= target){
      el.textContent = formatCount(target);
      clearInterval(t);
    }
  }, stepTime);
}
function formatCount(n){ if(n >= 1000) return Math.round(n/100)/10 + 'k'; return String(n); }

// ------- load songs and posts -------
let songs = [];
async function loadSongs(){
  try{
    const r = await fetch(SNG);
    songs = await r.json();
    renderWorks(songs);
    pickFeatured();
  }catch(e){
    console.error('songs load fail', e);
    document.getElementById('works-list').innerHTML = '<p class="muted">曲データがありません。</p>';
  }
}
async function loadPosts(){
  try{
    const r = await fetch(PST);
    const posts = await r.json();
    renderPosts(posts);
  }catch(e){
    document.getElementById('news-list').innerHTML = '<p class="muted">お知らせがありません。</p>';
  }
}

// ------- render works -------
function renderWorks(list){
  const dom = document.getElementById('works-list');
  if(!list.length){ dom.innerHTML = '<p class="muted">まだ曲が登録されていません。</p>'; return; }
  dom.innerHTML = list.map(s => `
    <div class="work-item" data-category="${s.category}">
      <img class="work-thumb" src="${s.cover || 'assets/cover-placeholder.jpg'}" alt="${s.title}">
      <div class="work-title">${s.title}</div>
      <div class="muted">${s.tags ? s.tags.join(', ') : ''}</div>
      <div style="margin-top:8px">
        <button class="btn play-btn" data-video="${s.videoId}">▶ 再生</button>
        <button class="btn outline lyrics-btn" data-lyrics="${encodeURIComponent(s.lyrics||'')}">歌詞</button>
      </div>
    </div>
  `).join('');
  attachWorkHandlers();
}

// handlers
function attachWorkHandlers(){
  document.querySelectorAll('.play-btn').forEach(b => b.addEventListener('click', e => {
    const id = e.currentTarget.dataset.video;
    if(!id) return alert('動画IDがありません');
    window.open(`https://www.youtube.com/watch?v=${id}`, '_blank');
  }));
  document.querySelectorAll('.lyrics-btn').forEach(b => b.addEventListener('click', e => {
    const txt = decodeURIComponent(e.currentTarget.dataset.lyrics);
    showLyrics(txt || '歌詞は未登録です');
  }));
}

// ------- search + filter -------
document.getElementById('search-btn').addEventListener('click', () => {
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  if(!q) return renderWorks(songs);
  const filtered = songs.filter(s => (s.title && s.title.toLowerCase().includes(q)) ||
    (s.tags && s.tags.join(' ').toLowerCase().includes(q)) ||
    (s.lyrics && s.lyrics.toLowerCase().includes(q)));
  renderWorks(filtered);
});
document.getElementById('filter-category').addEventListener('change', (e) => {
  const v = e.target.value;
  if(v === 'all') renderWorks(songs);
  else renderWorks(songs.filter(s => s.category === v));
});

// ------- featured/random pick -------
function pickFeatured(){
  if(!songs.length) return;
  const idx = Math.floor(Math.random() * songs.length);
  const s = songs[idx];
  const box = document.getElementById('featured-box');
  box.innerHTML = `
    <img src="${s.cover||'assets/cover-placeholder.jpg'}" style="width:120px;height:120px;border-radius:8px;object-fit:cover;margin-right:12px">
    <div>
      <div style="font-weight:800">${s.title}</div>
      <div class="muted">${s.artist || 'Xerox'} · ${s.tags ? s.tags.join(', ') : ''}</div>
      <div style="margin-top:10px">
        <button class="btn primary" onclick="window.open('https://www.youtube.com/watch?v=${s.videoId}','_blank')">▶ 再生</button>
        <button class="btn outline" onclick="showLyrics('${(s.lyrics||'').slice(0,200).replace(/'/g,\"\\'\")}')">歌詞</button>
      </div>
    </div>
  `;
}

// ------- posts render -------
function renderPosts(posts){
  if(!posts || !posts.length){ document.getElementById('news-list').innerHTML = '<p class="muted">お知らせはありません。</p>'; return; }
  document.getElementById('news-list').innerHTML = posts.map(p => `
    <article style="margin-bottom:12px">
      <div style="font-weight:800">${p.title}</div>
      <div class="muted">${new Date(p.publishedAt).toLocaleDateString()}</div>
      <div style="margin-top:6px">${p.excerpt}</div>
    </article>
  `).join('');
}

// ------- lyrics modal (simple alert modal) -------
function showLyrics(txt){
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `<div class="modal-inner card"><button class="btn outline" id="close-modal">閉じる</button><h3>歌詞</h3><pre style="white-space:pre-wrap;margin-top:8px">${escapeHtml(txt)}</pre></div>`;
  document.body.appendChild(modal);
  document.getElementById('close-modal').addEventListener('click', ()=> modal.remove());
}
function escapeHtml(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

// init
loadStats();
loadSongs();
loadPosts();
