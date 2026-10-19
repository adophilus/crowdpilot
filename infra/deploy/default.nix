# VPS-side auto-deploy.
#
# CI never SSHes anywhere: it builds the backend and pushes to cachix. This
# unit ships with the home-manager config itself: a timer pulls THIS repo
# (app code + infra/ in one flake) every 5 minutes and runs
# `home-manager switch` only when origin/main moved. New commits bring both
# the new package and the new unit config in one rev.
#
# Deliberately NOT WantedBy default.target: only the timer activates the
# oneshot service, otherwise every `home-manager switch` (which starts
# default.target wants) would trigger a deploy → switch loop.
{
  pkgs,
  ...
}:
{
  systemd.user.services.crowdpilot-deploy = {
    Unit = {
      Description = "Pull crowdpilot repo and switch home-manager if origin/main moved";
      # No After=: there is no network-online.target in the user manager —
      # such a dep would be a silent no-op.
    };
    Service = {
      Type = "oneshot";
      ExecStart = pkgs.writeShellScript "crowdpilot-deploy" ''
        set -euo pipefail
        # systemd user units don't get ~/.nix-profile/bin in PATH; git and
        # home-manager live there. nix itself comes from the system profile.
        export PATH="$HOME/.nix-profile/bin:/run/current-system/sw/bin:$PATH"

        cd "$HOME/crowdpilot" || {
          echo "crowdpilot-deploy: $HOME/crowdpilot does not exist — bootstrap incomplete, see docs/deploy-notes.md"
          exit 0
        }
        if [ ! -d .git ]; then
          echo "crowdpilot-deploy: $HOME/crowdpilot is not a git clone — see docs/deploy-notes.md bootstrap"
          exit 1
        fi

        git fetch origin main

        local_rev="$(git rev-parse HEAD)"
        remote_rev="$(git rev-parse origin/main)"

        if [ "$local_rev" = "$remote_rev" ]; then
          echo "crowdpilot-deploy: up to date ($local_rev), nothing to do"
          exit 0
        fi

        # Switch FIRST, advance HEAD only after success: a failed switch
        # must leave HEAD at the last-known-good rev so the next timer tick
        # retries. Building from the fetched rev via ?rev= makes the
        # working-tree position irrelevant (all deploys are committed).
        echo "crowdpilot-deploy: switching $local_rev -> $remote_rev"
        home-manager switch --flake "git+file://$HOME/crowdpilot?rev=$remote_rev#crowdpilot"

        # Record the now-active rev.
        git reset --hard "$remote_rev"
        echo "crowdpilot-deploy: now at $remote_rev"
      '';
    };
  };

  systemd.user.timers.crowdpilot-deploy = {
    Unit = {
      Description = "Run crowdpilot-deploy every 5 minutes";
    };
    Timer = {
      OnBootSec = "2min";
      OnUnitActiveSec = "5min";
    };
    Install = {
      WantedBy = [ "timers.target" ];
    };
  };
}
