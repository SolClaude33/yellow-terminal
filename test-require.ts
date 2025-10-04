import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log("Testing require with createRequire:");
try {
  const vite = require('vite');
  console.log("✓ Vite loaded");
} catch (e: any) {
  console.log("✗ Failed:", e.message);
}
