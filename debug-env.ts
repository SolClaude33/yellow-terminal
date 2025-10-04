console.log("Debug: NODE_ENV at import time:", process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  console.log("Debug: Condition TRUE - will load vite");
  try {
    const vite = require('vite');
    console.log("Debug: Vite loaded successfully");
  } catch (e: any) {
    console.log("Debug: Vite load failed:", e.message);
  }
} else {
  console.log("Debug: Condition FALSE - NODE_ENV is:", process.env.NODE_ENV);
}
