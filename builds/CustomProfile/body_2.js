                if (row.message.nick != null) row.message.nick = storage.globalName;
              } else if (storage.username) row.message.username = storage.username;
            }
            args[1] = JSON.stringify(rows);
          } catch (e) {}
        }));
      }
    } catch (e) {}

    try {
      var CAS = safeFind(function () { return findByProps("getAccounts", "getLocalAccounts"); })
        || safeFind(function () { return findByProps("getAccounts"); });
      if (CAS && CAS.getAccounts) {
        unpatches.push(after("getAccounts", CAS, function (_, res) {
          if (!storage.enabled) return res;
          var tid = targetId();
          if (!tid || !cachedSelfId || tid !== cachedSelfId) return res;
          var fake = formatConnections();
          if (!fake.length && !storage.hideRealConnections) return res;
          var base = storage.hideRealConnections ? [] : (Array.isArray(res) ? res.slice() : []);
          return base.concat(fake);
        }));
      }
    } catch (e) {}
  }

  function Settings() {
    ensureDefaults();
    useProxy(storage);
    var bump = React.useReducer(function (x) { return x + 1; }, 0)[1];
    function setAndBump(fn) { fn(); bump(); try { forceRerender(); } catch (e) {} }

    function sectionTitle(t) {
      return React.createElement(Text, {
        key: "sec-" + t,
        style: { marginTop: 20, marginBottom: 8, marginHorizontal: 16, color: "#fff", fontSize: 14, fontWeight: "700", opacity: 0.9 }
      }, t);
    }
    function field(key, label, placeholder) {
      var val = storage[key] != null ? String(storage[key]) : "";
      function onChange(t) { setAndBump(function () { storage[key] = t; }); }
      if (FormInput) {
        return React.createElement(FormInput, {
          key: key, title: label, value: val, placeholder: placeholder || "",
          onChange: onChange, onChangeText: onChange
        });
      }
      return React.createElement(View, { key: key, style: { paddingHorizontal: 16, paddingVertical: 8 } },
        React.createElement(Text, { style: { color: "#aaa", fontSize: 13, marginBottom: 4 } }, label),
        React.createElement(TextInput, {
          value: val, placeholder: placeholder || "", placeholderTextColor: "#666",
          onChangeText: onChange,
          style: { color: "#fff", backgroundColor: "rgba(255,255,255,0.06)", padding: 12, borderRadius: 8 }
        })
      );
    }
    function switchRow(key, label, subLabel) {
      var val = !!storage[key];
      function flip() { setAndBump(function () { storage[key] = !storage[key]; }); }
      if (FormRow && FormSwitch) {
        return React.createElement(FormRow, {
          key: key, label: label, subLabel: subLabel,
          trailing: React.createElement(FormSwitch, { value: val, onValueChange: flip }), onPress: flip
        });
      }
      return React.createElement(View, {
        key: key, style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }
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
      var leading = Image ? React.createElement(Image, {
        source: { uri: "https://cdn.discordapp.com/badge-icons/" + badge.icon + ".png" },
        style: { width: 22, height: 22 }
      }) : null;
      if (FormRow && FormSwitch) {
        return React.createElement(FormRow, {
          key: "badge-" + badge.key, label: badge.label, leading: leading,
          trailing: React.createElement(FormSwitch, { value: on, onValueChange: flip }), onPress: flip
        });
      }
      return React.createElement(TouchableOpacity, {
        key: "badge-" + badge.key, onPress: flip,
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
          key: label, label: label, subLabel: valueLabel, onPress: onPress
        });
      }
      return React.createElement(TouchableOpacity, {
        key: label, onPress: onPress,
        style: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }
      },
        React.createElement(Text, { style: { color: "#fff", fontSize: 16 } }, label),
        React.createElement(Text, { style: { color: "#aaa", fontSize: 13, marginTop: 2 } }, valueLabel)
      );
    }
    function action(label, onPress) {
      return React.createElement(TouchableOpacity, {
        key: label, onPress: onPress,
        style: { marginHorizontal: 16, marginVertical: 6, padding: 14, borderRadius: 8, backgroundColor: "rgba(88,101,242,0.35)", alignItems: "center" }
      }, React.createElement(Text, { style: { color: "#fff", fontWeight: "600" } }, label));
    }

    var children = [];
    children.push(React.createElement(Text, {
      key: "title", style: { margin: 16, color: "#fff", fontSize: 20, fontWeight: "700" }
    }, "Custom Profile"));
    children.push(switchRow("enabled", "Enable larp", "Apply overrides to your profile"));
    children.push(sectionTitle("Identity"));
    children.push(field("username", "Username", "optional"));
    children.push(field("globalName", "Display name", "optional"));
    children.push(field("bio", "Bio", "optional"));
    children.push(field("pronouns", "Pronouns", "optional"));
    children.push(field("avatar", "Avatar (hash or https URL)", "optional"));
    children.push(field("banner", "Banner (hash or https URL)", "optional"));
    children.push(field("accentColor", "Accent color (int)", "optional"));
    children.push(field("targetId", "Target user ID (blank = you)", "optional"));

    children.push(sectionTitle("Connections"));
    children.push(switchRow("hideRealConnections", "Hide real connections", "Only show larp connections"));
    var conns = getConnections();
    for (var ci = 0; ci < conns.length; ci++) {
      (function (idx) {
        var c = conns[idx];
        children.push(React.createElement(View, {
          key: "conn-" + idx,
          style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 }
        },
          React.createElement(Text, { style: { color: "#fff", flex: 1 } }, c.type + ": " + c.name),
          React.createElement(TouchableOpacity, {
            onPress: function () {
              setAndBump(function () {
                var list = Array.isArray(storage.connections) ? storage.connections.slice() : [];
                list.splice(idx, 1);
                storage.connections = list;
              });
            }
          }, React.createElement(Text, { style: { color: "#f66" } }, "Remove"))
        ));
      })(ci);
    }
    var draftType = CONNECTION_TYPES[Number(storage.draftConnType) || 0] || CONNECTION_TYPES[0];
    children.push(cycleRow("Type: " + draftType.label, "Tap to cycle", function () {
      setAndBump(function () {
        var cur = Number(storage.draftConnType) || 0;
        storage.draftConnType = (cur + 1) % CONNECTION_TYPES.length;
      });
    }));
    children.push(field("draftConnName", "Connection name", draftType.placeholder));
    children.push(action("Add connection", function () {
      setAndBump(function () {
        var name = String(storage.draftConnName || "").trim();
        if (!name) return;
        var list = Array.isArray(storage.connections) ? storage.connections.slice() : [];
        list.push({ type: draftType.id, name: name, verified: true });
        storage.connections = list;
        storage.draftConnName = "";
      });
    }));

    children.push(sectionTitle("Nitro"));
    children.push(switchRow("nitro", "Show Nitro", null));
    var nl = Number(storage.nitroLevel);
    if (isNaN(nl) || nl < 0) nl = 0;
    if (nl >= NITRO_LEVELS.length) nl = NITRO_LEVELS.length - 1;
    children.push(cycleRow("Nitro tier: " + NITRO_LEVELS[nl].label, "Tap to cycle", function () {
      setAndBump(function () {
        var cur = Number(storage.nitroLevel);
        if (isNaN(cur) || cur < 0) cur = 0;
        storage.nitroLevel = (cur + 1) % NITRO_LEVELS.length;
        storage.premiumSince = "";
        storage.nitro = true;
      });
    }));
    children.push(field("premiumSince", "Premium since override (optional)", "YYYY-MM-DD"));

    children.push(sectionTitle("Boost badge"));
    var bl = Number(storage.boostLevel);
    var boostLabel = (isNaN(bl) || bl < 0) ? "None" : (BOOST_LEVELS[bl] ? BOOST_LEVELS[bl].label : "None");
    children.push(cycleRow("Boost: " + boostLabel, "Tap to cycle", function () {
      setAndBump(function () {
        var cur = Number(storage.boostLevel);
        if (isNaN(cur)) cur = -1;
        if (cur >= BOOST_LEVELS.length - 1) storage.boostLevel = -1;
        else storage.boostLevel = cur + 1;
      });
    }));

    children.push(sectionTitle("Classic badges"));
    children.push(switchRow("hideRealBadges", "Hide real badges", "Replace with selected only"));
    for (var bi = 0; bi < BADGES.length; bi++) children.push(badgeToggle(BADGES[bi]));

    children.push(sectionTitle("Actions"));
    children.push(action("Apply / Refresh", function () { installPatches(); forceRerender(); bump(); }));
    children.push(action("Reset all", function () {
      setAndBump(function () {
        var keys = Object.keys(storage);
        for (var j = 0; j < keys.length; j++) { try { delete storage[keys[j]]; } catch (e) {} }
        ensureDefaults();
        storage.enabled = false;
        installPatches();
      });
    }));

    children.push(React.createElement(Text, {
      key: "foot", style: { margin: 16, opacity: 0.5, fontSize: 12, textAlign: "center", color: "#888" }
    }, "CustomProfile v2.6.1"));

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
      try { logger.log("[CustomProfile] v2.6.1 loaded"); } catch (e) {}
    },
    onUnload: function () {
      uninstallPatches();
      try { logger.log("[CustomProfile] unloaded"); } catch (e) {}
    },
    settings: Settings
  };

  exports.default = plugin;
  try { Object.defineProperty(exports, "__esModule", { value: true }); } catch (e) {}
  return exports;
})({});
