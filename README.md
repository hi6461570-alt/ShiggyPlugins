# ShiggyPlugins

Plugins for **ShiggyCord** (Vendetta / Bunny / Kettu / Revenge compatible).

---

## How to install a plugin

1. Open Discord with ShiggyCord.
2. Go to **Settings → Plugins**.
3. Paste a **plugin URL** (must end with `/`) and install.
4. Enable the plugin, then open it → **Configure** (gear) if it has settings.

### CustomProfile install URL

```
https://raw.githubusercontent.com/hi6461570-alt/ShiggyPlugins/main/builds/CustomProfile/
```

Remove any old CustomProfile install first if the hash/URL changed.

> **Note:** Do **not** paste `repo.json` as a Vendetta plugin URL. That file is only for Bunny-style plugin repositories. CustomProfile is a Vendetta-format plugin.

Optional Bunny repo URL (for clients that browse plugin repos):

```
https://raw.githubusercontent.com/hi6461570-alt/ShiggyPlugins/main/repo.json
```

---

## Current plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| **CustomProfile** | 2.6.0 | Local-only profile larp (identity, badges, nitro, boost, connections) |

---

## CustomProfile — features

Local-only (only you see the changes):

| Area | What you can larp |
|------|-------------------|
| **Identity** | Username, display name, bio, pronouns, account creation date |
| **Look** | Avatar URL, banner URL, accent color |
| **Nitro** | Simulate Nitro + tenure badge tiers (Bronze → Opal) |
| **Boost** | Server boost badge (1–24 months) |
| **Classic badges** | Staff, Partner, HypeSquad, Bug Hunter, Early Supporter, Active Dev, etc. |
| **Hide real badges** | Replace `profile.badges` with your selection |
| **Connections** | Fake profile connections (Steam, Xbox, PSN, Spotify, GitHub, X, TikTok, Riot, Epic, Roblox, domain, and more) |
| **Hide real connections** | Replace real connected accounts with fakes only |
| **Target** | Optional target user ID (default: you) |

Inspired by Nightcord CustomProfile; built for ShiggyCord’s Vendetta eval (`exports.default = { onLoad, onUnload, settings }`).

---

## Repo layout

```
repo.json
builds/
  CustomProfile/
    manifest.json
    index.js
README.md
```

Add another plugin: create `builds/<Name>/` + entry in `repo.json`.

> Vibecoded w/ Grok <3
