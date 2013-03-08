// ==UserScript==
// @name           4chan X Name Sync
// @version        4.0.0
// @namespace      milky
// @description    Shares names with other posters on 4chan's forced anon boards. Requires 4chan X v3.
// @author         milkytiptoe
// @author         ihavenoface
// @run-at         document-idle
// @include        *://boards.4chan.org/b/*
// @include        *://boards.4chan.org/q/*
// @include        *://boards.4chan.org/soc/*
// @updateURL      https://github.com/milkytiptoe/Name-Sync/raw/master/NameSync.user.js
// @downloadURL    https://github.com/milkytiptoe/Name-Sync/raw/master/NameSync.user.js
// @homepage       http://milkytiptoe.github.com/Name-Sync/
// @icon           data:image/gif;base64,R0lGODlhIAAgAMQQABAQEM/Pz9/f3zAwMH9/f+/v7yAgIGBgYJ+fn6+vr4+Pj1BQUHBwcL+/v0BAQAAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABAALAAAAAAgACAAAAXNICSOZGmeaKqubOu6QvC+DSDPopAQfFOMjYdthhg8jsiHowEJKmGOpPToUFBbAcB0i3SwBNqkYUE4GLbeVRRpQJQaxmQ6lUgOfqKDYx/vqpEAeCJZXHMnAkkEJoRThiYISYIkAg2Vlg03OJqbnC8MDgcEbikBew5hQpkjBUkMKk5TQyQESaomsLECQHYruA8DTCUIqA/BKb4PBgpMAghrSAcsyFxIAy1OBsRcB5LHVAIH1AYJLwJGaQIEDmdKB+Q4BQMLnSkF7/T4+fr4IQA7
// ==/UserScript==

// Contributers: https://github.com/milkytiptoe/Name-Sync/graphs/contributors

(function() {
  var $, $$, CSS, Main, Menus, Names, Set, Settings, Sync, Updater, d, g;

  Set = {};

  d = document;

  g = {
    NAMESPACE: "NameSync.",
    VERSION: "4.0.0",
    threads: [],
    board: null
  };

  $$ = function(selector, root) {
    if (root == null) {
      root = d.body;
    }
    return root.querySelectorAll(selector);
  };

  $ = function(selector, root) {
    if (root == null) {
      root = d.body;
    }
    return root.querySelector(selector);
  };

  $.extend = function(object, properties) {
    var key, val;
    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
  };

  $.extend($, {
    event: function(type, detail) {
      return d.dispatchEvent(new CustomEvent(type, {
        detail: detail
      }));
    }
  });

  CSS = {
    init: function() {
      var css;
      css = ".section-name-sync input[type='text'] {\n  border: 1px solid #CCC;\n  width: 148px;\n  padding: 2px;\n}\n.section-name-sync input[type='button'] {\n  width: 130px;\n  height: 26px;\n}\n.section-name-sync ul {\n  list-style: none;\n  margin: 0;\n  padding: 8px;\n}\n.section-name-sync label {\n  text-decoration: underline;\n}\n.section-name-sync {\n  background: url(//www.milkyis.me/namesync/bg.png) no-repeat #F0E0D6 bottom right;\n}";
      if (Set["Hide IDs"]) {
        return css += ".posteruid {\n  display: none;\n}";
      }
    }
  };

  Main = {
    init: function() {
      var path, thread, _i, _len, _ref;
      path = location.pathname.slice(1).split("/");
      if (path[1] === "catalog") {
        return;
      }
      g.board = path[0];
      _ref = $$(".thread");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        thread = _ref[_i];
        g.threads.push(thread.id.slice(1));
      }
      Settings.init();
      Settings.init();
      Names.init();
      CSS.init();
      Menus.init();
      if (Set["Sync on /" + g.board + "/"]) {
        Sync.init();
      }
      if (Set["Automatic Updates"]) {
        return Updater.init();
      }
    }
  };

  Menus = {
    init: function() {}
  };

  Names = {
    init: function() {}
  };

  Settings = {
    main: {
      "Sync on /b/": ["Enable sync on /b/", true],
      "Sync on /q/": ["Enable sync on /q/", true],
      "Sync on /soc/": ["Enable sync on /soc/", true],
      "Hide IDs": ["Hide Unique IDs next to names", false],
      "Automatic Updates": ["Check for updates automatically", true],
      "Persona Fields": ["Share persona fields instead of the 4chan X quick reply fields", false]
    },
    init: function() {
      var setting, stored, val, _ref;
      _ref = Settings.main;
      for (setting in _ref) {
        val = _ref[setting];
        Set[setting] = (stored = Settings.get(val) === null) ? val[1] : stored === "true";
      }
      return $.event("AddSettingsSection", {
        title: "Name Sync",
        open: Settings.open
      });
    },
    open: function(section, g) {},
    get: function(name) {
      return localStorage.getItem("" + g.NAMESPACE + name);
    },
    set: function(name, value) {
      return localStorage.setItem("" + g.NAMESPACE + name, value);
    }
  };

  Sync = {
    init: function() {}
  };

  Updater = {
    init: function() {
      var last;
      if (last = Settings.get("lastcheck") === null || Date.now() > last + 86400000) {
        return this.update();
      }
    },
    update: function() {}
  };

  Main.init();

}).call(this);
