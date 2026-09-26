# ShiggyPlugins

Multi-plugin repo for **ShiggyCord** / Bunny / Kettu / Vendetta / Revenge.

## Install CustomProfile (Vendetta / ShiggyCord)

Use this as a **plugin URL** (not a Bunny repository):

```
https://raw.githubusercontent.com/hi6461570-alt/ShiggyPlugins/main/builds/CustomProfile/
```

Must end with `/`. Remove any old CustomProfile install first, then paste the URL above.

Open the plugin → **Configure** (gear).

> Do **not** install `repo.json` as a Vendetta plugin URL — that is only for Bunny-style plugin repositories. CustomProfile is a Vendetta-format plugin (`vendetta=>{...}` IIFE with `settings`).

## Bunny-style repository (optional)

```
https://raw.githubusercontent.com/hi6461570-alt/ShiggyPlugins/main/repo.json
```

Only use this if your client browses Bunny plugin repos. CustomProfile still runs as Vendetta JS.

## Layout

```
repo.json
builds/CustomProfile/manifest.json
builds/CustomProfile/index.js
```

> Vibecoded w/ Grok <3
