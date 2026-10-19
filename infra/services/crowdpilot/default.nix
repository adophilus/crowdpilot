{
  pkgs,
  lib,
  config,
  ...
}:
let
  # Both units below consume the same decrypted dotenv (single source of
  # truth — PORT/NODE_ENV/DATABASE_URL/provider keys live there, not here).
  envFile = config.sops.secrets."services/crowdpilot/secrets.env".path;
in
{
  # Bootstrap note: until the owner sops-encrypts the real secrets.env (one
  # command, docs/deploy-notes.md), the plaintext template stands in so the
  # home config evaluates; activation/decrypt fails loudly until replaced.
  sops.secrets."services/crowdpilot/secrets.env" = {
    sopsFile =
      if builtins.pathExists ./secrets.env then
        ./secrets.env
      else
        ./secrets.env.template;
    format = "dotenv";
  };

  systemd.user.services.crowdpilot-backend = {
    Unit = {
      Description = "CrowdPilot backend (Effect-TS)";
      StartLimitIntervalSec = 60;
      StartLimitBurst = 5;
    };
    Service = {
      # Kysely migrations run before every start — the migrate wrapper ships
      # in the backend flake output, so the API never starts on a stale schema.
      ExecStartPre = "${pkgs.crowdpilot-backend}/bin/crowdpilot-backend-migrate";
      ExecStart = "${pkgs.crowdpilot-backend}/bin/crowdpilot-backend";
      # PORT=1050 / NODE_ENV=production / DATABASE_URL / provider keys live in
      # the encrypted dotenv. Hard start requirement: missing age key at
      # bootstrap = unit refuses to start.
      EnvironmentFile = envFile;
      Restart = "on-failure";
      RestartSec = 5;
    };
    Install = {
      WantedBy = [ "default.target" ];
    };
  };
}
