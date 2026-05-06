/* ============================================================
   yamijpg — app.js
   EmailJS: service_i166yth / template_lipk83f / Hn0ZYi8BQIJnryeUF
   ============================================================ */

/* ─── EMAILJS CONFIG ──────────────────────────────────────── */
var EJ_SERVICE  = 'service_i166yth';
var EJ_TEMPLATE = 'template_lipk83f';

/* ─── STORAGE WRAPPER ─────────────────────────────────────── */
var LS = {
  get: function(k, fb) {
    try { var v = localStorage.getItem('yj_' + k); return v !== null ? JSON.parse(v) : fb; }
    catch(e) { return fb; }
  },
  set: function(k, v) {
    try { localStorage.setItem('yj_' + k, JSON.stringify(v)); }
    catch(e) {
      if (k === 'imgs') alert('Storage full — try deleting some uploaded photos first.');
    }
  },
  del: function(k) { try { localStorage.removeItem('yj_' + k); } catch(e) {} }
};

/* ─── DEFAULT PHOTO METADATA ──────────────────────────────── */
/* Images live in /images/ — referenced by path, not base64.
   On first visit these are written to localStorage so edits
   (pin, delete, toggle comments) persist across reloads.     */
var DEFAULTS = [
  {id:'p0', tag:'Nature · Autumn',    caption:'The last few leaves holding on. Yellow against all that purple twilight.',              date:'Oct 2, 2024',   featured:true,  commentsOpen:true, views:0, exif:{camera:'Sony A7III',    lens:'35mm f/1.8',       shutter:'1/200s',  iso:'ISO 400'}},
  {id:'p1', tag:'Urban · Minimalist', caption:'Looking up at the ordinary — sometimes that\'s where the interesting stuff lives.',     date:'Oct 1, 2024',   featured:false, commentsOpen:true, views:0, exif:{camera:'iPhone 14 Pro', lens:'Wide',              shutter:'1/1000s', iso:'ISO 50'}},
  {id:'p2', tag:'Macro · Nature',     caption:'Found this one working hard on a Tuesday morning.',                                     date:'Sept 15, 2024', featured:false, commentsOpen:true, views:0, exif:{camera:'Sony A7III',    lens:'90mm Macro f/2.8', shutter:'1/400s',  iso:'ISO 200'}},
  {id:'p3', tag:'Flora · Wild',       caption:'A whole field of them and still one bee doing all the work.',                           date:'Sept 14, 2024', featured:false, commentsOpen:true, views:0, exif:{camera:'Sony A7III',    lens:'50mm f/2.0',       shutter:'1/320s',  iso:'ISO 320'}},
  {id:'p4', tag:'Macro · Bloom',      caption:'Purple aster, close up. Couldn\'t walk past it.',                                      date:'Sept 13, 2024', featured:false, commentsOpen:true, views:0, exif:{camera:'Sony A7III',    lens:'90mm Macro f/2.8', shutter:'1/500s',  iso:'ISO 250'}},
  {id:'p5', tag:'Macro · Wildflower', caption:'Single yellow wildflower pushing through the leaf litter.',                            date:'Sept 12, 2024', featured:false, commentsOpen:true, views:0, exif:{camera:'Sony A7III',    lens:'90mm Macro f/2.8', shutter:'1/250s',  iso:'ISO 320'}}
];

/* Built-in image paths (shipped with the site) */
var BUILTIN = {
  p0:'images/img_p0.jpg', p1:'images/img_p1.jpg',
  p2:'images/img_p2.jpg', p3:'images/img_p3.jpg',
  p4:'images/img_p4.jpg', p5:'images/img_p5.jpg'
};

/* ─── LOAD STATE ──────────────────────────────────────────── */
var PHOTOS   = LS.get('photos', null);
if (!PHOTOS) { PHOTOS = JSON.parse(JSON.stringify(DEFAULTS)); LS.set('photos', PHOTOS); }

var IMGS     = LS.get('imgs', {});     /* base64 for user-uploaded photos only */
var liked    = LS.get('liked', {});
var comments = LS.get('comments', {});
var subs     = LS.get('subs', []);
var guestbook= LS.get('gb', []);

/* ─── SAVE HELPERS ────────────────────────────────────────── */
function savePhotos()   { LS.set('photos', PHOTOS); }
function saveImgs()     { LS.set('imgs', IMGS); }
function saveLiked()    { LS.set('liked', liked); }
function saveComments() { LS.set('comments', comments); }
function saveSubs()     { LS.set('subs', subs); }
function saveGB()       { LS.set('gb', guestbook); }

/* ─── IMAGE SRC ───────────────────────────────────────────── */
function getSrc(id) {
  if (IMGS[id])    return IMGS[id];     /* user-uploaded, stored as base64 */
  if (BUILTIN[id]) return BUILTIN[id];  /* default shipped image file      */
  return '';
}

/* ─── STATE ───────────────────────────────────────────────── */
/* Password is stored as a SHA-256 hash — never as plain text.
   To change your password, update PASS_HASH with the SHA-256
   hash of your new password. Generate one at: sha256.online   */
var PASS_HASH = '03dbe3175353ef0c9c5ce84485b3ecadf304b2673566cc3d4b82c80e39f1de96';
var authed = false;
var lbIdx = 0;
var activeFilter = null;
var tapCount = 0, tapTimer = null;
var subMode = 'email';

function sha256(str) {
  /* Native Web Crypto API — works in all modern browsers */
  var buf = new TextEncoder().encode(str);
  return crypto.subtle.digest('SHA-256', buf).then(function(hash) {
    return Array.from(new Uint8Array(hash))
      .map(function(b){ return b.toString(16).padStart(2,'0'); })
      .join('');
  });
}
/* ─── UTILS ───────────────────────────────────────────────── */
function safe(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function show(id)      { var e=document.getElementById(id); if(e) e.style.display='block'; }
function hide(id)      { var e=document.getElementById(id); if(e) e.style.display='none';  }
function val(id)       { var e=document.getElementById(id); return e ? e.value.trim() : ''; }
function setVal(id, v) { var e=document.getElementById(id); if(e) e.value = v; }
function setText(id,v) { var e=document.getElementById(id); if(e) e.textContent = v; }
function flashOk(id, ms)  { var e=document.getElementById(id); if(!e) return; e.style.display='block'; setTimeout(function(){ e.style.display='none'; }, ms||3500); }
function flashErr(id, ms) { var e=document.getElementById(id); if(!e) return; e.style.display='block'; setTimeout(function(){ e.style.display='none'; }, ms||3500); }
function disableBtn(id)   { var e=document.getElementById(id); if(e){ e.disabled=true;  e.style.opacity='.5'; } }
function enableBtn(id)    { var e=document.getElementById(id); if(e){ e.disabled=false; e.style.opacity='';   } }

/* ─── THEME (persists across visits) ─────────────────────── */
(function initTheme() {
  var t = LS.get('theme', 'light');
  document.documentElement.setAttribute('data-theme', t);
  var btn = document.getElementById('mode-btn');
  if (btn) btn.innerHTML = t === 'dark' ? '&#9788; Light' : '&#9790; Dark';
})();

function toggleMode() {
  var cur  = document.documentElement.getAttribute('data-theme');
  var next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  var btn = document.getElementById('mode-btn');
  if (btn) btn.innerHTML = next === 'dark' ? '&#9788; Light' : '&#9790; Dark';
  LS.set('theme', next);
}

function togglePwEye(inputId) {
  var inp = document.getElementById(inputId);
  if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
}

/* ─── STATS ───────────────────────────────────────────────── */
function updateStats() {
  var tags={}, lk=0, cc=0, views=0;
  for (var i=0; i<PHOTOS.length; i++) {
    tags[PHOTOS[i].tag] = 1;
    views += (PHOTOS[i].views || 0);
  }
  for (var k in liked)    if (liked[k]) lk++;
  for (var ck in comments) cc += (comments[ck]||[]).length;

  setText('s-photos', PHOTOS.length);
  setText('s-tags',   Object.keys(tags).length);
  setText('s-likes',  lk);
  setText('s-subs',   subs.length);
  setText('d-photos', PHOTOS.length);
  setText('d-likes',  lk);
  setText('d-coms',   cc);
  setText('d-subs',   subs.length);
  setText('d-gb',     guestbook.length);
  setText('d-views',  views);
}

/* ─── HERO ────────────────────────────────────────────────── */
function updateHero() {
  var p=null, idx=0;
  for (var i=0; i<PHOTOS.length; i++) { if (PHOTOS[i].featured) { p=PHOTOS[i]; idx=i; break; } }
  if (!p && PHOTOS.length) { p=PHOTOS[0]; idx=0; }
  if (!p) return;
  var img = document.getElementById('hero-img');
  if (img) img.src = getSrc(p.id);
  setText('hero-tag', p.tag);
  var hc = document.getElementById('hero-cap');
  if (hc) hc.innerHTML = '\u201c' + safe(p.caption) + '\u201d';
  setText('hero-date', p.date);
  var hw = document.getElementById('hero-wrap');
  if (hw) (function(i){ hw.onclick = function(){ openLb(i); }; })(idx);
}

/* ─── FEED ────────────────────────────────────────────────── */
function renderFeed() {
  var feed = document.getElementById('feed');
  if (!feed) return;
  var latest = PHOTOS.slice(0, 3);
  setText('feed-badge', latest.length);
  if (!latest.length) { feed.innerHTML = '<p class="empty-msg">No photos yet.</p>'; return; }
  var html = '';
  for (var i=0; i<latest.length; i++) {
    var p = latest[i];
    html += '<div class="post">';
    html += '<img class="post-img" src="' + getSrc(p.id) + '" alt="photo" onclick="openLb(' + i + ')" loading="lazy"/>';
    html += '<div class="post-body">';
    html += '<div class="post-tag">'     + safe(p.tag)     + '</div>';
    html += '<div class="post-caption">\u201c' + safe(p.caption) + '\u201d</div>';
    html += '<div class="post-date">'    + safe(p.date)    + '</div>';
    /* EXIF */
    if (p.exif && (p.exif.camera || p.exif.lens || p.exif.shutter || p.exif.iso)) {
      html += '<div class="exif-bar">';
      if (p.exif.camera)  html += '<div class="exif-item"><div class="exif-label">Camera</div><div class="exif-val">'  + safe(p.exif.camera)  + '</div></div>';
      if (p.exif.lens)    html += '<div class="exif-item"><div class="exif-label">Lens</div><div class="exif-val">'    + safe(p.exif.lens)    + '</div></div>';
      if (p.exif.shutter) html += '<div class="exif-item"><div class="exif-label">Shutter</div><div class="exif-val">'+ safe(p.exif.shutter) + '</div></div>';
      if (p.exif.iso)     html += '<div class="exif-item"><div class="exif-label">ISO</div><div class="exif-val">'     + safe(p.exif.iso)     + '</div></div>';
      html += '</div>';
    }
    /* Like + views */
    html += '<div class="action-row">';
    html += '<button class="like-btn' + (liked[p.id] ? ' on' : '') + '" onclick="doLike(\'' + p.id + '\')">' + (liked[p.id] ? '&#10084; Liked' : '&#9825; Like') + '</button>';
    html += '<span class="views-badge">&#128065; ' + (p.views||0) + ' views</span>';
    html += '</div>';
    /* Related */
    html += '<div class="related"><div class="related-label">More photos</div><div class="related-row">' + relatedHTML(p.id, p.tag) + '</div></div>';
    /* Comments */
    html += '<div class="hr"></div>';
    if (p.commentsOpen) {
      html += '<div class="com-label">Comments</div>';
      html += '<div class="com-list" id="cl-' + p.id + '"></div>';
      html += '<div class="field"><label>Name</label><input type="text" id="cn-' + p.id + '" autocomplete="name" placeholder="Your name"/></div>';
      html += '<div class="field"><label>Comment</label><textarea id="ct-' + p.id + '" rows="2" placeholder="Leave a comment\u2026"></textarea></div>';
      html += '<button class="btn btn-sm" onclick="postCom(\'' + p.id + '\')">Post Comment</button>';
    } else {
      html += '<div class="com-closed">Comments closed.</div>';
    }
    html += '</div></div>';
  }
  feed.innerHTML = html;
  for (var j=0; j<latest.length; j++) renderComs(latest[j].id);
}

function relatedHTML(currentId, tag) {
  var rel=[], html='';
  for (var i=0; i<PHOTOS.length; i++) {
    if (PHOTOS[i].id !== currentId && PHOTOS[i].tag === tag) rel.push(i);
  }
  for (var j=0; j<PHOTOS.length && rel.length<3; j++) {
    if (PHOTOS[j].id !== currentId && rel.indexOf(j) === -1) rel.push(j);
  }
  for (var k=0; k<Math.min(3, rel.length); k++) {
    html += '<div class="related-thumb" onclick="openLb(' + rel[k] + ')"><img src="' + getSrc(PHOTOS[rel[k]].id) + '" alt="" loading="lazy"/></div>';
  }
  return html;
}

/* ─── GALLERY ─────────────────────────────────────────────── */
function renderGallery() {
  var grid = document.getElementById('gal');
  if (!grid) return;
  if (!PHOTOS.length) {
    grid.innerHTML = '<p class="empty-msg" style="grid-column:1/-1">No photos yet.</p>';
    setText('gal-badge', '0'); renderTags(); return;
  }
  var html='', count=0;
  for (var i=0; i<PHOTOS.length; i++) {
    var p = PHOTOS[i];
    var hide = activeFilter && p.tag !== activeFilter;
    html += '<div class="gthumb' + (hide ? ' off' : '') + '" onclick="openLb(' + i + ')">';
    html += '<img src="' + getSrc(p.id) + '" alt="" loading="lazy"/>';
    html += '<button class="glike' + (liked[p.id] ? ' on' : '') + '" onclick="event.stopPropagation();doLike(\'' + p.id + '\')">' + (liked[p.id] ? '&#10084;' : '&#9825;') + '</button>';
    html += '</div>';
    if (!hide) count++;
  }
  grid.innerHTML = html;
  setText('gal-badge', count);
  renderTags();
}

function renderTags() {
  var wrap = document.getElementById('tag-row');
  if (!wrap) return;
  if (!PHOTOS.length) { wrap.innerHTML = ''; return; }
  var tags = ['All'];
  for (var i=0; i<PHOTOS.length; i++) if (tags.indexOf(PHOTOS[i].tag) === -1) tags.push(PHOTOS[i].tag);
  var html = '';
  for (var j=0; j<tags.length; j++) {
    var t = tags[j], active = (!activeFilter && t === 'All') || activeFilter === t;
    html += '<button class="tbtn' + (active ? ' on' : '') + '" onclick="doFilter(\'' + safe(t) + '\')">' + safe(t) + '</button>';
  }
  wrap.innerHTML = html;
}

function doFilter(tag) { activeFilter = tag === 'All' ? null : tag; renderGallery(); }

function doLike(id) {
  liked[id] = !liked[id];
  saveLiked();
  renderFeed(); renderGallery(); updateStats();
}

/* ─── LIGHTBOX ────────────────────────────────────────────── */
function openLb(idx) {
  lbIdx = idx;
  if (PHOTOS[lbIdx]) { PHOTOS[lbIdx].views = (PHOTOS[lbIdx].views||0)+1; savePhotos(); }
  showLb();
  document.getElementById('lb').className = 'lb on';
  document.body.style.overflow = 'hidden';
  updateStats();
}
function showLb() {
  if (lbIdx < 0) lbIdx = PHOTOS.length-1;
  if (lbIdx >= PHOTOS.length) lbIdx = 0;
  var p = PHOTOS[lbIdx];
  var img = document.getElementById('lb-img'); if (img) img.src = getSrc(p.id);
  var cap = document.getElementById('lb-cap'); if (cap) cap.innerHTML = '\u201c' + safe(p.caption) + '\u201d';
  var tag = document.getElementById('lb-tag'); if (tag) tag.textContent = p.tag;
}
function lbPrev() { lbIdx--; showLb(); }
function lbNext() { lbIdx++; showLb(); }
function closeLb() { document.getElementById('lb').className = 'lb'; document.body.style.overflow = ''; }
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { closeLb(); }
  var lb = document.getElementById('lb');
  if (lb && lb.className.indexOf('on') > -1) {
    if (e.key === 'ArrowLeft')  lbPrev();
    if (e.key === 'ArrowRight') lbNext();
  }
});

/* ─── COMMENTS ────────────────────────────────────────────── */
function renderComs(id) {
  var el = document.getElementById('cl-'+id); if (!el) return;
  var c = comments[id]||[];
  if (!c.length) { el.innerHTML='<div class="com-empty">No comments yet. Be first.</div>'; return; }
  var html='';
  for (var i=0; i<c.length; i++) {
    html += '<div class="com-item"><div class="com-name">'+safe(c[i].name)+'</div><div class="com-text">'+safe(c[i].text)+'</div></div>';
  }
  el.innerHTML = html;
}
function postCom(id) {
  var n = document.getElementById('cn-'+id);
  var t = document.getElementById('ct-'+id);
  if (!n||!t) return;
  var name=n.value.trim(), text=t.value.trim();
  if (!name||!text) return;
  if (!comments[id]) comments[id]=[];
  comments[id].push({name:name, text:text});
  n.value=''; t.value='';
  saveComments();
  renderComs(id); updateStats();
}

/* ─── SUBSCRIBE ── EmailJS notifies site owner ────────────── */
function swSubTab(mode) {
  subMode = mode;
  document.getElementById('sub-tab-email').className = 'sub-tab'+(mode==='email'?' on':'');
  document.getElementById('sub-tab-phone').className = 'sub-tab'+(mode==='phone'?' on':'');
  document.getElementById('sub-email-form').style.display = mode==='email'?'':'none';
  document.getElementById('sub-phone-form').style.display = mode==='phone'?'':'none';
}

function doSubscribe(type) {
  var inputId = type==='email' ? 'sub-email-input' : 'sub-phone-input';
  var v = val(inputId);
  if (!v) { flashErr('sub-err'); return; }

  /* Duplicate check */
  for (var i=0; i<subs.length; i++) {
    if (subs[i].value === v) { flashErr('sub-dup'); return; }
  }

  var ds = new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  subs.push({type:type, value:v, date:ds});
  setVal(inputId, '');
  saveSubs();
  flashOk('sub-ok', 5000);
  updateStats(); renderSubDash();

  /* Notify site owner via EmailJS */
  emailjs.send(EJ_SERVICE, EJ_TEMPLATE, {
    from_name:  'yamijpg Subscriber',
    from_email: type==='email' ? v : 'phone-subscriber@yamijpg',
    message:    'New subscriber!\n\nType: ' + type + '\nValue: ' + v + '\nDate: ' + ds
  }).catch(function(err){ console.warn('EmailJS sub notify failed:', err); });
}

/* ─── GUESTBOOK ───────────────────────────────────────────── */
function renderGuestbook() {
  var list  = document.getElementById('gb-list');
  var badge = document.getElementById('gb-badge');
  if (badge) badge.textContent = guestbook.length;
  if (!list) return;
  if (!guestbook.length) { list.innerHTML='<div class="com-empty" style="margin-bottom:16px">No entries yet. Be the first!</div>'; return; }
  var html='';
  for (var i=guestbook.length-1; i>=0; i--) {
    var g=guestbook[i];
    html += '<div class="gb-entry"><div class="gb-header"><div class="gb-name">'+safe(g.name)+'</div><div class="gb-date">'+safe(g.date)+'</div></div><div class="gb-text">'+safe(g.message)+'</div></div>';
  }
  list.innerHTML = html;
}
function postGuestbook() {
  var n=val('gb-name'), m=val('gb-msg');
  if (!n||!m) return;
  var ds = new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  guestbook.push({name:n, message:m, date:ds});
  setVal('gb-name',''); setVal('gb-msg','');
  saveGB();
  flashOk('gb-ok');
  renderGuestbook(); updateStats(); renderAdmGB();
}

/* ─── CONTACT ── EmailJS sends message to site owner ─────── */
function sendMsg() {
  var n = val('c-name');
  var e = val('c-email');
  var m = val('c-msg');
  if (!n || !m) return;

  disableBtn('c-send-btn');

  emailjs.send(EJ_SERVICE, EJ_TEMPLATE, {
    from_name:  n,
    from_email: e || 'No email provided',
    message:    m
  }).then(
    function() {
      setVal('c-name',''); setVal('c-email',''); setVal('c-msg','');
      flashOk('c-ok', 5000);
      enableBtn('c-send-btn');
    },
    function(err) {
      console.error('EmailJS error:', err);
      flashErr('c-err', 5000);
      enableBtn('c-send-btn');
    }
  );
}

/* ─── ADMIN: OPEN / CLOSE / AUTH ──────────────────────────── */
function openAdm() {
  var ov = document.getElementById('adm-overlay');
  if (ov) ov.className = 'adm-overlay on';
  document.body.style.overflow = 'hidden';
  if (authed) showDash(); else showLogin();
}
function closeAdm() {
  var ov = document.getElementById('adm-overlay');
  if (ov) ov.className = 'adm-overlay';
  document.body.style.overflow = '';
}
function showLogin() {
  show('adm-login-screen');
  document.getElementById('adm-dashboard').style.display = 'none';
}
function showDash() {
  hide('adm-login-screen');
  document.getElementById('adm-dashboard').style.display = 'flex';
  updateStats(); renderPostsTable(); renderSubDash(); renderAdmGB();
}
function checkPw() {
  var input = val('adm-pw');
  if (!input) { show('adm-err'); return; }
  sha256(input).then(function(hash) {
    if (hash === PASS_HASH) {
      authed = true;
      hide('adm-err');
      setVal('adm-pw', '');
      showDash();
    } else {
      show('adm-err');
    }
  });
}
document.getElementById('adm-pw').addEventListener('keydown', function(e){ if(e.key==='Enter') checkPw(); });
function doLogout() { authed=false; closeAdm(); }

function swAdmPane(name) {
  var panes = ['overview','upload','manage','subscribers','guestbook'];
  for (var i=0; i<panes.length; i++) {
    var p = document.getElementById('pane-'+panes[i]);
    var b = document.getElementById('anav-'+panes[i]);
    if (p) p.className = 'adm-pane'+(panes[i]===name?' on':'');
    if (b) b.className = 'adm-nav-item'+(panes[i]===name?' on':'');
  }
  if (name==='manage')      renderPostsTable();
  if (name==='subscribers') renderSubDash();
  if (name==='guestbook')   renderAdmGB();
  if (name==='overview')    updateStats();
}

/* ─── ADMIN: UPLOAD ───────────────────────────────────────── */
function prevFile(input) {
  var file = input.files[0]; if (!file) return;
  var r = new FileReader();
  r.onload = function(e) {
    var prev = document.getElementById('uz-prev');
    var lbl  = document.getElementById('uz-lbl');
    if (prev) { prev.src=e.target.result; prev.style.display='block'; }
    if (lbl)  lbl.style.display='none';
  };
  r.readAsDataURL(file);
}

function doUpload() {
  var fi      = document.getElementById('fi');
  var cap     = val('up-cap');
  var tag     = val('up-tag') || 'Untagged';
  var cam     = val('up-cam');
  var lens    = val('up-lens');
  var shutter = val('up-shutter');
  var iso     = val('up-iso');
  var feat    = document.getElementById('up-feat').value === '1';
  var comOpen = document.getElementById('up-com').value  === '1';

  if (!fi||!fi.files||!fi.files[0]||!cap) { flashErr('up-err'); return; }

  disableBtn('up-btn');

  var reader = new FileReader();
  reader.onload = function(evt) {
    var img = new Image();
    img.onload = function() {
      var MAX=1200, w=img.width, h=img.height;
      if (w>MAX||h>MAX) {
        if (w>=h) { h=Math.round(h*MAX/w); w=MAX; }
        else      { w=Math.round(w*MAX/h); h=MAX; }
      }
      var cv=document.createElement('canvas');
      cv.width=w; cv.height=h;
      cv.getContext('2d').drawImage(img,0,0,w,h);
      var src = cv.toDataURL('image/jpeg', 0.78);

      var newId = 'pu'+Date.now();
      var ds    = new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});

      if (feat) for (var i=0; i<PHOTOS.length; i++) PHOTOS[i].featured=false;

      /* Store image data and metadata separately */
      IMGS[newId] = src;
      saveImgs();

      PHOTOS.unshift({
        id:newId, tag:tag, caption:cap, date:ds,
        featured:feat, commentsOpen:comOpen, views:0,
        exif:{camera:cam, lens:lens, shutter:shutter, iso:iso}
      });
      savePhotos();

      /* Reset form */
      fi.value='';
      setVal('up-cap',''); setVal('up-tag','');
      setVal('up-cam',''); setVal('up-lens','');
      setVal('up-shutter',''); setVal('up-iso','');
      document.getElementById('up-feat').value='0';
      document.getElementById('up-com').value='1';
      var prev=document.getElementById('uz-prev');
      var lbl=document.getElementById('uz-lbl');
      if (prev){prev.style.display='none';prev.src='';}
      if (lbl) lbl.style.display='';

      enableBtn('up-btn');
      flashOk('up-ok');
      renderAll(); renderPostsTable();
    };
    img.onerror = function(){ flashErr('up-err'); enableBtn('up-btn'); };
    img.src = evt.target.result;
  };
  reader.onerror = function(){ flashErr('up-err'); enableBtn('up-btn'); };
  reader.readAsDataURL(fi.files[0]);
}

/* ─── ADMIN: MANAGE ───────────────────────────────────────── */
function renderPostsTable() {
  var tbody = document.getElementById('posts-tbody'); if (!tbody) return;
  if (!PHOTOS.length) {
    tbody.innerHTML='<tr><td colspan="5" class="empty-msg" style="padding:16px">No photos yet.</td></tr>';
    return;
  }
  var html='';
  for (var i=0; i<PHOTOS.length; i++) {
    var p=PHOTOS[i];
    html += '<tr>';
    html += '<td><img class="post-thumb-sm" src="'+getSrc(p.id)+'" alt=""/></td>';
    html += '<td><div class="post-cap-sm">'+safe(p.caption)+'</div>';
    html += '<div class="post-meta-sm">'+(p.views||0)+' views'+(p.featured?' · ★ featured':'')+'</div></td>';
    html += '<td><span class="tag-pill">'+safe(p.tag)+'</span></td>';
    html += '<td class="date-cell">'+safe(p.date)+'</td>';
    html += '<td><div class="act-btns">';
    html += '<button class="tog'+(p.commentsOpen?' on':'')+'" onclick="togCom(\''+p.id+'\')">'+(p.commentsOpen?'💬 On':'💬 Off')+'</button>';
    html += '<button class="btn btn-sm" onclick="pinPhoto(\''+p.id+'\')">★ Pin</button>';
    html += '<button class="btn btn-red btn-sm" onclick="delPhoto(\''+p.id+'\')">🗑 Del</button>';
    html += '</div></td></tr>';
  }
  tbody.innerHTML=html;
}

function togCom(id) {
  for (var i=0; i<PHOTOS.length; i++) {
    if (PHOTOS[i].id===id) { PHOTOS[i].commentsOpen=!PHOTOS[i].commentsOpen; break; }
  }
  savePhotos(); renderAll(); renderPostsTable();
}
function pinPhoto(id) {
  for (var i=0; i<PHOTOS.length; i++) PHOTOS[i].featured = (PHOTOS[i].id===id);
  savePhotos(); renderAll(); renderPostsTable();
}
function delPhoto(id) {
  /* Remove from PHOTOS array */
  PHOTOS = PHOTOS.filter(function(p){ return p.id!==id; });
  /* Remove uploaded image data if it exists */
  if (IMGS[id]) { delete IMGS[id]; saveImgs(); }
  /* If it was a built-in default we only remove the metadata entry —
     the image file stays on disk but the photo won't show anymore */
  savePhotos(); renderAll(); renderPostsTable();
}

/* ─── ADMIN: SUBSCRIBERS ──────────────────────────────────── */
function renderSubDash() {
  var list=document.getElementById('sub-dash-list'); if (!list) return;
  if (!subs.length) { list.innerHTML='<div class="empty-msg">No subscribers yet.</div>'; return; }
  var html='';
  for (var i=0; i<subs.length; i++) {
    var s=subs[i];
    html += '<div class="sub-dash-row">';
    html += '<div class="sub-dash-type">'+safe(s.type)+'</div>';
    html += '<div class="sub-dash-val">'+safe(s.value)+'</div>';
    html += '<div class="sub-dash-date">'+safe(s.date)+'</div>';
    html += '<button class="sub-remove" onclick="removeSub('+i+')">✕</button>';
    html += '</div>';
  }
  list.innerHTML=html;
}
function removeSub(i) { subs.splice(i,1); saveSubs(); renderSubDash(); updateStats(); }

/* ─── ADMIN: GUESTBOOK ────────────────────────────────────── */
function renderAdmGB() {
  var list=document.getElementById('adm-gb-list'); if (!list) return;
  if (!guestbook.length) { list.innerHTML='<div class="empty-msg">No entries yet.</div>'; return; }
  var html='';
  for (var i=guestbook.length-1; i>=0; i--) {
    var g=guestbook[i];
    html += '<div class="gb-entry" style="margin-bottom:10px">';
    html += '<div class="gb-header">';
    html += '<div class="gb-name">'+safe(g.name)+'</div>';
    html += '<div class="gb-date">'+safe(g.date)+'</div>';
    html += '<button class="sub-remove" onclick="delGB('+i+')" style="margin-left:auto">✕ Delete</button>';
    html += '</div><div class="gb-text">'+safe(g.message)+'</div></div>';
  }
  list.innerHTML=html;
}
function delGB(i) { guestbook.splice(i,1); saveGB(); renderGuestbook(); renderAdmGB(); updateStats(); }

/* ─── RENDER ALL ──────────────────────────────────────────── */
function renderAll() { updateHero(); renderFeed(); renderGallery(); updateStats(); renderGuestbook(); }

/* ─── SECRET FOOTER TAP (5×) opens admin on mobile ───────── */
var fbrand = document.getElementById('f-brand');
if (fbrand) {
  fbrand.addEventListener('click', function() {
    tapCount++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(function(){ tapCount=0; }, 2000);
    if (tapCount >= 5) { tapCount=0; openAdm(); }
  });
}

/* ─── BOOT ────────────────────────────────────────────────── */
renderAll();
