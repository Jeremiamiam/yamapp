type ToastType = 'error' | 'success' | 'info';

export type ToastAction = { label: string; onClick: () => void };

const DISPLAY_MAX_LEN = 120;

function showToast(
  message: string,
  type: ToastType = 'info',
  options?: { action?: ToastAction; duration?: number }
): void {
  if (typeof document === 'undefined') return; // SSR guard

  const el = document.createElement('div');
  el.style.cssText = [
    'position:fixed',
    'bottom:1.5rem',
    'right:1.5rem',
    'left:1rem',
    'max-width:min(24rem,calc(100vw - 2rem))',
    'margin-left:auto',
    'z-index:9999',
    'padding:0.75rem 1rem',
    'border-radius:0.5rem',
    'font-size:0.875rem',
    'font-family:inherit',
    'line-height:1.4',
    'word-break:break-word',
    `background:${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6'}`,
    'color:white',
    'box-shadow:0 4px 12px rgba(0,0,0,0.15)',
    'animation:_toast-in 0.2s ease',
    'display:flex',
    'align-items:flex-start',
    'gap:0.5rem',
    'flex-wrap:nowrap',
  ].join(';');

  const text = document.createElement('span');
  text.textContent = message.length > DISPLAY_MAX_LEN ? message.slice(0, DISPLAY_MAX_LEN) + '…' : message;
  text.style.cssText = 'flex:1 1 auto;min-width:0;overflow:hidden';
  el.appendChild(text);

  const hasCopy = type === 'error' && typeof navigator?.clipboard?.writeText === 'function';
  const action = options?.action ?? (hasCopy ? { label: 'Copier', onClick: () => {} } : undefined);

  if (action) {
    const btn = document.createElement('button');
    btn.textContent = action.label;
    btn.type = 'button';
    btn.style.cssText = [
      'padding:0.35rem 0.6rem',
      'border-radius:0.375rem',
      'border:none',
      'background:rgba(255,255,255,0.25)',
      'color:white',
      'font-size:0.75rem',
      'font-weight:600',
      'cursor:pointer',
      'white-space:nowrap',
      'flex-shrink:0',
    ].join(';');
    btn.addEventListener('click', async () => {
      if (hasCopy && !options?.action) {
        try {
          await navigator.clipboard.writeText(message);
        } catch {
          /* ignore */
        }
      } else {
        action.onClick();
      }
      el.remove();
    });
    el.appendChild(btn);
  }

  if (!document.getElementById('_yam-toast-style')) {
    const style = document.createElement('style');
    style.id = '_yam-toast-style';
    style.textContent =
      '@keyframes _toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);
  }

  document.body.appendChild(el);
  const duration = options?.duration ?? (action ? 10000 : type === 'error' ? 10000 : 4000);
  setTimeout(() => el.remove(), duration);
}

export const toast = {
  error: (msg: string, options?: { duration?: number; action?: ToastAction }) =>
    showToast(msg, 'error', options),
  success: (msg: string, options?: { action?: ToastAction; duration?: number }) =>
    showToast(msg, 'success', options),
  info: (msg: string, options?: { duration?: number }) => showToast(msg, 'info', options),
};
