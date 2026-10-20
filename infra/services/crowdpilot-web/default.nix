{
	pkgs,
	lib,
	config,
	...
}:
# Web (TanStack Start SSR) — serves the app on :3000. Caddy routes
# crowdpilot.hackathons.adophilus.com here, with /api/* to the backend.
# Needs no secrets: static assets + SSR only. PORT is set inline (not a
# secret) so the backend's sops dotenv keeps its own PORT=1050.
{
	systemd.user.services.crowdpilot-web = {
		Unit = {
			Description = "CrowdPilot web (TanStack Start SSR)";
			StartLimitIntervalSec = 60;
			StartLimitBurst = 5;
			Wants = [ "crowdpilot-backend.service" ];
			After = [ "crowdpilot-backend.service" ];
		};
		Service = {
			Environment = [
				"PORT=3000"
				"NODE_ENV=production"
			];
			ExecStart = "${pkgs.crowdpilot-web}/bin/crowdpilot-web";
			Restart = "on-failure";
			RestartSec = 5;
		};
		Install = {
			WantedBy = [ "default.target" ];
		};
	};
}
