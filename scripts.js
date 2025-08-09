// scripts.js
const songsUrl = 'data/songs.json';
const postsUrl = 'data/posts.json';

document.getElementById('year').textContent = new Date().getFullYear();

// helper: format small numbers
function fmt(n){
  if(n >= 1000) return (Math.round(n/100)/10)+'k';
  return String(n);
}

// load stats (demo: uses stored values or fallback)
async function loadStats(){
  // For GitHub Pages (no backend), we can't call YouTube API securely.
  // So this is demo: try to fetch a local file 'data/stats.json' if you add it,
  // otherwise show sample value (from conversation: 34)
  try{
    const res = await fetch('data/stats.json');
    if(res.ok){
      const st = await res.json();
      document.getElementById('yt-subs').textContent = st.youtube ? fmt(st.youtube) : '--';
      document.getElementById('sns-total').textContent = st.total ? fmt(st.total) : '--';
    } else {
      document.getElementById('yt-subs').textContent = fmt(34);
      document.getElementById('sns-total').textContent = fmt(34);
    }
  } catch(e){
    document.getElementById('yt-subs').textContent = fmt(34);
    document.getElementById('sns-total').textContent = fmt(34);
  }
}

// render works
let songsData = [];
async function loadSongs(){
  const res = await fetch(songsUrl);
  songsData = await res.json();
  renderWorks(songsData);
}

function renderWorks(list){
  const dom = document.getElementById('works-list');
  if(!list.length){ dom.innerHTML = '<p class="muted">まだ曲が登録されていません。</p>'; return; }
  dom.innerHTML = list.map(s => `
    <div class="work-item" data-category="${s.category}">
      <img class="work-thumb" src="${s.cover||'assets/cover-placeholder.jpg'}" alt="${s.title}">
      <h3>${s.title}</h3>
      <div class="muted">${s.artist || 'Xerox'} · ${s.tags ? s.tags.join(', ') : ''}</div>
      <div class="action-row" style="margin-top:8px">
        <button class="btn play-btn" data-video="${s.videoId}">再生</button>
        <button class="btn ghost lyrics-btn" data-lyrics="${encodeURIComponent(s.lyrics||'')}">歌詞</button>
      </div>
    </div>
  `).join('');
  // attach handlers
  document.querySelectorAll('.play-btn').forEach(b => b.addEventListener('click', e => {
    const vid = e.currentTarget.dataset.video;
    if(!vid){ alert('埋め込みIDがありません'); return; }
    playYoutube(vid);
  }));
  document.querySelectorAll('.lyrics-btn').forEach(b => b.addEventListener('click', e => {
    const l = decodeURIComponent(e.currentTarget.dataset.lyrics);
    showLyrics(l || '歌詞は未登録です');
  }));
}

// youtube play: opens modal with embed (simple)
function playYoutube(id){
  const win = window.open(`https://www.youtube.com/watch?v=${id}`, '_blank');
  if(!win) alert('ポップアップがブロックされました。新しいタブで開いてください。');
}

// lyrics modal
function showLyrics(text){
  document.getElementById('lyrics-title').textContent = '歌詞';
  document.getElementById('lyrics-content').textContent = text;
  document.getElementById('lyrics-modal').classList.remove('hidden');
}
document.getElementById('close-lyrics').addEventListener('click', ()=> document.getElementById('lyrics-modal').classList.add('hidden'));

// load posts
async function loadPosts(){
  const res = await fetch(postsUrl);
  const posts = await res.json();
  const dom = document.getElementById('posts-list');
  if(!posts.length){ dom.innerHTML = '<p class="muted">まだ記事がありません。</p>'; return; }
  dom.innerHTML = posts.map(p => `
    <article class="card">
      <h3>${p.title}</h3>
      <div class="muted">${new Date(p.publishedAt).toLocaleDateString()}</div>
      <p>${p.excerpt}</p>
      <details><summary>全文を表示</summary><div>${p.content}</div></details>
    </article>
  `).join('');
}

// search
document.getElementById('search-btn').addEventListener('click', async ()=>{
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  if(!q) return renderWorks(songsData);
  const filtered = songsData.filter(s => {
    return (s.title && s.title.toLowerCase().includes(q)) ||
           (s.tags && s.tags.join(' ').toLowerCase().includes(q)) ||
           (s.lyrics && s.lyrics.toLowerCase().includes(q));
  });
  renderWorks(filtered);
});

// filter category
document.getElementById('filter-category').addEventListener('change', (e)=>{
  const v = e.target.value;
  if(v === 'all') renderWorks(songsData);
  else renderWorks(songsData.filter(s => s.category === v));
});

// play category (simple: open first video in category as demo)
document.getElementById('play-category').addEventListener('click', ()=>{
  const v = document.getElementById('filter-category').value;
  const list = (v === 'all') ? songsData : songsData.filter(s => s.category === v);
  if(!list.length){ alert('曲がありません'); return; }
  // open playlist: open each video in new tab (user can close)
  list.forEach(s => {
    if(s.videoId) window.open(`https://www.youtube.com/watch?v=${s.videoId}`, '_blank');
  });
});

// init
loadStats();
loadSongs();
loadPosts();
