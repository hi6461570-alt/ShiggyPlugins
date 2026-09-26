(function (exports) {
  "use strict";
  var storage = vendetta.plugin.storage;
  var after = vendetta.patcher.after;
  var findByProps = vendetta.metro.findByProps;
  var findByStoreName = vendetta.metro.findByStoreName;
  var React = vendetta.metro.common.React;
  var RN = vendetta.metro.common.ReactNative;
  var useProxy = vendetta.storage.useProxy;
  var Forms = (vendetta.ui.components && vendetta.ui.components.Forms) || {};
  var logger = vendetta.logger || console;
  var ScrollView = RN.ScrollView;
  var Text = RN.Text;
  var View = RN.View;
  var Switch = RN.Switch;
  var FormRow = Forms.FormRow;
  var FormSwitch = Forms.FormSwitch;
  var unpatches = [];

  function ensure() {
    if (storage.enabled == null) storage.enabled = true;
    if (storage.markVoice == null) storage.markVoice = true;
    if (storage.markActivities == null) storage.markActivities = true;
    if (storage.markClients == null) storage.markClients = true;
  }

  function safeFind(fn) { try { return fn(); } catch (e) { return null; } }

  function isGhostOffline(userId) {
    try {
      var id = String(userId);
      var PS = safeFind(function () { return findByStoreName("PresenceStore"); })
        || safeFind(function () { return findByProps("getStatus", "getState"); })
        || safeFind(function () { return findByProps("getStatus"); });

      var status = PS && PS.getStatus ? PS.getStatus(id) : null;
      var looksOffline = !status || status === "offline" || status === "invisible";
      if (!looksOffline) return false;

      if (storage.markVoice) {
        var VS = safeFind(function () { return findByStoreName("VoiceStateStore"); })
          || safeFind(function () { return findByProps("getAllVoiceStates"); })
          || safeFind(function () { return findByProps("getVoiceStateForChannel"); });
        if (VS) {
          if (VS.getAllVoiceStates) {
            try {
              var all = VS.getAllVoiceStates();
              if (all && JSON.stringify(all).indexOf(id) >= 0) return true;
            } catch (e) {}
          }
          if (VS.getUserIds) {
            try {
              var ids = VS.getUserIds();
              if (ids && (ids.indexOf(id) >= 0 || ids[id])) return true;
            } catch (e) {}
          }
        }
      }

      if (storage.markActivities && PS) {
        try {
          var acts = PS.getActivities ? PS.getActivities(id) : null;
          if (acts && acts.length) return true;
          if (PS.getActivity && PS.getActivity(id)) return true;
        } catch (e) {}
      }

      if (storage.markClients && PS) {
        try {
          var st = PS.getState ? PS.getState() : null;
          var cs = (st && (st.clientStatuses || st.statuses)) || (PS.clientStatuses) || null;
          var entry = cs && (cs[id] || cs[userId]);
          if (entry) {
            if (typeof entry === "string" && entry !== "offline" && entry !== "invisible") return true;
            for (var k in entry) {
              var v = entry[k];
              if (v && v !== "offline" && v !== "invisible") return true;
            }
          }
          if (PS.getClientStatus) {
            var c = PS.getClientStatus(id);
            if (c) {
              for (var k2 in c) {
                if (c[k2] && c[k2] !== "offline" && c[k2] !== "invisible") return true;
              }
            }
          }
        } catch (e) {}
      }
    } catch (e) {}
    return false;
  }

  function install() {
    while (unpatches.length) try { unpatches.pop()(); } catch (e) {}
    ensure();

    try {
      var PS = safeFind(function () { return findByStoreName("PresenceStore"); })
        || safeFind(function () { return findByProps("getStatus"); });
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
      var onlineUtils = safeFind(function () { return findByProps("isMobileOnline", "isOnline"); })
        || safeFind(function () { return findByProps("isOnline"); });
      if (onlineUtils && onlineUtils.isOnline) {
        unpatches.push(after("isOnline", onlineUtils, function (args, res) {
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
        return React.createElement(FormRow, {
          key: key, label: label, subLabel: sub,
          trailing: React.createElement(FormSwitch, { value: !!storage[key], onValueChange: function () { flip(key); } })
        });
      return React.createElement(View, { key: key, style: { padding: 16 } },
        React.createElement(Text, { style: { color: "#fff" } }, label),
        React.createElement(Switch, { value: !!storage[key], onValueChange: function () { flip(key); } })
      );
    }
    return React.createElement(ScrollView, { style: { flex: 1 } },
      React.createElement(Text, { style: { margin: 16, color: "#fff", fontSize: 18, fontWeight: "700" } }, "True Presence"),
      React.createElement(Text, { style: { marginHorizontal: 16, marginBottom: 8, color: "#aaa", fontSize: 13 } },
        "Locally show users who look offline/invisible but are in voice, have activities, or active clients."),
      sw("enabled", "Enabled", null),
      sw("markVoice", "Detect voice", "In a voice channel"),
      sw("markActivities", "Detect activities", "Games / Spotify etc."),
      sw("markClients", "Detect clients", "desktop / mobile / web session")
    );
  }

  var plugin = {
    onLoad: function () {
      ensure();
      install();
      try { logger.log("[TruePresence] v1.2.0 loaded"); } catch (e) {}
    },
    onUnload: function () {
      while (unpatches.length) try { unpatches.pop()(); } catch (e) {}
    },
    settings: Settings
  };
  exports.default = plugin;
  try { Object.defineProperty(exports, "__esModule", { value: true }); } catch (e) {}
  return exports;
})({});
