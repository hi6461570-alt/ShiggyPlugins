(function (exports) {
  "use strict";
  var storage = vendetta.plugin.storage;
  var findByProps = vendetta.metro.findByProps;
  var findByStoreName = vendetta.metro.findByStoreName;
  var React = vendetta.metro.common.React;
  var ReactNative = vendetta.metro.common.ReactNative;
  var useProxy = vendetta.storage.useProxy;
  var Forms = (vendetta.ui.components && vendetta.ui.components.Forms) || {};
  var logger = vendetta.logger || console;
  var ScrollView = ReactNative.ScrollView;
  var Text = ReactNative.Text;
  var View = ReactNative.View;
  var Switch = ReactNative.Switch;
  var FormRow = Forms.FormRow;
  var FormSwitch = Forms.FormSwitch;
  var unpatches = [];

  var FLAG_BADGES = [
    { flag: 1 << 0, icon: "5e74e9b61934fc1f67c65515d1f7e60d" },
    { flag: 1 << 1, icon: "3f9748e53446a137a052f3454e2de41e" },
    { flag: 1 << 2, icon: "bf01d1073931f921909045f3a39fd264" },
    { flag: 1 << 3, icon: "2717692c7dca7289b35297368a940dd0" },
    { flag: 1 << 6, icon: "8a88d63823d8a71cd5e390baa45efa02" },
    { flag: 1 << 7, icon: "011940fd013da3f7fb926e4a1cd2e618" },
    { flag: 1 << 8, icon: "3aa41de486fa12454c3761e8e223442e" },
    { flag: 1 << 9, icon: "7060786766c9c840eb3019e725d2b358" },
    { flag: 1 << 14, icon: "848f79194d4be5ff5f81505cbd0ce1e6" },
    { flag: 1 << 17, icon: "6df5892e0f35b051f8b61eace34f4967" },
    { flag: 1 << 18, icon: "fee1624003e2fee35cb398e125dc479b" },
    { flag: 1 << 22, icon: "6bdc42827a38498929a4920da12695d9" }
  ];
  var NITRO_ICON = "2ba85e8026a8614b640c2837bcdfe21b";

  function ensure() {
    if (storage.enabled == null) storage.enabled = true;
    if (storage.showNitro == null) storage.showNitro = true;
    if (storage.maxBadges == null) storage.maxBadges = 4;
  }

  function iconsForUser(user) {
    if (!user) return [];
    var flags = (user.publicFlags != null ? user.publicFlags : user.flags) || 0;
    var out = [];
    for (var i = 0; i < FLAG_BADGES.length; i++) {
      if (flags & FLAG_BADGES[i].flag) out.push(FLAG_BADGES[i].icon);
    }
    if (storage.showNitro && (user.premiumType || user.premium_type)) out.push(NITRO_ICON);
    var max = Number(storage.maxBadges) || 4;
    if (out.length > max) out = out.slice(0, max);
    return out;
  }

  function install() {
    while (unpatches.length) try { unpatches.pop()(); } catch (e) {}
    ensure();
    try {
      var DCD = ReactNative.NativeModules && ReactNative.NativeModules.DCDChatManager;
      if (DCD && DCD.updateRows) {
        unpatches.push(vendetta.patcher.before("updateRows", DCD, function (args) {
          if (!storage.enabled) return;
          try {
            var rows = JSON.parse(args[1]);
            var UserStore = findByStoreName("UserStore") || findByProps("getUser", "getCurrentUser");
            for (var i = 0; i < rows.length; i++) {
              var row = rows[i];
              if (!row || row.type !== 1 || !row.message) continue;
              var uid = row.message.authorId || row.message.userId;
              if (!uid || !UserStore || !UserStore.getUser) continue;
              var user = UserStore.getUser(uid);
              var icons = iconsForUser(user);
              if (!icons.length) continue;
              if (!row.message._sbic) {
                row.message._sbic = true;
                row.message.badges = icons.map(function (ic) {
                  return { icon: ic, description: "badge" };
                });
              }
            }
            args[1] = JSON.stringify(rows);
          } catch (e) {}
        }));
      }
    } catch (e) {}
  }

  function Settings() {
    ensure();
    useProxy(storage);
    var bump = React.useReducer(function (x) { return x + 1; }, 0)[1];
    function flip(k) { storage[k] = !storage[k]; bump(); install(); }
    function sw(key, label) {
      if (FormRow && FormSwitch)
        return React.createElement(FormRow, { key: key, label: label,
          trailing: React.createElement(FormSwitch, { value: !!storage[key], onValueChange: function () { flip(key); } }) });
      return React.createElement(View, { key: key, style: { flexDirection: "row", justifyContent: "space-between", padding: 16 } },
        React.createElement(Text, { style: { color: "#fff" } }, label),
        React.createElement(Switch, { value: !!storage[key], onValueChange: function () { flip(key); } })
      );
    }
    return React.createElement(ScrollView, { style: { flex: 1 } },
      React.createElement(Text, { style: { margin: 16, color: "#fff", fontSize: 16, fontWeight: "700" } }, "Show Badges In Chat"),
      sw("enabled", "Enabled"),
      sw("showNitro", "Show Nitro badge"),
      React.createElement(Text, { style: { margin: 16, color: "#888", fontSize: 12 } },
        "Injects classic profile badges into chat rows (local). Reopen a channel after enabling.")
    );
  }

  var plugin = {
    onLoad: function () { ensure(); install(); try { logger.log("[ShowBadgesInChat] loaded"); } catch (e) {} },
    onUnload: function () { while (unpatches.length) try { unpatches.pop()(); } catch (e) {} },
    settings: Settings
  };
  exports.default = plugin;
  try { Object.defineProperty(exports, "__esModule", { value: true }); } catch (e) {}
  return exports;
})({});
