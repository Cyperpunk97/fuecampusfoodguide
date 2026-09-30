import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Bookmark, BookOpen, Check, ChevronDown, Download, ExternalLink, FileCheck2, Image, Leaf, LoaderCircle, Pencil, Plus, RefreshCw, Search, Settings2, Trash2, TriangleAlert, Upload, X } from 'lucide-react';
import { api } from './api';
import { DishBadges, EmptyState } from './components';
import { type MenuItem, type Menus, type RestaurantMenu, type Venue, normalized } from './data';
import { dishKey, downloadJson, useFoodTools } from './foodTools';
import { useI18n } from './i18n';
import { MenuItemThumb } from './MenuItemThumb';
import { auditMenu, menuMatchesVenue, normalizeDishImage, normalizeMenu, parseDishPrice } from './menuLogic';
import { checkMenuPhotos, type PhotoResult } from './menuPhotos';
import { type MenuPreference } from './original';

type Props = {
  venue: Venue; menu: RestaurantMenu; cachedMenus: Menus; backend: string;
  sourceOptions?: { talabat?: RestaurantMenu; repository?: RestaurantMenu };
  sourceLoading?: boolean; onSelectSource?: (source: MenuPreference) => void; onReload?: () => void;
  onAudit?: () => void; onPlan?: () => void;
  onChange: (menu: RestaurantMenu) => void; onReset: () => void; onConnect: () => void;
};
const EMPTY_DISH = { id: '', name: '', nameAr: '', description: '', category: '', price: '', image: '', popular: false, student: false, vegetarian: false, spicy: false };
const MENU_PAGE_SIZE = typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches ? 16 : 40;

export function MenuPanel({ venue, menu, cachedMenus, backend, sourceOptions, sourceLoading = false, onSelectSource, onReload, onAudit, onPlan, onChange, onReset, onConnect }: Props) {
  const { t, n, lang } = useI18n(); const tools = useFoodTools();
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('all'); const [flag, setFlag] = useState('all');
  const [maxPrice, setMaxPrice] = useState(''); const [sort, setSort] = useState('source'); const [visible, setVisible] = useState(MENU_PAGE_SIZE);
  const [editing, setEditing] = useState(false); const [advancedOpen, setAdvancedOpen] = useState(false); const [mode, setMode] = useState<'dish' | 'import' | 'report' | null>(null);
  const [draft, setDraft] = useState(EMPTY_DISH); const [importBrand, setImportBrand] = useState(''); const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(''); const [confirmReset, setConfirmReset] = useState(false);
  const [reason, setReason] = useState('Wrong price'); const [reportItem, setReportItem] = useState(''); const [detail, setDetail] = useState('');
  const [photoResults, setPhotoResults] = useState<PhotoResult[]>([]); const [checkingPhotos, setCheckingPhotos] = useState(false);
  const photoController = useRef<AbortController | null>(null); const fileRef = useRef<HTMLInputElement>(null);
  const changeRef = useRef(onChange); changeRef.current = onChange;
  const quality = useMemo(() => auditMenu(venue, menu), [venue, menu]);
  const matchedImports = useMemo(() => Object.entries(cachedMenus).filter(([, value]) => value.items.length > 0 && menuMatchesVenue(value, venue)), [cachedMenus, venue]);
  const photoUrls = useMemo(() => Array.from(new Set(menu.items.map(item => normalizeDishImage(item.imageUrl)).filter((value): value is string => Boolean(value)))), [menu.items]);
  const key = `${menu.restaurantId}|${menu.source}|${menu.checkedAt || ''}|${menu.items.length}`;
  const currentMenuKey = useRef(key); currentMenuKey.current = key;

  useEffect(() => { setVisible(MENU_PAGE_SIZE); }, [query, category, flag, maxPrice, sort, key]);
  useEffect(() => { if (category !== 'all' && !menu.categories.includes(category)) setCategory('all'); }, [category, menu.categories]);
  useEffect(() => { photoController.current?.abort(); setCheckingPhotos(false); setPhotoResults([]); return () => photoController.current?.abort(); }, [menu.items]);
  useEffect(() => {
    if (!backend || sourceLoading || menu.items.length) { setBusy(false); return; }
    let active = true; setBusy(true); setError('');
    const requestedMenuKey = key;
    api.lookupMenu(backend, venue.id, venue.brand).then(value => {
      if (!active || currentMenuKey.current !== requestedMenuKey) return;
      if (!menuMatchesVenue(value, venue)) throw new Error('The returned menu does not match this restaurant. It was not applied.');
      changeRef.current({ ...value, restaurantId: venue.id, restaurantName: venue.name, brand: venue.brand });
    }).catch(err => { if (active) setError((err as Error).message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [backend, venue.id, venue.brand, menu.items.length, sourceLoading]);

  const saved = useMemo(() => new Set(tools.saved.map(item => item.key)), [tools.saved]);
  const terms = useMemo(() => normalized(query).split(/\s+/).filter(Boolean), [query]);
  const indexedItems = useMemo(() => menu.items.map(item => ({ item, text: normalized(`${item.name} ${item.nameAr || ''} ${item.description} ${item.category}`) })), [menu.items]);
  const matches = useMemo(() => {
    const result = indexedItems.filter(({ item, text }) => terms.every(term => text.includes(term)) && (category === 'all' || item.category === category)
      && (flag === 'all' || flag === 'popular' && item.isPopular || flag === 'student' && item.isStudentDeal || flag === 'vegetarian' && item.isVegetarian || flag === 'spicy' && item.isSpicy || flag === 'saved' && saved.has(dishKey(venue.id, item)))
      && (!maxPrice || item.price !== null && item.price <= Number(maxPrice))).map(entry => entry.item);
    if (sort !== 'source') result.sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name, lang) : sort === 'popular' ? Number(b.isPopular) - Number(a.isPopular) : a.price === null ? b.price === null ? 0 : 1 : b.price === null ? -1 : sort === 'highest' ? b.price - a.price : a.price - b.price);
    return result;
  }, [indexedItems, terms, category, flag, maxPrice, saved, venue.id, sort, lang]);
  const shown = useMemo(() => matches.slice(0, visible), [matches, visible]);
  const groups = useMemo(() => Array.from(new Set(shown.map(item => item.category))), [shown]);
  const sourceLabel = menu.source === 'talabat-cache' ? t('Talabat archive', 'أرشيف طلبات') : menu.source === 'live' ? t('Backend lookup', 'من الخادم') : menu.source === 'custom' ? t('Your device menu', 'منيو جهازك') : t('Campus-authored menu', 'منيو مكتوب للجامعة');
  const addToPlan = (item: MenuItem) => {
    if (tools.addToPlan(venue, item)) setMessage(t('Added to your meal plan. This is not an order.', 'تمت الإضافة لخطة الوجبة. ده مش طلب.'));
    else setError(t('Plan limit reached: up to 50 dishes and 20 of each item.', 'وصلت لحد الخطة: حتى ٥٠ طبق و٢٠ قطعة من كل صنف.'));
  };

  const changeMenu = (next: RestaurantMenu) => {
    const cleaned = normalizeMenu({ ...next, checkedAt: new Date().toISOString(), scope: 'device' }, 'custom');
    if (cleaned) onChange({ ...cleaned, restaurantId: venue.id, restaurantName: venue.name, brand: venue.brand });
  };
  const applyImported = (value: RestaurantMenu) => {
    if (value.restaurantName && !menuMatchesVenue(value, venue)) throw new Error(t('This menu belongs to another restaurant. Choose a matching source.', 'المنيو ده لمطعم تاني. اختار مصدر مطابق.'));
    onChange({ ...value, restaurantId: venue.id, restaurantName: venue.name, brand: venue.brand, checkedAt: new Date().toISOString() });
    setMode(null); setError(''); setMessage(t('Matching menu applied. Your existing menu was kept until this succeeded.', 'تم تطبيق المنيو المطابق. المنيو السابق اتحتفظ بيه حتى نجاح الجلب.'));
  };
  const lookup = async (forceLive: boolean) => {
    if (!backend) { setError(t('A deployed backend is needed for live Talabat lookup. Existing menus remain available.', 'الخادم المنشور مطلوب لجلب منيو طلبات مباشر. المنيوهات الحالية متاحة.')); return; }
    if (menu.source === 'custom' && !window.confirm(t('This lookup will replace local menu edits if it succeeds. Continue?', 'الجلب سيستبدل تعديلات المنيو المحلية إذا نجح. هل تريد المتابعة؟'))) return;
    const requestedMenuKey = currentMenuKey.current;
    setBusy(true); setError('');
    try {
      const result = await api.lookupMenu(backend, venue.id, venue.brand, url.trim() || undefined, forceLive);
      if (currentMenuKey.current !== requestedMenuKey) throw new Error(t('The menu changed while loading. Your newer edits were kept; retry the lookup if needed.', 'المنيو اتغير أثناء التحميل. تم الاحتفاظ بتعديلاتك الأحدث؛ أعد الجلب إذا لزم.'));
      applyImported(result);
    }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  const saveDish = (event: FormEvent) => {
    event.preventDefault(); const price = parseDishPrice(draft.price); const image = normalizeDishImage(draft.image);
    if (draft.name.trim().length < 2 || !draft.category.trim()) { setError(t('Enter a dish name and category.', 'اكتب اسم الطبق والقسم.')); return; }
    if (draft.price.trim() && price === null) { setError(t('Enter a positive price, or leave it empty for Ask in store.', 'اكتب سعر موجب، أو اتركه فارغًا للسؤال في المحل.')); return; }
    if (draft.image.trim() && !image) { setError(t('Use a Talabat or Delivery Hero HTTPS dish image URL.', 'استخدم رابط صورة طبق HTTPS من طلبات أو Delivery Hero.')); return; }
    const item = { id: draft.id || `custom-${Date.now()}`, name: draft.name.trim(), nameAr: draft.nameAr.trim() || undefined, description: draft.description.trim(), category: draft.category.trim(), price, imageUrl: image,
      isPopular: draft.popular, isStudentDeal: draft.student, isVegetarian: draft.vegetarian, isSpicy: draft.spicy };
    changeMenu({ ...menu, items: draft.id ? menu.items.map(previous => previous.id === draft.id ? item : previous) : [...menu.items, item] });
    setDraft(EMPTY_DISH); setMode(null); setError(''); setMessage(t('Dish saved on your device. Prices and categories were checked.', 'تم حفظ الطبق على جهازك وفحص السعر والقسم.'));
  };
  const importFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError(t('Menu files must be under 2 MB.', 'ملف المنيو لازم يكون أقل من ٢ ميجابايت.')); return; }
    try { const value = normalizeMenu(JSON.parse(await file.text()), 'custom'); if (!value?.items.length) throw new Error('The JSON file contains no usable menu items.'); applyImported(value); }
    catch (err) { setError((err as Error).message); }
  };
  const checkPhotos = async () => {
    if (checkingPhotos) { photoController.current?.abort(); setCheckingPhotos(false); return; }
    const controller = new AbortController(); photoController.current = controller; setCheckingPhotos(true); setPhotoResults([]);
    try { await checkMenuPhotos(photoUrls, controller.signal, results => { if (!controller.signal.aborted) setPhotoResults(results); }); }
    finally { if (!controller.signal.aborted) setCheckingPhotos(false); }
  };
  const report = (event: FormEvent) => {
    event.preventDefault(); tools.reportMenu({ venueId: venue.id, venueName: venue.brand, itemName: reportItem.trim() || undefined, reason, detail: detail.trim() });
    setMode(null); setDetail(''); setMessage(t('Problem report saved locally. Export it from the menu check center; it has not been sent publicly.', 'تم حفظ البلاغ محليًا. صدّره من مركز الفحص؛ لم يتم نشره.'));
  };

  return <section className="menu-panel">
    <div className="menu-source-heading"><div><BookOpen size={19} /><h3>{t('Menu')}</h3><span>{n(menu.items.length)} {t('items', 'صنف')}</span></div><span className="source-pill">{sourceLabel}</span></div>
    {sourceOptions?.talabat && sourceOptions.repository && onSelectSource && <div className="menu-source-switch" role="group" aria-label={t('Menu source', 'مصدر المنيو')}><button className={menu.source === 'talabat-cache' || menu.source === 'live' ? 'active' : ''} onClick={() => { if (menu.source === 'custom' && !window.confirm(t('Replace local edits with the source menu?', 'استبدال التعديلات المحلية بالمنيو الأصلي؟'))) return; onSelectSource('talabat'); }}>{t('Full Talabat menu', 'منيو طلبات الكامل')}<span>{n(sourceOptions.talabat.items.length)}</span></button><button className={menu.source === 'repository' ? 'active' : ''} onClick={() => { if (menu.source === 'custom' && !window.confirm(t('Replace local edits with the source menu?', 'استبدال التعديلات المحلية بالمنيو الأصلي؟'))) return; onSelectSource('repository'); }}>{t('Campus menu', 'منيو الجامعة')}<span>{n(sourceOptions.repository.items.length)}</span></button></div>}
    <p className="menu-source-note">{menu.scope === 'brand' ? t('Brand reference menu. The source may be from another branch; confirm campus availability and prices.', 'مرجع منيو للعلامة. المصدر ممكن يكون لفرع آخر؛ تأكد من التوفر والأسعار في الجامعة.') : menu.source === 'custom' ? t('Your local menu edits. Not published or vendor-verified.', 'تعديلات منيو محلية. غير منشورة أو مؤكدة من المطعم.') : t('Authored in the original campus guide, not a live restaurant feed.', 'مكتوب في دليل الجامعة الأصلي، مش بيانات مطعم مباشرة.')} {menu.lastUpdated && <span>{t('Source date', 'تاريخ المصدر')}: {n(menu.lastUpdated)}</span>}</p>
    {menu.partial && <p className="audit-notice"><TriangleAlert size={14} />{t('Only the offline subset is loaded. Reload the original data for the complete menu.', 'نسخة جزئية بدون اتصال. أعد تحميل البيانات الأصلية للمنيو الكامل.')}</p>}
    {quality.issues.some(issue => issue.code === 'future-date') && <p className="audit-notice"><TriangleAlert size={14} />{t('The source lists a future date. This menu is not verified as current.', 'المصدر يحتوي تاريخ في المستقبل. المنيو غير مؤكد كمنيو حالي.')}</p>}
    <button className="mobile-menu-tools-toggle" aria-expanded={advancedOpen} onClick={() => { setAdvancedOpen(open => !open); setMode(null); }}><Settings2 size={16} />{t('Menu tools', 'أدوات المنيو')}<ChevronDown size={15} /></button>
    <div className={`menu-toolbar ${advancedOpen ? 'is-open' : ''}`}><button className="button button-outline button-small" onClick={() => { setDraft(EMPTY_DISH); setMode(mode === 'dish' ? null : 'dish'); setError(''); }}><Plus size={14} />{t('Add dish')}</button><button className="button button-outline button-small" onClick={() => setMode(mode === 'import' ? null : 'import')}><Upload size={14} />{t('Provide menu')}</button><button className="icon-button" title={t('Refresh menu', 'تحديث المنيو')} aria-label={t('Refresh menu', 'تحديث المنيو')} disabled={busy || sourceLoading} onClick={() => backend ? void lookup(true) : onReload?.()}>{busy || sourceLoading ? <LoaderCircle size={15} className="spinning" /> : <RefreshCw size={15} />}</button><button className={`icon-button ${editing ? 'selected' : ''}`} title={t('Edit menu', 'تعديل المنيو')} aria-label={t('Edit menu', 'تعديل المنيو')} onClick={() => setEditing(!editing)}><Pencil size={15} /></button><button className="icon-button" title={t('Export menu')} aria-label={t('Export menu')} onClick={() => downloadJson(`${venue.id}-menu.json`, menu)}><Download size={15} /></button>{onAudit && <button className="icon-button" title={t('Check all menus', 'افحص كل المنيوهات')} aria-label={t('Check all menus', 'افحص كل المنيوهات')} onClick={onAudit}><FileCheck2 size={16} /></button>}</div>
    {message && <p className="inline-success" role="status"><Check size={13} />{message}<button onClick={() => setMessage('')} aria-label={t('Close', 'إغلاق')}><X size={13} /></button></p>}{error && <p className="form-error" role="alert">{error}</p>}
    {mode === 'dish' && <form className="inline-editor" onSubmit={saveDish}><div className="form-section-title"><h4>{draft.id ? t('Edit dish', 'تعديل الطبق') : t('Add dish')}</h4><button type="button" className="icon-button" onClick={() => setMode(null)} aria-label={t('Cancel')}><X size={15} /></button></div><div className="form-columns"><label className="field-label">{t('Dish name')}<input data-autofocus required minLength={2} maxLength={180} value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} /></label><label className="field-label">{t('Arabic name')}<input dir="rtl" maxLength={180} value={draft.nameAr} onChange={e => setDraft(d => ({ ...d, nameAr: e.target.value }))} /></label></div><label className="field-label">{t('Description & ingredients')}<textarea rows={2} maxLength={1400} value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} /></label><div className="form-columns"><label className="field-label">{t('Category')}<input required maxLength={160} list={`categories-${venue.id}`} value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))} /><datalist id={`categories-${venue.id}`}>{menu.categories.map(c => <option key={c} value={c} />)}</datalist></label><label className="field-label">{t('Price')} ({t('EGP', 'ج.م')})<input type="number" min={1} max={100000} step="0.01" value={draft.price} onChange={e => setDraft(d => ({ ...d, price: e.target.value }))} placeholder={t('Optional')} /></label></div><label className="field-label">{t('Original dish image URL', 'رابط صورة الطبق الأصلية')}<input type="url" maxLength={3000} value={draft.image} onChange={e => setDraft(d => ({ ...d, image: e.target.value }))} placeholder="https://talabat.dhmedia.io/..." /></label><div className="menu-tag-inputs">{([{ id: 'popular', label: 'Popular' }, { id: 'student', label: 'Student deal' }, { id: 'vegetarian', label: 'Likely vegetarian' }, { id: 'spicy', label: 'Spicy' }] as const).map(tag => <label key={tag.id}><input type="checkbox" checked={draft[tag.id]} onChange={e => setDraft(d => ({ ...d, [tag.id]: e.target.checked }))} />{t(tag.label)}</label>)}</div><button className="button button-primary button-full" type="submit">{t('Save dish')}<Check size={14} /></button></form>}
    {mode === 'import' && <div className="inline-editor"><h4>{t('Import a matching menu', 'استيراد منيو مطابق')}</h4><p className="muted">{t('Only matching-brand archives are offered, so another restaurant’s dishes cannot be attached accidentally.', 'الأرشيفات المطابقة فقط متاحة، لتجنب ربط أطباق مطعم آخر بالخطأ.')}</p><label className="field-label">{t('Original cached menus', 'المنيوهات الأصلية المحفوظة')}<select value={importBrand} onChange={e => setImportBrand(e.target.value)}><option value="">{t('Choose a source...', 'اختار مصدر...')}</option>{matchedImports.map(([id, value]) => <option key={id} value={id}>{value.originRestaurantName || value.restaurantName} / {value.items.length}</option>)}</select></label><button className="button button-outline button-full" disabled={!importBrand} onClick={() => { try { applyImported(cachedMenus[importBrand]); } catch (err) { setError((err as Error).message); } }}>{t('Apply cached menu', 'طبّق المنيو المحفوظ')}</button><div className="editor-divider" /><input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={e => { void importFile(e.target.files?.[0]); e.target.value = ''; }} /><button className="button button-outline button-full" onClick={() => fileRef.current?.click()}><Upload size={14} />{t('Import menu JSON', 'استيراد منيو JSON')}</button><form onSubmit={e => { e.preventDefault(); void lookup(true); }}><label className="field-label">{t('Talabat URL (optional)', 'رابط طلبات (اختياري)')}<input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.talabat.com/egypt/restaurant/..." /></label>{!backend && <p className="privacy-note">{t('Live lookup needs your deployed backend.', 'الجلب المباشر يحتاج خادمك المنشور.')}<button className="text-button" type="button" onClick={onConnect}>{t('Connect')}</button></p>}<button type="submit" className="button button-primary button-full" disabled={busy}>{busy ? <LoaderCircle className="spinning" size={14} /> : <RefreshCw size={14} />}{t('Look up Talabat menu', 'اجلب منيو طلبات')}</button></form></div>}
    <div className="menu-search"><Search size={15} /><input type="search" enterKeyHint="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t('Search dishes, ingredients...', 'ابحث عن طبق أو مكونات...')} aria-label={t('Search dishes', 'بحث الأطباق')} />{query && <button onClick={() => setQuery('')} aria-label={t('Clear')}><X size={14} /></button>}</div><div className="menu-filter-row"><select value={category} aria-label={t('Category')} onChange={e => setCategory(e.target.value)}><option value="all">{t('All categories')}</option>{menu.categories.map(c => <option key={c}>{c}</option>)}</select><select value={sort} aria-label={t('Sort dishes', 'ترتيب الأطباق')} onChange={e => setSort(e.target.value)}><option value="source">{t('Menu order', 'ترتيب المنيو')}</option><option value="lowest">{t('Cheapest first', 'الأرخص أولًا')}</option><option value="highest">{t('Highest price first', 'الأغلى أولًا')}</option><option value="name">{t('Name (A–Z)')}</option><option value="popular">{t('Popular first', 'الأشهر أولًا')}</option></select><div className="small-budget-input"><input type="number" min={1} value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder={t('Max EGP', 'أقصى سعر')} aria-label={t('Max price per dish')} /></div></div><div className="menu-flag-tabs">{[{ id: 'all', label: 'Any' }, { id: 'popular', label: 'Popular' }, { id: 'student', label: 'Student deal' }, { id: 'vegetarian', label: 'Likely vegetarian' }, { id: 'spicy', label: 'Spicy' }, { id: 'saved', label: 'Saved' }].map(f => <button className={flag === f.id ? 'active' : ''} key={f.id} aria-pressed={flag === f.id} onClick={() => setFlag(f.id)}>{t(f.label)}</button>)}</div>
    {busy || sourceLoading && !menu.items.length ? <div className="menu-loading" role="status"><LoaderCircle size={20} className="spinning" /><strong>{t('Loading matching menu...', 'جارٍ تحميل المنيو المطابق...')}</strong><p>{t('Your existing data is kept until a usable source returns.', 'بياناتك الحالية محفوظة حتى يرجع مصدر قابل للاستخدام.')}</p></div> : null}
    {shown.length ? groups.map(group => (
      <section className="menu-group" key={group}>
        <h4>{group}<span>{n(matches.filter(item => item.category === group).length)}</span></h4>
        {shown.filter(item => item.category === group).map(item => (
          <article className="menu-item enhanced-menu-item" key={item.id}>
            {item.imageUrl && <MenuItemThumb src={item.imageUrl} alt={item.name} className="menu-dish-image" />}
            <div className="menu-item-info">
              <h5>{lang === 'ar' && item.nameAr ? item.nameAr : item.name}</h5>
              {item.nameAr && lang !== 'ar' && <span className="menu-arabic-name" dir="rtl">{item.nameAr}</span>}
              {item.description && <p>{item.description}</p>}
              <DishBadges item={item} />
              <div className="dish-tools">
                <button aria-label={`${t('Save dish')} ${item.name}`} aria-pressed={saved.has(dishKey(venue.id, item))} className={saved.has(dishKey(venue.id, item)) ? 'saved' : ''} onClick={() => tools.toggleSaved(venue, item)}><Bookmark size={13} fill={saved.has(dishKey(venue.id, item)) ? 'currentColor' : 'none'} />{saved.has(dishKey(venue.id, item)) ? t('Saved') : t('Save dish')}</button>
                <button onClick={() => addToPlan(item)}><Plus size={14} />{t('Plan this dish', 'أضف لخطة الوجبة')}</button>
              </div>
              {editing && <div className="dish-edit-actions">
                <button className="text-button" onClick={() => { setDraft({ id: item.id, name: item.name, nameAr: item.nameAr || '', description: item.description, category: item.category, price: item.price === null ? '' : String(item.price), image: item.imageUrl || '', popular: Boolean(item.isPopular), student: Boolean(item.isStudentDeal), vegetarian: Boolean(item.isVegetarian), spicy: Boolean(item.isSpicy) }); setMode('dish'); }}><Pencil size={12} />{t('Edit', 'تعديل')}</button>
                <button className="text-button" onClick={() => { if (confirmDelete === item.id) { changeMenu({ ...menu, items: menu.items.filter(previous => previous.id !== item.id) }); setConfirmDelete(''); } else setConfirmDelete(item.id); }}><Trash2 size={12} />{confirmDelete === item.id ? t('Confirm remove', 'أكد الحذف') : t('Remove')}</button>
              </div>}
            </div>
            <span className="menu-item-price"><strong>{item.price === null ? '--' : n(item.price)}</strong><small>{item.price === null ? t('Ask in store') : t('EGP', 'ج.م')}</small></span>
          </article>
        ))}
      </section>
    )) : !busy && (!sourceLoading || menu.items.length > 0) && <EmptyState icon={<BookOpen size={27} />} title={menu.items.length ? t('No dishes matched.', 'لا توجد أطباق مطابقة.') : t('No matching source menu yet.', 'لا يوجد منيو مطابق حتى الآن.')} description={menu.items.length ? t('Try another query or clear menu filters.', 'جرّب بحث تاني أو امسح الفلاتر.') : t('This venue has no usable menu in the loaded source. We will not replace it with another brand or invented meals.', 'المكان ده ملوش منيو قابل للاستخدام في المصدر المحمّل. لن نستبدله بمطعم آخر أو أطباق مصطنعة.')} action={<button className="button button-outline" onClick={() => { if (menu.items.length) { setQuery(''); setCategory('all'); setFlag('all'); setMaxPrice(''); } else setMode('import'); }}>{menu.items.length ? t('Clear filters') : t('Provide menu')}<Plus size={14} /></button>} />}
    {matches.length > visible && <button className="button button-outline button-full" onClick={() => setVisible(count => count + MENU_PAGE_SIZE)}>{t('Show more dishes', 'عرض أطباق أكثر')} ({n(shown.length)}/{n(matches.length)})<Plus size={14} /></button>}
    {onPlan && tools.plan.length > 0 && <button className="menu-plan-link" onClick={onPlan}>{t('View my meal plan', 'اعرض خطة وجبتي')}<span>{n(tools.plan.reduce((sum, item) => sum + item.quantity, 0))}</span></button>}
    <div className="menu-photo-check"><button className="text-button" disabled={!photoUrls.length || !navigator.onLine} onClick={() => void checkPhotos()}>{checkingPhotos ? <LoaderCircle size={13} className="spinning" /> : <Image size={14} />}{checkingPhotos ? t('Cancel photo check', 'إلغاء فحص الصور') : t('Check this menu’s photos', 'افحص صور المنيو')} ({n(photoUrls.length)})</button>{photoResults.length > 0 && <p aria-live="polite">{n(photoResults.length)} / {n(photoUrls.length)} {t('checked', 'تم فحصها')} / {n(photoResults.filter(result => result.status === 'loaded').length)} {t('loaded', 'محمّلة')} / {n(photoResults.filter(result => result.status !== 'loaded').length)} {t('unavailable or timed out', 'غير متاحة أو انتهت المهلة')}</p>}</div>
    <p className="notice-text"><Leaf size={14} />{t('Dietary labels are hints, never allergy guarantees. Confirm ingredients and live prices with the venue.', 'العلامات الغذائية إشارات، مش ضمان للحساسية. تأكد من المكونات والأسعار مع المكان.')}</p>
    {mode === 'report' && <form className="inline-editor" onSubmit={report}><h4>{t('Report a menu problem', 'بلّغ عن مشكلة في المنيو')}</h4><label className="field-label">{t('Problem', 'المشكلة')}<select value={reason} onChange={e => setReason(e.target.value)}>{['Wrong price', 'Wrong dish or restaurant', 'Missing dish', 'Photo problem', 'Dietary label problem'].map(value => <option key={value}>{value}</option>)}</select></label><label className="field-label">{t('Dish name')}<input maxLength={180} value={reportItem} onChange={e => setReportItem(e.target.value)} placeholder={t('Optional')} /></label><label className="field-label">{t('Details', 'التفاصيل')}<textarea maxLength={500} rows={3} value={detail} onChange={e => setDetail(e.target.value)} /></label><p className="privacy-note">{t('Private device report. Export from the menu check center to share; no false posting confirmation.', 'بلاغ خاص على جهازك. صدّره من مركز الفحص للمشاركة؛ لن يتم تأكيد نشر غير حقيقي.')}</p><button className="button button-primary button-full" type="submit">{t('Save problem report', 'احفظ البلاغ')}<Check size={14} /></button></form>}
    <div className="menu-bottom-actions">{menu.sourceUrl && <a className="text-button" href={menu.sourceUrl} target="_blank" rel="noopener noreferrer">{t('View source menu', 'عرض المصدر')}<ExternalLink size={13} /></a>}{menu.pdfUrl && <a className="text-button" href={menu.pdfUrl} target="_blank" rel="noopener noreferrer">{t('Menu PDF', 'ملف المنيو')}<Download size={13} /></a>}<button className="text-button" onClick={() => setMode(mode === 'report' ? null : 'report')}><TriangleAlert size={13} />{t('Report a problem', 'بلّغ عن مشكلة')}</button>{(menu.source === 'custom' || menu.source === 'live') && <button className="text-button" onClick={() => { if (confirmReset) { onReset(); setConfirmReset(false); } else setConfirmReset(true); }}>{confirmReset ? t('Confirm restore', 'أكد الاستعادة') : t('Restore original menu')}<RefreshCw size={13} /></button>}</div>
  </section>;
}