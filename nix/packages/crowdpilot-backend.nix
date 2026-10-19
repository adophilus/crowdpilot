{
	lib,
	pkgs,
	nodejs,
	backend-bundle,
	...
}:
# Wrapper scripts for the backend service:
#   crowdpilot-backend         → the API server (systemd ExecStart)
#   crowdpilot-backend-migrate → migrations (systemd ExecStartPre)
# DATABASE_URL etc. arrive via the systemd unit's EnvironmentFile (sops-nix);
# wrappers only force NODE_ENV=production.
pkgs.symlinkJoin {
	name = "crowdpilot-backend";

	paths = [
		(pkgs.writeShellScriptBin "crowdpilot-backend" ''
			export NODE_ENV=production
			exec ${lib.getExe nodejs} ${backend-bundle}/dist/start.mjs
		'')
		(pkgs.writeShellScriptBin "crowdpilot-backend-migrate" ''
			export NODE_ENV=production
			exec ${lib.getExe nodejs} ${backend-bundle}/dist/migrate.mjs
		'')
	];
}
