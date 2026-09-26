(function (exports) {
  "use strict";
  var storage = vendetta.plugin.storage;
  var before = vendetta.patcher.before;
  var findByProps = vendetta.metro.findByProps;
  var findByStoreName = vendetta.metro.findByStoreName;
  var React = vendetta.metro.common.React;
  var RN = vendetta.metro.common.ReactNative;
  var useProxy = vendetta.storage.useProxy;
  var Forms = (vendetta.ui.components && vendetta.ui.components.Forms) || {};
  var logger = vendetta.logger || console;
  var ScrollView = RN.ScrollView, Text = RN.Text, View = RN.View, Switch = RN.Switch;
  var FormRow = Forms.FormRow, FormSwitch = Forms.FormSwitch;
  var unpatches = [];

  var FLAG_BADGES = [
    {f:1<<0,i:"5e74e9b61934fc1f67c65515d1f7e60d"},{f:1<<1,i:"3f9748e53446a137a052f3454e2de41e"},
    {f:1<<2,i:"bf01d1073931f921909045f3a39fd264"},{f:1<<3,i:"2717692c7dca7289b35297368a940dd0"},
    {f:1<<6,i:"8a88d63823d8a71cd5e390baa45efa02"},{f:1<<7,i:"011940fd013da3f7fb926e4a1cd2e618"},
    {f:1<<8,i:"3aa41de486fa12454c3761e8e223442e"},{f:1<<9,i:"7060786766c9c840eb3019e725d2b358"},
    {f:1<<14,i:"848f79194d4be5ff5f81505cbd0ce1e6"},{f:1<<17,i:"6df5892e0f35b051f8b61eace34f4967"},
    {f:1<<18,i:"fee1624003e2fee35cb398e125dc479b"},{f:1<<22,i:"6bdc42827a38498929a4920da12695d9"}
  ];
  var NITRO = "2ba85e8026a8614b640c2837bcdfe21b";
  var BOOST = {1:"51040c70d4f20a921ad6674ff86fc95c",2:"0e4080d1d333bc7ad29ef6528b6f2fb7",3:"72bed924410c304dbe3d00a6e593ff59",6:"df199d2050d3ed4ebf84d64ae83989f8",9:"996b3e870e8a22ce519b3a50e6bdd52f",12:"991c9f39ee33d7537d9f408c3e53141e",15:"cb3ae83c15e970e8f3d410bc62cb8b99",18:"7142225d31238f6387d9f09efaa02759",24:"ec92202290b48d0879b7413d2dde3bab"};

  function ensure() {
    if (storage.enabled == null) storage.enabled = true;
    if (storage.showNitro == null) storage.showNitro = true;
    if (storage.showBoost == null) storage.showBoost = true;
    if (storage.showProfileBadges == null) storage.showProfileBadges = true;
    if (storage.emojiMarks == null) storage.emojiMarks = true;
    if (storage.maxBadges == null) storage.maxBadges = 8;
  }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function getUser(id) {
    var s = safe(function(){return findByStoreName("UserStore");}) || safe(function(){return findByProps("getUser","getCurrentUser");});
    return s && s.getUser ? s.getUser(id) : null;
  }
  function getProfile(id) {
    var s = safe(function(){return findByStoreName("UserProfileStore");}) || safe(function(){return findByProps("getUserProfile");});
    return s && s.getUserProfile ? s.getUserProfile(id) : null;
  }
  function collect(user, profile) {
    var out = [], seen = {};
    function push(icon, id) { if (!icon || seen[icon]) return; seen[icon]=1; out.push({icon:icon,id:id||icon}); }
    if (storage.showProfileBadges && profile && Array.isArray(profile.badges)) {
      for (var i=0;i<profile.badges.length;i++) {
        var b = profile.badges[i]; if (b && (b.icon||b.id)) push(b.icon||b.id, b.id);
      }
    }
    if (user) {
      var flags = (user.publicFlags != null ? user.publicFlags : user.flags) || 0;
      for (var j=0;j<FLAG_BADGES.length;j++) if (flags & FLAG_BADGES[j].f) push(FLAG_BADGES[j].i);
    }
    if (storage.showNitro && user && (user.premiumType || user.premium_type || (profile && (profile.premiumType||profile.premium_type))))
      push(NITRO, "premium");
    if (storage.showBoost && user) {
      var since = user.premiumGuildSince || user.premium_guild_since || (profile && (profile.premiumGuildSince||profile.premium_guild_since));
      if (since) {
        try {
          var months = Math.max(1, Math.floor((Date.now()-new Date(since).getTime())/(30.44*24*3600*1000)));
          var best=1, keys=Object.keys(BOOST).map(Number).sort(function(a,b){return a-b;});
          for (var k=0;k<keys.length;k++) if (months>=keys[k]) best=keys[k];
          push(BOOST[best], "guild_booster");
        } catch(e) { push(BOOST[1], "guild_booster"); }
      }
    }
    var max = Number(storage.maxBadges)||8;
    return out.length > max ? out.slice(0,max) : out;
  }
  function emoji(b) {
    var id = String(b && b.id || "");
    if (id.indexOf("staff")>=0) return "S";
    if (id.indexOf("partner")>=0) return "P";
    if (id.indexOf("hypesquad")>=0) return "H";
    if (id.indexOf("bug")>=0) return "B";
    if (id.indexOf("early")>=0) return "E";
    if (id.indexOf("mod")>=0) return "M";
    if (id.indexOf("dev")>=0) return "D";
    if (id.indexOf("premium")>=0||id.indexOf("nitro")>=0) return "N";
    if (id.indexOf("boost")>=0) return "+";
    return "*";
  }
  function install() {
    while (unpatches.length) try { unpatches.pop()(); } catch(e){}
    ensure();
    try {
      var DCD = RN.NativeModules && RN.NativeModules.DCDChatManager;
      if (DCD && DCD.updateRows) {
        unpatches.push(before("updateRows", DCD, function(args){
          if (!storage.enabled) return;
          try {
            var rows = typeof args[1]==="string" ? JSON.parse(args[1]) : args[1];
            if (!Array.isArray(rows)) return;
            for (var i=0;i<rows.length;i++) {
              var row = rows[i];
              if (!row || !row.message) continue;
              var uid = row.message.authorId || row.message.userId || (row.message.author&&row.message.author.id);
              if (!uid) continue;
              var badges = collect(getUser(uid), getProfile(uid));
              if (!badges.length) continue;
              row.message.badges = badges.map(function(b){ return {icon:b.icon, description:"badge", id:b.id}; });
              if (storage.emojiMarks && !row.message._sbic) {
                row.message._sbic = true;
                var marks = badges.map(emoji).join("");
                if (row.message.username) row.message.username = row.message.username + " " + marks;
                if (row.message.authorName) row.message.authorName = row.message.authorName + " " + marks;
              }
            }
            args[1] = typeof args[1]==="string" ? JSON.stringify(rows) : rows;
          } catch(e){}
        }));
      }
    } catch(e){}
  }
  function Settings() {
    ensure(); useProxy(storage);
    var bump = React.useReducer(function(x){return x+1;},0)[1];
    function flip(k){ storage[k]=!storage[k]; bump(); install(); }
    function sw(key,label,sub){
      if (FormRow && FormSwitch)
        return React.createElement(FormRow,{key:key,label:label,subLabel:sub,
          trailing:React.createElement(FormSwitch,{value:!!storage[key],onValueChange:function(){flip(key);}})});
      return React.createElement(View,{key:key,style:{flexDirection:"row",justifyContent:"space-between",padding:16}},
        React.createElement(Text,{style:{color:"#fff"}},label),
        React.createElement(Switch,{value:!!storage[key],onValueChange:function(){flip(key);}}));
    }
    return React.createElement(ScrollView,{style:{flex:1}},
      React.createElement(Text,{style:{margin:16,color:"#fff",fontSize:16,fontWeight:"700"}},"Show Badges In Chat"),
      sw("enabled","Enabled"),
      sw("showNitro","Show Nitro"),
      sw("showBoost","Show Boost"),
      sw("showProfileBadges","Show profile.badges","Quest/custom/tenure"),
      sw("emojiMarks","Marks on names","Most reliable on mobile — reopen channel"),
      React.createElement(Text,{style:{margin:16,color:"#888",fontSize:12}},
        "Classic + Nitro + boost + profile.badges in chat. Reopen channel after enabling.")
    );
  }
  exports.default = {
    onLoad: function(){ ensure(); install(); try{logger.log("[ShowBadgesInChat] v1.2.0 loaded");}catch(e){} },
    onUnload: function(){ while(unpatches.length) try{unpatches.pop()();}catch(e){} },
    settings: Settings
  };
  try { Object.defineProperty(exports,"__esModule",{value:true}); } catch(e){}
  return exports;
})({});
