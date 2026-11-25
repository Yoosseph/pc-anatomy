// Restore the explorer's theme before the app or static guide paints.
try {
  if (localStorage.getItem('pc-anatomy-theme') === 'light') {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.classList.remove('dark');
  }
} catch {
  // Storage is optional.
}
