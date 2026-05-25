function inIframe(): boolean {
  try { return window !== window.top; } catch { return true; }
}

function toonPdfToast(url: string, filename: string): void {
  const bestaand = document.getElementById('kbf-pdf-toast');
  if (bestaand) bestaand.remove();

  const toast = document.createElement('div');
  toast.id = 'kbf-pdf-toast';
  toast.style.cssText = [
    'position:fixed', 'bottom:24px', 'left:50%', 'transform:translateX(-50%)',
    'background:#0f172a', 'color:white', 'padding:14px 20px', 'border-radius:10px',
    'font-size:13px', 'z-index:9999', 'display:flex', 'flex-direction:column',
    'gap:10px', 'box-shadow:0 4px 24px rgba(0,0,0,0.4)', 'max-width:92vw',
    'font-family:sans-serif',
  ].join(';');

  const tekst = document.createElement('span');
  tekst.textContent = `PDF klaar: ${filename}`;
  tekst.style.cssText = 'font-weight:600;color:#e2e8f0';

  const instructie = document.createElement('span');
  instructie.textContent = 'Rechts-klik op de link hieronder → "Openen in nieuw venster"';
  instructie.style.cssText = 'color:#94a3b8;font-size:12px';

  const link = document.createElement('a');
  link.href = url;
  link.textContent = `📄 ${filename}`;
  link.style.cssText = 'color:#5eead4;text-decoration:underline;font-weight:600;word-break:break-all;cursor:context-menu';

  const sluit = document.createElement('button');
  sluit.textContent = 'Sluiten';
  sluit.style.cssText = 'align-self:flex-end;background:#1e293b;border:1px solid #334155;color:#94a3b8;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-family:sans-serif';
  sluit.onclick = () => { toast.remove(); URL.revokeObjectURL(url); };

  toast.append(tekst, instructie, link, sluit);
  document.body.appendChild(toast);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);

  if (inIframe()) {
    toonPdfToast(url, filename);
    return;
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}
