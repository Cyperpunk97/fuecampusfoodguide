import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { normalized, type MenuItem, type RestaurantMenu, type Venue } from './data';

export type DishReference = { key: string; venueId: string; venueName: string; item: MenuItem; savedAt: string };
export type PlannedDish = DishReference & { quantity: number };
export type MenuReport = { id: string; venueId: string; venueName: string; itemName?: string; reason: string; detail: string; date: string };
type FoodState = { saved: DishReference[]; plan: PlannedDish[]; budget: number; reports: MenuReport[] };
const EMPTY: FoodState = { saved: [], plan: [], budget: 250, reports: [] };
const KEY = 'cs-star-food-tools-v1';

export const dishKey = (venueId: string, item: MenuItem) => `${venueId}::${item.id}`;
export function currentDish(reference: DishReference, menus: Record<string, RestaurantMenu>): MenuItem | undefined {
  const items = menus[reference.venueId]?.items || [];
  const exact = items.find(item => item.id === reference.item.id);
  if (exact && normalized(exact.name) === normalized(reference.item.name)) return exact;
  const named = items.filter(item => normalized(item.name) === normalized(reference.item.name) && normalized(item.category) === normalized(reference.item.category));
  return named.length === 1 ? named[0] : undefined;
}

function validReference(value: unknown): value is DishReference {
  const item = value && typeof value === 'object' ? (value as { item?: unknown }).item : null;
  const row = value as Partial<DishReference> | null;
  return Boolean(row && typeof row.key === 'string' && row.key.length <= 240 && typeof row.venueId === 'string' && row.venueId.length <= 120 && typeof row.venueName === 'string' && row.venueName.length <= 160 && item && typeof item === 'object' && typeof (item as MenuItem).name === 'string');
}

/** Shared with backup import so malformed files cannot poison device state. */
export function sanitizeFoodState(value: unknown): FoodState {
  const raw = value && typeof value === 'object' ? value as Partial<FoodState> : {};
  const saved = Array.isArray(raw.saved) ? raw.saved.filter(validReference).slice(0, 300) : [];
  const plan = Array.isArray(raw.plan) ? raw.plan.filter(validReference).slice(0, 50).map(item => ({
    ...item,
    quantity: Math.min(20, Math.max(1, Math.round(Number((item as PlannedDish).quantity) || 1))),
  })) : [];
  const budget = Number.isFinite(raw.budget) && Number(raw.budget) > 0 && Number(raw.budget) <= 100000 ? Number(raw.budget) : 250;
  const reports = Array.isArray(raw.reports) ? raw.reports.filter(report => report && typeof report === 'object' && typeof (report as MenuReport).venueId === 'string').slice(0, 200) as MenuReport[] : [];
  return { saved, plan, budget, reports };
}

function readState(): FoodState {
  try { return sanitizeFoodState(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch { return { ...EMPTY, saved: [], plan: [], reports: [] }; }
}

function useFoodState() {
  const [state, setState] = useState<FoodState>(readState);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { window.dispatchEvent(new Event('cs-storage-error')); } }, [state]);
  return useMemo(() => ({
    ...state,
    toggleSaved(venue: Venue, item: MenuItem) {
      const key = dishKey(venue.id, item);
      setState(old => ({ ...old, saved: old.saved.some(dish => dish.key === key) ? old.saved.filter(dish => dish.key !== key) : [{ key, venueId: venue.id, venueName: venue.brand, item, savedAt: new Date().toISOString() }, ...old.saved].slice(0, 300) }));
    },
    removeSaved(key: string) { setState(old => ({ ...old, saved: old.saved.filter(dish => dish.key !== key) })); },
    addToPlan(venue: Venue, item: MenuItem) {
      const key = dishKey(venue.id, item);
      let added = false;
      setState(old => {
        const previous = old.plan.find(dish => dish.key === key);
        if (previous && previous.quantity >= 20 || !previous && old.plan.length >= 50) return old;
        added = true;
        return { ...old, plan: previous ? old.plan.map(dish => dish.key === key ? { ...dish, quantity: Math.min(20, dish.quantity + 1) } : dish) : [...old.plan, { key, venueId: venue.id, venueName: venue.brand, item, savedAt: new Date().toISOString(), quantity: 1 }] };
      });
      return added;
    },
    setQuantity(key: string, quantity: number) { setState(old => ({ ...old, plan: quantity < 1 ? old.plan.filter(dish => dish.key !== key) : old.plan.map(dish => dish.key === key ? { ...dish, quantity: Math.min(20, Math.round(quantity)) } : dish) })); },
    clearPlan() { setState(old => ({ ...old, plan: [] })); },
    setBudget(budget: number) { if (Number.isFinite(budget) && budget > 0 && budget <= 100000) setState(old => ({ ...old, budget })); },
    reportMenu(report: Omit<MenuReport, 'id' | 'date'>) { setState(old => ({ ...old, reports: [{ ...report, id: `report-${Date.now()}`, date: new Date().toISOString() }, ...old.reports].slice(0, 200) })); },
    restore(value: unknown) { setState(sanitizeFoodState(value)); },
    clear() { setState({ ...EMPTY, saved: [], plan: [], reports: [] }); },
  }), [state]);
}
type FoodTools = ReturnType<typeof useFoodState>;
const Context = createContext<FoodTools | null>(null);
export function FoodToolsProvider({ children }: { children: ReactNode }) { return <Context.Provider value={useFoodState()}>{children}</Context.Provider>; }
export function useFoodTools(): FoodTools { const tools = useContext(Context); if (!tools) throw new Error('Food tools provider is missing.'); return tools; }

export function downloadJson(filename: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
