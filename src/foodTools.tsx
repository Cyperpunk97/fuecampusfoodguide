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

function readState(): FoodState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null') as FoodState | null;
    if (!raw) return EMPTY;
    const reference = (value: DishReference) => value && typeof value.key === 'string' && typeof value.venueId === 'string' && value.item && typeof value.item.name === 'string';
    return { saved: Array.isArray(raw.saved) ? raw.saved.filter(reference).slice(0, 300) : [],
      plan: Array.isArray(raw.plan) ? raw.plan.filter(reference).slice(0, 50).map(item => ({ ...item, quantity: Math.min(20, Math.max(1, Math.round(Number(item.quantity) || 1))) })) : [],
      budget: Number.isFinite(raw.budget) && raw.budget > 0 ? raw.budget : 250,
      reports: Array.isArray(raw.reports) ? raw.reports.filter(report => report && typeof report.venueId === 'string').slice(0, 200) : [] };
  } catch { return EMPTY; }
}

function useFoodState() {
  const [state, setState] = useState<FoodState>(readState);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { window.dispatchEvent(new Event('cs-storage-error')); } }, [state]);
  const tools = useMemo(() => ({
    ...state,
    toggleSaved(venue: Venue, item: MenuItem) {
      const key = dishKey(venue.id, item);
      setState(old => ({ ...old, saved: old.saved.some(dish => dish.key === key) ? old.saved.filter(dish => dish.key !== key) : [{ key, venueId: venue.id, venueName: venue.brand, item, savedAt: new Date().toISOString() }, ...old.saved].slice(0, 300) }));
    },
    removeSaved(key: string) { setState(old => ({ ...old, saved: old.saved.filter(dish => dish.key !== key) })); },
    addToPlan(venue: Venue, item: MenuItem) {
      const key = dishKey(venue.id, item);
      const previous = state.plan.find(dish => dish.key === key);
      if (previous && previous.quantity >= 20 || !previous && state.plan.length >= 50) return false;
      setState(old => ({ ...old, plan: old.plan.some(dish => dish.key === key) ? old.plan.map(dish => dish.key === key ? { ...dish, quantity: Math.min(20, dish.quantity + 1) } : dish) : [...old.plan, { key, venueId: venue.id, venueName: venue.brand, item, savedAt: new Date().toISOString(), quantity: 1 }].slice(0, 50) }));
      return true;
    },
    setQuantity(key: string, quantity: number) { setState(old => ({ ...old, plan: quantity < 1 ? old.plan.filter(dish => dish.key !== key) : old.plan.map(dish => dish.key === key ? { ...dish, quantity: Math.min(20, Math.round(quantity)) } : dish) })); },
    clearPlan() { setState(old => ({ ...old, plan: [] })); },
    setBudget(budget: number) { if (Number.isFinite(budget) && budget > 0 && budget <= 100000) setState(old => ({ ...old, budget })); },
    reportMenu(report: Omit<MenuReport, 'id' | 'date'>) { setState(old => ({ ...old, reports: [{ ...report, id: `report-${Date.now()}`, date: new Date().toISOString() }, ...old.reports].slice(0, 200) })); },
  }), [state]);
  return tools;
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