'use client';

import { useState } from 'react';

export function ProjectImage({
  url,
  fallback,
}: {
  url: string | null;
  fallback: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!url || failedUrl === url)
    return <span className="project-card__visual">{fallback}</span>;
  // Backend media URLs are served by its controlled public media endpoint.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="project-card__visual"
      src={url}
      alt=""
      loading="lazy"
      width={640}
      height={360}
      style={{ objectFit: 'cover' }}
      onError={() => setFailedUrl(url)}
    />
  );
}
