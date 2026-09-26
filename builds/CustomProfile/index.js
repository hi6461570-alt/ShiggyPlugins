(function (exports) {
  "use strict";
  var urls = [
    "https://cdn.jsdelivr.net/gh/hi6461570-alt/ShiggyPlugins@2759dd99a0c97f9de9aa44c37555775d0e74b637/builds/CustomProfile/index.js",
    "https://raw.githubusercontent.com/hi6461570-alt/ShiggyPlugins/2759dd99a0c97f9de9aa44c37555775d0e74b637/builds/CustomProfile/index.js",
    "https://cdn.jsdelivr.net/gh/hi6461570-alt/ShiggyPlugins@c84356a1a8ccba317453ba6d6308f74ae9175166/builds/CustomProfile/index.js"
  ];
  var src = null, lastErr = null;
  for (var i = 0; i < urls.length; i++) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", urls[i] + (urls[i].indexOf("?") >= 0 ? "&" : "?") + "_=" + Date.now(), false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText && xhr.responseText.indexOf("CustomProfile") >= 0) {
        src = xhr.responseText;
        break;
      }
      lastErr = "status " + xhr.status;
    } catch (e) { lastErr = String(e); }
  }
  if (!src) throw new Error("CustomProfile load failed: " + lastErr);
  var result = eval(src);
  var plugin = (result && result.default) ? result.default : result;
  exports.default = plugin;
  try { Object.defineProperty(exports, "__esModule", { value: true }); } catch (e) {}
  return exports;
})({});
