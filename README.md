# ShiggyPlugins

Plugins for **ShiggyCord** (Vendetta / Bunny / Kettu / Revenge compatible).

## Install

Settings → Plugins → paste a URL ending in `/`:

| Plugin | URL |
|--------|-----|
| CustomProfile | `https://raw.githubusercontent.com/hi6461570-alt/ShiggyPlugins/main/builds/CustomProfile/` |
| ShareX | `https://raw.githubusercontent.com/hi6461570-alt/ShiggyPlugins/main/builds/ShareX/` |
| ShowBadgesInChat | `https://raw.githubusercontent.com/hi6461570-alt/ShiggyPlugins/main/builds/ShowBadgesInChat/` |
| TruePresence | `https://raw.githubusercontent.com/hi6461570-alt/ShiggyPlugins/main/builds/TruePresence/` |

## Plugins

### CustomProfile `2.7.0`
Local profile larp — identity, nitro/boost badges, classic badges, connections. Tabbed settings UI (General / Look / Nitro / Badges / Links).

### ShareX `1.0.0`
Import a ShareX `.sxcu` custom uploader and rehost images via built-in commands:
- `/sharex config` — paste `.sxcu` JSON
- `/sharex upload` — download URL → upload via sxcu → send resulting link
- `/sharex status` — active uploader name

### ShowBadgesInChat `1.0.0`
Shows classic profile badges next to usernames in chat (local).

### TruePresence `1.0.0`
Locally reveal users who appear offline/invisible but are in voice, have activities, or active client sessions.

## Layout

```
repo.json
builds/<Plugin>/manifest.json
builds/<Plugin>/index.js
```

> Vibecoded w/ Grok <3
