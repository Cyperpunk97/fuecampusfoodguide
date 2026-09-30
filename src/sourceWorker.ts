import { parseSourceData } from './sourceParser';

self.onmessage = (event: MessageEvent<(string | null)[]>) => {
  try { self.postMessage({ result: parseSourceData(event.data) }); }
  catch (error) { self.postMessage({ error: (error as Error).message }); }
};