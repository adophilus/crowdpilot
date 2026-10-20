{
	pkgs,
	stdenv,
	nodejs,
	pnpm,
	pnpmConfigHook,
	fetchPnpmDeps,
	...
}:
# The web ships as the TanStack Start SSR bundle (vite build → dist/server +
# dist/client) plus scripts/serve.mjs (a ~90-line node host that serves
# dist/client statics and hands everything else to the SSR handler).
# Built with VITE_API_URL=/api — Caddy routes /api/* to the backend on the
# same origin, so no CORS and no second hostname.
stdenv.mkDerivation (finalAttrs: {
	pname = "crowdpilot-web-bundle";
	version = "0.0.1";

	src = ../..;

	pnpmDeps = fetchPnpmDeps {
		inherit (finalAttrs) pname src;
		inherit pnpm;
		fetcherVersion = 4;
		hash = "sha256-Vvd1Am+3YU2OusmTyn2+jYLZO5uwEpEvusye1RyyDr0=";
	};

	nativeBuildInputs = [
		nodejs
		pnpm
		pnpmConfigHook
	];

	CI = "true";

	buildPhase = ''
		runHook preBuild
		VITE_API_URL=/api pnpm --filter @crowdpilot/web build
		# vite's SSR output externalizes react — bundle it into one ESM file so
		# the runtime needs no node_modules. (esbuild is transitive via vite, so
		# reference pnpm's hoisted .bin directly.)
		node_modules/.pnpm/node_modules/.bin/esbuild apps/web/dist/server/server.js \
			--bundle --platform=node --format=esm \
			--banner:js='import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' \
			--outfile=apps/web/dist/server/server.bundle.mjs
		runHook postBuild
	'';

	installPhase = ''
		runHook preInstall
		mkdir -p $out/dist
		cp -r apps/web/dist/client $out/dist/client
		cp apps/web/dist/server/server.bundle.mjs $out/dist/server.mjs
		cp apps/web/scripts/serve.mjs $out/dist/serve.mjs
		runHook postInstall
	'';
})
