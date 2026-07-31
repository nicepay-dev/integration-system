import { defineConfig } from 'vite';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export default defineConfig({
  cacheDir: join(tmpdir(), 'nicepay-vite-cache'),
});
