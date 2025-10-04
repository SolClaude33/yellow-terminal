import { createRequire } from "module";
const require = createRequire(import.meta.url);
(global as any).require = require;

import "./index.js";
