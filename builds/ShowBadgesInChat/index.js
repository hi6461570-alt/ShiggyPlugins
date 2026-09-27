(function (exports) {
  "use strict";
  // ShowBadgesInChat v1.5.0 — real CDN badge icons, all users, skip bots
  var storage = vendetta.plugin.storage;
  var before = vendetta.patcher.before;
  var after = vendetta.patcher.after;
  var findByProps = vendetta.metro.findByProps;
  var findByStoreName = vendetta.metro.findByStoreName;
  var findByName = vendetta.metro.findByName;
  var React = vendetta.metro.common.React;
  var RN = vendetta.metro.common.ReactNative;
  var useProxy = vendetta.storage.useProxy;
  var Forms = (vendetta.ui.components && vendetta.ui.components.Forms) || {};
  var logger = vendetta.logger || console;
  var ScrollView = RN.ScrollView, Text = RN.Text, View = RN.View, Switch = RN.Switch, Image = RN.Image;
  var FormRow = Forms.FormRow, FormSwitch = Forms.FormSwitch;
  var unpatches = [];
  var cache = {};
  var patched = false;

  var CDN = "https://cdn.discordapp.com/badge-icons/";

  var FLAG_BADGES = [
    { f: 1 << 0,  id: "staff",                  icon: "5e74e9b61934fc1f67c65515d1f7e60d", label: "Discord Staff" },
    { f: 1 << 1,  id: "partner",                icon: "3f9748e53446a137a052f3454e2de41e", label: "Partnered Server Owner" },
    { f: 1 << 2,  id: "hypesquad_events",       icon: "bf01d1073931f921909045f3a39fd264", label: "HypeSquad Events" },
    { f: 1 << 3,  id: "bug_hunter_level_1",     icon: "2717692c7dca7289b35297368a940dd0", label: "Bug Hunter Level 1" },
    { f: 1 << 6,  id: "hypesquad_house_1",      icon: "8a88d63823d8a71cd5e390baa45efa02", label: "HypeSquad Bravery" },
    { f: 1 << 7,  id: "hypesquad_house_2",      icon: "011940fd013da3f7fb926e4a1cd2e618", label: "HypeSquad Brilliance" },
    { f: 1 << 8,  id: "hypesquad_house_3",      icon: "3aa41de486fa12454c3761e8e223442e", label: "HypeSquad Balance" },
    { f: 1 << 9,  id: "early_supporter",        icon: "7060786766c9c840eb3019e725d2b358", label: "Early Supporter" },
    { f: 1 << 14, id: "bug_hunter_level_2",     icon: "848f79194d4be5ff5f81505cbd0ce1e6", label: "Bug Hunter Level 2" },
    { f: 1 << 17, id: "verified_developer",     icon: "6df5892e0f35b051f8b61eace34f4967", label: "Early Verified Bot Developer" },
    { f: 1 << 18, id: "certified_moderator",    icon: "fee1624003e2fee35cb398e125dc479b", label: "Moderator Programs Alumni" },
    { f: 1 << 22, id: "active_developer",       icon: "6bdc42827a38498929a4920da12695d9", label: "Active Developer" }
  ];

  var NITRO_ICONS = [
    { months: 72, id: "premium_tenure_72_month", icon: "5b154df19c53dce2af92c9b61e6be5e2" },
    { months: 60, id: "premium_tenure_60_month", icon: "cd5e2cfd9d7f27a8cdcd3e8a8d5dc9f4" },
    { months: 36, id: "premium_tenure_36_month", icon: "11e2d339068b55d3a506cff34d3780f3" },
    { months: 24, id: "premium_tenure_24_month", icon: "0d61871f72bb9a33a7ae568c1fb4f20a" },
    { months: 12, id: "premium_tenure_12_month", icon: "0334688279c8359120922938dcb1d6f8" },
    { months: 6,  id: "premium_tenure_6_month",  icon: "2895086c18d5531d499862e41d1155a6" },
    { months: 3,  id: "premium_tenure_3_month",  icon: "4514fab914bdbfb4ad2fa23df76121a6" },
    { months: 1,  id: "premium_tenure_1_month",  icon: "4f33c4a9c64ce221936bd256c356f91f" },
    { months: 0,  id: "premium",                 icon: "2ba85e8026a8614b640c2837bcdfe21b" }
  ];
  var BOOST_ICONS = [
    { months: 24, icon: "ec92202290b48d0879b7413d2dde3bab", id: "guild_booster_lvl9" },
    { months: 18, icon: "7142225d31238f6387d9f09efaa02759", id: "guild_booster_lvl8" },
    { months: 15, icon: "cb3ae83c15e970e8f3d410bc62cb8b99", id: "guild_booster_lvl7" },
    { months: 12, icon: "991c9f39ee33d7537d9f408c3e53141e", id: "guild_booster_lvl6" },
    { months: 9,  icon: "996b3e870e8a22ce519b3a50e6bdd52f", id: "guild_booster_lvl5" },
    { months: 6,  icon: "df199d2050d3ed4ebf84d64ae83989f8", id: "guild_booster_lvl4" },
    { months: 3,  icon: "72bed924410c304dbe3d00a6e593ff59", id: "guild_booster_lvl3" },
    { months: 2,  icon: "0e4080d1d333bc7ad29ef6528b6f2fb7", id: "guild_booster_lvl2" },
    { months: 1,  icon: "51040c70d4f20a921ad6674ff86fc95c", id: "guild_booster_lvl1" }
  ];

  function ensure() {
    if (storage.enabled == null) storage.enabled = true;
    if (storage.showClassic == null) storage.showClassic = true;
    if (storage.showNitro == null) storage.showNitro = true;
    if (storage.showBoost == null) storage.showBoost = true;
    if (storage.showProfileBadges == null) storage.showProfileBadges = true;
    if (storage.skipBots == null) storage.skipBots = true;
    if (storage.maxBadges == null) storage.maxBadges = 6;
  }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function log(m) { try { logger.log("[ShowBadgesInChat] " + m); } catch (e) {} }
  function iconUrl(hash) {
    if (!hash) return null;
    var h = String(hash);
    if (/^https?:\/\//i.test(h)) return h;
    return CDN + h + ".png";
  }
  function monthsSince(iso) {
    try {
      var t = new Date(iso).getTime();
      if (isNaN(t)) return 0;
      return Math.max(0, Math.floor((Date.now() - t) / (30.44 * 24 * 3600 * 1000)));
    } catch (e) { return 0; }
  }

  function getUser(id) {
    var s = safe(function () { return findByStoreName("UserStore"); })
      || safe(function () { return findByProps("getUser", "getCurrentUser"); });
    return s && s.getUser ? s.getUser(String(id)) : null;
  }
  function getProfile(id) {
    var s = safe(function () { return findByStoreName("UserProfileStore"); })
      || safe(function () { return findByProps("getUserProfile"); });
    return s && s.getUserProfile ? s.getUserProfile(String(id)) : null;
  }
  function isBot(user, msg) {
    if (msg && (msg.bot || msg.isBot || msg.webhookId || msg.webhook_id)) return true;
    if (!user) return false;
    return !!(user.bot || user.isBot || user.system || user.isSystemUser);
  }

  function collect(userId) {
    userId = String(userId);
    if (cache[userId] && cache[userId].t > Date.now() - 15000) return cache[userId].b;

    var user = getUser(userId);
    var profile = getProfile(userId);
    var out = [];
    var seen = {};

    function push(icon, id, label) {
      if (!icon) return;
      var key = String(id || icon);
      if (seen[key]) return;
      seen[key] = 1;
      out.push({
        id: id || key,
        description: label || id || "Badge",
        icon: String(icon).replace(/^https?:\/\/cdn\.discordapp\.com\/badge-icons\//, "").replace(/\.png$/i, ""),
        iconUrl: iconUrl(icon),
        link: "https://discord.com/settings/premium"
      });
    }

    if (storage.showClassic && user) {
      var flags = (user.publicFlags != null ? user.publicFlags : user.flags) || 0;
      if (profile) {
        var pf = (profile.publicFlags != null ? profile.publicFlags : profile.flags);
        if (pf) flags = flags | pf;
      }
      for (var i = 0; i < FLAG_BADGES.length; i++) {
        if (flags & FLAG_BADGES[i].f) push(FLAG_BADGES[i].icon, FLAG_BADGES[i].id, FLAG_BADGES[i].label);
      }
    }

    if (storage.showProfileBadges && profile && Array.isArray(profile.badges)) {
      for (var j = 0; j < profile.badges.length; j++) {
        var b = profile.badges[j];
        if (!b) continue;
        var bid = String(b.id || "");
        if (!storage.showNitro && (bid.indexOf("premium") >= 0 || bid.indexOf("nitro") >= 0)) continue;
        if (!storage.showBoost && bid.indexOf("guild_booster") >= 0) continue;
        push(b.icon || bid, bid || b.icon, b.description || bid);
      }
    }

    if (storage.showNitro) {
      var prem = (user && (user.premiumType || user.premium_type))
        || (profile && (profile.premiumType || profile.premium_type));
      var pSince = (user && (user.premiumSince || user.premium_since))
        || (profile && (profile.premiumSince || profile.premium_since));
      var avatar = user && user.avatar;
      var animated = avatar && String(avatar).indexOf("a_") === 0;
      if (prem || pSince || animated) {
        var nm = pSince ? monthsSince(pSince) : 0;
        var ni = NITRO_ICONS[NITRO_ICONS.length - 1];
        for (var k = 0; k < NITRO_ICONS.length; k++) {
          if (nm >= NITRO_ICONS[k].months) { ni = NITRO_ICONS[k]; break; }
        }
        push(ni.icon, ni.id, "Nitro");
      }
    }

    if (storage.showBoost) {
      var bSince = (user && (user.premiumGuildSince || user.premium_guild_since))
        || (profile && (profile.premiumGuildSince || profile.premium_guild_since));
      if (bSince) {
        var bm = monthsSince(bSince) || 1;
        var bi = BOOST_ICONS[BOOST_ICONS.length - 1];
        for (var m = 0; m < BOOST_ICONS.length; m++) {
          if (bm >= BOOST_ICONS[m].months) { bi = BOOST_ICONS[m]; break; }
        }
        push(bi.icon, bi.id, "Server Boosting");
      }
    }

    var max = Number(storage.maxBadges);
    if (!isNaN(max) && max > 0 && out.length > max) out = out.slice(0, max);

    cache[userId] = { t: Date.now(), b: out };
    return out;
  }

  function handleRow(row) {
    if (!storage.enabled) return;
    if (!row || !row.message) return;
    if (row.type != null && row.type !== 1) return;
    var msg = row.message;
    var uid = msg.authorId != null ? msg.authorId
      : (msg.userId != null ? msg.userId
      : (msg.author && msg.author.id != null ? msg.author.id : null));
    if (uid == null) return;
    uid = String(uid);

    var user = getUser(uid);
    if (storage.skipBots && isBot(user, msg)) return;

    var badges = collect(uid);
    if (!badges.length) return;

    msg.badges = badges.map(function (b) {
      return {
        id: b.id,
        description: b.description,
        icon: b.icon,
        iconUrl: b.iconUrl,
        src: b.iconUrl,
        url: b.iconUrl,
        link: b.link
      };
    });

    if (!msg.roleIcon && badges[0]) {
      msg.roleIcon = {
        name: badges[0].description || badges[0].id,
        source: badges[0].iconUrl,
        iconSource: badges[0].iconUrl,
        src: badges[0].iconUrl
      };
    }

    msg.tagIcons = badges.map(function (b) {
      return { src: b.iconUrl, source: b.iconUrl, id: b.id, description: b.description };
    });
  }

  function install() {
    while (unpatches.length) try { unpatches.pop()(); } catch (e) {}
    ensure();
    patched = false;
    cache = {};

    var nm = RN.NativeModules || {};
    var DCD = nm.DCDChatManager;

    if (DCD && DCD.updateRows) {
      try {
        unpatches.push(before("updateRows", DCD, function (args) {
          if (!storage.enabled) return;
          try {
            var rows = JSON.parse(args[1]);
            if (!Array.isArray(rows)) return;
            for (var i = 0; i < rows.length; i++) handleRow(rows[i]);
            args[1] = JSON.stringify(rows);
          } catch (e) {}
        }));
        patched = true;
        log("patched DCDChatManager.updateRows");
      } catch (e) { log("DCD patch fail: " + e); }
    }

    try {
      var RowManager = safe(function () { return findByName("RowManager"); });
      if (RowManager && RowManager.prototype && RowManager.prototype.generate) {
        unpatches.push(after("generate", RowManager.prototype, function (_, row) {
          try { handleRow(row); } catch (e) {}
        }));
        patched = true;
        log("patched RowManager.generate");
      }
    } catch (e) {}

    try {
      var UPS = safe(function () { return findByStoreName("UserProfileStore"); })
        || safe(function () { return findByProps("getUserProfile"); });
      if (UPS && UPS.getUserProfile) {
        unpatches.push(after("getUserProfile", UPS, function (args) {
          try { if (args && args[0] != null) delete cache[String(args[0])]; } catch (e) {}
        }));
      }
    } catch (e) {}

    if (!patched) log("WARNING: no chat row patch");
  }

  function Settings() {
    ensure();
    useProxy(storage);
    var bump = React.useReducer(function (x) { return x + 1; }, 0)[1];
    function flip(k) { storage[k] = !storage[k]; cache = {}; bump(); install(); }
    function sw(key, label, sub) {
      if (FormRow && FormSwitch) {
        return React.createElement(FormRow, {
          key: key, label: label, subLabel: sub,
          trailing: React.createElement(FormSwitch, { value: !!storage[key], onValueChange: function () { flip(key); } }),
          onPress: function () { flip(key); }
        });
      }
      return React.createElement(View, {
        key: key, style: { flexDirection: "row", justifyContent: "space-between", padding: 16 }
      },
        React.createElement(View, { style: { flex: 1 } },
          React.createElement(Text, { style: { color: "#fff" } }, label),
          sub ? React.createElement(Text, { style: { color: "#888", fontSize: 12 } }, sub) : null
        ),
        React.createElement(Switch, { value: !!storage[key], onValueChange: function () { flip(key); } })
      );
    }
    var preview = FLAG_BADGES.slice(0, 6).map(function (b) {
      return React.createElement(Image, {
        key: b.id,
        source: { uri: CDN + b.icon + ".png" },
        style: { width: 20, height: 20, marginRight: 4 }
      });
    });

    return React.createElement(ScrollView, { style: { flex: 1 } },
      React.createElement(Text, { style: { margin: 16, color: "#fff", fontSize: 18, fontWeight: "700" } }, "Show Badges In Chat"),
      React.createElement(View, { style: { flexDirection: "row", marginHorizontal: 16, marginBottom: 8, alignItems: "center" } }, preview),
      React.createElement(Text, { style: { marginHorizontal: 16, marginBottom: 12, color: "#888", fontSize: 13 } },
        "Real Discord badge icons (cdn.discordapp.com/badge-icons) next to names for every non-bot user."),
      sw("enabled", "Enabled"),
      sw("skipBots", "Ignore bots", "Do not show badges on bot/webhook messages"),
      sw("showClassic", "Classic flags", "Staff, HypeSquad, Early Supporter, Active Dev…"),
      sw("showNitro", "Nitro / tenure", "Uses premium fields + animated avatar hint"),
      sw("showBoost", "Server boost"),
      sw("showProfileBadges", "Merge profile.badges", "When Discord has loaded that user's profile"),
      React.createElement(Text, { style: { margin: 16, color: patched ? "#4caf50" : "#f44336", fontSize: 12 } },
        patched ? "Chat patch active" : "Chat patch NOT active"),
      React.createElement(Text, { style: { margin: 16, color: "#666", fontSize: 12 } },
        "v1.5.0 — reopen channel after changing settings. Classic flags work for everyone; full profile badges appear after opening a user once.")
    );
  }

  exports.default = {
    onLoad: function () { ensure(); install(); log("v1.5.0 loaded"); },
    onUnload: function () {
      while (unpatches.length) try { unpatches.pop()(); } catch (e) {}
      cache = {};
      patched = false;
    },
    settings: Settings
  };
  try { Object.defineProperty(exports, "__esModule", { value: true }); } catch (e) {}
  return exports;
})({});
