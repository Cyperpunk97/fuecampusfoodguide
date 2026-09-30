import { memo, useEffect, useId, useRef, useState, type FormEvent, type ReactNode, type TouchEvent } from 'react';
import { ArrowRight, ArrowUpDown, Bookmark, BookOpen, Check, ChevronRight, Clock3, Coffee, GraduationCap, Heart, MapPin, Navigation, Plus, Sparkles, Star, UtensilsCrossed, X } from 'lucide-react';
import { directionsUrl, distanceLabel, faculties, moods, type Memory, type MenuItem, type Venue } from './data';
import { triggerHaptic } from './native';
import { useI18n } from './i18n';

export function BrandMark({ className = '' }: { className?: string }) {
  return <span className={`brand-mark ${className}`} aria-hidden="true"><UtensilsCrossed size={23} strokeWidth={1.8} /><span className="brand-spark">✦</span></span>;
}
export function Avatar({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`avatar ${className}`} aria-hidden="true">{name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'CF'}</span>;
}
export const VenueLogo = memo(function VenueLogo({ venue, className = '', compact = false }: { venue: Venue; className?: string; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [venue.logoUrl]);
  const words = venue.brand.replace(/[^\p{L}\p{N}\s'&-]/gu, ' ').split(/[\s-]+/).filter(w => w && !/^(the|of|and|de|el|a)$/i.test(w));
  const initials = words.length === 1 ? words[0].slice(0, 2).toUpperCase() : words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const wide = Boolean(venue.logoWidth && venue.logoHeight && venue.logoWidth / venue.logoHeight > 1.6);
  const showLogo = venue.logoUrl && !failed && !(compact && wide);
  return <span className={`venue-logo ${wide ? 'wordmark' : ''} ${className}`}>
    {showLogo ? <img src={venue.logoUrl!} alt={`${venue.brand} logo`} loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <span className="logo-monogram" aria-label={venue.brand}>{initials || venue.brand.slice(0, 2)}</span>}
  </span>;
});

export function Dialog({ title, children, onClose, className = '', hideHeader = false }: { title: string; children: ReactNode; onClose: () => void; className?: string; hideHeader?: boolean }) {
  const { t } = useI18n(); const ref = useRef<HTMLDivElement>(null); const closeRef = useRef(onClose); const titleId = useId(); closeRef.current = onClose;
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element && event.target.closest('.sheet-drag-handle-bar, .sheet-logo-header, .dialog-heading'))) return;
    const touch = event.touches[0]; dragStart.current = { x: touch.clientX, y: touch.clientY };
  };
  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = dragStart.current; dragStart.current = null;
    if (!start || !window.matchMedia('(max-width: 760px)').matches) return;
    const touch = event.changedTouches[0]; const dy = touch.clientY - start.y;
    if (dy > 85 && dy > Math.abs(touch.clientX - start.x) * 1.4) closeRef.current();
  };
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null; const oldOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]') || []).filter(el => el.offsetParent !== null);
    const timer = window.setTimeout(() => (ref.current?.querySelector<HTMLElement>('[data-autofocus]') || focusable()[0] || ref.current)?.focus(), 30);
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); }
      if (e.key !== 'Tab') return;
      const nodes = focusable(); const first = nodes[0]; const last = nodes[nodes.length - 1];
      if (!nodes.length) { e.preventDefault(); ref.current?.focus(); }
      else if (e.shiftKey && (document.activeElement === first || !ref.current?.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { clearTimeout(timer); document.removeEventListener('keydown', key); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, []);
  return <div className={`dialog-overlay ${className.includes('venue-dialog') ? 'sheet-overlay' : ''}`} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className={`dialog-panel ${className}`} ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    {!className.includes('venue-dialog') && <div className="sheet-drag-handle-bar" aria-hidden="true"><span className="sheet-drag-pill" /></div>}
    {hideHeader ? <h2 className="sr-only" id={titleId}>{title}</h2> : <div className="dialog-heading"><h2 id={titleId}>{title}</h2><button className="icon-button" onClick={onClose} aria-label={t('Close', 'إغلاق')}><X size={20} /></button></div>}{children}
  </div></div>;
}

export function PriceLabel({ venue, showNote = true }: { venue: Venue; showNote?: boolean }) {
  const { t, n } = useI18n();
  return <span className="price-label"><strong>{venue.averagePrice !== null ? `≈ ${n(Math.round(venue.averagePrice))}` : `${n(venue.priceMin)}–${n(venue.priceMax)}`} <small>{t('EGP', 'ج.م')}</small></strong>{showNote && <span>{venue.averagePrice !== null ? `${t('from', 'من')} ${n(venue.priceReports)} ${t('students', 'طالب')}` : t('approx. / person', 'تقريبًا للفرد')}</span>}</span>;
}
export function DishBadges({ item }: { item: MenuItem }) {
  const { t } = useI18n();
  return <span className="dish-badges">{item.isPopular && <span className="dish-popular"><Star size={10} />{t('Popular')}</span>}{item.isStudentDeal && <span className="dish-deal"><GraduationCap size={11} />{t('Student deal')}</span>}{item.isVegetarian && <span>{t('Likely vegetarian')}</span>}{item.isSpicy && <span className="dish-spicy">♨ {t('Spicy')}</span>}</span>;
}

export type VenueTab = 'overview' | 'menu' | 'reviews' | 'study';
export type VenueAction = (action: 'open' | 'favorite' | 'compare', venue: Venue, tab?: VenueTab) => void;
export const VenueCard = memo(function VenueCard({ venue: v, favorite, compared, onAction, menuCount, origin }: { venue: Venue; favorite: boolean; compared: boolean; onAction: VenueAction; menuCount: number; origin?: { lat: number; lng: number } }) {
  const { t, n } = useI18n();
  const wideLogo = Boolean(v.logoUrl && v.logoWidth && v.logoHeight && v.logoWidth / v.logoHeight > 1.6);
  return <article className={`venue-card ${wideLogo ? 'venue-card-wide-logo' : ''} ${compared ? 'is-compared' : ''}`}>
    <button className="venue-card-main" onClick={() => onAction('open', v)} aria-label={`${t('Explore', 'اكتشف')} ${v.name}`}>
      <div className="venue-card-top"><VenueLogo venue={v} /><span className="venue-kind">{v.category === 'Cafe' ? <Coffee size={13} /> : <UtensilsCrossed size={13} />}{t(v.kind)}</span></div>
      <div className="venue-title-row"><h3>{v.brand}</h3>{v.reviewCount ? <span className="rating"><Star size={13} fill="currentColor" /><b>{n(v.rating.toFixed(1))}</b><span>({n(v.reviewCount)})</span></span> : <span className="unrated-tag">{t('No reviews yet')}</span>}</div>
      <p className="venue-address"><MapPin size={13} /><span>{v.location}</span></p>
      <p className="venue-signature"><span>{t(v.kind)}</span>{v.onCampus && <span className="venue-campus-separator">/ {t('On campus')}</span>}</p>
      <div className="venue-card-meta"><span><Clock3 size={14} /><strong>{n(v.walk)} {t('min walk', 'دقيقة مشي')}</strong><small>{n(distanceLabel(v))}</small></span><PriceLabel venue={v} /></div>
      <div className="venue-status">{v.onCampus && <span><i />{t('On campus')}</span>}{v.openState === 'open' && <span className="open-badge">{t('Open now')}</span>}{v.openState === 'closed' && <span className="closed-badge">{t('Closed')}</span>}{v.approximate && <span>{t('Approximate location')}</span>}</div>
    </button>
    <button className={`favorite-heart ${favorite ? 'is-favorite' : ''}`} aria-label={`${favorite ? t('Remove') : t('Save')} ${v.brand}`} aria-pressed={favorite} onClick={() => { void triggerHaptic(favorite ? 'light' : 'success'); onAction('favorite', v); }}><Heart size={18} fill={favorite ? 'currentColor' : 'none'} /></button>
    <div className="venue-card-actions">
      <button onClick={() => onAction('open', v, 'menu')}>
        <BookOpen size={14} />{t('View menu')}{menuCount > 0 && <span>{n(menuCount)}</span>}<ChevronRight size={14} />
      </button>
      <a
        href={directionsUrl(v, origin)}
        target="_blank"
        rel="noopener noreferrer"
        className="card-quick-dir"
        title={t('Directions')}
        aria-label={`${t('Directions')} ${v.brand}`}
        onClick={(e) => { e.stopPropagation(); void triggerHaptic('selection'); }}
      >
        <Navigation size={13} />
        <span>{t('Directions')}</span>
      </a>
      <button className={compared ? 'compared' : ''} onClick={() => { void triggerHaptic('selection'); onAction('compare', v); }} aria-pressed={compared} aria-label={`${t('Compare')} ${v.brand}`}>
        {compared ? <Check size={14} /> : <ArrowUpDown size={14} />}{t('Compare')}
      </button>
    </div>
  </article>;
});

export function ProfileEditor({ name, facultyId, onSave, favoriteCount, reviewCount }: { name: string; facultyId: string; onSave: (name: string, facultyId: string) => void; favoriteCount: number; reviewCount: number }) {
  const { t, n, lang } = useI18n(); const [draftName, setName] = useState(name === 'Campus foodie' ? '' : name); const [faculty, setFaculty] = useState(facultyId); const [error, setError] = useState('');
  return <form className="profile-form" onSubmit={e => { e.preventDefault(); if (draftName.trim().length < 2) { setError(t('Enter a name with at least 2 characters.', 'اكتب اسم من حرفين على الأقل.')); return; } onSave(draftName.trim(), faculty); }}>
    <div className="profile-preview"><Avatar name={draftName || 'Campus foodie'} className="avatar-large" /><h3>{t('Your campus corner.', 'ركنك في الجامعة.')}</h3><p>{t('Your name, your faculty, your favorite spots.', 'اسمك وكليتك وأماكنك المفضلة.')}</p></div><div className="profile-stats"><span><strong>{n(favoriteCount)}</strong>{t('saved spots', 'مكان محفوظ')}</span><span><strong>{n(reviewCount)}</strong>{t('your reviews', 'تقييماتك')}</span></div>
    <label className="field-label">{t('Your name')}<input data-autofocus required minLength={2} maxLength={60} value={draftName} onChange={e => setName(e.target.value)} placeholder={t('Name or student ID', 'الاسم أو الرقم الجامعي')} /></label>
    <label className="field-label">{t('Your faculty')}<select value={faculty} onChange={e => setFaculty(e.target.value)}>{faculties.map(f => <option key={f.id} value={f.id}>{lang === 'ar' ? f.nameAr : f.name}</option>)}</select></label>
    <div className="form-info"><GraduationCap size={18} /><p>{t('Distances and walking estimates start from your faculty building.', 'المسافات ووقت المشي بيتحسبوا من مبنى كليتك.')}</p></div><p className="privacy-note"><Bookmark size={14} />{t('This is a device profile, not an authenticated account.', 'ده ملف على جهازك، مش حساب مسجّل.')}</p>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary button-full" type="submit">{t('Save profile')}<Check size={16} /></button>
  </form>;
}

export function MemoryComposer({ name, facultyId, allVenues, connected, onSave }: { name: string; facultyId: string; allVenues: Venue[]; connected: boolean; onSave: (m: Memory) => Promise<void> }) {
  const { t, lang } = useI18n(); const [author, setAuthor] = useState(name === 'Campus foodie' ? '' : name); const [title, setTitle] = useState(''); const [caption, setCaption] = useState('');
  const [venueId, setVenue] = useState('fue-cilantro'); const [venueName, setVenueName] = useState(''); const [faculty, setFaculty] = useState(facultyId);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [mood, setMood] = useState<Memory['mood']>('celebration'); const [tags, setTags] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const selected = allVenues.find(v => v.id === venueId);
  const submit = async (e: FormEvent) => { e.preventDefault(); if (title.trim().length < 3 || author.trim().length < 2 || caption.trim().length < 5 || (!selected && venueName.trim().length < 2)) { setError(t('Please complete the title, name, place, and story.', 'كمّل العنوان والاسم والمكان والحكاية.')); return; } setBusy(true); setError('');
    try { await onSave({ id: `memory-${Date.now()}`, title: title.trim(), caption: caption.trim(), name: author.trim(), venueId, venueName: selected?.name || venueName.trim(), date: new Date().toISOString(), outingDate: date, mood, faculty: faculties.find(f => f.id === faculty)?.name || '', tags: tags.split(',').map(s => s.trim().slice(0, 30)).filter(Boolean).slice(0, 6), cheers: 0, source: connected ? 'community' : 'device' }); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  return <form className="memory-form" onSubmit={submit}><p className="muted">{t('Keep the story, the mood, and the people. Only original venue logos are used.', 'احتفظ بالحكاية والمزاج والناس. بنعرض شعارات الأماكن الأصلية فقط.')}</p><div className="memory-composer-brand">{selected ? <VenueLogo venue={selected} /> : <UtensilsCrossed size={30} />}<div><strong>{selected?.brand || t('Your campus moment', 'ذكريتك في الجامعة')}</strong><span>{t('No stock photos. Just your story.', 'من غير صور جاهزة. حكايتك بس.')}</span></div></div>
    <label className="field-label">{t('Title')}<input data-autofocus required minLength={3} maxLength={100} value={title} onChange={e => setTitle(e.target.value)} placeholder={t('A campus moment worth keeping…', 'ذكرى من الجامعة تستاهل تتحفظ…')} /></label>
    <label className="field-label">{t('Your story')}<textarea required minLength={5} maxLength={1000} rows={4} value={caption} onChange={e => setCaption(e.target.value)} placeholder={t('Where did you go? What happened?', 'رحت فين؟ وإيه اللي حصل؟')} /><span className="field-hint">{caption.length}/1000</span></label>
    <div className="form-columns"><label className="field-label">{t('Your name')}<input required minLength={2} maxLength={50} value={author} onChange={e => setAuthor(e.target.value)} /></label><label className="field-label">{t('Places')}<select value={venueId} onChange={e => setVenue(e.target.value)}>{allVenues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}<option value="">{t('Another place…', 'مكان تاني…')}</option></select></label></div>
    {!venueId && <label className="field-label">{t('Place name', 'اسم المكان')}<input required minLength={2} maxLength={80} value={venueName} onChange={e => setVenueName(e.target.value)} /></label>}
    <div className="form-columns"><label className="field-label">{t('Date of outing')}<input type="date" required value={date} onChange={e => setDate(e.target.value)} /></label><label className="field-label">{t('Mood')}<select value={mood} onChange={e => setMood(e.target.value as Memory['mood'])}>{moods.map(m => <option key={m.id} value={m.id}>{m.emoji} {lang === 'ar' ? m.labelAr : m.label}</option>)}</select></label></div>
    <label className="field-label">{t('Faculty / department')}<select value={faculty} onChange={e => setFaculty(e.target.value)}>{faculties.map(f => <option key={f.id} value={f.id}>{lang === 'ar' ? f.nameAr : f.name}</option>)}</select></label>
    <label className="field-label">{t('Tags')}<input value={tags} maxLength={185} onChange={e => setTags(e.target.value)} placeholder={t('Friends, lunch break, CS crew… (comma-separated)', 'صحاب، بريك، دفعة الحاسبات… (افصل بفاصلة)')} /></label>
    <p className="privacy-note"><Bookmark size={14} />{connected ? t('Posts to your configured community backend.', 'هيتنشر على خادم المجتمع المتصل.') : t('Saved privately on this device.', 'محفوظة بشكل خاص على جهازك.')}</p>{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" className="button button-primary button-full" disabled={busy}>{busy ? t('Saving…', 'جارٍ الحفظ…') : connected ? t('Share a memory') : t('Save memory')}<Plus size={16} /></button>
  </form>;
}

export const EmptyState = memo(function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon">{icon || <Sparkles size={28} />}</span><h3>{title}</h3><p>{description}</p>{action}</div>;
});
export function LoadingLine({ label }: { label: string }) { return <span className="loading-line"><span />{label}<ArrowRight size={13} /></span>; }
