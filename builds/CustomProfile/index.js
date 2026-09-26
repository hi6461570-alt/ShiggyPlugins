(function (exports) {
  "use strict";
  var storage = vendetta.plugin.storage;
  var after = vendetta.patcher.after;
  var before = vendetta.patcher.before;
  var findByProps = vendetta.metro.findByProps;
  var findByStoreName = vendetta.metro.findByStoreName;
  var React = vendetta.metro.common.React;
  var ReactNative = vendetta.metro.common.ReactNative;
  var useProxy = vendetta.storage.useProxy;
  var Forms = (vendetta.ui.components && vendetta.ui.components.Forms) || {};
  var logger = vendetta.logger || console;

  var ScrollView = ReactNative.ScrollView;
  var View = ReactNative.View;
  var Text = ReactNative.Text;
  var TextInput = ReactNative.TextInput;
  var Switch = ReactNative.Switch;
  var TouchableOpacity = ReactNative.TouchableOpacity;
  var Image = ReactNative.Image;

  var FormRow = Forms.FormRow;
  var FormSwitch = Forms.FormSwitch;
  var FormInput = Forms.FormInput;
  var FormSection = Forms.FormSection;

  var FLAG = {
    STAFF: 1 << 0,
    PARTNER: 1 << 1,
    HYPESQUAD: 1 << 2,
    BUG_HUNTER_1: 1 << 3,
    BRAVERY: 1 << 6,
    BRILLIANCE: 1 << 7,
    BALANCE: 1 << 8,
    EARLY_SUPPORTER: 1 << 9,
    BUG_HUNTER_2: 1 << 14,
    DEV_VERIFIED: 1 << 17,
    MOD_ALUMNI: 1 << 18,
    ACTIVE_DEVELOPER: 1 << 22
  };

  // Classic flag badges — icon is CDN hash (no extension), used in profile.badges
  var BADGES = [
    { key: "staff", id: "staff", label: "Staff", flag: FLAG.STAFF, icon: "5e74e9b61934fc1f67c65515d1f7e60d", link: "https://discord.com/company" },
    { key: "partner", id: "partner", label: "Partnered Server Owner", flag: FLAG.PARTNER, icon: "3f9748e53446a137a052f3454e2de41e", link: "https://discord.com/partners" },
    { key: "hypesquad", id: "hypesquad_events", label: "HypeSquad Events", flag: FLAG.HYPESQUAD, icon: "bf01d1073931f921909045f3a39fd264", link: "https://discord.com/hypesquad" },
    { key: "bughunter1", id: "bug_hunter_level_1", label: "Bug Hunter Lvl 1", flag: FLAG.BUG_HUNTER_1, icon: "2717692c7dca7289b35297368a940dd0", link: "https://support.discord.com/hc/en-us/articles/360046057772-Discord-Bugs" },
    { key: "bravery", id: "hypesquad_house_1", label: "HypeSquad Bravery", flag: FLAG.BRAVERY, icon: "8a88d63823d8a71cd5e390baa45efa02", link: "https://discord.com/settings/hypesquad-online" },
    { key: "brilliance", id: "hypesquad_house_2", label: "HypeSquad Brilliance", flag: FLAG.BRILLIANCE, icon: "011940fd013da3f7fb926e4a1cd2e618", link: "https://discord.com/settings/hypesquad-online" },
    { key: "balance", id: "hypesquad_house_3", label: "HypeSquad Balance", flag: FLAG.BALANCE, icon: "3aa41de486fa12454c3761e8e223442e", link: "https://discord.com/settings/hypesquad-online" },
    { key: "early", id: "early_supporter", label: "Early Supporter", flag: FLAG.EARLY_SUPPORTER, icon: "7060786766c9c840eb3019e725d2b358", link: "https://discord.com/settings/premium" },
    { key: "modalumni", id: "certified_moderator", label: "Former Moderator", flag: FLAG.MOD_ALUMNI, icon: "fee1624003e2fee35cb398e125dc479b", link: "https://discord.com/safety" },
    { key: "bughunter2", id: "bug_hunter_level_2", label: "Bug Hunter Lvl 2", flag: FLAG.BUG_HUNTER_2, icon: "848f79194d4be5ff5f81505cbd0ce1e6", link: "https://support.discord.com/hc/en-us/articles/360046057772-Discord-Bugs" },
    { key: "dev", id: "verified_developer", label: "Early Verified Bot Developer", flag: FLAG.DEV_VERIFIED, icon: "6df5892e0f35b051f8b61eace34f4967", link: "https://support.discord.com/hc/articles/360040720312" },
    { key: "activedev", id: "active_developer", label: "Active Developer", flag: FLAG.ACTIVE_DEVELOPER, icon: "6bdc42827a38498929a4920da12695d9", link: "https://support-dev.discord.com/hc/articles/10113997751447" }
  ];

  // Nitro tenure badge tiers (icon hash only)
  var NITRO_LEVELS = [
    { label: "Nitro (0 mo)", months: 0, icon: "2ba85e8026a8614b640c2837bcdfe21b", id: "premium" },
    { label: "Bronze (1 mo)", months: 1, icon: "4f33c4a9c64ce221936bd256c356f91f", id: "premium_tenure_1_month" },
    { label: "Silver (3 mo)", months: 3, icon: "4514fab914bdbfb4ad2fa23df76121a6", id: "premium_tenure_3_month" },
    { label: "Gold (6 mo)", months: 6, icon: "2895086c18d5531d499862e41d1155a6", id: "premium_tenure_6_month" },
    { label: "Platinum (12 mo)", months: 12, icon: "0334688279c8359120922938dcb1d6f8", id: "premium_tenure_12_month" },
    { label: "Diamond (24 mo)", months: 24, icon: "0d61871f72bb9a33a7ae568c1fb4f20a", id: "premium_tenure_24_month" },
    { label: "Emerald (36 mo)", months: 36, icon: "11e2d339068b55d3a506cff34d3780f3", id: "premium_tenure_36_month" },
    { label: "Ruby (60 mo)", months: 60, icon: "cd5e2cfd9d7f27a8cdcd3e8a8d5dc9f4", id: "premium_tenure_60_month" },
    { label: "Opal (72 mo)", months: 72, icon: "5b154df19c53dce2af92c9b61e6be5e2", id: "premium_tenure_72_month" }
  ];

  var BOOST_LEVELS = [
    { label: "1 Month", months: 1, icon: "51040c70d4f20a921ad6674ff86fc95c", id: "guild_booster_lvl1" },
    { label: "2 Months", months: 2, icon: "0e4080d1d333bc7ad29ef6528b6f2fb7", id: "guild_booster_lvl2" },
    { label: "3 Months", months: 3, icon: "72bed924410c304dbe3d00a6e593ff59", id: "guild_booster_lvl3" },
    { label: "6 Months", months: 6, icon: "df199d2050d3ed4ebf84d64ae83989f8", id: "guild_booster_lvl4" },
    { label: "9 Months", months: 9, icon: "996b3e870e8a22ce519b3a50e6bdd52f", id: "guild_booster_lvl5" },
    { label: "12 Months", months: 12, icon: "991c9f39ee33d7537d9f408c3e53141e", id: "guild_booster_lvl6" },
    { label: "15 Months", months: 15, icon: "cb3ae83c15e970e8f3d410bc62cb8b99", id: "guild_booster_lvl7" },
    { label: "18 Months", months: 18, icon: "7142225d31238f6387d9f09efaa02759", id: "guild_booster_lvl8" },
    { label: "24 Months", months: 24, icon: "ec92202290b48d0879b7413d2dde3bab", id: "guild_booster_lvl9" }
  ];

  var unpatches = [];
  var cachedSelfId = null;

  function safeFind(fn) {
    try { return fn(); } catch (e) { return null; }
  }
  function findUserStore() {
    return safeFind(function () { return findByStoreName("UserStore"); })
      || safeFind(function () { return findByProps("getCurrentUser", "getUser"); })
      || safeFind(function () { return findByProps("getCurrentUser"); });
  }
  function findUserProfileStore() {
    return safeFind(function () { return findByStoreName("UserProfileStore"); })
      || safeFind(function () { return findByProps("getUserProfile"); });
  }
  function findAvatarStuff() {
    return safeFind(function () { return findByProps("getUserAvatarURL", "getUserAvatarSource"); })
      || safeFind(function () { return findByProps("getUserAvatarURL"); });
  }
  function findBannerStuff() {
    return safeFind(function () { return findByProps("getUserBannerURL"); });
  }
  function findDisplayNameStuff() {
    return safeFind(function () { return findByProps("getName", "getDisplayName"); })
      || safeFind(function () { return findByProps("getDisplayName"); });
  }
  function findSnowflakeUtils() {
    return safeFind(function () { return findByProps("extractTimestamp"); });
  }
  function findPremiumUtils() {
    return safeFind(function () { return findByProps("isPremium", "isPremiumAtLeast"); })
      || safeFind(function () { return findByProps("isPremium"); });
  }

  function ensureDefaults() {
    if (storage.enabled == null) storage.enabled = false;
    if (storage.username == null) storage.username = "";
    if (storage.globalName == null) storage.globalName = "";
    if (storage.bio == null) storage.bio = "";
    if (storage.pronouns == null) storage.pronouns = "";
    if (storage.avatar == null) storage.avatar = "";
    if (storage.banner == null) storage.banner = "";
    if (storage.createdAt == null) storage.createdAt = "";
    if (storage.nitro == null) storage.nitro = false;
    if (storage.nitroLevel == null) storage.nitroLevel = 0;
    if (storage.boostLevel == null) storage.boostLevel = -1;
    if (storage.premiumSince == null) storage.premiumSince = "";
    if (storage.badgeFlags == null) storage.badgeFlags = 0;
    if (storage.hideRealBadges == null) storage.hideRealBadges = true;
    if (storage.accentColor == null) storage.accentColor = "";
    if (storage.targetId == null) storage.targetId = "";
  }

  function resolveSelfIdSafe() {
    try {
      var us = findUserStore();
      var me = us && us.getCurrentUser ? us.getCurrentUser() : null;
      if (me && me.id != null) cachedSelfId = String(me.id);
    } catch (e) {}
    return cachedSelfId;
  }

  function targetId() {
    var t = storage.targetId;
    if (t && String(t).trim()) return String(t).trim();
    return cachedSelfId;
  }

  function isTarget(id) {
    if (!storage.enabled) return false;
    var tid = targetId();
    if (!tid || id == null) return false;
    return String(id) === tid;
  }

  function getBadgeFlags() {
    var n = Number(storage.badgeFlags);
    return isNaN(n) ? 0 : (n >>> 0);
  }

  function monthsAgoISO(months) {
    var d = new Date();
    d.setMonth(d.getMonth() - (months || 0));
    d.setDate(d.getDate() - 2);
    return d.toISOString();
  }

  function nitroSinceISO() {
    if (storage.premiumSince && String(storage.premiumSince).trim()) {
      try {
        var d = new Date(storage.premiumSince);
        if (!isNaN(d.getTime())) return d.toISOString();
      } catch (e) {}
    }
    var level = Number(storage.nitroLevel);
    if (isNaN(level) || level < 0) level = 0;
    if (level >= NITRO_LEVELS.length) level = NITRO_LEVELS.length - 1;
    return monthsAgoISO(NITRO_LEVELS[level].months);
  }

  function boostSinceISO() {
    var level = Number(storage.boostLevel);
    if (isNaN(level) || level < 0 || level >= BOOST_LEVELS.length) return null;
    return monthsAgoISO(BOOST_LEVELS[level].months);
  }

  function formatSince(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch (e) {
      return iso;
    }
  }

  /** Build the profile.badges array Discord mobile actually renders. */
  function buildBadgesArray() {
    var out = [];
    var bf = getBadgeFlags();
    for (var i = 0; i < BADGES.length; i++) {
      var b = BADGES[i];
      if (bf & b.flag) {
        out.push({
          id: b.id,
          description: b.label,
          icon: b.icon,
          link: b.link
        });
      }
    }
    if (storage.nitro) {
      var nl = Number(storage.nitroLevel);
      if (isNaN(nl) || nl < 0) nl = 0;
      if (nl >= NITRO_LEVELS.length) nl = NITRO_LEVELS.length - 1;
      var nt = NITRO_LEVELS[nl];
      var since = nitroSinceISO();
      out.push({
        id: nt.id,
        description: "Subscriber since " + formatSince(since),
        icon: nt.icon,
        link: "https://discord.com/settings/premium"
      });
    }
    var bl = Number(storage.boostLevel);
    if (!isNaN(bl) && bl >= 0 && bl < BOOST_LEVELS.length) {
      var bt = BOOST_LEVELS[bl];
      var bSince = boostSinceISO();
      out.push({
        id: bt.id,
        description: "Server boosting since " + formatSince(bSince),
        icon: bt.icon,
        link: "https://discord.com/settings/premium"
      });
    }
    return out;
  }

  function applyToUser(user) {
    if (!user || !storage.enabled) return user;
    if (!isTarget(user.id)) return user;
    try {
      if (storage.username) user.username = storage.username;
      if (storage.globalName) {
        user.globalName = storage.globalName;
        user.displayName = storage.globalName;
      }
      if (storage.avatar && !/^https?:\/\//i.test(String(storage.avatar))) {
        user.avatar = storage.avatar;
      }

      var bf = getBadgeFlags();
      if (storage.hideRealBadges || bf) {
        user.publicFlags = bf;
        user.flags = bf;
      }

      if (storage.nitro) {
        user.premiumType = 2;
        user.premium_type = 2;
        user.premiumSince = nitroSinceISO();
        user.premium_since = user.premiumSince;
      }

      var boostIso = boostSinceISO();
      if (boostIso) {
        user.premiumGuildSince = boostIso;
        user.premium_guild_since = boostIso;
      } else if (storage.hideRealBadges) {
        try {
          user.premiumGuildSince = null;
          user.premium_guild_since = null;
        } catch (e) {}
      }
    } catch (e) {}
    return user;
  }

  function applyToProfile(profile) {
    if (!profile || !storage.enabled) return profile;
    var pid = profile.userId || (profile.user && profile.user.id) || profile.id;
    if (pid != null) {
      if (!isTarget(pid)) return profile;
    } else {
      var tid = targetId();
      if (!tid || !cachedSelfId || tid !== cachedSelfId) return profile;
    }
    try {
      if (storage.bio != null && storage.bio !== "") profile.bio = storage.bio;
      if (storage.pronouns != null && storage.pronouns !== "") profile.pronouns = storage.pronouns;
      if (storage.banner && !/^https?:\/\//i.test(String(storage.banner))) profile.banner = storage.banner;
      if (storage.accentColor != null && storage.accentColor !== "") {
        var n = Number(storage.accentColor);
        if (!isNaN(n)) {
          profile.accentColor = n;
          profile.themeColors = profile.themeColors || [n, n];
        }
      }
      if (storage.createdAt) {
        try { profile.createdAt = new Date(storage.createdAt).toISOString(); } catch (e) {}
      }

      var bf = getBadgeFlags();
      if (storage.hideRealBadges || bf) {
        profile.publicFlags = bf;
        profile.flags = bf;
      }

      if (storage.nitro) {
        profile.premiumType = 2;
        profile.premium_type = 2;
        profile.premiumSince = nitroSinceISO();
        profile.premium_since = profile.premiumSince;
      }

      var boostIso = boostSinceISO();
      if (boostIso) {
        profile.premiumGuildSince = boostIso;
        profile.premium_guild_since = boostIso;
      } else if (storage.hideRealBadges) {
        try {
          profile.premiumGuildSince = null;
          profile.premium_guild_since = null;
        } catch (e) {}
      }

      var built = buildBadgesArray();
      if (storage.hideRealBadges) {
        profile.badges = built;
      } else {
        var existing = Array.isArray(profile.badges) ? profile.badges.slice() : [];
        var managedIds = {};
        for (var i = 0; i < BADGES.length; i++) managedIds[BADGES[i].id] = true;
        for (var j = 0; j < NITRO_LEVELS.length; j++) managedIds[NITRO_LEVELS[j].id] = true;
        for (var k = 0; k < BOOST_LEVELS.length; k++) managedIds[BOOST_LEVELS[k].id] = true;
        managedIds["premium"] = true;
        managedIds["nitro"] = true;
        existing = existing.filter(function (b) {
          if (!b || !b.id) return true;
          if (managedIds[b.id]) return false;
          if (String(b.id).indexOf("premium") >= 0) return false;
          if (String(b.id).indexOf("guild_booster") >= 0) return false;
          if (String(b.id).indexOf("hypesquad") >= 0) return false;
          return true;
        });
        profile.badges = existing.concat(built);
      }
    } catch (e) {}
    return profile;
  }

  function forceRerender() {
    try {
      var us = findUserStore();
      if (us && us.emitChange) us.emitChange();
    } catch (e) {}
    try {
      var ps = findUserProfileStore();
      if (ps && ps.emitChange) ps.emitChange();
    } catch (e) {}
  }

  function uninstallPatches() {
    while (unpatches.length) {
      try { unpatches.pop()(); } catch (e) {}
    }
  }

  function installPatches() {
    uninstallPatches();
    resolveSelfIdSafe();

    var UserStore = findUserStore();
    if (UserStore && UserStore.getCurrentUser) {
      unpatches.push(after("getCurrentUser", UserStore, function (_, res) {
        if (res && res.id != null) cachedSelfId = String(res.id);
        return applyToUser(res);
      }));
    }
    if (UserStore && UserStore.getUser) {
      unpatches.push(after("getUser", UserStore, function (_, res) {
        return applyToUser(res);
      }));
    }

    var ProfileStore = findUserProfileStore();
    if (ProfileStore && ProfileStore.getUserProfile) {
      unpatches.push(after("getUserProfile", ProfileStore, function (_, res) {
        return applyToProfile(res);
      }));
    }

    var avatarStuff = findAvatarStuff();
    if (avatarStuff && avatarStuff.getUserAvatarURL) {
      unpatches.push(after("getUserAvatarURL", avatarStuff, function (args, res) {
        var id = args && args[0] && (args[0].id != null ? args[0].id : args[0]);
        if (!isTarget(id)) return res;
        if (storage.avatar && /^https?:\/\//i.test(String(storage.avatar))) return storage.avatar;
        return res;
      }));
    }
    if (avatarStuff && avatarStuff.getUserAvatarSource) {
      unpatches.push(after("getUserAvatarSource", avatarStuff, function (args, res) {
        var id = args && args[0] && (args[0].id != null ? args[0].id : args[0]);
        if (!isTarget(id)) return res;
        if (storage.avatar && /^https?:\/\//i.test(String(storage.avatar))) return { uri: storage.avatar };
        return res;
      }));
    }

    var bannerStuff = findBannerStuff();
    if (bannerStuff && bannerStuff.getUserBannerURL) {
      unpatches.push(after("getUserBannerURL", bannerStuff, function (args, res) {
        var u = args && args[0];
        var id = u && (u.id != null ? u.id : u.userId != null ? u.userId : u);
        if (!isTarget(id)) return res;
        if (storage.banner && /^https?:\/\//i.test(String(storage.banner))) return storage.banner;
        return res;
      }));
    }

    var nameStuff = findDisplayNameStuff();
    if (nameStuff && nameStuff.getDisplayName) {
      unpatches.push(after("getDisplayName", nameStuff, function (args, res) {
        var id = args && args[0] && (args[0].id != null ? args[0].id : args[0]);
        if (!isTarget(id)) return res;
        return storage.globalName || storage.username || res;
      }));
    }
    if (nameStuff && nameStuff.getName) {
      unpatches.push(after("getName", nameStuff, function (args, res) {
        var id = args && args[0] && (args[0].id != null ? args[0].id : args[0]);
        if (!isTarget(id)) return res;
        return storage.globalName || storage.username || res;
      }));
    }

    var snow = findSnowflakeUtils();
    if (snow && snow.extractTimestamp) {
      unpatches.push(after("extractTimestamp", snow, function (args, res) {
        try {
          if (!isTarget(args && args[0]) || !storage.createdAt) return res;
          var t = new Date(storage.createdAt).getTime();
          if (!isNaN(t)) return t;
        } catch (e) {}
        return res;
      }));
    }

    var prem = findPremiumUtils();
    if (prem && prem.isPremium) {
      unpatches.push(after("isPremium", prem, function (args, res) {
        if (!storage.enabled || !storage.nitro) return res;
        var id = args && args[0] && (args[0].id != null ? args[0].id : args[0]);
        if (id != null) {
          if (!isTarget(id)) return res;
        } else {
          var tid = targetId();
          if (!tid || !cachedSelfId || tid !== cachedSelfId) return res;
        }
        return true;
      }));
    }

    try {
      var DCDChatManager = ReactNative.NativeModules && ReactNative.NativeModules.DCDChatManager;
      if (DCDChatManager && DCDChatManager.updateRows) {
        unpatches.push(before("updateRows", DCDChatManager, function (args) {
          if (!storage.enabled) return;
          try {
            var rows = JSON.parse(args[1]);
            var tid = targetId();
            if (!tid) return;
            for (var i = 0; i < rows.length; i++) {
              var row = rows[i];
              if (!row || row.type !== 1 || !row.message) continue;
              var authorId = String(
                row.message.authorId != null
                  ? row.message.authorId
                  : row.message.userId != null
                    ? row.message.userId
                    : ""
              );
              if (authorId !== tid) continue;
              if (storage.avatar && /^https?:\/\//i.test(String(storage.avatar)))
                row.message.avatarURL = storage.avatar;
              if (storage.globalName) {
                row.message.username = storage.globalName;
                if (row.message.nick != null) row.message.nick = storage.globalName;
              } else if (storage.username) {
                row.message.username = storage.username;
              }
            }
            args[1] = JSON.stringify(rows);
          } catch (e) {}
        }));
      }
    } catch (e) {}
  }

  function Settings() {
    useProxy(storage);
    var tick = React.useReducer(function (x) { return x + 1; }, 0);
    var bump = tick[1];

    function setAndBump(fn) {
      fn();
      bump();
      forceRerender();
    }

    var children = [];

    function sectionTitle(title) {
      if (FormSection) {
        return React.createElement(FormSection, { key: "sec-" + title, title: title });
      }
      return React.createElement(Text, {
        key: "sec-" + title,
        style: {
          marginHorizontal: 16, marginTop: 18, marginBottom: 6,
          fontSize: 13, fontWeight: "700", opacity: 0.6, color: "#aaa", textTransform: "uppercase"
        }
      }, title);
    }

    function field(key, label, placeholder) {
      if (FormInput) {
        return React.createElement(FormInput, {
          key: key,
          title: label,
          value: storage[key] || "",
          placeholder: placeholder || "",
          onChange: function (t) { storage[key] = t; bump(); },
          onChangeText: function (t) { storage[key] = t; bump(); }
        });
      }
      return React.createElement(View, {
        key: key,
        style: { marginHorizontal: 16, marginVertical: 8 }
      },
        React.createElement(Text, { style: { marginBottom: 4, opacity: 0.7, fontSize: 13, color: "#ccc" } }, label),
        React.createElement(TextInput, {
          value: storage[key] || "",
          placeholder: placeholder || "",
          placeholderTextColor: "#888",
          onChangeText: function (t) { storage[key] = t; bump(); },
          autoCapitalize: "none",
          autoCorrect: false,
          style: {
            backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8,
            paddingHorizontal: 12, paddingVertical: 10, color: "#fff", fontSize: 15
          }
        })
      );
    }

    function switchRow(key, label, subLabel) {
      var val = !!storage[key];
      function flip() {
        setAndBump(function () { storage[key] = !storage[key]; });
      }
      if (FormRow && FormSwitch) {
        return React.createElement(FormRow, {
          key: key,
          label: label,
          subLabel: subLabel,
          trailing: React.createElement(FormSwitch, { value: val, onValueChange: flip }),
          onPress: flip
        });
      }
      return React.createElement(View, {
        key: key,
        style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }
      },
        React.createElement(View, { style: { flex: 1, paddingRight: 12 } },
          React.createElement(Text, { style: { color: "#fff", fontSize: 16 } }, label),
          subLabel ? React.createElement(Text, { style: { color: "#aaa", fontSize: 13, marginTop: 2 } }, subLabel) : null
        ),
        React.createElement(Switch, { value: val, onValueChange: flip })
      );
    }

    function badgeToggle(badge) {
      var flags = getBadgeFlags();
      var on = !!(flags & badge.flag);
      function flip() {
        setAndBump(function () {
          var f = getBadgeFlags();
          if (f & badge.flag) storage.badgeFlags = (f & ~badge.flag) >>> 0;
          else storage.badgeFlags = (f | badge.flag) >>> 0;
        });
      }
      var leading = null;
      if (Image) {
        leading = React.createElement(Image, {
          source: { uri: "https://cdn.discordapp.com/badge-icons/" + badge.icon + ".png" },
          style: { width: 22, height: 22 }
        });
      }
      if (FormRow && FormSwitch) {
        return React.createElement(FormRow, {
          key: "badge-" + badge.key,
          label: badge.label,
          leading: leading,
          trailing: React.createElement(FormSwitch, { value: on, onValueChange: flip }),
          onPress: flip
        });
      }
      return React.createElement(TouchableOpacity, {
        key: "badge-" + badge.key,
        onPress: flip,
        style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 }
      },
        React.createElement(View, { style: { flexDirection: "row", alignItems: "center", flex: 1 } },
          leading,
          React.createElement(Text, { style: { color: "#fff", fontSize: 15, marginLeft: 8 } }, badge.label)
        ),
        React.createElement(Switch, { value: on, onValueChange: flip })
      );
    }

    function cycleRow(label, valueLabel, onPress) {
      if (FormRow) {
        return React.createElement(FormRow, {
          key: label,
          label: label,
          subLabel: valueLabel,
          onPress: onPress
        });
      }
      return React.createElement(TouchableOpacity, {
        key: label,
        onPress: onPress,
        style: { marginHorizontal: 16, marginVertical: 6, padding: 12, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.06)" }
      },
        React.createElement(Text, { style: { color: "#fff", fontSize: 15 } }, label),
        React.createElement(Text, { style: { color: "#aaa", fontSize: 13, marginTop: 2 } }, valueLabel)
      );
    }

    function action(label, fn) {
      if (FormRow) return React.createElement(FormRow, { key: label, label: label, onPress: fn });
      return React.createElement(TouchableOpacity, {
        key: label,
        onPress: fn,
        style: { margin: 12, padding: 14, borderRadius: 8, backgroundColor: "rgba(88,101,242,0.3)" }
      }, React.createElement(Text, { style: { color: "#fff", textAlign: "center", fontSize: 15 } }, label));
    }

    children.push(sectionTitle("General"));
    children.push(switchRow("enabled", "Enable Custom Profile", "Local only — only you see these changes"));
    children.push(switchRow("hideRealBadges", "Hide real badges", "Replace profile.badges entirely with your selection (recommended)"));
    children.push(field("targetId", "Target user ID (empty = you)", "Leave empty to larp yourself"));

    children.push(sectionTitle("Identity"));
    children.push(field("username", "Username", "Custom username"));
    children.push(field("globalName", "Display name", "Custom display name"));
    children.push(field("bio", "Bio", "Custom bio"));
    children.push(field("pronouns", "Pronouns", "he/him, they/them, ..."));
    children.push(field("createdAt", "Account creation date", "YYYY-MM-DD"));

    children.push(sectionTitle("Aesthetics"));
    children.push(field("avatar", "Avatar URL", "https://..."));
    children.push(field("banner", "Banner URL", "https://..."));

    var accentDisplay =
      storage.accentColor != null && storage.accentColor !== ""
        ? Number(storage.accentColor).toString(16).padStart(6, "0")
        : "";
    if (FormInput) {
      children.push(React.createElement(FormInput, {
        key: "accent",
        title: "Accent color (hex, no #)",
        value: accentDisplay,
        placeholder: "5865f2",
        onChange: function (t) {
          var h = String(t || "").replace("#", "");
          var n = parseInt(h, 16);
          storage.accentColor = !isNaN(n) && h.length === 6 ? n : "";
          bump();
        },
        onChangeText: function (t) {
          var h = String(t || "").replace("#", "");
          var n = parseInt(h, 16);
          storage.accentColor = !isNaN(n) && h.length === 6 ? n : "";
          bump();
        }
      }));
    }

    children.push(sectionTitle("Nitro badge"));
    children.push(switchRow("nitro", "Simulate Nitro", "Adds Nitro badge to profile.badges + premiumType"));
    var nl = Number(storage.nitroLevel);
    if (isNaN(nl) || nl < 0) nl = 0;
    if (nl >= NITRO_LEVELS.length) nl = NITRO_LEVELS.length - 1;
    children.push(cycleRow(
      "Nitro tier: " + NITRO_LEVELS[nl].label,
      "Tap to cycle · changes badge icon on profile",
      function () {
        setAndBump(function () {
          var cur = Number(storage.nitroLevel);
          if (isNaN(cur) || cur < 0) cur = 0;
          storage.nitroLevel = (cur + 1) % NITRO_LEVELS.length;
          storage.premiumSince = "";
          storage.nitro = true;
        });
      }
    ));
    children.push(field("premiumSince", "Premium since override (optional)", "YYYY-MM-DD — leave empty to use tier"));

    children.push(sectionTitle("Boost badge"));
    var bl = Number(storage.boostLevel);
    var boostLabel = (isNaN(bl) || bl < 0) ? "None" : (BOOST_LEVELS[bl] ? BOOST_LEVELS[bl].label : "None");
    children.push(cycleRow(
      "Boost: " + boostLabel,
      "Tap to cycle · None → 1mo → … → 24mo",
      function () {
        setAndBump(function () {
          var cur = Number(storage.boostLevel);
          if (isNaN(cur)) cur = -1;
          if (cur >= BOOST_LEVELS.length - 1) storage.boostLevel = -1;
          else storage.boostLevel = cur + 1;
        });
      }
    ));

    children.push(sectionTitle("Classic badges (publicFlags + profile.badges)"));
    children.push(React.createElement(Text, {
      key: "badge-help",
      style: { marginHorizontal: 16, marginBottom: 8, fontSize: 12, color: "#888" }
    }, "These appear on your profile when Hide real badges is on (or merged when off)."));
    for (var i = 0; i < BADGES.length; i++) {
      children.push(badgeToggle(BADGES[i]));
    }

    children.push(sectionTitle("Actions"));
    children.push(action("Apply / Refresh", function () {
      installPatches();
      forceRerender();
      bump();
    }));
    children.push(action("Reset all", function () {
      setAndBump(function () {
        var keys = Object.keys(storage);
        for (var j = 0; j < keys.length; j++) {
          try { delete storage[keys[j]]; } catch (e) {}
        }
        ensureDefaults();
        storage.enabled = false;
        installPatches();
      });
    }));

    children.push(React.createElement(Text, {
      key: "foot",
      style: { margin: 16, opacity: 0.5, fontSize: 12, textAlign: "center", color: "#888" }
    }, "CustomProfile v2.5.0 — rebuilds profile.badges (mobile)"));

    return React.createElement(ScrollView, { style: { flex: 1 } }, children);
  }

  var plugin = {
    onLoad: function () {
      ensureDefaults();
      if (typeof storage.badgeFlags === "string") {
        var parsed = parseInt(storage.badgeFlags, 10);
        storage.badgeFlags = isNaN(parsed) ? 0 : parsed;
      }
      installPatches();
      try {
        logger.log("[CustomProfile] v2.5.0 loaded selfId=" + cachedSelfId + " flags=" + getBadgeFlags() + " nitroLevel=" + storage.nitroLevel);
      } catch (e) {}
    },
    onUnload: function () {
      uninstallPatches();
      try { logger.log("[CustomProfile] unloaded"); } catch (e) {}
    },
    settings: Settings
  };

  exports.default = plugin;
  try {
    Object.defineProperty(exports, "__esModule", { value: true });
  } catch (e) {}
  return exports;
})({});
