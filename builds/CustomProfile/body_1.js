    if (storage.draftConnName == null) storage.draftConnName = "";
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
      try { var d = new Date(storage.premiumSince); if (!isNaN(d.getTime())) return d.toISOString(); } catch (e) {}
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
    try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
    catch (e) { return iso; }
  }

  function buildBadgesArray() {
    var out = [];
    var bf = getBadgeFlags();
    for (var i = 0; i < BADGES.length; i++) {
      var b = BADGES[i];
      if (bf & b.flag) out.push({ id: b.id, description: b.label, icon: b.icon, link: b.link });
    }
    if (storage.nitro) {
      var nl = Number(storage.nitroLevel);
      if (isNaN(nl) || nl < 0) nl = 0;
      if (nl >= NITRO_LEVELS.length) nl = NITRO_LEVELS.length - 1;
      var nt = NITRO_LEVELS[nl];
      out.push({ id: nt.id, description: "Subscriber since " + formatSince(nitroSinceISO()), icon: nt.icon, link: "https://discord.com/settings/premium" });
    }
    var bl = Number(storage.boostLevel);
    if (!isNaN(bl) && bl >= 0 && bl < BOOST_LEVELS.length) {
      var bt = BOOST_LEVELS[bl];
      out.push({ id: bt.id, description: "Server boosting since " + formatSince(boostSinceISO()), icon: bt.icon, link: "https://discord.com/settings/premium" });
    }
    return out;
  }

  function applyToUser(user) {
    if (!user || !storage.enabled) return user;
    if (!isTarget(user.id)) return user;
    try {
      if (storage.username) user.username = storage.username;
      if (storage.globalName) { user.globalName = storage.globalName; user.displayName = storage.globalName; }
      if (storage.avatar && !/^https?:\/\//i.test(String(storage.avatar))) user.avatar = storage.avatar;
      var bf = getBadgeFlags();
      if (storage.hideRealBadges || bf) { user.publicFlags = bf; user.flags = bf; }
      if (storage.nitro) {
        user.premiumType = 2; user.premium_type = 2;
        user.premiumSince = nitroSinceISO(); user.premium_since = user.premiumSince;
      }
      var boostIso = boostSinceISO();
      if (boostIso) { user.premiumGuildSince = boostIso; user.premium_guild_since = boostIso; }
      else if (storage.hideRealBadges) {
        try { user.premiumGuildSince = null; user.premium_guild_since = null; } catch (e) {}
      }
    } catch (e) {}
    return user;
  }

  function applyToProfile(profile) {
    if (!profile || !storage.enabled) return profile;
    var pid = profile.userId || (profile.user && profile.user.id) || profile.id;
    if (pid != null) { if (!isTarget(pid)) return profile; }
    else {
      var tid = targetId();
      if (!tid || !cachedSelfId || tid !== cachedSelfId) return profile;
    }
    try {
      if (storage.bio != null && storage.bio !== "") profile.bio = storage.bio;
      if (storage.pronouns != null && storage.pronouns !== "") profile.pronouns = storage.pronouns;
      if (storage.banner && !/^https?:\/\//i.test(String(storage.banner))) profile.banner = storage.banner;
      if (storage.accentColor != null && storage.accentColor !== "") {
        var n = Number(storage.accentColor);
        if (!isNaN(n)) { profile.accentColor = n; profile.themeColors = profile.themeColors || [n, n]; }
      }
      if (storage.createdAt) {
        try { profile.createdAt = new Date(storage.createdAt).toISOString(); } catch (e) {}
      }
      var bf = getBadgeFlags();
      if (storage.hideRealBadges || bf) { profile.publicFlags = bf; profile.flags = bf; }
      if (storage.nitro) {
        profile.premiumType = 2; profile.premium_type = 2;
        profile.premiumSince = nitroSinceISO(); profile.premium_since = profile.premiumSince;
      }
      var boostIso = boostSinceISO();
      if (boostIso) { profile.premiumGuildSince = boostIso; profile.premium_guild_since = boostIso; }
      else if (storage.hideRealBadges) {
        try { profile.premiumGuildSince = null; profile.premium_guild_since = null; } catch (e) {}
      }
      var built = buildBadgesArray();
      if (storage.hideRealBadges) profile.badges = built;
      else {
        var existing = Array.isArray(profile.badges) ? profile.badges.slice() : [];
        var managedIds = {};
        for (var i = 0; i < BADGES.length; i++) managedIds[BADGES[i].id] = true;
        for (var j = 0; j < NITRO_LEVELS.length; j++) managedIds[NITRO_LEVELS[j].id] = true;
        for (var k = 0; k < BOOST_LEVELS.length; k++) managedIds[BOOST_LEVELS[k].id] = true;
        managedIds["premium"] = true; managedIds["nitro"] = true;
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
      var conns = formatConnections();
      if (conns.length || storage.hideRealConnections) {
        if (storage.hideRealConnections) profile.connectedAccounts = conns;
        else {
          var prev = Array.isArray(profile.connectedAccounts) ? profile.connectedAccounts.slice() : [];
          profile.connectedAccounts = prev.concat(conns);
        }
      }
    } catch (e) {}
    return profile;
  }

  function forceRerender() {
    try {
      var Flux = safeFind(function () { return findByProps("dispatch", "subscribe"); });
      if (Flux && Flux.dispatch) {
        try { Flux.dispatch({ type: "USER_UPDATE" }); } catch (e) {}
        try { Flux.dispatch({ type: "CURRENT_USER_UPDATE" }); } catch (e) {}
        try { Flux.dispatch({ type: "CONNECTION_OPEN" }); } catch (e) {}
      }
    } catch (e) {}
  }

  function uninstallPatches() {
    while (unpatches.length) try { unpatches.pop()(); } catch (e) {}
  }

  function installPatches() {
    uninstallPatches();
    ensureDefaults();
    resolveSelfIdSafe();

    try {
      var US = findUserStore();
      if (US && US.getUser) {
        unpatches.push(after("getUser", US, function (args, res) {
          if (!res || !storage.enabled) return res;
          return applyToUser(res);
        }));
      }
      if (US && US.getCurrentUser) {
        unpatches.push(after("getCurrentUser", US, function (args, res) {
          if (!res || !storage.enabled) return res;
          if (res.id != null) cachedSelfId = String(res.id);
          return applyToUser(res);
        }));
      }
    } catch (e) {}

    try {
      var UPS = findUserProfileStore();
      if (UPS && UPS.getUserProfile) {
        unpatches.push(after("getUserProfile", UPS, function (args, res) {
          if (!res || !storage.enabled) return res;
          return applyToProfile(res);
        }));
      }
    } catch (e) {}

    try {
      var av = findAvatarStuff();
      if (av && av.getUserAvatarURL) {
        unpatches.push(after("getUserAvatarURL", av, function (args, res) {
          if (!storage.enabled || !storage.avatar) return res;
          var u = args && args[0];
          var id = u && (u.id != null ? u.id : u);
          if (id != null && isTarget(id) && /^https?:\/\//i.test(String(storage.avatar))) return storage.avatar;
          return res;
        }));
      }
    } catch (e) {}

    try {
      var bn = findBannerStuff();
      if (bn && bn.getUserBannerURL) {
        unpatches.push(after("getUserBannerURL", bn, function (args, res) {
          if (!storage.enabled || !storage.banner) return res;
          var u = args && args[0];
          var id = (u && u.id != null) ? u.id : (u && u.userId != null ? u.userId : null);
          if (id != null && isTarget(id) && /^https?:\/\//i.test(String(storage.banner))) return storage.banner;
          return res;
        }));
      }
    } catch (e) {}

    try {
      var prem = findPremiumUtils();
      if (prem && prem.isPremium) {
        unpatches.push(after("isPremium", prem, function (args, res) {
          if (!storage.enabled || !storage.nitro) return res;
          var id = args && args[0] && (args[0].id != null ? args[0].id : args[0]);
          if (id != null) { if (!isTarget(id)) return res; }
          else {
            var tid = targetId();
            if (!tid || !cachedSelfId || tid !== cachedSelfId) return res;
          }
          return true;
        }));
      }
    } catch (e) {}

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
              var authorId = String(row.message.authorId != null ? row.message.authorId : row.message.userId != null ? row.message.userId : "");
              if (authorId !== tid) continue;
              if (storage.avatar && /^https?:\/\//i.test(String(storage.avatar))) row.message.avatarURL = storage.avatar;
              if (storage.globalName) {
                row.message.username = storage.globalName;
