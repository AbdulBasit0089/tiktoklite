// Helper: call API with JSON
async function api(path, method='GET', body=null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  return res.json();
}

function b64DecodeUnicode(str) {
  try { return decodeURIComponent(atob(str).split('').map(function(c){return '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)}).join('')); }
  catch(e){ return null; }
}

async function getMe() {
  // Try /.auth/me first (SWA built-in)
  try {
    const res = await fetch('/.auth/me');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        const p = data[0];
        return { userId: p.userId, name: p.userDetails || 'user', provider: p.identityProvider };
      }
    }
  } catch {}
  // Fallback to API (will decode x-ms-client-principal server-side if available)
  try {
    return await api('/api/me');
  } catch { return null; }
}

function thumbFromTitle(title){
  // quick placeholder thumbnail as data URL (solid color with initials)
  const canvas = document.createElement('canvas');
  canvas.width = 400; canvas.height = 225;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1f6feb'; ctx.fillRect(0,0,400,225);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline='middle';
  const initials = (title||'Video').split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()).join('');
  ctx.fillText(initials || 'V', 200, 112);
  return canvas.toDataURL('image/jpeg', 0.8);
}

let me = null;
let isCreator = false;
let skip = 0; const take = 12;
async function refreshMe(){
  me = await getMe();
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const whoami = document.getElementById('whoami');
  const uploadSection = document.getElementById('uploadSection');
  if (me?.userId){
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    whoami.textContent = `Signed in as ${me.name}`;
    // Check role from API
    try {
      const r = await api('/api/isCreator');
      isCreator = !!r.isCreator;
    } catch { isCreator = false; }
    uploadSection.classList.toggle('hidden', !isCreator);
  } else {
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    whoami.textContent='';
    isCreator = false;
    uploadSection.classList.add('hidden');
  }
}

async function loadVideos(reset=false){
  if (reset){ skip=0; document.getElementById('grid').innerHTML=''; }
  const q = document.getElementById('q').value.trim();
  const genre = document.getElementById('filterGenre').value;
  const url = `/api/videos?q=${encodeURIComponent(q)}&genre=${encodeURIComponent(genre)}&skip=${skip}&take=${take}`;
  const data = await api(url);
  const grid = document.getElementById('grid');
  data.items.forEach(v => {
    const div = document.createElement('div');
    div.className='tile';
    const img = document.createElement('img');
    img.src = v.thumbnailUrl || 'https://via.placeholder.com/400x225?text=Video';
    div.appendChild(img);
    const a = document.createElement('a');
    a.className='tile-title';
    a.href = `video.html?id=${encodeURIComponent(v.id)}`;
    a.textContent = v.title;
    div.appendChild(a);
    const meta = document.createElement('div');
    meta.className='small';
    meta.textContent = `${v.publisher} • ${v.genre} • ${v.ageRating} • ⭐ ${Number(v.avgRating||0).toFixed(1)}`;
    div.appendChild(meta);
    grid.appendChild(div);
  });
  skip += data.items.length;
  document.getElementById('loadMoreBtn').classList.toggle('hidden', data.items.length < take);
}

async function doUpload(){
  const f = document.getElementById('file').files?.[0];
  const msg = document.getElementById('uploadMsg');
  if (!f){ msg.textContent='Choose an MP4 file.'; return; }
  if (f.type !== 'video/mp4'){ msg.textContent='Please upload MP4.'; return; }
  msg.textContent='Requesting upload URL...';
  const title = document.getElementById('title').value.trim() || f.name;
  const payload = {
    fileName: f.name,
  };
  const sas = await api('/api/getUploadSas', 'POST', payload);
  msg.textContent='Uploading video...';
  const put = await fetch(sas.uploadUrl, { method:'PUT', headers:{'x-ms-blob-type':'BlockBlob'}, body:f });
  if (!put.ok){ msg.textContent='Upload failed.'; return; }
  msg.textContent='Saving metadata...';
  const meta = {
    title,
    publisher: document.getElementById('publisher').value.trim() || (me?.name || 'Unknown'),
    producer: document.getElementById('producer').value.trim() || (me?.name || 'Unknown'),
    genre: document.getElementById('genre').value,
    ageRating: document.getElementById('ageRating').value,
    blobUrl: sas.blobUrl,
    thumbnailUrl: thumbFromTitle(title)
  };
  await api('/api/videos', 'POST', meta);
  msg.textContent='Done! Your video is live.';
  document.getElementById('file').value='';
  loadVideos(true);
}

document.getElementById('loginBtn').onclick = ()=>{ window.location.href='/.auth/login/github?post_login_redirect_uri=/' };
document.getElementById('logoutBtn').onclick = ()=>{ window.location.href='/.auth/logout?post_logout_redirect_uri=/' };
document.getElementById('uploadBtn').onclick = ()=>{ doUpload().catch(e=>{ document.getElementById('uploadMsg').textContent=e.message }) };
document.getElementById('searchBtn').onclick = ()=> loadVideos(true);
document.getElementById('loadMoreBtn').onclick = ()=> loadVideos(false);

refreshMe().then(()=>loadVideos(true));
