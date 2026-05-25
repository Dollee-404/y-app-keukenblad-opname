interface Props {
  bericht: string;
  onBevestigen: () => void;
  onAnnuleren: () => void;
}

export default function ConfirmModal({ bericht, onBevestigen, onAnnuleren }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onAnnuleren}
    >
      <div
        style={{
          background: 'white', borderRadius: 12, padding: '24px 28px',
          maxWidth: 380, width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#0f172a', lineHeight: 1.5 }}>
          {bericht}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onAnnuleren}
            style={{
              padding: '8px 16px', fontSize: 13, borderRadius: 6,
              border: '1px solid #cbd5e1', background: 'white',
              color: '#475569', cursor: 'pointer', minWidth: 80,
            }}
          >
            Annuleren
          </button>
          <button
            onClick={onBevestigen}
            style={{
              padding: '8px 16px', fontSize: 13, borderRadius: 6,
              border: 'none', background: '#ef4444',
              color: 'white', cursor: 'pointer', fontWeight: 600, minWidth: 80,
            }}
          >
            Doorgaan
          </button>
        </div>
      </div>
    </div>
  );
}
