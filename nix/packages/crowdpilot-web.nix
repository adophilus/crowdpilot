{
	lib,
	pkgs,
	nodejs,
	web-bundle,
	...
}:
# Wrapper for the web service (systemd ExecStart). PORT arrives via the
# systemd unit (Environment = "PORT=3000"); NODE_ENV forced here.
pkgs.symlinkJoin {
	name = "crowdpilot-web";

	paths = [
		(pkgs.writeShellScriptBin "crowdpilot-web" ''
			export NODE_ENV=production
			exec ${lib.getExe nodejs} ${web-bundle}/dist/serve.mjs
		'')
	];
}
