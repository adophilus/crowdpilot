import { build } from "esbuild";
import { cpSync } from "node:fs";

/* Production bundler: one self-contained ESM file per entry (dist/start.mjs,
 * dist/migrate.mjs). Workspace sources (the @crowdpilot/* packages point at
 * src/*.ts) and all deps are inlined — no runtime node_modules. pg-native
 * stays external: it's pg's optional lazy require, never installed in prod.
 *
 * The migrate bundle reads SQL from ../migrations relative to itself (same
 * rule as unbundled: <dirname>/../migrations), so migrations are copied to
 * apps/backend/migrations here — dev (tsx, packages/sql) and the nix install
 * ($out/migrations next to $out/dist) both resolve it unchanged.
 *
 * The createRequire banner matters: bundled CJS deps (pg) still `require()`
 * node builtins, and esbuild's ESM shim throws on those unless a real
 * `require` exists in scope. */

await build({
	entryPoints: ["scripts/start.ts", "../../packages/sql/scripts/migrate.ts"],
	bundle: true,
	platform: "node",
	format: "esm",
	target: "node22",
	tsconfig: "tsconfig.json",
	external: ["pg-native"],
	define: { "process.env.NODE_ENV": '"production"' },
	outdir: "dist",
	entryNames: "[name]",
	outExtension: { ".js": ".mjs" },
	banner: {
		js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
	},
	logLevel: "info",
});

cpSync("../../packages/sql/migrations", "migrations", { recursive: true });
