import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';

async function loadModule(entry, exports) {
  const result = await build({
    stdin: { contents: `export { ${exports.join(', ')} } from '${entry}';`, resolveDir: process.cwd(), sourcefile: 'test-entry.ts' },
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    target: 'node22',
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

test('menu normalisation accepts supported source data and rejects unsafe values', async () => {
  const menu = await loadModule('./src/menuLogic.ts', ['parseDishPrice', 'safeMenuUrl', 'normalizeDishImage', 'normalizeMenu', 'runMenuChecks']);
  assert.equal(menu.parseDishPrice('٩٥٫٥٠ ج.م'), 95.5);
  assert.equal(menu.parseDishPrice(0), null);
  assert.equal(menu.safeMenuUrl('http://example.test/menu'), undefined);
  assert.equal(menu.normalizeDishImage('javascript:alert(1)'), null);
  assert.equal(menu.normalizeMenu({ currency: 'USD', items: [{ name: 'Coffee', price: 5 }] }), null);
  assert.ok(menu.runMenuChecks().every(check => check.passed));
});

test('backup import keeps valid device data and ignores prototype-pollution keys', async () => {
  const backup = await loadModule('./src/backup.ts', ['parseDeviceBackup']);
  const result = backup.parseDeviceBackup(JSON.stringify({
    version: 4,
    favorites: ['fue-cilantro', '__proto__'],
    profile: { name: 'Campus tester', faculty: 'CS' },
    language: 'ar',
    menuPreferences: { 'fue-cilantro': 'repository', constructor: 'talabat' },
    menuOverrides: { '__proto__': { items: [{ name: 'Bad' }] } },
    reviews: [{ id: 'review-1', venueId: 'fue-cilantro', name: 'Tester', rating: 5, comment: 'Nice', spent: 90, date: '2026-10-06' }],
  }));
  assert.equal(result.language, 'ar');
  assert.deepEqual(result.favorites, ['fue-cilantro']);
  assert.deepEqual(result.menuPreferences, { 'fue-cilantro': 'repository' });
  assert.equal(Object.keys(result.menuOverrides).length, 0);
  assert.equal(result.reviews[0].rating, 5);
});

test('PWA manifest points to committed static install icons', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
  assert.deepEqual(manifest.icons.map(icon => icon.src).filter(src => src.endsWith('.png')), ['/icons/icon-192.png', '/icons/icon-512.png']);
  for (const icon of manifest.icons.filter(icon => icon.src.endsWith('.png'))) {
    const asset = await readFile(new URL(`../public${icon.src}`, import.meta.url));
    assert.deepEqual([...asset.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  }
});

test('repository ignores generated dependencies and builds', async () => {
  const ignore = await readFile(new URL('../.gitignore', import.meta.url), 'utf8');
  assert.match(ignore, /^node_modules\/$/m);
  assert.match(ignore, /^dist\/$/m);
});
