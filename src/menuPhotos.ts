import { normalizeDishImage } from './menuLogic';

export type PhotoResult = { url: string; status: 'loaded' | 'unavailable' | 'timeout' };

export async function checkMenuPhotos(urls: string[], signal: AbortSignal, onProgress: (results: PhotoResult[]) => void): Promise<PhotoResult[]> {
  const queue = Array.from(new Set(urls.map(normalizeDishImage).filter((url): url is string => Boolean(url))));
  const results: PhotoResult[] = []; let index = 0;
  const probe = (url: string) => new Promise<PhotoResult>(resolve => {
    if (signal.aborted) { resolve({ url, status: 'timeout' }); return; }
    const image = new Image(); let settled = false;
    const finish = (status: PhotoResult['status']) => {
      if (settled) return; settled = true; clearTimeout(timer);
      image.onload = null; image.onerror = null; signal.removeEventListener('abort', cancelled);
      resolve({ url, status });
    };
    const cancelled = () => { finish('timeout'); image.src = ''; };
    const timer = window.setTimeout(() => { finish('timeout'); image.src = ''; }, 8000);
    image.onload = () => finish(image.naturalWidth > 0 ? 'loaded' : 'unavailable');
    image.onerror = () => finish('unavailable'); image.referrerPolicy = 'no-referrer';
    signal.addEventListener('abort', cancelled, { once: true }); image.src = url;
  });
  await Promise.all(Array.from({ length: Math.min(4, queue.length) }, async () => {
    while (index < queue.length && !signal.aborted) {
      const result = await probe(queue[index++]); if (signal.aborted) return;
      results.push(result); onProgress([...results]);
    }
  }));
  return results;
}