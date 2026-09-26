(function (exports) {
  "use strict";
  var storage = vendetta.plugin.storage;
  var before = vendetta.patcher.before;
  var after = vendetta.patcher.after;
  var findByProps = vendetta.metro.findByProps;
  var findByStoreName = vendetta.metro.findByStoreName;
  var React = vendetta.metro.common.React;
  var RN = vendetta.metro.common.ReactNative;
  var useProxy = vendetta.storage.useProxy;
  var Forms = (vendetta.ui.components && vendetta.ui.components.Forms) || {};
  var logger = vendetta.logger || console;
  var ScrollView = RN.ScrollView, Text = RN.Text, View = RN.View, Switch = RN.Switch, TextInput = RN.TextInput;
  var FormRow = Forms.FormRow, FormSwitch = Forms.FormSwitch, FormInput = Forms.FormInput;
  var unpatches = [];
  var pendingFetch = {};
  var cache = {};

  var FLAG_BADGES = [
    { f: 1 << 0, id: "staff", icon: "5e74e9b61934fc1f67c65515d1f7e60d", mark: "S" },
    { f: 1 << 1, id: "partner", icon: "3f9748e53446a137a052f3454e2de41e", mark: "P" },
    { f: 1 << 2, id: "hypesquad_events", icon: "bf01d1073931f921909045f3a39fd264", mark: "H" },
    { f: 1 << 3, id: "bug_hunter_level_1", icon: "2717692c7dca7289b35297368a940dd0", mark: "B" },
    { f: 1 << 6, id: "hypesquad_house_1", icon: "8a88d63823d8a71cd5e390baa45efa02", mark: "H" },
    { f: 1 << 7, id: "hypesquad_house_2", icon: "011940fd013da3f7fb926e4a1cd2e618", mark: "H" },
    { f: 1 << 8, id: "hypesquad_house_3", icon: "3aa41de486fa12454c3761e8e223442e", mark: "H" },
    { f: 1 << 9, id: "early_supporter", icon: "7060786766c9c840eb3019e725d2b358", mark: "E" },
    { f: 1 << 14, id: "bug_hunter_level_2", icon: "848f79194d4be5ff5f81505cbd0ce1e6", mark: "B" },
    { f: 1 << 17, id: "verified_developer", icon: "6df5892e0f35b051f8b61eace34f4967", mark: "D" },
    { f: 1 << 18, id: "certified_moderator", icon: "fee1624003e2fee35cb398e125dc479b", mark: "M" },
    { f: 1 << 22, id: "active_developer", icon: "6bdc42827a38498929a4920da12695d9", mark: "D" }
  ];
  var NITRO_ICONS = {
    premium: "2ba85e8026a8614b640c2837bcdfe21b",
    premium_tenure_1_month: "4f33c4a9c64ce221936bd256c356f91f",
    premium_tenure_3_month: "4514fab914bdbfb4ad2fa23df76121a6",
    premium_tenure_6_month: "2895086c18d5531d499862e41d1155a6",
    premium_tenure_12_month: "0334688279c8359120922938dcb1d6f8",
    premium_tenure_24_month: "0d61871f72bb9a33a7ae568c1fb4f20a",
    premium_tenure_36_month: "11e2d339068b55d3a506cff34d3780f3",
    premium_tenure_60_month: "cd5e2cfd9d7f27a8cdcd3e8a8d5dc9f4",
    premium_tenure_72_month: "5b154df19c53dce2af92c9b61e6be5e2"
  };
  var BOOST_ICONS = {
    1: "51040c70d4f20a921ad6674ff86fc95c", 2: "0e4080d1d333bc7ad29ef6528b6f2fb7",
    3: "72bed924410c304dbe3d00a6e593ff59", 6: "df199d2050d3ed4ebf84d64ae83989f8",
    9: "996b3e870e8a22ce519b3a50e6bdd52f", 12: "991c9f39ee33d7537d9f408c3e53141e",
    15: "cb3ae83c15e970e8f3d410bc62cb8b99", 18: "7142225d31238f6387d9f09efaa02759",
    24: "ec92202290b48d0879b7413d2dde3bab"
  };

  function ensure() {
    if (storage.enabled == null) storage.enabled = true;
    if (storage.showClassic == null) storage.showClassic = true;
    if (storage.showNitro == null) storage.showNitro = true;
    if (storage.showBoost == null) storage.showBoost = true;
    if (storage.showProfileBadges == null) storage.showProfileBadges = true;
    if (storage.emojiMarks == null) storage.emojiMarks = true;
    if (storage.fetchProfiles == null) storage.fetchProfiles = true;
    if (storage.maxBadges == null) storage.maxBadges = 0;
  }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
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
  function requestProfile(id) {
    if (!storage.fetchProfiles || !id) return;
    id = String(id);
    if (pendingFetch[id]) return;
    if (getProfile(id) && Array.isArray(getProfile(id).badges)) return;
    pendingFetch[id] = true;
    try {
      var actions = safe(function () { return findByProps("fetchProfile", "getUserProfile"); })
        || safe(function () { return findByProps("fetchProfile"); })
        || safe(function () { return findByProps("getUserProfile", "fetchUser"); });
      if (actions && actions.fetchProfile) {
        Promise.resolve(actions.fetchProfile(id)).catch(function () {});
      } else {
        var Flux = safe(function () { return findByProps("dispatch", "subscribe"); });
        if (Flux && Flux.dispatch) {
          try { Flux.dispatch({ type: "USER_PROFILE_FETCH_START", userId: id }); } catch (e) {}
          try { Flux.dispatch({ type: "USER_PROFILE_FETCH", userId: id }); } catch (e) {}
        }
      }
    } catch (e) {}
    setTimeout(function () { delete pendingFetch[id]; }, 15000);
  }
  function monthsSince(iso) {
    try {
      var t = new Date(iso).getTime();
      if (isNaN(t)) return 1;
      return Math.max(1, Math.floor((Date.now() - t) / (30.44 * 24 * 3600 * 1000)));
    } catch (e) { return 1; }
  }
  function boostIconForMonths(months) {
    var keys = Object.keys(BOOST_ICONS).map(Number).sort(function (a, b) { return a - b; });
    var best = 1;
    for (var i = 0; i < keys.length; i++) if (months >= keys[i]) best = keys[i];
    return BOOST_ICONS[best];
  }
  function collect(userId) {
    userId = String(userId);
    if (cache[userId] && cache[userId].t > Date.now() - 30000) return cache[userId].b;
    var user = getUser(userId);
    var profile = getProfile(userId);
    var out = [];
    var seen = {};
    function push(icon, id, mark) {
      if (!icon) return;
      var key = String(icon);
      if (seen[key]) return;
      seen[key] = 1;
      out.push({ icon: icon, id: id || icon, mark: mark || "*" });
    }

    if (storage.showProfileBadges && profile && Array.isArray(profile.badges) && profile.badges.length) {
      for (var i = 0; i < profile.badges.length; i++) {
        var b = profile.badges[i];
        if (!b) continue;
        var icon = b.icon || b.id;
        var bid = String(b.id || "");
        if (!storage.showNitro && (bid.indexOf("premium") >= 0 || bid.indexOf("nitro") >= 0)) continue;
        if (!storage.showBoost && bid.indexOf("guild_booster") >= 0) continue;
        if (!storage.showClassic) {
          var isClassic = false;
          for (var c = 0; c < FLAG_BADGES.length; c++) if (FLAG_BADGES[c].id === bid) { isClassic = true; break; }
          if (isClassic) continue;
        }
        var mark = "*";
        if (bid.indexOf("staff") >= 0) mark = "S";
        else if (bid.indexOf("partner") >= 0) mark = "P";
        else if (bid.indexOf("hypesquad") >= 0) mark = "H";
        else if (bid.indexOf("bug") >= 0) mark = "B";
        else if (bid.indexOf("early") >= 0) mark = "E";
        else if (bid.indexOf("mod") >= 0) mark = "M";
        else if (bid.indexOf("dev") >= 0) mark = "D";
        else if (bid.indexOf("premium") >= 0 || bid.indexOf("nitro") >= 0) mark = "N";
        else if (bid.indexOf("boost") >= 0) mark = "+";
        else if (bid.indexOf("quest") >= 0) mark = "Q";
        push(icon, bid, mark);
      }
    } else {
      if (storage.showClassic && user) {
        var flags = (user.publicFlags != null ? user.publicFlags : user.flags) || 0;
        for (var j = 0; j < FLAG_BADGES.length; j++) {
          if (flags & FLAG_BADGES[j].f) push(FLAG_BADGES[j].icon, FLAG_BADGES[j].id, FLAG_BADGES[j].mark);
        }
      }
      if (storage.showNitro) {
        var prem = (user && (user.premiumType || user.premium_type))
          || (profile && (profile.premiumType || profile.premium_type));
        var pSince = (user && (user.premiumSince || user.premium_since))
          || (profile && (profile.premiumSince || profile.premium_since));
        if (prem || pSince) {
          var nIcon = NITRO_ICONS.premium;
          if (pSince) {
            var nm = monthsSince(pSince);
            if (nm >= 72) nIcon = NITRO_ICONS.premium_tenure_72_month;
            else if (nm >= 60) nIcon = NITRO_ICONS.premium_tenure_60_month;
            else if (nm >= 36) nIcon = NITRO_ICONS.premium_tenure_36_month;
            else if (nm >= 24) nIcon = NITRO_ICONS.premium_tenure_24_month;
            else if (nm >= 12) nIcon = NITRO_ICONS.premium_tenure_12_month;
            else if (nm >= 6) nIcon = NITRO_ICONS.premium_tenure_6_month;
            else if (nm >= 3) nIcon = NITRO_ICONS.premium_tenure_3_month;
            else if (nm >= 1) nIcon = NITRO_ICONS.premium_tenure_1_month;
          }
          push(nIcon, "premium", "N");
        }
      }
      if (storage.showBoost) {
        var bSince = (user && (user.premiumGuildSince || user.premium_guild_since))
          || (profile && (profile.premiumGuildSince || profile.premium_guild_since));
        if (bSince) push(boostIconForMonths(monthsSince(bSince)), "guild_booster", "+");
      }
      if (storage.showProfileBadges && (!profile || !Array.isArray(profile.badges))) {
        requestProfile(userId);
      }
    }

    var max = Number(storage.maxBadges);
    if (!isNaN(max) && max > 0 && out.length > max) out = out.slice(0, max);
    cache[userId] = { t: Date.now(), b: out };
    return out;
  }

  function install() {
    while (unpatches.length) try { unpatches.pop()(); } catch (e) {}
    ensure();
    try {
      var UPS = safe(function () { return findByStoreName("UserProfileStore"); })
        || safe(function () { return findByProps("getUserProfile"); });
      if (UPS && UPS.getUserProfile) {
        unpatches.push(after("getUserProfile", UPS, function (args, res) {
          try {
            var id = args && args[0];
            if (id != null) delete cache[String(id)];
          } catch (e) {}
          return res;
        }));
      }
    } catch (e) {}

    try {
      var DCD = RN.NativeModules && RN.NativeModules.DCDChatManager;
      if (DCD && DCD.updateRows) {
        unpatches.push(before("updateRows", DCD, function (args) {
          if (!storage.enabled) return;
          try {
            var raw = args[1];
            var rows = typeof raw === "string" ? JSON.parse(raw) : raw;
            if (!Array.isArray(rows)) return;
            var changed = false;
            for (var i = 0; i < rows.length; i++) {
              var row = rows[i];
              if (!row || !row.message) continue;
              var msg = row.message;
              var uid = msg.authorId != null ? msg.authorId
                : (msg.userId != null ? msg.userId
                : (msg.author && msg.author.id != null ? msg.author.id : null));
              if (uid == null) continue;
              uid = String(uid);
              var badges = collect(uid);
              if (!badges.length) continue;
              changed = true;
              msg.badges = badges.map(function (b) {
                return { icon: b.icon, id: b.id, description: b.id || "badge" };
              });
              if (storage.emojiMarks && !msg._sbicMarks) {
                msg._sbicMarks = true;
                var marks = " " + badges.map(function (b) { return b.mark || "*"; }).join("");
                if (msg.username) msg.username = String(msg.username) + marks;
                if (msg.authorName) msg.authorName = String(msg.authorName) + marks;
                if (msg.nick) msg.nick = String(msg.nick) + marks;
              }
            }
            if (changed) args[1] = typeof raw === "string" ? JSON.stringify(rows) : rows;
          } catch (e) {}
        }));
      }
    } catch (e) {}
  }

  function Settings() {
    ensure();
    useProxy(storage);
    var bump = React.useReducer(function (x) { return x + 1; }, 0)[1];
    function flip(k) {
      storage[k] = !storage[k];
      cache = {};
      bump();
      install();
    }
    function sw(key, label, sub) {
      if (FormRow && FormSwitch) {
        return React.createElement(FormRow, {
          key: key, label: label, subLabel: sub,
          trailing: React.createElement(FormSwitch, { value: !!storage[key], onValueChange: function () { flip(key); } }),
          onPress: function () { flip(key); }
        });
      }
      return React.createElement(View, {
        key: key,
        style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }
      },
        React.createElement(View, { style: { flex: 1, paddingRight: 12 } },
          React.createElement(Text, { style: { color: "#fff", fontSize: 16 } }, label),
          sub ? React.createElement(Text, { style: { color: "#888", fontSize: 12, marginTop: 2 } }, sub) : null
        ),
        React.createElement(Switch, { value: !!storage[key], onValueChange: function () { flip(key); } })
      );
    }
    function numField() {
      var val = String(storage.maxBadges == null ? 0 : storage.maxBadges);
      function onChange(t) {
        var n = parseInt(t, 10);
        storage.maxBadges = isNaN(n) ? 0 : Math.max(0, n);
        cache = {};
        bump();
      }
      if (FormInput) {
        return React.createElement(FormInput, {
          key: "max", title: "Max badges (0 = all)", value: val,
          onChange: onChange, onChangeText: onChange, placeholder: "0"
        });
      }
      return React.createElement(View, { key: "max", style: { padding: 16 } },
        React.createElement(Text, { style: { color: "#aaa", marginBottom: 4 } }, "Max badges (0 = all)"),
        React.createElement(TextInput, {
          value: val, onChangeText: onChange, keyboardType: "number-pad",
          style: { color: "#fff", backgroundColor: "rgba(255,255,255,0.06)", padding: 12, borderRadius: 8 }
        })
      );
    }
    return React.createElement(ScrollView, { style: { flex: 1 } },
      React.createElement(Text, { style: { margin: 16, color: "#fff", fontSize: 18, fontWeight: "700" } }, "Show Badges In Chat"),
      React.createElement(Text, { style: { marginHorizontal: 16, marginBottom: 8, color: "#888", fontSize: 13 } },
        "Shows every profile badge next to usernames in guilds, DMs, and group chats."),
      sw("enabled", "Enabled", "Master toggle"),
      sw("showProfileBadges", "Profile badges", "Everything Discord shows on the profile (quests, tenure, etc.)"),
      sw("showClassic", "Classic flags", "Staff, HypeSquad, Early Supporter, Active Dev…"),
      sw("showNitro", "Nitro / tenure", "Nitro badge including tenure tiers"),
      sw("showBoost", "Server boost", "Boost badge tier from boost since date"),
      sw("emojiMarks", "Letter marks on names", "Appends S/P/H/N/+ etc. — most reliable on mobile"),
      sw("fetchProfiles", "Fetch missing profiles", "Load full badge lists for users not yet opened"),
      numField(),
      React.createElement(Text, {
        style: { margin: 16, color: "#666", fontSize: 12 }
      }, "v1.3.0 — reopen the channel after changing settings. Profile badges appear after Discord has loaded that user's profile.")
    );
  }

  exports.default = {
    onLoad: function () {
      ensure();
      install();
      try { logger.log("[ShowBadgesInChat] v1.3.0 loaded"); } catch (e) {}
    },
    onUnload: function () {
      while (unpatches.length) try { unpatches.pop()(); } catch (e) {}
      cache = {};
      pendingFetch = {};
    },
    settings: Settings
  };
  try { Object.defineProperty(exports, "__esModule", { value: true }); } catch (e) {}
  return exports;
})({});
