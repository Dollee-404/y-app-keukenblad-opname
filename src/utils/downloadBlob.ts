export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);

  // Poging 1: anchor-click download
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Poging 2: nieuw tabblad (iframe-safe, user-initiated context)
  setTimeout(() => {
    const newTab = window.open(url, '_blank');
    if (newTab) {
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } else {
      toonDownloadToast(url, filename);
    }
  }, 150);
}

function toonDownloadToast(url: string, filename: string): void {
  const toast = document.createElement('div');
  toast.style.cssText = [
    'position:fixed', 'bottom:24px', 'left:50%', 'transform:translateX(-50%)',
    'background:#0f172a', 'color:white', 'padding:12px 20px', 'border-radius:8px',
    'font-size:13px', 'z-index:9999', 'display:flex', 'gap:12px', 'align-items:center',
    'box-shadow:0 4px 16px rgba(0,0,0,0.3)', 'max-width:90vw',
  ].join(';');

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.textContent = 'Klik hier om op te slaan';
  link.style.cssText = 'color:#5eead4;text-decoration:underline;font-weight:600;white-space:nowrap';

  const sluit = document.createElement('button');
  sluit.textContent = '×';
  sluit.style.cssText = 'background:none;border:none;color:#94a3b8;cursor:pointer;font-size:18px;padding:0;margin-left:4px;line-height:1';
  sluit.onclick = () => {
    toast.remove();
    URL.revokeObjectURL(url);
  };

  const tekst = document.createElement('span');
  tekst.textContent = 'PDF gereed —';

  toast.append(tekst, link, sluit);
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
    URL.revokeObjectURL(url);
  }, 15_000);
}
