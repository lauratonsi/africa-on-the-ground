// npm run validate
import { loadAll, validate, report } from "./lib.mjs";

const result = validate(loadAll());
report(result);
process.exit(result.errors.length ? 1 : 0);
