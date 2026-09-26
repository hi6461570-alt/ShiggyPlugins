(function (exports) {
  "use strict";
  var url = "https://raw.githubusercontent.com/hi6461570-alt/ShiggyPlugins/c84356a1a8ccba317453ba6d6308f74ae9175166/builds/CustomProfile/index.js";
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url + "?_=" + Date.now(), false);
  xhr.send(null);
  if (xhr.status < 200 || xhr.status >= 300) throw new Error("CustomProfile fetch failed: " + xhr.status);
  var src = xhr.responseText;
  var result = eval(src);
  var plugin = (result && result.default) ? result.default : result;
  exports.default = plugin;
  try { Object.defineProperty(exports, "__esModule", { value: true }); } catch (e) {}
  return exports;
})({});
