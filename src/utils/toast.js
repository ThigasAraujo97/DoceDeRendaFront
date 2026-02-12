export function toastSuccess(message, duration) {
  try {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', message, duration } }));
  } catch (e) {
    // fallback to alert
    try { alert(message); } catch (err) {}
  }
}

export function toastError(message, duration) {
  try {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'error', message, duration } }));
  } catch (e) {
    try { alert(message); } catch (err) {}
  }
}
