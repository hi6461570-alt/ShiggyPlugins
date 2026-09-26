(function (exports) {
  "use strict";
  var url = "https://raw.githubusercontent.com/hi6461570-alt/ShiggyPlugins/main/builds/CustomProfile/body.js";
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url + "?_=" + Date.now(), false);
  xhr.send(null);
  if (xhr.status < 200 || xhr.status >= 300) throw new Error("CustomProfile body fetch failed: " + xhr.status);
  var src = xhr.responseText;
  var result = eval(src);
  var plugin = (result && result.default) ? result.default : result;
  exports.default = plugin;
  try { Object.defineProperty(exports, "__esModule", { value: true }); } catch (e) {}
  return exports;
})({});
