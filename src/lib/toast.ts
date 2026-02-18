type ToastType = 'error' | 'success' | 'info';

function showToast(message: string, type: ToastType = 'info'): void {
  if (typeof document === 'undefined') return; // SSR guard

  const el = document.createElement('div');
  el.textContent = message;

  const colors: Record<ToastType, string> = {
    error: '#ef4444',
    success: '#22c55e',
    info: '#3b82f6',
  };

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
    `background:${colors[type]}`,
    'color:white',
    'box-shadow:0 4px 12px rgba(0,0,0,0.15)',
    'animation:_toast-in 0.2s ease',
  ].join(';');

  if (!document.getElementById('_yam-toast-style')) {
    const style = document.createElement('style');
    style.id = '_yam-toast-style';
    style.textContent =
      '@keyframes _toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);
  }

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

export const toast = {
  error: (msg: string) => showToast(msg, 'error'),
  success: (msg: string) => showToast(msg, 'success'),
  info: (msg: string) => showToast(msg, 'info'),
};
