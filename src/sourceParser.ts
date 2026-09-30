import { parse } from '@babel/parser';
import type { Node } from '@babel/types';
import { makeVenue, type Menus, type Venue } from './data';
import { normalizeMenu } from './menuLogic';

export type ParsedSources = {
  menus?: Menus;
  cachedMenus?: Menus;
  venues?: Venue[];
  messages?: Record<string, string>;
  errors: string[];
  successes: number;
};

function literal(node: Node | null | undefined): unknown {
  if (!node) return undefined;
  switch (node.type) {
    case 'StringLiteral': case 'NumericLiteral': case 'BooleanLiteral': return node.value;
    case 'NullLiteral': return null;
    case 'TSAsExpression': case 'TSSatisfiesExpression': case 'TSNonNullExpression': return literal(node.expression);
    case 'ArrayExpression': return node.elements.map(item => literal(item));
    case 'ObjectExpression': {
      const result: Record<string, unknown> = Object.create(null);
      for (const property of node.properties) {
        if (property.type !== 'ObjectProperty' || property.computed) continue;
        const key = property.key.type === 'Identifier' ? property.key.name : property.key.type === 'StringLiteral' || property.key.type === 'NumericLiteral' ? String(property.key.value) : null;
        if (key && !['__proto__', 'constructor', 'prototype'].includes(key)) result[key] = literal(property.value);
      }
      return result;
    }
    case 'UnaryExpression': return node.operator === '-' && typeof literal(node.argument) === 'number' ? -Number(literal(node.argument)) : undefined;
    default: return undefined;
  }
}

function extractConstants(source: string): Record<string, unknown> {
  const ast = parse(source, { sourceType: 'module', plugins: ['typescript'], attachComment: false });
  const result: Record<string, unknown> = Object.create(null);
  for (const statement of ast.program.body) {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (declaration?.type !== 'VariableDeclaration') continue;
    for (const variable of declaration.declarations) if (variable.id.type === 'Identifier') result[variable.id.name] = literal(variable.init);
  }
  return result;
}

function normalizeCollection(value: unknown, source: 'repository' | 'talabat-cache'): Menus {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Menus = {};
  for (const [id, raw] of Object.entries(value)) {
    if (['__proto__', 'constructor', 'prototype'].includes(id)) continue;
    const menu = normalizeMenu(raw, source);
    if (menu && menu.items.length) result[id] = { ...menu, restaurantId: menu.restaurantId || id };
  }
  return result;
}

/** The expensive TypeScript and JSON parsing runs in a worker on supported devices. */
export function parseSourceData(sources: (string | null)[]): ParsedSources {
  const paths = ['menus.ts', 'talabatMenusData.json', 'venues.ts', 'i18n.ts'];
  const parsed: ParsedSources = { errors: [], successes: 0 };
  sources.forEach((text, index) => {
    if (text === null) return;
    try {
      if (index === 0) {
        const menus = normalizeCollection(extractConstants(text).DEFAULT_MENUS, 'repository');
        if (!Object.keys(menus).length) throw new Error('No authored menus found.');
        parsed.menus = menus;
      } else if (index === 1) {
        const menus = normalizeCollection(JSON.parse(text), 'talabat-cache');
        if (!Object.keys(menus).length) throw new Error('No Talabat menus found.');
        parsed.cachedMenus = menus;
      } else if (index === 2) {
        const source = extractConstants(text);
        const brand = (source.CONTACTS_BY_BRAND || {}) as Record<string, Record<string, unknown>>;
        const branch = (source.CONTACTS_BY_ID || {}) as Record<string, Record<string, unknown>>;
        const catalog = ((source.CATALOG || []) as Record<string, unknown>[])
          .filter(v => typeof v.id === 'string' && typeof v.lat === 'number' && typeof v.lng === 'number')
          .map(v => makeVenue({ ...v, ...brand[String(v.brand)], ...branch[String(v.id)] }));
        if (!catalog.length) throw new Error('No original venues found.');
        parsed.venues = catalog;
      } else {
        const messages = extractConstants(text);
        const en = (messages.en || {}) as Record<string, string>;
        const ar = (messages.ar || {}) as Record<string, string>;
        parsed.messages = {};
        for (const [key, english] of Object.entries(en)) if (typeof english === 'string' && typeof ar[key] === 'string') parsed.messages[english] = ar[key];
      }
      parsed.successes++;
    } catch (error) { parsed.errors.push(`${paths[index]}: ${(error as Error).message}`); }
  });
  return parsed;
}