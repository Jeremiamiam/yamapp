type ToastType = 'error' | 'success' | 'info';

export type ToastAction = { label: string; onClick: () => void };

function showToast(
  message: string,
  type: ToastType = 'info',
  options?: { action?: ToastAction }
): void {
  if (typeof document === 'undefined') return; // SSR guard

  const el = document.createElement('div');
  el.style.cssText = [
    'position:fixed',
    'bottom:1.5rem',
    'right:1.5rem',
    'z-index:9999',
    'padding:0.75rem 1.25rem',
    'border-radius:0.5rem',
    'max-width:24rem',
    'font-size:0.875rem',
    'font-family:inherit',
    'line-height:1.4',
    `background:${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6'}`,
    'color:white',
    'box-shadow:0 4px 12px rgba(0,0,0,0.15)',
    'animation:_toast-in 0.2s ease',
    'display:flex',
    'align-items:center',
    'gap:0.75rem',
    'flex-wrap:wrap',
  ].join(';');

  const text = document.createElement('span');
  text.textContent = message;
  text.style.flex = '1 1 auto';
  el.appendChild(text);

  if (options?.action) {
    const btn = document.createElement('button');
    btn.textContent = options.action.label;
    btn.type = 'button';
    btn.style.cssText = [
      'padding:0.35rem 0.75rem',
      'border-radius:0.375rem',
      'border:none',
      'background:rgba(255,255,255,0.25)',
      'color:white',
      'font-size:0.8125rem',
      'font-weight:600',
      'cursor:pointer',
      'white-space:nowrap',
    ].join(';');
    btn.addEventListener('click', () => {
      options.action!.onClick();
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
  setTimeout(() => el.remove(), options?.action ? 8000 : 4000);
}

export const toast = {
  error: (msg: string) => showToast(msg, 'error'),
  success: (msg: string, options?: { action?: ToastAction }) => showToast(msg, 'success', options),
  info: (msg: string) => showToast(msg, 'info'),
};
