(function (exports) {
  "use strict";
  // ShowBadgesInChat v1.4.0 — RowManager + DCDChatManager (RoleColorEverywhere pattern)
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
  var ScrollView = RN.ScrollView, Text = RN.Text, View = RN.View, Switch = RN.Switch;
  var FormRow = Forms.FormRow, FormSwitch = Forms.FormSwitch;
  var unpatches = [];
  var cache = {};
  var patched = false;

  var FLAG_BADGES = [
    { f: 1 << 0, id: "staff", mark: "\uD83D\uDEE1" },
    { f: 1 << 1, id: "partner", mark: "\u2728" },
    { f: 1 << 2, id: "hypesquad_events", mark: "\uD83C\uDF89" },
    { f: 1 << 3, id: "bug_hunter_level_1", mark: "\uD83D\uDC1B" },
    { f: 1 << 6, id: "hypesquad_house_1", mark: "\uD83D\uDDE1" },
    { f: 1 << 7, id: "hypesquad_house_2", mark: "\uD83D\uDCA1" },
    { f: 1 << 8, id: "hypesquad_house_3", mark: "\u2696" },
    { f: 1 << 9, id: "early_supporter", mark: "\uD83C\uDF1F" },
    { f: 1 << 14, id: "bug_hunter_level_2", mark: "\uD83D\uDC1B" },
    { f: 1 << 17, id: "verified_developer", mark: "\uD83D\uDCBB" },
    { f: 1 << 18, id: "certified_moderator", mark: "\uD83D\uDEE1" },
    { f: 1 << 22, id: "active_developer", mark: "\u26A1" }
  ];

  function ensure() {
    if (storage.enabled == null) storage.enabled = true;
    if (storage.showClassic == null) storage.showClassic = true;
    if (storage.showNitro == null) storage.showNitro = true;
    if (storage.showBoost == null) storage.showBoost = true;
    if (storage.showProfileBadges == null) storage.showProfileBadges = true;
    if (storage.marksOnName == null) storage.marksOnName = true;
  }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function log(m) { try { logger.log("[ShowBadgesInChat] " + m); } catch (e) {} }

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

  function collectMarks(userId) {
    userId = String(userId);
    if (cache[userId] && cache[userId].t > Date.now() - 20000) return cache[userId].m;
    var marks = [];
    var seen = {};
    function add(m) {
      if (!m || seen[m]) return;
      seen[m] = 1;
      marks.push(m);
    }

    var profile = getProfile(userId);
    var user = getUser(userId);

    if (storage.showProfileBadges && profile && Array.isArray(profile.badges)) {
      for (var i = 0; i < profile.badges.length; i++) {
        var b = profile.badges[i];
        if (!b || !b.id) continue;
        var id = String(b.id);
        if (!storage.showNitro && (id.indexOf("premium") >= 0 || id.indexOf("nitro") >= 0)) continue;
        if (!storage.showBoost && id.indexOf("guild_booster") >= 0) continue;
        if (id.indexOf("staff") >= 0) add("\uD83D\uDEE1");
        else if (id.indexOf("partner") >= 0) add("\u2728");
        else if (id.indexOf("hypesquad_house_1") >= 0 || id.indexOf("bravery") >= 0) add("\uD83D\uDDE1");
        else if (id.indexOf("hypesquad_house_2") >= 0 || id.indexOf("brilliance") >= 0) add("\uD83D\uDCA1");
        else if (id.indexOf("hypesquad_house_3") >= 0 || id.indexOf("balance") >= 0) add("\u2696");
        else if (id.indexOf("hypesquad") >= 0) add("\uD83C\uDF89");
        else if (id.indexOf("bug") >= 0) add("\uD83D\uDC1B");
        else if (id.indexOf("early") >= 0) add("\uD83C\uDF1F");
        else if (id.indexOf("mod") >= 0) add("\uD83D\uDEE1");
        else if (id.indexOf("dev") >= 0 || id.indexOf("developer") >= 0) add("\u26A1");
        else if (id.indexOf("premium") >= 0 || id.indexOf("nitro") >= 0) add("\uD83D\uDC8E");
        else if (id.indexOf("guild_booster") >= 0 || id.indexOf("boost") >= 0) add("\uD83D\uDE80");
        else if (id.indexOf("quest") >= 0) add("\uD83C\uDFAF");
        else if (id.indexOf("legacy") >= 0) add("\uD83D\uDCDD");
        else add("\u2B50");
      }
    }

    if (!marks.length && user) {
      if (storage.showClassic) {
        var flags = (user.publicFlags != null ? user.publicFlags : user.flags) || 0;
        for (var j = 0; j < FLAG_BADGES.length; j++) {
          if (flags & FLAG_BADGES[j].f) add(FLAG_BADGES[j].mark);
        }
      }
      if (storage.showNitro) {
        var prem = user.premiumType || user.premium_type
          || (profile && (profile.premiumType || profile.premium_type));
        var pSince = user.premiumSince || user.premium_since
          || (profile && (profile.premiumSince || profile.premium_since));
        if (prem || pSince) add("\uD83D\uDC8E");
      }
      if (storage.showBoost) {
        var bSince = user.premiumGuildSince || user.premium_guild_since
          || (profile && (profile.premiumGuildSince || profile.premium_guild_since));
        if (bSince) add("\uD83D\uDE80");
      }
    }

    var out = marks.join("");
    cache[userId] = { t: Date.now(), m: out };
    return out;
  }

  function stripOldMarks(name) {
    if (!name) return name;
    return String(name).replace(/[\uD83D\uDEE1\u2728\uD83C\uDF89\uD83D\uDC1B\uD83D\uDDE1\uD83D\uDCA1\u2696\uD83C\uDF1F\uD83D\uDCBB\u26A1\uD83D\uDC8E\uD83D\uDE80\uD83C\uDFAF\uD83D\uDCDD\u2B50]+$/g, "").replace(/\s+$/,"");
  }

  function handleRow(row) {
    if (!storage.enabled || !storage.marksOnName) return;
    if (!row || !row.message) return;
    if (row.type != null && row.type !== 1) return;
    var msg = row.message;
    var uid = msg.authorId != null ? msg.authorId
      : (msg.userId != null ? msg.userId
      : (msg.author && msg.author.id != null ? msg.author.id : null));
    if (uid == null) return;
    var marks = collectMarks(uid);
    if (!marks) return;

    if (msg.username != null) {
      msg.username = stripOldMarks(msg.username) + " " + marks;
    }
    if (msg.authorName != null) {
      msg.authorName = stripOldMarks(msg.authorName) + " " + marks;
    }
    if (msg.nick != null) {
      msg.nick = stripOldMarks(msg.nick) + " " + marks;
    }
    if (msg.tag != null && typeof msg.tag === "string") {
      msg.tag = stripOldMarks(msg.tag) + " " + marks;
    }
  }

  function getClientBuild() {
    try {
      var nm = RN.NativeModules || {};
      var info = nm.InfoDictionaryManager || nm.RTNClientInfoManager || nm.ClientInfoManager;
      if (info && info.Build) return parseInt(info.Build, 10) || 0;
    } catch (e) {}
    return 999999;
  }

  function install() {
    while (unpatches.length) try { unpatches.pop()(); } catch (e) {}
    ensure();
    patched = false;
    cache = {};

    var build = getClientBuild();
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
        log("patched DCDChatManager.updateRows (build " + build + ")");
      } catch (e) {
        log("DCDChatManager patch failed: " + e);
      }
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
    } catch (e) {
      log("RowManager patch failed: " + e);
    }

    try {
      var UPS = safe(function () { return findByStoreName("UserProfileStore"); })
        || safe(function () { return findByProps("getUserProfile"); });
      if (UPS && UPS.getUserProfile) {
        unpatches.push(after("getUserProfile", UPS, function (args) {
          try {
            if (args && args[0] != null) delete cache[String(args[0])];
          } catch (e) {}
        }));
      }
    } catch (e) {}

    if (!patched) log("WARNING: no chat row patch applied — badges will not show");
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
          trailing: React.createElement(FormSwitch, {
            value: !!storage[key],
            onValueChange: function () { flip(key); }
          }),
          onPress: function () { flip(key); }
        });
      }
      return React.createElement(View, {
        key: key,
        style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }
      },
        React.createElement(View, { style: { flex: 1 } },
          React.createElement(Text, { style: { color: "#fff", fontSize: 16 } }, label),
          sub ? React.createElement(Text, { style: { color: "#888", fontSize: 12 } }, sub) : null
        ),
        React.createElement(Switch, { value: !!storage[key], onValueChange: function () { flip(key); } })
      );
    }
    return React.createElement(ScrollView, { style: { flex: 1 } },
      React.createElement(Text, { style: { margin: 16, color: "#fff", fontSize: 18, fontWeight: "700" } }, "Show Badges In Chat"),
      React.createElement(Text, { style: { marginHorizontal: 16, marginBottom: 12, color: "#888", fontSize: 13 } },
        "Appends badge emoji next to usernames in guilds, DMs, and groups (native chat). Reopen the channel after enabling."),
      sw("enabled", "Enabled", "Master toggle"),
      sw("marksOnName", "Show on names", "Emoji marks after username"),
      sw("showProfileBadges", "Use profile.badges", "All badges Discord shows on the profile"),
      sw("showClassic", "Classic flags", "Staff, HypeSquad, Early Supporter…"),
      sw("showNitro", "Nitro", "Nitro / tenure"),
      sw("showBoost", "Boost", "Server boost"),
      React.createElement(Text, { style: { margin: 16, color: patched ? "#4caf50" : "#f44336", fontSize: 12 } },
        patched ? "Chat patch active" : "Chat patch NOT active — check logs"),
      React.createElement(Text, { style: { margin: 16, color: "#666", fontSize: 12 } }, "v1.4.0")
    );
  }

  exports.default = {
    onLoad: function () {
      ensure();
      install();
      log("v1.4.0 loaded");
    },
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
