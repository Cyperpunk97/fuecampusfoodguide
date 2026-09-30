import { useRef, useState } from 'react';
import { ArrowUpRight, BookOpen, Bookmark, Calculator, ChevronDown, ChevronRight, ClipboardList, ExternalLink, FileCheck2, GraduationCap, Languages, Moon, Plus, Search, Settings2, Shuffle, Smartphone, Sun, Trash2, Trophy, UserRound } from 'lucide-react';
import { useI18n, type Language } from './i18n';

export type MoreAction = 'saved-dishes' | 'planner' | 'menus' | 'compare' | 'campus' | 'faculty' | 'profile' | 'settings' | 'about' | 'install';

export function MobileMore({ onOpen, onLeaderboard, onLanguage, onToggleDarkMode, onSurprise, faculty, name, savedCount, planCount, connected, language, darkMode }: {
  onOpen: (action: MoreAction) => void;
  onLeaderboard: () => void;
  onLanguage: () => void;
  onToggleDarkMode: () => void;
  onSurprise: () => void;
  faculty: string;
  name: string;
  savedCount: number;
  planCount: number;
  connected: boolean;
  language: Language;
  darkMode: boolean;
}) {
  const { t, n } = useI18n();
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [ingredients, setIngredients] = useState([{ id: 0, name: '', calories: '', grams: '' }]);
  const nextIngredientId = useRef(1);
  const totalCalories = ingredients.reduce((total, ingredient) => {
    const calories = Number(ingredient.calories);
    const grams = Number(ingredient.grams);
    return total + (Number.isFinite(calories) && Number.isFinite(grams) ? calories * grams / 100 : 0);
  }, 0);
  const updateIngredient = (id: number, field: 'name' | 'calories' | 'grams', value: string) => {
    setIngredients(rows => rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };
  return <div className="more-screen">
    <header className="more-intro">
      <span className="more-eyebrow">CS FAMILY STAR / FUE</span>
      <h2>{t('More', 'المزيد')}</h2>
      <p>{t('Menus, planning and your account.', 'المنيوهات والتخطيط وحسابك.')}</p>
    </header>

    <section className="more-section" aria-label={t('Your food', 'أكلك')}>
      <h3>{t('Your food', 'أكلك')}</h3>
      <button className="more-item" onClick={() => onOpen('saved-dishes')}><span className="more-item-icon"><Bookmark size={19} /></span><span className="more-item-copy"><strong>{t('Saved dishes', 'أطباق محفوظة')}</strong><small>{savedCount ? `${n(savedCount)} ${t('dishes to try again', 'طبق عايز تجربه تاني')}` : t('Keep your go-to orders', 'احتفظ بطلباتك المفضلة')}</small></span><ChevronRight size={18} /></button>
      <button className="more-item" onClick={() => onOpen('planner')}><span className="more-item-icon"><ClipboardList size={19} /></span><span className="more-item-copy"><strong>{t('Meal budget planner', 'خطة الوجبة والميزانية')}</strong><small>{planCount ? `${n(planCount)} ${t('items in your plan', 'صنف في خطتك')}` : t('Plan a meal before you go', 'خطط لوجبتك قبل ما تروح')}</small></span><ChevronRight size={18} /></button>
    </section>

    <section className="more-section" aria-label={t('Food tools', 'أدوات الطعام')}>
      <h3>{t('Food tools', 'أدوات الطعام')}</h3>
      <button className="more-item" aria-expanded={calculatorOpen} aria-controls="calorie-calculator" onClick={() => setCalculatorOpen(open => !open)}>
        <span className="more-item-icon"><Calculator size={19} /></span>
        <span className="more-item-copy"><strong>{t('Calories calculator', 'حاسبة السعرات الحرارية')}</strong><small>{t('Estimate calories from ingredient amounts', 'قدّر السعرات حسب كمية المكونات')}</small></span>
        {calculatorOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      {calculatorOpen && <div className="calorie-calculator" id="calorie-calculator">
        <p className="calorie-note">{t('Enter calories per 100 g and the amount used. Google can help you look up each ingredient.', 'أدخل السعرات لكل ١٠٠ جم والكمية المستخدمة. يساعدك Google في البحث عن كل مكون.')}</p>
        {ingredients.map((ingredient, index) => <div className="calorie-ingredient" key={ingredient.id}>
          <div className="calorie-ingredient-heading">
            <strong>{t('Ingredient', 'المكون')} {n(index + 1)}</strong>
            {ingredients.length > 1 && <button className="calorie-remove" type="button" aria-label={`${t('Remove ingredient', 'احذف المكون')} ${index + 1}`} onClick={() => setIngredients(rows => rows.filter(row => row.id !== ingredient.id))}><Trash2 size={15} /></button>}
          </div>
          <div className="calorie-fields">
            <label className="calorie-field calorie-food-field"><span>{t('Food', 'الطعام')}</span><input value={ingredient.name} onChange={event => updateIngredient(ingredient.id, 'name', event.target.value)} placeholder={t('e.g. grilled chicken', 'مثال: دجاج مشوي')} /></label>
            <label className="calorie-field"><span>{t('Calories / 100 g', 'السعرات / ١٠٠ جم')}</span><input type="number" min="0" step="any" inputMode="decimal" value={ingredient.calories} onChange={event => updateIngredient(ingredient.id, 'calories', event.target.value)} placeholder="165" /></label>
            <label className="calorie-field"><span>{t('Amount (g)', 'الكمية (جم)')}</span><input type="number" min="0" step="any" inputMode="decimal" value={ingredient.grams} onChange={event => updateIngredient(ingredient.id, 'grams', event.target.value)} placeholder="120" /></label>
          </div>
          {ingredient.name.trim() && <a className="calorie-search-link" href={`https://www.google.com/search?q=${encodeURIComponent(`${ingredient.name.trim()} calories per 100 g`)}`} target="_blank" rel="noopener noreferrer"><Search size={14} />{t('Search Google', 'ابحث في Google')}<ExternalLink size={12} /></a>}
        </div>)}
        <button className="calorie-add" type="button" onClick={() => setIngredients(rows => [...rows, { id: nextIngredientId.current++, name: '', calories: '', grams: '' }])}><Plus size={15} />{t('Add ingredient', 'أضف مكونًا')}</button>
        <div className="calorie-total" aria-live="polite"><span>{t('Estimated total', 'الإجمالي التقديري')}</span><strong>{n(Number(totalCalories.toFixed(1)))} <small>kcal</small></strong></div>
        <p className="calorie-disclaimer">{t('Estimates vary by brand and preparation. Check packaging when available; Google results are not imported or verified.', 'تختلف التقديرات حسب النوع والتحضير. راجع العبوة عند توفرها؛ نتائج Google لا تُستورد أو تُراجع تلقائيًا.')}</p>
      </div>}
    </section>

    <section className="more-section" aria-label={t('Explore more', 'اكتشف أكثر')}>
      <h3>{t('Explore more', 'اكتشف أكثر')}</h3>
      <button className="more-item" onClick={onSurprise}><span className="more-item-icon"><Shuffle size={19} /></span><span className="more-item-copy"><strong>{t('Surprise me')}</strong><small>{t('Pick a food spot for me', 'اختار لي مكان أكل')}</small></span><ChevronRight size={18} /></button>
      <button className="more-item" onClick={onLeaderboard}><span className="more-item-icon"><Trophy size={19} /></span><span className="more-item-copy"><strong>{t('Leaderboard')}</strong><small>{t('The campus food critics', 'نقّاد أكل الجامعة')}</small></span><ChevronRight size={18} /></button>
      <button className="more-item" onClick={() => onOpen('compare')}><span className="more-item-icon"><BookOpen size={19} /></span><span className="more-item-copy"><strong>{t('Compare two spots')}</strong><small>{t('Find the right place for today', 'اختار المكان المناسب لليوم')}</small></span><ChevronRight size={18} /></button>
      <button className="more-item" onClick={() => onOpen('menus')}><span className="more-item-icon"><FileCheck2 size={19} /></span><span className="more-item-copy"><strong>{t('Check menus', 'افحص المنيوهات')}</strong><small>{t('Sources, prices & missing menus', 'المصادر والأسعار والمنيوهات الناقصة')}</small></span><ChevronRight size={18} /></button>
    </section>

    <section className="more-section" aria-label={t('Your app', 'تطبيقك')}>
      <h3>{t('Your app', 'تطبيقك')}</h3>
      <button className="more-item" onClick={() => onOpen('campus')}><span className="more-item-icon"><GraduationCap size={19} /></span><span className="more-item-copy"><strong>{t('Campus & nearby', 'الجامعة والقريب')}</strong><small>{t('Choose where to browse', 'اختار منطقة البحث')}</small></span><ChevronRight size={18} /></button>
      <button className="more-item" onClick={() => onOpen('faculty')}><span className="more-item-icon"><GraduationCap size={19} /></span><span className="more-item-copy"><strong>{t('Your faculty')}</strong><small>{faculty}</small></span><ChevronRight size={18} /></button>
      <button className="more-item" onClick={() => onOpen('profile')}><span className="more-item-icon"><UserRound size={19} /></span><span className="more-item-copy"><strong>{t('Your profile')}</strong><small>{name}</small></span><ChevronRight size={18} /></button>
      <button className="more-item" onClick={onLanguage}><span className="more-item-icon"><Languages size={19} /></span><span className="more-item-copy"><strong>{t('Language')}</strong><small>{language === 'en' ? 'English / العربية' : 'العربية / English'}</small></span><ChevronRight size={18} /></button>
      <button className="more-item" onClick={onToggleDarkMode} aria-pressed={darkMode}><span className="more-item-icon">{darkMode ? <Sun size={19} /> : <Moon size={19} />}</span><span className="more-item-copy"><strong>{t('Dark mode', 'الوضع الداكن')}</strong><small>{darkMode ? t('On', 'مفعّل') : t('Off', 'متوقف')}</small></span><span className={`theme-switch ${darkMode ? 'active' : ''}`} aria-hidden="true"><i /></span></button>
      <button className="more-item" onClick={() => onOpen('settings')}><span className="more-item-icon"><Settings2 size={19} /></span><span className="more-item-copy"><strong>{t('Settings')}</strong><small>{connected ? t('Community connected', 'المجتمع متصل') : t('Saved on this device', 'محفوظ على الجهاز')}</small></span><ChevronRight size={18} /></button>
    </section>

    <div className="more-bottom-links">
      <button onClick={() => onOpen('about')}><BookOpen size={16} />{t('About FUE')}<ArrowUpRight size={14} /></button>
      <button onClick={() => onOpen('install')}><Smartphone size={16} />{t('Get the Android app')}<ArrowUpRight size={14} /></button>
    </div>
  </div>;
}