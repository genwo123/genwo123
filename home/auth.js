/**
 * auth.js — WG 포트폴리오 편집 모드 인증
 * 각 페이지에서 <script src="...auth.js"></script> 로 불러오면 됩니다.
 * Gist 토큰/ID는 각 페이지에서 GIST_TOKEN, GIST_ID 변수로 선언해두세요.
 */

const AUTH = (() => {
  const HASH = '4498171e1e5bda8c0d382dc9f6bc77bb23017c66f069d87cd91898980210d222';
  const SESSION_KEY = 'wg_edit_auth';

  // ── SHA-256 해시 ──────────────────
  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  // ── 인증 상태 확인 ─────────────────
  function isAuthed() {
    return sessionStorage.getItem(SESSION_KEY) === 'ok';
  }

  // ── 잠금 아이콘 렌더 ──────────────
  function renderLockBtn() {
    const btn = document.createElement('button');
    btn.id = 'auth-btn';
    btn.innerHTML = isAuthed() ? '✎ 편집중' : '⊘';
    btn.style.cssText = `
      font-family:'DM Mono',monospace; font-size:10px; letter-spacing:1.5px;
      padding:6px 14px; border-radius:2px; cursor:pointer; transition:all .2s;
      background:transparent; outline:none;
      ${isAuthed()
        ? 'border:1px solid rgba(61,168,106,.4); color:#3da86a;'
        : 'border:1px solid #2e2e3a; color:#4a4858;'}
    `;
    btn.addEventListener('click', () => isAuthed() ? logout() : showModal());
    return btn;
  }

  // ── Nav에 버튼 주입 ───────────────
  function injectBtn() {
    const navRight = document.querySelector('.nav-right');
    if (!navRight) return;
    const existing = document.getElementById('auth-btn');
    if (existing) existing.remove();
    navRight.prepend(renderLockBtn());
  }

  // ── 모달 ──────────────────────────
  function showModal() {
    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.style.cssText = `
      position:fixed; inset:0; z-index:9999;
      background:rgba(0,0,0,0.7); backdrop-filter:blur(8px);
      display:flex; align-items:center; justify-content:center;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background:#111115; border:1px solid #2e2e3a; border-radius:8px;
      padding:32px 36px; min-width:300px; text-align:center;
    `;

    box.innerHTML = `
      <div style="font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:2px;color:#f0eee8;margin-bottom:6px;">EDIT MODE</div>
      <div style="font-family:'DM Mono',monospace;font-size:10px;color:#4a4858;letter-spacing:2px;margin-bottom:24px;">비밀번호를 입력하세요</div>
      <input id="auth-input" type="password" placeholder="••••••"
        style="width:100%;background:#0c0c0e;border:1px solid #2e2e3a;border-radius:3px;
               padding:10px 14px;color:#f0eee8;font-family:'DM Mono',monospace;font-size:14px;
               outline:none;letter-spacing:4px;text-align:center;margin-bottom:12px;" />
      <div id="auth-err" style="font-family:'DM Mono',monospace;font-size:10px;color:#e8391a;height:16px;margin-bottom:12px;"></div>
      <div style="display:flex;gap:10px;">
        <button id="auth-cancel" style="flex:1;padding:10px;background:transparent;border:1px solid #2e2e3a;border-radius:2px;color:#7a7888;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;cursor:pointer;">취소</button>
        <button id="auth-confirm" style="flex:1;padding:10px;background:#e8391a;border:none;border-radius:2px;color:#fff;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:1px;cursor:pointer;">확인</button>
      </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const input = document.getElementById('auth-input');
    const err   = document.getElementById('auth-err');
    input.focus();

    async function tryAuth() {
      const hash = await sha256(input.value);
      if (hash === HASH) {
        sessionStorage.setItem(SESSION_KEY, 'ok');
        overlay.remove();
        injectBtn();
        onAuthChange(true);
      } else {
        err.textContent = '비밀번호가 틀렸습니다';
        input.value = '';
        input.focus();
        input.style.borderColor = '#e8391a';
        setTimeout(() => { input.style.borderColor = '#2e2e3a'; err.textContent = ''; }, 2000);
      }
    }

    document.getElementById('auth-confirm').addEventListener('click', tryAuth);
    document.getElementById('auth-cancel').addEventListener('click', () => overlay.remove());
    input.addEventListener('keydown', e => { if (e.key === 'Enter') tryAuth(); });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  // ── 로그아웃 ──────────────────────
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    injectBtn();
    onAuthChange(false);
  }

  // ── 인증 변경 콜백 ────────────────
  // 각 페이지에서 AUTH.onChange = (authed) => { ... } 로 오버라이드 가능
  function onAuthChange(authed) {
    if (typeof AUTH.onChange === 'function') AUTH.onChange(authed);
  }

  // ── 초기화 ────────────────────────
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectBtn);
    } else {
      injectBtn();
    }
  }

  init();

  return { isAuthed, showModal, logout, onChange: null };
})();
