(function (exports) {
  "use strict";
  // CustomProfile v2.7.0 — Discord settings tab
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
    STAFF: 1 << 0, PARTNER: 1 << 1, HYPESQUAD: 1 << 2, BUG_HUNTER_1: 1 << 3,
    BRAVERY: 1 << 6, BRILLIANCE: 1 << 7, BALANCE: 1 << 8, EARLY_SUPPORTER: 1 << 9,
    BUG_HUNTER_2: 1 << 14, DEV_VERIFIED: 1 << 17, MOD_ALUMNI: 1 << 18, ACTIVE_DEVELOPER: 1 << 22
  };

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

  var CONNECTION_TYPES = [
    { id: "steam", label: "Steam", placeholder: "steam_id" },
    { id: "xbox", label: "Xbox", placeholder: "Gamertag" },
    { id: "playstation", label: "PlayStation", placeholder: "PSN_ID" },
    { id: "epicgames", label: "Epic Games", placeholder: "EpicName" },
    { id: "riotgames", label: "Riot Games", placeholder: "Name#TAG" },
    { id: "leagueoflegends", label: "League of Legends", placeholder: "Name#TAG" },
    { id: "battlenet", label: "Battle.net", placeholder: "Name#1234" },
    { id: "bungie", label: "Bungie.net", placeholder: "Name#1234" },
    { id: "roblox", label: "Roblox", placeholder: "username" },
    { id: "spotify", label: "Spotify", placeholder: "user" },
    { id: "amazon-music", label: "Amazon Music", placeholder: "user" },
    { id: "soundcloud", label: "SoundCloud", placeholder: "user" },
    { id: "youtube", label: "YouTube", placeholder: "channel" },
    { id: "twitch", label: "Twitch", placeholder: "user" },
    { id: "tiktok", label: "TikTok", placeholder: "user" },
    { id: "twitter", label: "X (Twitter)", placeholder: "handle" },
    { id: "bluesky", label: "Bluesky", placeholder: "user.bsky.social" },
    { id: "github", label: "GitHub", placeholder: "user" },
    { id: "reddit", label: "Reddit", placeholder: "user" },
    { id: "facebook", label: "Facebook", placeholder: "user" },
    { id: "instagram", label: "Instagram", placeholder: "user" },
    { id: "paypal", label: "PayPal", placeholder: "user" },
    { id: "ebay", label: "eBay", placeholder: "user" },
    { id: "crunchyroll", label: "Crunchyroll", placeholder: "user" },
    { id: "domain", label: "Domain", placeholder: "example.com" },
    { id: "mastodon", label: "Mastodon", placeholder: "@user@server" },
    { id: "skype", label: "Skype", placeholder: "user" }
  ];

  function defaultConnUrl(type, name) {
    if (!name) return undefined;
    var n = String(name).replace(/^@/, "");
    if (type === "domain") return /^https?:\/\//i.test(name) ? name : ("https://" + name);
    if (type === "twitter") return "https://x.com/" + n;
    if (type === "github") return "https://github.com/" + n;
    if (type === "youtube") return "https://youtube.com/@" + n;
    if (type === "twitch") return "https://twitch.tv/" + n;
    if (type === "spotify") return "https://open.spotify.com/user/" + n;
    if (type === "tiktok") return "https://tiktok.com/@" + n;
    if (type === "reddit") return "https://reddit.com/user/" + n;
    if (type === "steam") return "https://steamcommunity.com/id/" + n;
    if (type === "bluesky") return "https://bsky.app/profile/" + n;
    if (type === "paypal") return "https://paypal.me/" + n;
    if (type === "facebook") return "https://facebook.com/" + n;
    if (type === "instagram") return "https://instagram.com/" + n;
    return undefined;
  }

  function getConnections() {
    try {
      var list = storage.connections;
      if (!Array.isArray(list)) return [];
      return list.filter(function (c) { return c && c.type && String(c.name || "").trim(); });
    } catch (e) { return []; }
  }

  function formatConnections() {
    return getConnections().map(function (c) {
      var url = c.url || defaultConnUrl(c.type, c.name);
      var obj = {
        type: c.type, id: String(c.name), name: String(c.name),
        verified: c.verified !== false, visibility: 1,
        show_activity: false, showActivity: false,
        friend_sync: false, friendSync: false,
        metadata_visibility: 0, metadataVisibility: 0,
        two_way_link: false, twoWayLink: false, metadata: {}
      };
      if (url) obj.url = url;
      return obj;
    });
  }

  var unpatches = [];
  var cachedSelfId = null;

  function safeFind(fn) { try { return fn(); } catch (e) { return null; } }
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
    if (storage.connections == null) storage.connections = [];
    if (storage.hideRealConnections == null) storage.hideRealConnections = false;
    if (storage.draftConnType == null) storage.draftConnType = 0;
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
