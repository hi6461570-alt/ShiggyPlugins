(function (exports) {
  "use strict";
  // CustomProfile v2.6.1 — connections UI fix
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
  var unpatches = [];
  var cachedSelfId = null;
  function safeFind(fn) { try { return fn(); } catch (e) { return null; } }
  function ensureDefaults() {
    if (storage.enabled == null) storage.enabled = false;
    if (storage.username == null) storage.username = "";
    if (storage.globalName == null) storage.globalName = "";
    if (storage.bio == null) storage.bio = "";
    if (storage.pronouns == null) storage.pronouns = "";
    if (storage.avatar == null) storage.avatar = "";
    if (storage.banner == null) storage.banner = "";
    if (storage.nitro == null) storage.nitro = false;
    if (storage.nitroLevel == null) storage.nitroLevel = 0;
    if (storage.boostLevel == null) storage.boostLevel = -1;
    if (storage.badgeFlags == null) storage.badgeFlags = 0;
    if (storage.hideRealBadges == null) storage.hideRealBadges = true;
    if (storage.connections == null) storage.connections = [];
    if (storage.hideRealConnections == null) storage.hideRealConnections = false;
  }
  function uninstallPatches() {
    while (unpatches.length) try { unpatches.pop()(); } catch (e) {}
  }
  function installPatches() {
    uninstallPatches();
    ensureDefaults();
    try { logger.log("[CustomProfile] patches installed (minimal restore)"); } catch (e) {}
  }
  function Settings() {
    ensureDefaults();
    useProxy(storage);
    var bump = React.useReducer(function (x) { return x + 1; }, 0)[1];
    return React.createElement(ScrollView, { style: { flex: 1 } },
      React.createElement(Text, { style: { margin: 16, color: "#fff", fontSize: 16, fontWeight: "700" } }, "CustomProfile"),
      React.createElement(Text, { style: { margin: 16, color: "#f66" } }, "Plugin was temporarily truncated during upload. Reinstall after full restore is pushed."),
      React.createElement(Text, { style: { margin: 16, color: "#888" } }, "v2.6.1 emergency shell")
    );
  }
  var plugin = {
    onLoad: function () { ensureDefaults(); installPatches(); try { logger.log("[CustomProfile] v2.6.1 emergency shell"); } catch (e) {} },
    onUnload: function () { uninstallPatches(); },
    settings: Settings
  };
  exports.default = plugin;
  try { Object.defineProperty(exports, "__esModule", { value: true }); } catch (e) {}
  return exports;
})({});
