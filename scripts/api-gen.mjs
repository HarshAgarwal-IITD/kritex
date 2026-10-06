#!/usr/bin/env node
// Generates src/lib/api/schema.d.ts from the backend OpenAPI spec.
// Spec source: $API_SPEC (file path or URL), default ../kritex-server/openapi.json.
//   npm run api:gen
//   API_SPEC=http://localhost:4000/api/docs-json npm run api:gen
//   API_SPEC=scripts/bootstrap-openapi.json npm run api:gen
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const spec = process.env.API_SPEC || "../kritex-server/openapi.json";
const out = "src/lib/api/schema.d.ts";

if (!/^https?:\/\//.test(spec) && !existsSync(spec)) {
  console.error(
    `api:gen: spec not found at "${spec}". Set API_SPEC to a file path or URL ` +
      `(e.g. API_SPEC=scripts/bootstrap-openapi.json).`,
  );
  process.exit(1);
}

const result = spawnSync("npx", ["openapi-typescript", spec, "-o", out], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(result.status ?? 1);
