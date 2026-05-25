function inIframe(): boolean {
  try { return window !== window.top; } catch { return true; }
}

function toonPdfInOverlay(dataUrl: string, filename: string): void {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;background:#1e293b';

  const balk = document.createElement('div');
  balk.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:#0f172a;flex-shrink:0';

  const label = document.createElement('span');
  label.textContent = filename;
  label.style.cssText = 'color:#e2e8f0;font-size:13px;font-weight:600;font-family:sans-serif';

  const sluit = document.createElement('button');
  sluit.textContent = 'Sluiten ✕';
  sluit.style.cssText = 'background:#334155;border:none;color:#e2e8f0;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px;font-family:sans-serif';
  sluit.onclick = () => overlay.remove();

  balk.append(label, sluit);

  const frame = document.createElement('iframe');
  frame.src = dataUrl;
  frame.style.cssText = 'flex:1;border:none;width:100%;background:white';

  overlay.append(balk, frame);
  document.body.appendChild(overlay);
}

export function downloadBlob(blob: Blob, filename: string): void {
  if (inIframe()) {
    // Brave blokkeert blob URLs — data URI is inline data en wordt niet geblokkeerd
    const reader = new FileReader();
    reader.onload = () => toonPdfInOverlay(reader.result as string, filename);
    reader.readAsDataURL(blob);
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}
