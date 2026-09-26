(function (exports) {
  "use strict";
  var storage = vendetta.plugin.storage;
  var after = vendetta.patcher.after;
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

  function ensure() {
    if (storage.enabled == null) storage.enabled = true;
    if (storage.markVoice == null) storage.markVoice = true;
    if (storage.markActivities == null) storage.markActivities = true;
    if (storage.markClients == null) storage.markClients = true;
  }

  function isGhostOffline(userId) {
    try {
      var PS = findByStoreName("PresenceStore") || findByProps("getStatus", "getState");
      var status = PS && PS.getStatus ? PS.getStatus(userId) : null;
      if (status && status !== "offline" && status !== "invisible") return false;

      if (storage.markVoice) {
        var VS = findByStoreName("VoiceStateStore") || findByProps("getVoiceStateForChannel", "getAllVoiceStates");
        if (VS && VS.getAllVoiceStates) {
          var all = VS.getAllVoiceStates();
          for (var gid in all) {
            var guild = all[gid];
            if (!guild) continue;
            if (JSON.stringify(guild).indexOf(String(userId)) >= 0) return true;
          }
        }
      }

      if (storage.markActivities && PS && PS.getActivities) {
        var acts = PS.getActivities(userId);
        if (acts && acts.length) return true;
      }

      if (storage.markClients && PS) {
        var st = PS.getState ? PS.getState() : null;
        var entry = st && st.clientStatuses && st.clientStatuses[userId];
        if (entry) {
          for (var k in entry) {
            if (entry[k] && entry[k] !== "offline" && entry[k] !== "invisible") return true;
          }
        }
      }
    } catch (e) {}
    return false;
  }

  function install() {
    while (unpatches.length) try { unpatches.pop()(); } catch (e) {}
    ensure();
    try {
      var PS = findByStoreName("PresenceStore") || findByProps("getStatus");
      if (PS && PS.getStatus) {
        unpatches.push(after("getStatus", PS, function (args, res) {
          if (!storage.enabled) return res;
          var id = args && args[0];
          if (id == null) return res;
          if ((res === "offline" || res === "invisible" || !res) && isGhostOffline(id)) return "online";
          return res;
        }));
      }
    } catch (e) {}
    try {
      var MLS = findByProps("isMobileOnline", "isOnline");
      if (MLS && MLS.isOnline) {
        unpatches.push(after("isOnline", MLS, function (args, res) {
          if (!storage.enabled || res) return res;
          var id = args && args[0] && (args[0].id != null ? args[0].id : args[0]);
          if (id != null && isGhostOffline(id)) return true;
          return res;
        }));
      }
    } catch (e) {}
  }

  function Settings() {
    ensure();
    useProxy(storage);
    var bump = React.useReducer(function (x) { return x + 1; }, 0)[1];
    function flip(k) { storage[k] = !storage[k]; bump(); install(); }
    function sw(key, label, sub) {
      if (FormRow && FormSwitch)
        return React.createElement(FormRow, { key: key, label: label, subLabel: sub,
          trailing: React.createElement(FormSwitch, { value: !!storage[key], onValueChange: function () { flip(key); } }) });
      return React.createElement(View, { key: key, style: { padding: 16 } },
        React.createElement(Text, { style: { color: "#fff" } }, label),
        React.createElement(Switch, { value: !!storage[key], onValueChange: function () { flip(key); } })
      );
    }
    return React.createElement(ScrollView, { style: { flex: 1 } },
      React.createElement(Text, { style: { margin: 16, color: "#fff", fontSize: 16, fontWeight: "700" } }, "True Presence"),
      React.createElement(Text, { style: { marginHorizontal: 16, marginBottom: 8, color: "#aaa", fontSize: 13 } },
        "Locally reveal users who look offline/invisible but are in voice, have activities, or an active client session."),
      sw("enabled", "Enabled", "Master toggle"),
      sw("markVoice", "Detect in voice", "Connected to a voice channel"),
      sw("markActivities", "Detect activities", "Spotify / games while offline"),
      sw("markClients", "Detect client sessions", "desktop/mobile/web status fields")
    );
  }

  var plugin = {
    onLoad: function () { ensure(); install(); try { logger.log("[TruePresence] loaded"); } catch (e) {} },
    onUnload: function () { while (unpatches.length) try { unpatches.pop()(); } catch (e) {} },
    settings: Settings
  };
  exports.default = plugin;
  try { Object.defineProperty(exports, "__esModule", { value: true }); } catch (e) {}
  return exports;
})({});
