import { useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpDown, BookOpen, Check, ChevronRight, Coffee, ExternalLink, GraduationCap, Leaf, LoaderCircle, MapPin, Plug, Search, ShieldCheck, Star, TrendingUp, TriangleAlert, Wallet, Wifi, Zap } from 'lucide-react';
import { api, validateBackend } from './api';
import { Dialog, DishBadges, EmptyState, PriceLabel, VenueLogo } from './components';
import { distanceLabel, faculties, normalized, studyAttributes, type AttributeId, type AttributeTally, type MenuItem, type RestaurantMenu, type Review, type StudyVotes, type Venue } from './data';
import { useI18n } from './i18n';

export type Filters = { priceTiers: number[]; minRating: number; maxDistance: number; onCampusOnly: boolean; favoritesOnly: boolean; openNowOnly: boolean; studyOnly: boolean; vegetarian: boolean; spicy: boolean; studentDealsOnly: boolean };
export const defaultFilters: Filters = { priceTiers: [], minRating: 0, maxDistance: 0, onCampusOnly: false, favoritesOnly: false, openNowOnly: false, studyOnly: false, vegetarian: false, spicy: false, studentDealsOnly: false };
export const filterCount = (f: Filters) => Number(f.priceTiers.length > 0) + Number(f.minRating > 0) + Number(f.maxDistance > 0) + [f.onCampusOnly, f.favoritesOnly, f.openNowOnly, f.studyOnly, f.vegetarian, f.spicy, f.studentDealsOnly].filter(Boolean).length;

export function FilterDialog({ value, unknownHours, onApply, onClose }: { value: Filters; unknownHours: number; onApply: (filters: Filters) => void; onClose: () => void }) {
  const { t, n } = useI18n(); const [draft, setDraft] = useState(value);
  const booleans: { key: keyof Pick<Filters, 'onCampusOnly' | 'favoritesOnly' | 'openNowOnly' | 'studyOnly' | 'vegetarian' | 'spicy' | 'studentDealsOnly'>; label: string; icon: typeof Leaf }[] = [
    { key: 'onCampusOnly', label: 'On campus only', icon: GraduationCap }, { key: 'favoritesOnly', label: 'Favorites only', icon: Star },
    { key: 'openNowOnly', label: 'Open now', icon: Coffee }, { key: 'studyOnly', label: 'Good for studying', icon: Wifi },
    { key: 'vegetarian', label: 'Vegetarian options', icon: Leaf }, { key: 'spicy', label: 'Spicy options', icon: Zap }, { key: 'studentDealsOnly', label: 'Student deals only', icon: GraduationCap },
  ];
  return <Dialog title={t('Filters')} onClose={onClose} className="filter-dialog"><div className="dialog-body"><p className="muted">{t('All the original filters, with a little more room for your next craving.', 'كل فلاتر التطبيق الأصلي علشان تلاقي الأكل اللي يناسبك.')}</p><fieldset className="filter-fieldset"><legend>{t('Your budget', 'ميزانيتك')} <span>{t('per person', 'للفرد')}</span></legend><div className="filter-options tiers">{[{ tier: 1, label: 'Budget', range: '40–100' }, { tier: 2, label: 'Mid-range', range: '120–250' }, { tier: 3, label: 'Premium', range: '300–600' }].map(option => <button key={option.tier} className={draft.priceTiers.includes(option.tier) ? 'active' : ''} onClick={() => setDraft(f => ({ ...f, priceTiers: f.priceTiers.includes(option.tier) ? f.priceTiers.filter(p => p !== option.tier) : [...f.priceTiers, option.tier] }))} aria-pressed={draft.priceTiers.includes(option.tier)}><Wallet size={17} /><strong>{t(option.label)}</strong><span>{n(option.range)} {t('EGP', 'ج.م')}</span></button>)}</div><p className="field-hint">{t('No selection means any price. These are editorial price tiers.', 'من غير اختيار يعني أي سعر. دي فئات أسعار تقديرية.')}</p></fieldset><fieldset className="filter-fieldset"><legend>{t('Minimum rating')}</legend><div className="filter-options rating-options">{[0, 3, 4, 4.5].map(rating => <button key={rating} className={draft.minRating === rating ? 'active' : ''} onClick={() => setDraft(f => ({ ...f, minRating: rating }))}>{rating ? <><Star size={12} />{n(rating)}+</> : t('Any')}</button>)}</div></fieldset><label className="field-label">{t('Distance')}<select value={draft.maxDistance} onChange={e => setDraft(f => ({ ...f, maxDistance: Number(e.target.value) }))}><option value={0}>{t('Anywhere nearby', 'أي مكان قريب')}</option><option value={600}>{t('Walking distance only')} · {n(600)} {t('m', 'م')}</option><option value={1000}>{t('Under 1 km', 'أقل من ١ كم')}</option><option value={1500}>{t('Under 1.5 km', 'أقل من ١٫٥ كم')}</option></select></label><div className="filter-check-list">{booleans.map(option => <label key={option.key}><option.icon size={17} /><span>{t(option.label)}</span><input type="checkbox" checked={draft[option.key]} onChange={e => setDraft(f => ({ ...f, [option.key]: e.target.checked }))} /></label>)}</div>
    {draft.openNowOnly && <p className="notice-text">{n(unknownHours)} {t('places have unknown opening hours and will be hidden. Unknown never means open.', 'مكان مواعيده غير متاحة وهيتم إخفاؤه. المواعيد المجهولة مش معناها مفتوح.')}</p>}{draft.studyOnly && <p className="notice-text">{t('Study recommendations need at least 3 votes, with 70% saying yes to both Wi-Fi and power outlets.', 'أماكن المذاكرة تحتاج ٣ أصوات على الأقل، و٧٠٪ موافقة على الواي فاي والكهرباء.')}</p>}<div className="form-info"><ShieldCheck size={17} /><p>{t('Vegetarian and spicy filters use menu flags. Confirm dietary needs with the venue.', 'فلاتر النباتي والحار بتستخدم علامات المنيو. تأكد من احتياجاتك الغذائية مع المكان.')}</p></div></div><div className="dialog-actions"><button className="text-button" onClick={() => setDraft(defaultFilters)}>{t('Clear filters')}</button><button className="button button-primary" onClick={() => onApply(draft)}>{t('Apply filters')}<ArrowRight size={16} /></button></div></Dialog>;
}

export type DishHit = { venue: Venue; item: MenuItem; score: number; menuScope: NonNullable<RestaurantMenu['scope']> };
const dishIndex = new WeakMap<RestaurantMenu, { item: MenuItem; name: string; haystack: string }[]>();
const stemDish = (s: string) => normalized(s).split(/\s+/).map(word => /[\u0600-\u06ff]/.test(word) && word.length >= 4 ? word.replace(/[اهي]$/, '') : word).join(' ');

export function findDishes(venues: Venue[], menus: Record<string, RestaurantMenu>, query: string, maxPrice: number | null): DishHit[] {
  const terms = stemDish(query).split(/\s+/).filter(Boolean); if (!terms.length && maxPrice === null) return [];
  const hits: DishHit[] = [];
  for (const venue of venues) {
    const menu = menus[venue.id]; if (!menu) continue;
    const menuScope = menu.scope || 'branch';
    let indexed = dishIndex.get(menu);
    if (!indexed) {
      indexed = menu.items.map(item => {
        const name = stemDish(`${item.name} ${item.nameAr || ''}`);
        return { item, name, haystack: stemDish(`${name} ${item.description} ${item.category}`) };
      });
      dishIndex.set(menu, indexed);
    }
    for (const { item, name, haystack } of indexed) {
      if (maxPrice !== null && (item.price === null || item.price > maxPrice)) continue;
      if (!terms.every(term => haystack.includes(term))) continue;
      hits.push({ venue, item, menuScope, score: terms.reduce((score, term) => score + (name.startsWith(term) ? 0 : name.includes(term) ? 1 : 3), 0) });
    }
  }
  return hits.sort((a, b) => a.score - b.score || Number(a.menuScope === 'brand') - Number(b.menuScope === 'brand') || (terms.length ? (a.item.price ?? Infinity) - (b.item.price ?? Infinity) : (b.item.price ?? 0) - (a.item.price ?? 0)) || a.venue.distance - b.venue.distance);
}
import { MenuItemThumb } from './MenuItemThumb';

export function DishResults({ hits, active, onOpen }: { hits: DishHit[]; active: boolean; onOpen: (v: Venue) => void }) {
  const { t, n, lang } = useI18n(); const [visible, setVisible] = useState(() => window.matchMedia('(max-width: 760px)').matches ? 12 : 30);
  return hits.length ? (
    <>
      <div className="dish-result-summary">
        <span><Check size={14} />{n(hits.length)} {t('dishes at', 'طبق في')} {n(new Set(hits.map(h => h.venue.id)).size)} {t('places', 'مكان')}</span>
        <small>{t('Prices and branch availability may change. Check the source before ordering.', 'قد تتغير الأسعار وتوفر الأطباق في الفرع. راجع المصدر قبل الطلب.')}</small>
      </div>
      <div className="dish-results">
        {hits.slice(0, visible).map(hit => (
          <button className={`dish-result ${hit.item.imageUrl ? 'has-dish-image' : ''}`} key={`${hit.venue.id}-${hit.item.id}`} onClick={() => onOpen(hit.venue)}>
            {hit.item.imageUrl ? (
              <MenuItemThumb src={hit.item.imageUrl} alt={hit.item.name} className="dish-result-thumb" retryable={false} />
            ) : (
              <VenueLogo venue={hit.venue} />
            )}
            <div>
              <h3>{lang === 'ar' && hit.item.nameAr ? hit.item.nameAr : hit.item.name}</h3>
              <p>{hit.venue.brand} <span>· {n(distanceLabel(hit.venue))}</span></p>
              {hit.menuScope === 'brand' && <small className="dish-source-warning"><TriangleAlert size={12} />{t('Brand reference · branch not verified', 'قائمة للعلامة · غير مؤكدة للفرع')}</small>}
              <DishBadges item={hit.item} />
            </div>
            <span className="dish-result-price">
              {hit.item.price !== null ? (
                <>
                  <strong>{n(hit.item.price)}</strong>
                  <small>{t('EGP', 'ج.م')}</small>
                </>
              ) : (
                <small>{t('Ask in store')}</small>
              )}
              <ChevronRight size={17} />
            </span>
          </button>
        ))}
      </div>
      {visible < hits.length && (
        <button className="button button-outline load-more-dishes" onClick={() => setVisible(count => count + (window.matchMedia('(max-width: 760px)').matches ? 12 : 30))}>
          {t('Show more dishes', 'عرض أطباق أكثر')}<ArrowRight size={15} />
        </button>
      )}
    </>
  ) : (
    <EmptyState
      icon={<Search size={28} />}
      title={active ? t('No dishes matched.', 'لا توجد أطباق مطابقة.') : t('A craving, not a restaurant name.', 'دور على الأكلة، مش اسم المطعم.')}
      description={active ? t('Try another dish, a bigger budget, or fewer venue filters.', 'جرّب طبق تاني أو ميزانية أكبر أو فلاتر أقل.') : t('Search in English or Arabic. You can also set a budget without a search to find dishes you can afford.', 'ابحث بالعربي أو الإنجليزي، أو حدد ميزانية لوحدها علشان تلاقي أطباق في حدودها.')}
    />
  );
}

export function StudyPanel({ venueId, tallies, ownVotes, connected, onVote }: { venueId: string; tallies: AttributeTally[]; ownVotes: StudyVotes[string]; connected: boolean; onVote: (attribute: AttributeId, value: boolean) => Promise<void> }) {
  const { t, n, lang } = useI18n(); const [busy, setBusy] = useState<AttributeId | null>(null); const [error, setError] = useState('');
  const vote = async (id: AttributeId, value: boolean) => { setBusy(id); setError(''); try { await onVote(id, value); } catch (err) { setError((err as Error).message); } finally { setBusy(null); } };
  return <section className="study-panel"><div className="section-overline"><Wifi size={19} /><h3>{t('Can you work here?', 'تقدر تذاكر هنا؟')}</h3></div><p className="muted">{t('Answered by students. Add your experience, one honest answer at a time.', 'إجابات الطلاب. شارك تجربتك بإجابة صادقة لكل سؤال.')}</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="study-rows">{studyAttributes.map(attribute => { const tally = tallies.find(row => row.venueId === venueId && row.attribute === attribute.id); const count = tally?.totalCount || 0; const yes = tally?.yesCount || 0; const mine = ownVotes?.[attribute.id]; return <div className="study-row" key={attribute.id}><div><strong>{lang === 'ar' ? attribute.labelAr : attribute.label}</strong><span>{count ? `${n(yes)} / ${n(count)} ${t('students say yes', 'طالب بيقول نعم')}` : t('No votes yet')}</span>{count > 0 && <div className="study-meter"><span style={{ width: `${yes / count * 100}%` }} /></div>}</div><div className="study-vote"><button disabled={busy === attribute.id} className={mine === true ? 'active' : ''} aria-pressed={mine === true} onClick={() => void vote(attribute.id, true)}>{t('Yes')}</button><button disabled={busy === attribute.id} className={mine === false ? 'active no' : ''} aria-pressed={mine === false} onClick={() => void vote(attribute.id, false)}>{t('No')}</button></div></div>; })}</div><p className="notice-text">{connected ? t('Votes are shared through your configured backend. Small samples are opinions, not guarantees.', 'الأصوات بتتشارك عبر الخادم المتصل. العينات الصغيرة آراء مش ضمانات.') : t('Your votes are saved on this device. Connect a backend in Settings to see and share community votes.', 'أصواتك بتتحفظ على جهازك. اتصل بالخادم في الإعدادات لعرض ومشاركة أصوات المجتمع.')}</p></section>;
}

export function PriceHistory({ reviews }: { reviews: Review[] }) {
  const { t, n, lang } = useI18n(); const prices = reviews.filter(r => r.spent !== null && r.spent > 0 && Number.isFinite(new Date(r.date).getTime())).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const mid = Math.floor(prices.length / 2); const old = prices.slice(0, mid); const recent = prices.slice(mid); const span = prices.length ? (new Date(prices[prices.length - 1].date).getTime() - new Date(prices[0].date).getTime()) / 86400000 : 0;
  const avg = (arr: Review[]) => Math.round(arr.reduce((s, r) => s + (r.spent || 0), 0) / (arr.length || 1)); const before = avg(old); const after = avg(recent); const meaningful = old.length >= 3 && recent.length >= 3 && span >= 30 && before > 0; const change = before ? Math.round((after - before) / before * 100) : 0;
  const max = Math.max(...prices.map(r => r.spent || 0), 1); const min = Math.min(...prices.map(r => r.spent || 0), max); const points = prices.map((r, i) => `${12 + i / Math.max(1, prices.length - 1) * 326},${68 - ((r.spent || 0) - min) / Math.max(1, max - min) * 50}`).join(' ');
  return <section className="price-history"><div className="section-overline"><TrendingUp size={18} /><h3>{t('Price history')}</h3><span>{n(prices.length)} {t('reports', 'تقرير')}</span></div>{prices.length > 1 ? <><svg viewBox="0 0 350 82" role="img" aria-label={t('Student-reported spending over time', 'إنفاق الطلاب بمرور الوقت')}><path d="M12 70H338" stroke="#e3e9dc" /><polyline points={points} fill="none" stroke="#527b47" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />{prices.map((r, i) => <circle key={r.id} cx={12 + i / Math.max(1, prices.length - 1) * 326} cy={68 - ((r.spent || 0) - min) / Math.max(1, max - min) * 50} r={3} fill="#527b47" />)}</svg><div className="price-history-labels"><span>{new Date(prices[0].date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { month: 'short', year: 'numeric' })}</span><span>{new Date(prices[prices.length-1].date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { month: 'short', year: 'numeric' })}</span></div></> : <p className="muted">{t('Share what you spent to start the price history.', 'شارك دفعت كام علشان يبدأ سجل الأسعار.')}</p>}{meaningful ? <div className="price-trend-insight"><strong>{Math.abs(change) < 10 ? t('Roughly steady', 'مستقر تقريبًا') : `${change > 0 ? t('Up', 'زيادة') : t('Down', 'انخفاض')} ${n(Math.abs(change))}%`}</strong><span>{n(before)} → {n(after)} {t('EGP', 'ج.م')} · {n(old.length)} + {n(recent.length)} {t('reports', 'تقرير')}</span></div> : <p className="field-hint">{t('A trend needs 3+ reports in each period over at least 30 days. Different orders do not automatically mean rising prices.', 'الاتجاه يحتاج ٣ تقارير لكل فترة وعلى الأقل ٣٠ يوم. اختلاف الطلبات مش دليل على زيادة الأسعار.')}</p>}</section>;
}

export function CompareDialog({ allVenues, ids, onSelect, onClose, onOpen }: { allVenues: Venue[]; ids: string[]; onSelect: (ids: string[]) => void; onClose: () => void; onOpen: (v: Venue) => void }) {
  const { t, n } = useI18n(); const a = allVenues.find(v => v.id === ids[0]); const b = allVenues.find(v => v.id === ids[1]);
  const ratingWinner = a && b && a.reviewCount >= 3 && b.reviewCount >= 3 && Math.abs(a.rating - b.rating) > .3 ? a.rating > b.rating ? 'a' : 'b' : '';
  const priceWinner = a && b && a.averagePrice !== null && b.averagePrice !== null && Math.abs(a.averagePrice - b.averagePrice) > 15 ? a.averagePrice < b.averagePrice ? 'a' : 'b' : '';
  const distanceWinner = a && b && !a.approximate && !b.approximate && Math.abs(a.distance - b.distance) > 50 ? a.distance < b.distance ? 'a' : 'b' : '';
  return <Dialog title={t('Compare two spots')} onClose={onClose} className="compare-dialog"><div className="dialog-body"><p className="muted">{t('Choose two places. A better number only wins when the comparison is fair.', 'اختار مكانين. الرقم الأحسن بيكسب بس لما المقارنة تكون عادلة.')}</p><div className="form-columns"><label className="field-label">{t('First spot')}<select value={ids[0] || ''} onChange={e => onSelect([e.target.value, ids[1] === e.target.value ? '' : ids[1] || ''])}><option value="">{t('Choose a spot…', 'اختار مكان…')}</option>{allVenues.filter(v => v.id !== ids[1]).map(v => <option value={v.id} key={v.id}>{v.name}</option>)}</select></label><label className="field-label">{t('Second spot')}<select value={ids[1] || ''} onChange={e => onSelect([ids[0] || '', e.target.value])}><option value="">{t('Choose a spot…', 'اختار مكان…')}</option>{allVenues.filter(v => v.id !== ids[0]).map(v => <option value={v.id} key={v.id}>{v.name}</option>)}</select></label></div>{a && b ? <><div className="comparison-brands">{[a, b].map(v => <button key={v.id} onClick={() => onOpen(v)}><VenueLogo venue={v} /><strong>{v.brand}</strong><small>{t('View details', 'عرض التفاصيل')}<ChevronRight size={12} /></small></button>)}</div><div className="comparison-table"><div className="comparison-row"><h4>{t('Your rating')}</h4><span className={ratingWinner === 'a' ? 'winner' : ''}>{a.reviewCount ? `${n(a.rating.toFixed(1))} ★ (${n(a.reviewCount)})` : t('No reviews yet')}</span><span className={ratingWinner === 'b' ? 'winner' : ''}>{b.reviewCount ? `${n(b.rating.toFixed(1))} ★ (${n(b.reviewCount)})` : t('No reviews yet')}</span>{!ratingWinner && <p>{t('Needs 3+ reviews on both sides; ratings within 0.3 are a tie.', 'تحتاج ٣ تقييمات لكل مكان؛ فرق ٠٫٣ أو أقل يُعتبر تعادل.')}</p>}</div><div className="comparison-row"><h4>{t('Typical spend')}</h4><span className={priceWinner === 'a' ? 'winner' : ''}><PriceLabel venue={a} /></span><span className={priceWinner === 'b' ? 'winner' : ''}><PriceLabel venue={b} /></span>{!priceWinner && <p>{t('Estimated ranges are not treated as measured student spending.', 'الأسعار التقديرية مش إنفاق فعلي من الطلاب.')}</p>}</div><div className="comparison-row"><h4>{t('From your faculty')}</h4><span className={distanceWinner === 'a' ? 'winner' : ''}>{n(distanceLabel(a))}</span><span className={distanceWinner === 'b' ? 'winner' : ''}>{n(distanceLabel(b))}</span>{!distanceWinner && <p>{t('Distances within 50 m are tied. Approximate locations are not ranked.', 'مسافات في حدود ٥٠ متر تعادل. المواقع التقريبية مش بنرتبها.')}</p>}</div><div className="comparison-row"><h4>{t('Category')}</h4><span>{t(a.category)}</span><span>{t(b.category)}</span></div><div className="comparison-row"><h4>{t('Must-try dishes')}</h4><span>{a.topDishes[0] || a.signature || '—'}</span><span>{b.topDishes[0] || b.signature || '—'}</span></div></div><p className="notice-text"><ArrowUpDown size={15} />{t('Highlighted cells are meaningful differences, not a promise that one place is better for everyone.', 'الخانات المميزة فروق ذات معنى، مش ضمان إن مكان أفضل لكل الناس.')}</p></> : <EmptyState icon={<ArrowUpDown size={29} />} title={t('Pick two different spots.', 'اختار مكانين مختلفين.')} description={t('Compare ratings, student-reported prices, walking distance, and must-try dishes.', 'قارن التقييمات وأسعار الطلاب والمسافة والأطباق المميزة.')} />}</div></Dialog>;
}

export function FacultyDialog({ facultyId, onSelect, onClose }: { facultyId: string; onSelect: (id: string) => void; onClose: () => void }) {
  const { t, lang } = useI18n();
  return <Dialog title={t('Your faculty')} onClose={onClose}><div className="dialog-body"><p className="muted">{t('Get distances and walking estimates from your lectures, not just the campus center.', 'احسب المسافات والمشي من مبنى محاضراتك بدل وسط الحرم.')}</p><div className="faculty-options">{faculties.map(f => <button key={f.id} className={facultyId === f.id ? 'active' : ''} onClick={() => onSelect(f.id)}><span className="campus-option-icon"><GraduationCap size={21} /></span><span><strong>{lang === 'ar' ? f.nameAr : f.shortName}</strong><small>{f.building}</small></span>{facultyId === f.id ? <Check size={18} /> : <ChevronRight size={18} />}</button>)}</div><p className="privacy-note"><MapPin size={14} />{t('Original FUE building coordinates. No GPS permission needed.', 'إحداثيات مباني الجامعة من الكود الأصلي. بدون إذن GPS.')}</p></div></Dialog>;
}

export function BackendSettings({ backend, onSave, onExport, suggestedBackend }: { backend: string; onSave: (value: string) => void; onExport: () => void; suggestedBackend?: string }) {
  const { t } = useI18n(); const [draft, setDraft] = useState(backend); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const test = async (e: FormEvent) => { e.preventDefault(); setBusy(true); setError(''); setSuccess(''); try { const value = validateBackend(draft); await api.venues(value); onSave(value); setSuccess(t('Connected to the community backend. New communities can start with no reviews yet.', 'تم الاتصال بخادم المجتمع. المجتمعات الجديدة ممكن تبدأ بدون تقييمات.')); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } };
  return <><div className="settings-intro"><span><Plug size={25} /></span><div><h3>{t('Community backend')}</h3><p>{t('Share real student contributions.', 'شارك مساهمات طلاب حقيقية.')}</p></div></div><p className="muted">{t('Connect a FUE Food Guide Community API to read and post shared reviews, memories, cheers, study votes, and rankings. Without it, your data stays on this device.', 'اتصل بواجهة مجتمع دليل أكل FUE لقراءة ونشر التقييمات والذكريات والتشجيع والأصوات والترتيب. بدونها بياناتك بتفضل على جهازك.')}</p>{suggestedBackend && <button className="button button-outline button-full settings-suggested-backend" type="button" onClick={() => setDraft(suggestedBackend)}><Plug size={15}/>{t('Use this app’s community URL', 'استخدم رابط مجتمع التطبيق ده')}</button>}<form onSubmit={test}><label className="field-label">{t('Community backend URL', 'رابط خادم المجتمع')}<input data-autofocus type="url" required value={draft} onChange={e => setDraft(e.target.value)} placeholder="https://your-community.example" /></label>{error && <p className="form-error" role="alert">{error}</p>}{success && <p className="inline-success" role="status"><Check size={15} />{success}</p>}<button className="button button-primary button-full" disabled={busy} type="submit">{busy ? <LoaderCircle size={16} className="spinning" /> : <Plug size={16} />}{t('Test connection')} & {t('Connect')}</button></form>{backend && <button className="button button-outline button-full settings-disconnect" onClick={() => { onSave(''); setDraft(''); setSuccess(t('Now using device-only storage.', 'التخزين على الجهاز فقط الآن.')); }}>{t('Disconnect')}</button>}<div className="form-info"><ShieldCheck size={19} /><p>{t('Use HTTPS and allow this app’s origin in CORS. The included Vercel community API needs Vercel KV environment variables; no service-role key is entered or stored in this app.', 'استخدم HTTPS واسمح لمصدر التطبيق في CORS. واجهة مجتمع Vercel المرفقة تحتاج متغيرات Vercel KV؛ لا يتم إدخال أو حفظ مفتاح service-role في التطبيق.')}</p></div><a className="text-button community-doc-link" href="/COMMUNITY.md" target="_blank" rel="noopener noreferrer"><BookOpen size={14}/>{t('Community deployment guide', 'دليل نشر المجتمع')}<ExternalLink size={13}/></a><div className="settings-data"><h4>{t('Your saved data', 'بياناتك المحفوظة')}</h4><p>{t('Export favorites, reviews, memories, menu edits, and study votes as a JSON backup.', 'صدّر المفضلة والتقييمات والذكريات وتعديلات المنيو والأصوات كنسخة JSON.')}</p><button className="button button-outline button-full" onClick={onExport}><BookOpen size={15} />{t('Export device backup', 'تصدير نسخة الجهاز')}</button></div></>;
}

export function AboutDialog({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n();
  return <Dialog title={t('About FUE')} onClose={onClose} className="about-dialog"><div className="dialog-body"><div className="about-fue-heading"><GraduationCap size={36} /><span className="eyebrow">{t('Est. 2006', 'تأسست ٢٠٠٦')}</span><h3>{t('Future University in Egypt', 'جامعة المستقبل في مصر')}</h3><p>{t('Your campus, your community.', 'جامعتك ومجتمعك.')}</p></div><p className="detail-description">{t('FUE Food Guide is a student-built guide to the cafés, restaurants, and quick bites around Future University in New Cairo. Choose your faculty to explore from your building, or head across to Point 90.', 'دليل أكل FUE دليل من الطلاب للكافيهات والمطاعم والوجبات حول جامعة المستقبل في القاهرة الجديدة. اختار كليتك لاستكشاف الأماكن من مبناك أو اتجه لبوينت ٩٠.')}</p><h4>{t('Future University’s six faculties', 'كليات جامعة المستقبل الست')}</h4><div className="about-faculties">{faculties.filter(f => f.id !== 'campus-center').map(f => <div key={f.id}><GraduationCap size={17} /><span>{lang === 'ar' ? f.nameAr : f.name}</span></div>)}</div><div className="location-note"><MapPin size={18} /><p><strong>{t('New Cairo, Egypt', 'القاهرة الجديدة، مصر')}</strong><span>{t('End of 90th Street North', 'نهاية شارع التسعين الشمالي')}</span></p></div><a className="button button-primary button-full" href="https://www.fue.edu.eg/" target="_blank" rel="noopener noreferrer">{t('Visit the university website', 'موقع الجامعة الرسمي')}<ExternalLink size={15} /></a><p className="privacy-note">{t('Original app by Youssef Ahmed and Ahmed Abdelwahab. An independent student guide, not a restaurant endorsement.', 'التطبيق الأصلي من يوسف أحمد وأحمد عبد الوهاب. دليل مستقل للطلاب، مش إعلان للمطاعم.')}</p></div></Dialog>;
}
