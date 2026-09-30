import { memo, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Utensils } from 'lucide-react';
import { normalizeDishImage } from './menuLogic';

export const MenuItemThumb = memo(function MenuItemThumb({ src, alt, className = '', retryable = true }: { src?: string | null; alt: string; className?: string; retryable?: boolean }) {
  const safeSrc = useMemo(() => normalizeDishImage(src), [src]);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { setError(false); setLoaded(false); setAttempt(0); }, [safeSrc]);
  if (!safeSrc || error) {
    return (
      <span className={`menu-item-thumb-placeholder ${className}`}>
        <Utensils size={18} strokeWidth={1.5} aria-hidden="true" />
        {safeSrc && retryable && <button className="photo-retry" aria-label={`Retry ${alt} photo`} onClick={e => { e.stopPropagation(); setAttempt(value => value + 1); setError(false); setLoaded(false); }}><RefreshCw size={11} /></button>}
      </span>
    );
  }
  return (
    <span className={`menu-item-thumb ${loaded ? 'photo-loaded' : 'photo-loading'} ${className}`}>
      <img
        key={`${safeSrc}-${attempt}`}
        src={safeSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </span>
  );
});
