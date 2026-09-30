import { createContext, useContext, type ReactNode } from 'react';

export type Language = 'en' | 'ar';
const dictionary: Record<string, string> = {
  'Discover': 'اكتشف', 'My favorites': 'المفضلة', 'Campus memories': 'ذكريات الجامعة', 'Leaderboard': 'أفضل المقيّمين', 'More': 'المزيد',
  'Settings': 'الإعدادات', 'Saved': 'المفضلة', 'Memories': 'ذكريات', 'Top foodies': 'المقيّمون', 'Food spots': 'أماكن الأكل',
  'Places': 'الأماكن', 'Dishes': 'الأطباق', 'All spots': 'كل الأماكن', 'Cafés': 'كافيهات', 'Fast food': 'وجبات سريعة', 'Restaurants': 'مطاعم', 'Sweet treats': 'حلويات',
  'Cafe': 'كافيه', 'Restaurant': 'مطعم', 'Fast Food': 'وجبات سريعة', 'On campus': 'داخل الحرم', 'On campus only': 'داخل الحرم فقط',
  'Filters': 'الفلاتر', 'Compare': 'قارن', 'Compare two spots': 'قارن بين مكانين', 'Search': 'بحث', 'Clear': 'مسح', 'Reset all': 'إعادة الضبط',
  'Nearest first': 'الأقرب أولًا', 'Top rated': 'الأعلى تقييمًا', 'Most reviewed': 'الأكثر تقييمًا', 'Price: low to high': 'الأرخص أولًا',
  'Price: high to low': 'الأغلى أولًا', 'Name (A–Z)': 'الاسم (أ–ي)', 'Grid': 'بطاقات', 'List': 'قائمة', 'Map': 'خريطة',
  'Your campus. Your kind of food.': 'جامعتك. والأكل اللي بتحبه.', 'A taste of campus': 'دليلك لأكل الجامعة',
  'Explore food spots': 'اكتشف أماكن الأكل', 'Surprise me': 'فاجئني', 'By students. For students.': 'من الطلاب. للطلاب.',
  'Your campus, in your pocket.': 'جامعتك معاك في جيبك.', 'Get the Android app': 'احصل على تطبيق أندرويد',
  'About FUE': 'عن جامعة المستقبل', 'Your faculty': 'كليتك', 'Campus Center': 'وسط الحرم',
  'No reviews yet': 'لا توجد تقييمات بعد', 'Reviews': 'التقييمات', 'Overview': 'نظرة عامة', 'Menu': 'المنيو', 'Study spot': 'مكان للمذاكرة',
  'Directions': 'الاتجاهات', 'Share': 'مشاركة', 'Call': 'اتصال', 'View menu': 'عرض المنيو', 'Save': 'حفظ', 'Remove': 'إزالة', 'Cancel': 'إلغاء',
  'Your rating': 'تقييمك', 'Your name': 'اسمك', 'Your review': 'رأيك', 'Write a review': 'اكتب تقييمًا', 'Post review': 'انشر التقييم',
  'Save my review': 'احفظ تقييمي', 'What should people order?': 'تنصح الناس تطلب إيه؟', 'How much did you spend per person?': 'دفعت كام للفرد؟',
  'Optional': 'اختياري', 'Price history': 'سجل الأسعار', 'Rating breakdown': 'تفصيل التقييمات', 'Must-try dishes': 'أطباق لازم تجربها',
  'Approximate location': 'موقع تقريبي', 'Hours unknown': 'المواعيد غير متاحة', 'Open now': 'مفتوح الآن', 'Closed': 'مغلق',
  'Popular': 'شائع', 'Student deal': 'عرض للطلاب', 'Likely vegetarian': 'نباتي على الأرجح', 'Spicy': 'حار', 'Any': 'الكل',
  'Ask in store': 'اسأل في المحل', 'All categories': 'كل الأقسام', 'Add dish': 'أضف طبق', 'Provide menu': 'أضف منيو',
  'Dish name': 'اسم الطبق', 'Arabic name': 'الاسم بالعربية', 'Description & ingredients': 'الوصف والمكونات', 'Category': 'القسم', 'Price': 'السعر',
  'Import menu': 'استيراد منيو', 'Export menu': 'تصدير المنيو', 'Save dish': 'احفظ الطبق', 'Restore original menu': 'استعادة المنيو الأصلي',
  'English': 'English', 'Language': 'اللغة', 'Refresh': 'تحديث', 'Retry': 'حاول تاني', 'Loading…': 'جارٍ التحميل…',
  'Budget': 'اقتصادي', 'Mid-range': 'متوسط', 'Premium': 'مميز', 'Any price': 'أي سعر', 'Minimum rating': 'أقل تقييم',
  'Walking distance only': 'على مسافة مشي فقط', 'Favorites only': 'المفضلة فقط', 'Student deals only': 'عروض الطلاب فقط',
  'Good for studying': 'مناسب للمذاكرة', 'Vegetarian options': 'اختيارات نباتية', 'Spicy options': 'اختيارات حارة',
  'Max price per dish': 'أقصى سعر للطبق', 'Find a dish': 'ابحث عن طبق', 'Clear filters': 'مسح الفلاتر',
  'Share a memory': 'شارك ذكرى', 'Your story': 'حكايتك', 'Title': 'العنوان', 'Mood': 'المزاج', 'Date of outing': 'تاريخ الخروجة',
  'Faculty / department': 'الكلية أو القسم', 'Tags': 'الوسوم', 'All moods': 'كل الحالات', 'All places': 'كل الأماكن',
  'Give a little cheer': 'شجّع صاحب الذكرى', 'Save memory': 'احفظ الذكرى', 'Your profile': 'ملفك', 'Save profile': 'احفظ الملف',
  'Your device': 'على جهازك', 'Community': 'المجتمع', 'Device only': 'على الجهاز فقط', 'Connected': 'متصل',
  'Backend connection': 'اتصال الخادم', 'Connect': 'اتصل', 'Disconnect': 'قطع الاتصال', 'Test connection': 'اختبر الاتصال',
  'Original project': 'المشروع الأصلي', 'Logo credits': 'حقوق الشعارات', 'Yes': 'نعم', 'No': 'لا',
  'No votes yet': 'لا توجد أصوات بعد', 'Your vote': 'صوتك', 'Apply filters': 'طبّق الفلاتر', 'Distance': 'المسافة',
  'From your faculty': 'من كليتك', 'Typical spend': 'متوسط الإنفاق', 'First spot': 'المكان الأول', 'Second spot': 'المكان الثاني',
};
type I18nValue = { lang: Language; t: (english: string, arabic?: string) => string; n: (value: number | string) => string };
const Context = createContext<I18nValue>({ lang: 'en', t: text => text, n: String });
export function I18nProvider({ lang, messages, children }: { lang: Language; messages?: Record<string, string>; children: ReactNode }) {
  const t = (text: string, ar?: string) => lang === 'ar' ? ar || dictionary[text] || messages?.[text] || text : text;
  const n = (value: number | string) => lang === 'ar' ? String(value).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)]) : String(value);
  return <Context.Provider value={{ lang, t, n }}>{children}</Context.Provider>;
}
export const useI18n = () => useContext(Context);
