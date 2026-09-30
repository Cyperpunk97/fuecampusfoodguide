import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronRight, Download, FileCheck2, LoaderCircle, RefreshCw, Search, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Dialog, VenueLogo } from './components';
import { normalized, type Menus, type Venue } from './data';
import { downloadJson, useFoodTools } from './foodTools';
import { useI18n } from './i18n';
import { auditMenu, runMenuChecks } from './menuLogic';
import { type OriginalSnapshot } from './original';
import { api } from './api';
import { menuMatchesVenue } from './menuLogic';

export function MenuAuditDialog({ venues, menus, snapshot, loading, onReload, onOpen, onClose, backend = '', onResolve }: { venues: Venue[]; menus: Menus; snapshot: OriginalSnapshot; loading: boolean; onReload: () => void; onOpen: (venue: Venue) => void; onClose: () => void; backend?: string; onResolve?: (id: string, menu: Menus[string]) => void }) {
  const { t, n, lang } = useI18n(); const tools = useFoodTools(); const [query, setQuery] = useState(''); const [filter, setFilter] = useState('all'); const [checkedAt, setCheckedAt] = useState(new Date().toISOString());
  const checks = useMemo(() => runMenuChecks(), [checkedAt]);
  const rows = useMemo(() => venues.map(venue => ({ venue, report: auditMenu(venue, menus[venue.id]) })), [venues, menus, checkedAt]);
  const available = rows.filter(row => row.report.items > 0).length;
  const [resolving, setResolving] = useState(false);
  const [lookupProgress, setLookupProgress] = useState({ done: 0, total: 0, added: 0, status: '' });
  const [lookupErrors, setLookupErrors] = useState<string[]>([]);
  const lookupController = useRef<AbortController | null>(null);
  useEffect(() => () => lookupController.current?.abort(), []);
  const findMissing = async () => {
    if (resolving) { lookupController.current?.abort(); setResolving(false); return; }
    if (!backend || !onResolve) return;
    const missing = rows.filter(row => !row.report.items).map(row => row.venue);
    const controller = new AbortController(); lookupController.current = controller;
    setResolving(true); setLookupErrors([]); setLookupProgress({ done: 0, total: missing.length, added: 0, status: '' });
    let added = 0;
    for (const [index, venue] of missing.entries()) {
      if (controller.signal.aborted) break;
      setLookupProgress({ done: index, total: missing.length, added, status: venue.brand });
      try {
        const menu = await api.lookupMenu(backend, venue.id, venue.brand);
        if (controller.signal.aborted) break;
        if (!menuMatchesVenue(menu, venue)) throw new Error('Returned restaurant does not match.');
        onResolve(venue.id, { ...menu, restaurantId: venue.id, restaurantName: venue.name, brand: venue.brand }); added++;
      } catch (err) {
        if (!controller.signal.aborted) setLookupErrors(old => [...old, `${venue.brand}: ${(err as Error).message}`]);
      }
      if (controller.signal.aborted) break;
      setLookupProgress({ done: index + 1, total: missing.length, added, status: '' });
      // The original endpoint allows 10 lookups/minute. Never fire 53 at once.
      if (index < missing.length - 1) await new Promise<void>(resolve => {
        const finish = () => { clearTimeout(timer); controller.signal.removeEventListener('abort', finish); resolve(); };
        const timer = window.setTimeout(finish, 6500); controller.signal.addEventListener('abort', finish, { once: true });
      });
    }
    if (!controller.signal.aborted) setResolving(false);
  };
  const results = rows.filter(({ venue, report }) => (!query || normalized(`${venue.name} ${venue.brand}`).includes(normalized(query)))
    && (filter === 'all' || filter === 'missing' && !report.items || filter === 'talabat' && ['talabat-cache', 'live'].includes(report.source) || filter === 'notes' && report.issues.length > 0));
  const exportReport = () => downloadJson('cs-family-menu-check.json', { checkedAt, sourceLoadedAt: snapshot.loadedAt, originalDataComplete: snapshot.complete, checks, menus: rows.map(row => row.report), localProblemReports: tools.reports,
    lookupErrors, disclaimer: 'Structural checks and source matching only. Not verification of live availability, current branch prices, or remote image availability.' });
  return <Dialog title={t('Menu check center', 'مركز فحص المنيوهات')} onClose={onClose} className="menu-audit-dialog">
    <div className="dialog-body">
      <div className="audit-intro"><FileCheck2 size={27} /><div><h3>{t('Every place, accounted for.', 'كل مكان محسوب.')}</h3><p>{n(available)} / {n(venues.length)} {t('places have a usable matching menu.', 'مكان له منيو مطابق قابل للاستخدام.')}</p></div></div>
      <p className="muted">{t('Checks brand matching, category indexing, unique items, prices, image URL safety, and dietary conflicts across every loaded menu.', 'فحص تطابق المطعم والأقسام والأصناف والأسعار وسلامة روابط الصور والتعارضات الغذائية في كل منيو محمّل.')}</p>
      <div className="audit-actions">
        <button className="button button-primary button-small" onClick={() => setCheckedAt(new Date().toISOString())}><ShieldCheck size={15} />{t('Check all menus', 'افحص كل المنيوهات')}</button>
        <button className="button button-outline button-small" disabled={loading || resolving} onClick={onReload}>{loading ? <LoaderCircle size={14} className="spinning" /> : <RefreshCw size={14} />}{t('Reload source data', 'أعد تحميل البيانات')}</button>
        <button className="icon-button" onClick={exportReport} title={t('Download check report', 'تحميل تقرير الفحص')} aria-label={t('Download check report', 'تحميل تقرير الفحص')}><Download size={17} /></button>
      </div>
      {backend && onResolve && available < venues.length && <button className="button button-outline button-full" disabled={loading || !navigator.onLine} onClick={() => void findMissing()}>{resolving ? <LoaderCircle size={14} className="spinning" /> : <RefreshCw size={14} />}{resolving ? t('Stop missing-menu lookup', 'إيقاف البحث عن المنيوهات') : t('Look up missing menus', 'ابحث عن المنيوهات المفقودة')}</button>}
      {lookupProgress.total > 0 && <p className="audit-notice" role="status">{n(lookupProgress.done)} / {n(lookupProgress.total)} {t('lookups completed', 'عملية بحث مكتملة')} / {n(lookupProgress.added)} {t('matching menus added', 'منيو مطابق تمت إضافته')} {lookupProgress.status && ` / ${lookupProgress.status}`}</p>}
      {lookupErrors.map(error => <p className="form-error" key={error}>{error}</p>)}
      {!snapshot.complete && <p className="audit-notice"><TriangleAlert size={16} />{t('Some original data is not loaded. Coverage is provisional; reload when online.', 'بعض البيانات الأصلية غير محمّلة. النتيجة مؤقتة؛ أعد التحميل عند الاتصال.')}</p>}
      {snapshot.errors?.map(error => <p className="form-error" key={error}>{error}</p>)}
      <div className="audit-test-summary">{checks.every(check => check.passed) ? <Check size={14} /> : <TriangleAlert size={14} />}<strong>{n(checks.filter(check => check.passed).length)} / {n(checks.length)}</strong>{t('menu logic checks passed', 'اختبار لمنطق المنيو ناجح')}<small>{new Date(checkedAt).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}</small></div>
      <details className="audit-test-details"><summary>{t('See the checks', 'عرض الاختبارات')}</summary>{checks.map(check => <p key={check.name}>{check.passed ? <Check size={12} /> : <TriangleAlert size={12} />}{check.name}</p>)}</details>
      <div className="audit-filter-bar"><div className="menu-search"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('Find a venue to check...', 'ابحث عن مكان لفحصه...')} aria-label={t('Search')} /></div><select value={filter} onChange={e => setFilter(e.target.value)} aria-label={t('Filter check results', 'تصفية نتائج الفحص')}><option value="all">{t('All places')}</option><option value="missing">{t('Missing menus', 'منيوهات غير متاحة')}</option><option value="talabat">{t('Talabat menus', 'منيوهات طلبات')}</option><option value="notes">{t('With source notes', 'مع ملاحظات')}</option></select></div>
      <div className="audit-rows">{results.map(({ venue, report }) => <details className="audit-row" key={venue.id}><summary><VenueLogo venue={venue} /><span className="audit-venue"><strong>{venue.brand}</strong><small>{report.items ? `${n(report.items)} ${t('items', 'صنف')} / ${n(report.priced)} ${t('priced', 'له سعر')} / ${n(report.images)} ${t('photo URLs', 'رابط صورة')}` : t('No usable menu in the source', 'لا يوجد منيو قابل للاستخدام في المصدر')}</small></span><span className={`audit-state ${report.status}`}>{report.status === 'review' ? <TriangleAlert size={12} /> : report.items ? <Check size={12} /> : <TriangleAlert size={12} />}{report.status === 'review' ? t('Review source', 'راجع المصدر') : report.items ? t('Available', 'متاح') : t('Missing', 'غير متاح')}</span><ChevronRight size={15} /></summary><div className="audit-row-details"><p><strong>{t('Source', 'المصدر')}:</strong> {report.source} / {report.scope === 'brand' ? t('Brand reference, not branch-verified', 'مرجع للعلامة، غير مؤكد للفرع') : t('Authored for this venue', 'مكتوب لهذا المكان')}</p>{report.issues.length ? report.issues.map(issue => <p key={issue.code}><TriangleAlert size={12} />{issue.detail}{issue.count > 1 ? ` (${n(issue.count)})` : ''}</p>) : <p><Check size={13} />{t('No structural issues found.', 'لا توجد مشاكل في بنية البيانات.')}</p>}{tools.reports.filter(problem => problem.venueId === venue.id).map(problem => <p key={problem.id}><BookOpen size={12} />{t('Your report', 'بلاغك')}: {problem.reason}{problem.detail ? ` / ${problem.detail}` : ''}</p>)}<button className="text-button" onClick={() => onOpen(venue)}>{t('Open and review menu', 'افتح وراجع المنيو')}<ArrowRight size={14} /></button></div></details>)}</div>
      {!results.length && <p className="muted audit-no-results">{t('No venues match this view.', 'لا توجد أماكن مطابقة.')}</p>}
      <p className="notice-text"><ShieldCheck size={16} />{t('Data checks do not confirm today’s prices, branch availability, or every remote photo. Missing menus are shown honestly; the app does not create substitute dishes.', 'فحص البيانات لا يؤكد أسعار اليوم أو توفر الأطباق في الفرع أو كل الصور الخارجية. المنيوهات المفقودة واضحة؛ التطبيق لا يخترع أصنافًا بديلة.')}</p>
    </div>
  </Dialog>;
}