(function (exports) {
  "use strict";
  var base = "https://raw.githubusercontent.com/hi6461570-alt/ShiggyPlugins/main/builds/CustomProfile/";
  function get(path) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", base + path + "?_=" + Date.now(), false);
    xhr.send(null);
    if (xhr.status < 200 || xhr.status >= 300) throw new Error("CustomProfile fetch failed: " + path + " " + xhr.status);
    return xhr.responseText;
  }
  var src = get("body_0.js") + get("body_1.js") + get("body_2.js");
  var result = eval(src);
  var plugin = (result && result.default) ? result.default : result;
  exports.default = plugin;
  try { Object.defineProperty(exports, "__esModule", { value: true }); } catch (e) {}
  return exports;
})({});
