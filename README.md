# ShiggyPlugins

Multi-plugin repo for **ShiggyCord** / Bunny / Kettu / Vendetta / Revenge.

## Install repository

Paste this as a **plugin repository** URL:

```
https://raw.githubusercontent.com/hi6461570-alt/ShiggyPlugins/main/repo.json
```

Or install a single plugin by URL:

```
https://raw.githubusercontent.com/hi6461570-alt/ShiggyPlugins/main/builds/CustomProfile/
```

## Plugins

| Plugin | Description | Version |
|--------|-------------|---------|
| **CustomProfile** | Larp plugin for Shiggy ;) | 2.5.0 |

### CustomProfile

Local-only identity larp (username, display name, avatar, banner, bio, pronouns, nitro/boost badges, classic badges). Open the plugin → **Configure**.

## Layout

```
repo.json                 # multi-plugin registry
builds/
  CustomProfile/
    manifest.json
    index.js
```

Add another plugin by creating `builds/<Name>/` and an entry in `repo.json`.

> Vibecoded w/ Grok <3
