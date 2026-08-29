'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function ShareProjectButton({ projectName }: { projectName: string }) {
  const t = useTranslations('ProjectDetail');
  const [message, setMessage] = useState('');

  async function share() {
    setMessage('');
    const data = {
      title: projectName,
      text: `${projectName} projesini incele`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(data);
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setMessage('Bağlantı kopyalandı.');
      } else setMessage('Bu tarayıcı paylaşmayı desteklemiyor.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMessage('Paylaşım tamamlanamadı.');
    }
  }

  return (
    <span className="share-control">
      <button type="button" onClick={() => void share()}>
        ↗ {t('share')}
      </button>
      {message && <small role="status">{message}</small>}
    </span>
  );
}
