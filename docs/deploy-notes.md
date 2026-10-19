# Deploy notes — CrowdPilot owner's manual

Target shape (beta-lyfe pattern, infra in this repo): push main → CI builds
the backend Nix package and pushes it to cachix → the VPS `crowdpilot-deploy`
timer (every 5 min) pulls this repo and `home-manager switch`es to origin/main
→ `ExecStartPre` runs migrations, `ExecStart` starts the API on
127.0.0.1:1050 → Caddy serves `https://api.crowdpilot.hackathons.adophilus.com`
with auto-TLS. The web app deploys to Vercel from `production.yaml` (prebuilt
CLI deploy; git integration off via `apps/web/vercel.json`).

No SSH credentials in CI (pull model). No lockfile-bump step — the VPS pulls
this repo directly, since infra/ and the package live in one flake.

## 1. VPS repo changes (`~/.projects/personal/vps/contabo`)

Users entry (copy of the betalyfe block, adapted):

```nix
users.users = {
  # ...
  crowdpilot = {
    isSystemUser = true;
    group = "crowdpilot";
    home = "/home/crowdpilot";
    createHome = true;
    shell = pkgs.bashInteractive;
    linger = true; # backend service + auto-deploy timer must survive no-login
    openssh.authorizedKeys.keys = [
      "ssh-ed25519 AAAA... crowdpilot-deploy" # generate one: ssh-keygen -t ed25519
    ];
  };
};
users.groups.crowdpilot = { };

# crowdpilot's self-deploy timer runs home-manager switch as that user and
# needs the cachix substituter from ~crowdpilot/.config/nix/nix.conf — a
# setting nix only honours for trusted users.
nix.settings.trusted-users = [ "betalyfe" "crowdpilot" ];
```

One Caddy vhost (TLS is automatic):

```nix
"api.crowdpilot.hackathons.adophilus.com" = {
  extraConfig = ''
    reverse_proxy 127.0.0.1:1050
  '';
};
```

DNS: the `*.hackathons.adophilus.com` wildcard already points at the VPS
(grey-clouded) — nothing new needed.

Apply: `nixos-rebuild switch --flake ./contabo#contabo --target-host contabo.vpn`.

## 2. Cachix

CD pushes to the shared personal cache `adophilus.cachix.org` (no per-project
cache; split later only if wanted). Owner steps:

1. Create/confirm the cache `adophilus` on cachix.org (or rename the cache in
   `.github/workflows/cd.yml` + both `nixConfig` blocks in `flake.nix`).
2. GitHub secret `CACHIX_AUTH_TOKEN` = a write token for that cache.
3. Add the cache's public key to `flake.nix` `nixConfig.trusted-public-keys`
   (placeholder comment marks the spot) and to the VPS user's
   `~crowdpilot/.config/nix/nix.conf` (step 3 below). Without cachix the VPS
   rebuilds the whole pnpm graph per deploy — do not skip.

The repo is public, so nix needs no `access-tokens` for it (unlike beta-lyfe).

## 3. One-time VPS bootstrap (as root, then as crowdpilot)

1. Deploy key: generate `ssh-keygen -t ed25519`, put the PUBLIC key in the
   `users.users.crowdpilot` block above (VPS repo), rebuild.
2. As crowdpilot: add the deploy key to GitHub (read-only is enough — repo is
   public) and clone:
   `git clone git@github.com:<owner>/crowdpilot.git ~/crowdpilot`
3. `~crowdpilot/.config/nix/nix.conf`:
   ```
   substituters = https://adophilus.cachix.org https://cache.nixos.org
   trusted-public-keys = adophilus.cachix.org-1:<KEY> cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY=
   ```
   (works because crowdpilot is in `trusted-users`).
4. Age key (sops): `mkdir -p ~/.config/sops/age && age-keygen -o ~/.config/sops/age/key.txt`
   — private half stays here; the public half goes into `infra/.sops.yaml`
   (next section). `chown -R crowdpilot:crowdpilot ~/.config` if you did this
   as root by accident.
5. Postgres: create the db + user on the VPS instance (shared postgres, like
   itrading), e.g. as root:
   ```sql
   CREATE USER crowdpilot WITH PASSWORD '...';
   CREATE DATABASE crowdpilot OWNER crowdpilot;
   ```
   The URL goes into the sops dotenv (`DATABASE_URL`), host 127.0.0.1:5432.
6. First switch (runuser inherits root's dbus — env prefix mandatory):
   ```
   runuser -u crowdpilot -- env \
     XDG_RUNTIME_DIR=/run/user/$(id -u crowdpilot) \
     DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u crowdpilot)/bus \
     home-manager switch --flake "$HOME/crowdpilot?...#crowdpilot"
   ```
   (run as root with the absolute repo path; home-manager comes from the
   home config after the first `nix run home-manager -- switch`.)
7. Verify: `systemctl --user -M crowdpilot@ status crowdpilot-backend` and
   `curl -s localhost:1050/health`. The deploy timer starts on the next tick
   (`systemctl --user -M crowdpilot@ list-timers`).

## 4. Secrets (sops + age)

- Rule: only sops-encrypted files under `infra/` (CI guard enforces it).
- `infra/services/crowdpilot/secrets.env.template` lists every key; real
  values for this project are staged in `../secrets.local.env` (untracked).
- Owner one-time steps on your machine:
  1. `age-keygen -o ~/.config/sops/age/keys.txt` (prints the public key).
  2. Paste the public key into `infra/.sops.yaml` (replaces the placeholder).
  3. `cp infra/services/crowdpilot/secrets.env.template infra/services/crowdpilot/secrets.env`,
     fill real values, then the one-liner:
     ```
     sops encrypt --in-place infra/services/crowdpilot/secrets.env
     ```
  4. Commit. The VPS decrypts at activation to a 0400 file; a missing age key
     = unit refuses to start (fail loud).
- Until `secrets.env` exists, the home config evaluates against the template
  but activation/decrypt fails loudly — first real switch happens after step
  3. That is the intended bootstrap order.

## 5. GitHub repo + secrets

Repo: create `crowdpilot` on GitHub (public, MIT), push main. Branch
protection optional. Actions secrets to set:

| Secret | Used by |
|---|---|
| `CACHIX_AUTH_TOKEN` | cd.yml (cachix push) |
| `VERCEL_TOKEN` | production.yaml |
| `VERCEL_ORG_ID` | production.yaml |
| `VERCEL_PROJECT_ID` | production.yaml |

Vercel project: import once with root directory `apps/web` (framework is
pinned by `apps/web/vercel.json`: `tanstack-start`, git deployments disabled —
all deploys come from `production.yaml`). `VITE_API_URL` is set in the
workflow; other web env goes in Vercel's project settings (pulled via
`vercel pull`).

## 6. Gotchas

- **Secrets-only change does NOT restart the unit.** home-manager sops
  re-decrypts the file but has no restart hook for user units. After any
  secrets-only commit: `systemctl --user -M crowdpilot@ restart
  crowdpilot-backend`, then check `/health`. Code/package changes restart
  normally (new store path in the unit).
- The deploy timer is deliberately NOT `WantedBy=default.target` — that would
  loop (every switch re-triggers the deploy). Don't "fix" it.
- `linger = true` is mandatory, else user services die when the last SSH
  session closes.
- First activation needs the `XDG_RUNTIME_DIR`/`DBUS_SESSION_BUS_ADDRESS`
  prefix under runuser (see bootstrap step 6).
- Deploy is switch-then-advance-HEAD: a broken rev keeps HEAD at the
  last-known-good commit and auto-retries every 5 min while the old
  generation keeps serving.
- Backend binds 127.0.0.1 only; public exposure is exclusively the Caddy
  vhost in the VPS repo. Port source of truth: the sops dotenv (PORT=1050).

## 7. Local validation quick reference

```
pnpm --filter backend build:prod                 # → apps/backend/dist/{start,migrate}.mjs
nix build .#packages.x86_64-linux.crowdpilot-backend
DATABASE_URL=postgres://crowdpilot:crowdpilot@127.0.0.1:5432/crowdpilot \
  ./result/bin/crowdpilot-backend-migrate        # against the dev docker pg
DATABASE_URL=... PORT=1051 ./result/bin/crowdpilot-backend &
curl -s localhost:1051/health
```
