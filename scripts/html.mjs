// Escape HTML condiviso dagli script di generazione (build, grafici, mappe).
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
