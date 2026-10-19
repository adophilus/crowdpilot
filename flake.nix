{
  description = "CrowdPilot — backend Nix package + VPS home-manager config (infra/)";

  nixConfig = {
    substituters = [ "https://adophilus.cachix.org" "https://cache.nixos.org" ];
    trusted-public-keys = [
      "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
      # Owner: after creating/confirming the shared cachix cache, add its
      # public key here AND in the VPS user's ~/.config/nix/nix.conf (see
      # docs/deploy-notes.md). Until then CI is the only builder.
    ];
  };

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    home-manager = {
      url = "github:nix-community/home-manager/release-26.05";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    sops-nix = {
      url = "github:Mic92/sops-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs:
    let
      system = "x86_64-linux";
      pkgs = import inputs.nixpkgs { inherit system; };
      nodejs = pkgs.nodejs_22;
      pnpm = pkgs.pnpm_11;
      backend-bundle = pkgs.callPackage ./nix/packages/crowdpilot-backend-bundle.nix {
        inherit nodejs pnpm;
      };
      crowdpilot-backend = pkgs.callPackage ./nix/packages/crowdpilot-backend.nix {
        inherit nodejs backend-bundle;
      };
    in
    {
      packages.${system} = {
        inherit crowdpilot-backend;
        default = crowdpilot-backend;
      };

      # The VPS home config lives in THIS repo (infra/): no separate infra
      # repo, no lockfile-bump deploy step — the pull timer switches straight
      # from a rev of this flake.
      homeConfigurations.crowdpilot = inputs.home-manager.lib.homeManagerConfiguration {
        pkgs = import inputs.nixpkgs {
          inherit system;
          overlays = [
            (_final: _prev: { inherit crowdpilot-backend; })
          ];
        };
        extraSpecialArgs = { inherit inputs; };
        modules = [
          inputs.sops-nix.homeManagerModules.sops
          ./infra/home.nix
          ./infra/services/crowdpilot
          ./infra/deploy
        ];
      };
    };
}
