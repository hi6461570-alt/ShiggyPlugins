(function (exports) {
  "use strict";
  var storage = vendetta.plugin.storage;
  var React = vendetta.metro.common.React;
  var ReactNative = vendetta.metro.common.ReactNative;
  var useProxy = vendetta.storage.useProxy;
  var Forms = (vendetta.ui.components && vendetta.ui.components.Forms) || {};
  var logger = vendetta.logger || console;
  var ScrollView = ReactNative.ScrollView;
  var Text = ReactNative.Text;
  var TextInput = ReactNative.TextInput;
  var FormInput = Forms.FormInput;
  var unreg = [];

  function ensure() {
    if (storage.sxcu == null) storage.sxcu = "";
    if (storage.lastUrl == null) storage.lastUrl = "";
    if (storage.lastError == null) storage.lastError = "";
  }

  function parseSxcu(raw) {
    var o = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!o || !o.RequestURL) throw new Error("Invalid .sxcu: missing RequestURL");
    return o;
  }

  function jsonPath(obj, path) {
    if (!path) return null;
    var p = String(path);
    if (p.charAt(0) === "$") p = p.slice(1);
    if (p.charAt(0) === ".") p = p.slice(1);
    var parts = p.replace(/\[(\d+)\]/g, ".$1").split(".");
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (!parts[i]) continue;
      if (cur == null) return null;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function extractUrl(sxcu, responseText) {
    var tpl = sxcu.URL || sxcu.ThumbnailURL || "";
    var m = /\{json:([^}]+)\}/.exec(tpl) || /\$json:([^$]+)\$/.exec(tpl);
    try {
      var j = JSON.parse(responseText);
      if (m) {
        var v = jsonPath(j, m[1]);
        if (v) return String(v);
      }
      if (j.url) return j.url;
      if (j.link) return j.link;
      if (j.data && j.data.link) return j.data.link;
      if (j.data && j.data.url) return j.data.url;
      if (j.files && j.files[0] && j.files[0].url) return j.files[0].url;
      if (j.message && String(j.message).indexOf("http") === 0) return j.message;
    } catch (e) {}
    var t = String(responseText || "").trim();
    if (t.indexOf("http") === 0) return t.split(" ")[0].split("\n")[0];
    throw new Error("Could not parse upload URL from response");
  }

  async function fetchAsBlob(url) {
    var res = await fetch(url);
    if (!res.ok) throw new Error("Failed to download source: " + res.status);
    var blob = await res.blob();
    var name = "upload.png";
    try {
      var path = url.split("?")[0];
      var base = path.split("/").pop() || name;
      if (base.indexOf(".") > 0) name = base;
    } catch (e) {}
    return { blob: blob, name: name };
  }

  async function uploadUrl(sourceUrl) {
    ensure();
    if (!storage.sxcu || !String(storage.sxcu).trim())
      throw new Error("No .sxcu configured. Use /sharex-config");
    var sxcu = parseSxcu(storage.sxcu);
    var file = await fetchAsBlob(sourceUrl);
    var method = (sxcu.RequestMethod || "POST").toUpperCase();
    var headers = Object.assign({}, sxcu.Headers || {});
    var form = new FormData();
    var args = sxcu.Arguments || {};
    for (var k in args)
      if (Object.prototype.hasOwnProperty.call(args, k)) form.append(k, args[k]);
    form.append(sxcu.FileFormName || "file", file.blob, file.name);
    var url = sxcu.RequestURL;
    if (sxcu.Parameters) {
      var qs = [];
      for (var p in sxcu.Parameters)
        if (Object.prototype.hasOwnProperty.call(sxcu.Parameters, p))
          qs.push(encodeURIComponent(p) + "=" + encodeURIComponent(sxcu.Parameters[p]));
      if (qs.length) url += (url.indexOf("?") >= 0 ? "&" : "?") + qs.join("&");
    }
    delete headers["Content-Type"];
    delete headers["content-type"];
    var res = await fetch(url, { method: method, headers: headers, body: form });
    var text = await res.text();
    if (!res.ok) throw new Error("Upload failed " + res.status + ": " + text.slice(0, 200));
    var out = extractUrl(sxcu, text);
    storage.lastUrl = out;
    storage.lastError = "";
    return out;
  }

  function getOpt(args, name) {
    if (!args) return null;
    for (var i = 0; i < args.length; i++) {
      if (args[i] && args[i].name === name) return args[i].value;
    }
    return null;
  }

  function regCmd() {
    var reg = vendetta.commands && vendetta.commands.registerCommand;
    if (!reg) {
      try { logger.log("[ShareX] commands API missing"); } catch (e) {}
      return;
    }

    unreg.push(
      reg({
        name: "sharex-config",
        description: "Save ShareX .sxcu uploader config",
        options: [
          { name: "sxcu", description: "Full .sxcu JSON string", type: 3, required: true }
        ],
        execute: function (args) {
          return (async function () {
            try {
              ensure();
              var raw = getOpt(args, "sxcu") || "";
              parseSxcu(raw);
              storage.sxcu = raw;
              var name = "uploader";
              try { name = JSON.parse(raw).Name || name; } catch (e) {}
              return { content: "ShareX config saved: **" + name + "**" };
            } catch (e) {
              storage.lastError = String(e && e.message || e);
              return { content: "ShareX error: " + storage.lastError };
            }
          })();
        }
      })
    );

    unreg.push(
      reg({
        name: "sharex-upload",
        description: "Rehost an image/file URL via configured ShareX uploader",
        options: [
          { name: "url", description: "Image or file URL to rehost", type: 3, required: true }
        ],
        execute: function (args) {
          return (async function () {
            try {
              ensure();
              var u = getOpt(args, "url");
              if (!u) return { content: "Missing url" };
              var out = await uploadUrl(String(u).trim());
              return { content: out };
            } catch (e) {
              storage.lastError = String(e && e.message || e);
              return { content: "ShareX error: " + storage.lastError };
            }
          })();
        }
      })
    );

    unreg.push(
      reg({
        name: "sharex-status",
        description: "Show active ShareX uploader status",
        options: [],
        execute: function () {
          return (async function () {
            try {
              ensure();
              if (!storage.sxcu) return { content: "No .sxcu configured. Use /sharex-config" };
              var n = "uploader";
              try { n = JSON.parse(storage.sxcu).Name || n; } catch (e) {}
              return {
                content:
                  "Active: **" + n + "**" +
                  (storage.lastUrl ? "\nLast: " + storage.lastUrl : "") +
                  (storage.lastError ? "\nLast error: " + storage.lastError : "")
              };
            } catch (e) {
              return { content: "ShareX error: " + String(e && e.message || e) };
            }
          })();
        }
      })
    );
  }

  function Settings() {
    ensure();
    useProxy(storage);
    var bump = React.useReducer(function (x) { return x + 1; }, 0)[1];
    var children = [];
    children.push(React.createElement(Text, { key: "t", style: { margin: 16, color: "#fff", fontSize: 16, fontWeight: "700" } }, "ShareX"));
    children.push(React.createElement(Text, { key: "h", style: { marginHorizontal: 16, marginBottom: 8, color: "#aaa", fontSize: 13 } },
      "Paste .sxcu JSON below or use /sharex-config. Upload with /sharex-upload <url>."));
    if (FormInput) {
      children.push(React.createElement(FormInput, {
        key: "sxcu", title: ".sxcu JSON", value: storage.sxcu || "",
        onChange: function (t) { storage.sxcu = t; bump(); },
        onChangeText: function (t) { storage.sxcu = t; bump(); }
      }));
    } else {
      children.push(React.createElement(TextInput, {
        key: "sxcu", value: storage.sxcu || "", multiline: true,
        onChangeText: function (t) { storage.sxcu = t; bump(); },
        style: { margin: 16, minHeight: 120, color: "#fff", backgroundColor: "rgba(255,255,255,0.06)", padding: 12, borderRadius: 8 }
      }));
    }
    children.push(React.createElement(Text, { key: "last", style: { margin: 16, color: "#888", fontSize: 12 } },
      "Last URL: " + (storage.lastUrl || "—") + "\nLast error: " + (storage.lastError || "—")));
    children.push(React.createElement(Text, { key: "cmds", style: { margin: 16, color: "#666", fontSize: 12 } },
      "Commands: /sharex-config · /sharex-upload · /sharex-status"));
    return React.createElement(ScrollView, { style: { flex: 1 } }, children);
  }

  var plugin = {
    onLoad: function () {
      ensure();
      regCmd();
      try { logger.log("[ShareX] v1.2.0 loaded"); } catch (e) {}
    },
    onUnload: function () {
      while (unreg.length) try { unreg.pop()(); } catch (e) {}
    },
    settings: Settings
  };
  exports.default = plugin;
  try { Object.defineProperty(exports, "__esModule", { value: true }); } catch (e) {}
  return exports;
})({});
