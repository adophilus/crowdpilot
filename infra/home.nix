{ pkgs, ... }:
{
  home.username = "crowdpilot";
  home.homeDirectory = "/home/crowdpilot";
  home.stateVersion = "26.05";

  # Private half of the infra age key (see infra/.sops.yaml for the public
  # half). Delivered by bootstrap (docs/deploy-notes.md), never committed.
  sops.age.keyFile = "/home/crowdpilot/.config/sops/age/key.txt";

  # git: for the deploy timer's pulls.
  # home-manager: so the deploy timer (and manual switches) can run
  # `home-manager switch` standalone, without a global install.
  # crowdpilot-backend: puts the migrate/start wrappers on PATH for an SSH
  # session, so operational runs don't need the store path dug out of
  # `systemctl show`.
  home.packages = [
    pkgs.git
    pkgs.home-manager
    pkgs.crowdpilot-backend
  ];
}
