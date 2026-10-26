{
	pkgs,
	stdenv,
	nodejs,
	pnpm,
	pnpmConfigHook,
	fetchPnpmDeps,
	...
}:
# The backend ships as esbuild BUNDLES (dist/start.mjs + dist/migrate.mjs):
# workspace sources (source-as-package), the Effect stack, and pg/kysely are
# all inlined — no runtime node_modules, no pg-native. The migrate bundle is
# the service's ExecStartPre; it reads migrations from ../migrations relative
# to itself, so installPhase places them at $out/migrations (next to dist/).
stdenv.mkDerivation (finalAttrs: {
	pname = "crowdpilot-backend-bundle";
	version = "0.0.1";

	src = ../..;

	pnpmDeps = fetchPnpmDeps {
		inherit (finalAttrs) pname src;
		inherit pnpm;
		fetcherVersion = 4;
		hash = "";
	};

	nativeBuildInputs = [
		nodejs
		pnpm
		pnpmConfigHook
	];

	CI = "true";

	buildPhase = ''
		runHook preBuild
		pnpm --filter @crowdpilot/backend build:prod
		runHook postBuild
	'';

	installPhase = ''
		runHook preInstall
		mkdir -p $out/dist $out/migrations
		cp apps/backend/dist/start.mjs apps/backend/dist/migrate.mjs $out/dist/
		cp packages/sql/migrations/*.sql $out/migrations/
		runHook postInstall
	'';
})
