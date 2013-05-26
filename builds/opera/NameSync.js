// ==UserScript==
// @name         4chan X Name Sync
// @version      4.4.0
// @namespace    milky
// @description  Enables names on 4chan's forced anon boards. Requires 4chan X.
// @author       milkytiptoe
// @author       ihavenoface
// @include      *://boards.4chan.org/b/*
// @include      *://boards.4chan.org/q/*
// @include      *://boards.4chan.org/soc/*
// @run-at       document-start
// @updateURL    https://github.com/milkytiptoe/Name-Sync/raw/master/builds/firefox/NameSync.meta.js
// @downloadURL  https://github.com/milkytiptoe/Name-Sync/raw/master/builds/firefox/NameSync.user.js
// @icon         https://www.namesync.org/namesync/logo.png
// ==/UserScript==

/*
  4chan X Name Sync v4.4.0
  https://www.namesync.org/
  
  Developers: milkytiptoe and ihavenoface
  
  Contributers: https://github.com/milkytiptoe/Name-Sync/graphs/contributors
  
  This script contains code from 4chan X (https://github.com/MayhemYDG/4chan-x)
  @license: https://github.com/MayhemYDG/4chan-x/blob/v3/LICENSE
*/

(function() {
  var $, $$, CSS, Config, Filter, Main, Menus, Names, Set, Settings, Sync, Updater, d, g;

  Set = {};

  d = document;

  g = {
    NAMESPACE: 'NameSync.',
    VERSION: '4.4.0',
    threads: []
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

  $.el = function(tag, properties) {
    var el;

    el = d.createElement(tag);
    if (properties) {
      $.extend(el, properties);
    }
    return el;
  };

  $.tn = function(text) {
    return d.createTextNode(text);
  };

  $.id = function(id) {
    return d.getElementById(id);
  };

  $.event = function(type, detail) {
    if (detail == null) {
      detail = {};
    }
    return d.dispatchEvent(new CustomEvent(type, detail));
  };

  $.on = function(el, type, handler) {
    return el.addEventListener(type, handler, false);
  };

  $.off = function(el, type, handler) {
    return el.removeEventListener(type, handler, false);
  };

  $.addClass = function(el, className) {
    return el.classList.add(className);
  };

  $.add = function(parent, children) {
    return parent.appendChild($.nodes(children));
  };

  $.rm = function(el) {
    return el.parentNode.removeChild(el);
  };

  $.prepend = function(parent, children) {
    return parent.insertBefore($.nodes(children), parent.firstChild);
  };

  $.after = function(root, el) {
    return root.parentNode.insertBefore($.nodes(el), root.nextSibling);
  };

  $.before = function(root, el) {
    return root.parentNode.insertBefore($.nodes(el), root);
  };

  $.nodes = function(nodes) {
    var frag, node, _i, _len;

    if (!(nodes instanceof Array)) {
      return nodes;
    }
    frag = d.createDocumentFragment();
    for (_i = 0, _len = nodes.length; _i < _len; _i++) {
      node = nodes[_i];
      frag.appendChild(node);
    }
    return frag;
  };

  $.ajax = function(file, type, data, callbacks) {
    var r, url;

    r = new XMLHttpRequest();
    if (file === 'qp') {
      r.overrideMimeType('application/json');
    }
    url = "https://www.namesync.org/namesync/" + file + ".php";
    if (type === 'GET') {
      url += "?" + data;
    }
    r.open(type, url, true);
    r.setRequestHeader('X-Requested-With', 'NameSync4.4.0');
    if (file === 'qp') {
      r.setRequestHeader('If-Modified-Since', Sync.lastModified);
    }
    if (type === 'POST') {
      r.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    }
    $.extend(r, callbacks);
    r.withCredentials = true;
    r.send(data);
    return r;
  };

  $.extend = function(object, properties) {
    var key, val;

    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
  };

  $.syncing = {};

  $.sync = (function() {
    $.on(window, 'storage', function(e) {
      var cb;

      if (cb = $.syncing[e.key]) {
        return cb(e.newValue);
      }
    });
    return function(key, cb) {
      return $.syncing[g.NAMESPACE + key] = cb;
    };
  })();

  $.ready = function(fc) {
    var cb, _ref;

    if ((_ref = d.readyState) === 'interactive' || _ref === 'complete') {
      fc();
      return;
    }
    cb = function() {
      $.off(d, 'DOMContentLoaded', cb);
      return fc();
    };
    return $.on(d, 'DOMContentLoaded', cb);
  };

  $.get = function(name) {
    return localStorage.getItem("" + g.NAMESPACE + name);
  };

  $.set = function(name, value) {
    return localStorage.setItem("" + g.NAMESPACE + name, value);
  };

  Config = {
    main: {
      'Sync on /b/': [true, 'Enable sync on /b/.'],
      'Sync on /q/': [true, 'Enable sync on /q/.'],
      'Sync on /soc/': [true, 'Enable sync on /soc/.'],
      'Read-only Mode': [false, 'Share none of your fields.'],
      'Hide Sage': [false, 'Share none of your fields when sage is in the email field.'],
      'Hide IDs': [false, 'Hide Unique IDs next to names.'],
      'Do Not Track': [false, 'Opt out of name tracking by third party websites.'],
      'Automatic Updates': [true, 'Check for updates automatically.']
    },
    other: {
      'Persona Fields': [false],
      'Filter': [false]
    }
  };

  CSS = {
    init: function() {
      var css;

      css = ".section-name-sync input[type='text'] {\n  border: 1px solid #CCC;\n  width: 148px;\n  padding: 2px;\n}\n.section-name-sync input[type='button'] {\n  padding: 3px;\n  margin-bottom: 6px;\n}\n.section-name-sync p {\n  margin: 0 0 8px 0;\n}\n.section-name-sync ul {\n  list-style: none;\n  margin: 0;\n  padding: 8px;\n}\n.section-name-sync div label {\n  text-decoration: underline;\n}\n#bgimage {\n  bottom: 0px;\n  right: 0px;\n  position: absolute;\n}\n#menu a[data-type=name] {\n  display: none;\n}";
      if (Set['Hide IDs']) {
        css += ".posteruid {\n  display: none;\n}";
      }
      if (Set['Filter']) {
        css += ".sync-filtered {\n  display: none !important;\n}";
      }
      return $.add(d.body, $.el('style', {
        textContent: css
      }));
    }
  };

  Filter = {
    init: function() {
      this.names = $.get('FilterNames');
      this.tripcodes = $.get('FilterTripcodes');
      this.emails = $.get('FilterEmails');
      return this.subjects = $.get('FilterSubjects');
    },
    filter: function(id) {
      var name, stored;

      stored = Names.nameByID[id];
      name = stored ? Names.nameByID[id].n.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&') : 'Anonymous';
      stored = $.get('FilterNames');
      $.set('FilterNames', stored ? "" + stored + "|" + name : name);
      $.event('OpenSettings', {
        detail: 'Name Sync'
      });
      return $('input[name=FilterNames]').focus();
    }
  };

  Main = {
    init: function() {
      var path, thread, _i, _len, _ref;

      $.off(d, '4chanXInitFinished', Main.init);
      path = location.pathname.slice(1).split('/');
      if (path[1] === 'catalog') {
        return;
      }
      g.board = path[0];
      _ref = $$('.thread');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        thread = _ref[_i];
        g.threads.push(thread.id.slice(1));
      }
      Settings.init();
      if (Set['Filter']) {
        Filter.init();
      }
      Names.init();
      CSS.init();
      Menus.init();
      if (Set["Sync on /" + g.board + "/"]) {
        Sync.init();
      }
      if (Set['Automatic Updates']) {
        return Updater.init();
      }
    },
    ready: function() {
      return $.event('AddCallback', {
        detail: {
          type: 'Post',
          callback: {
            name: '4chan X Name Sync',
            cb: function() {
              if (!g.board || g.board === this.board.ID) {
                return Names.threads = this.board.threads;
              }
            }
          }
        }
      });
    }
  };

  Menus = {
    uid: null,
    init: function() {
      var subEntries;

      $.event('AddMenuEntry', {
        detail: {
          type: 'header',
          el: this.makeSubEntry('4chan X Name Sync Settings', function() {
            return $.event('OpenSettings', {
              detail: 'Name Sync'
            });
          }),
          order: 112
        }
      });
      subEntries = [];
      subEntries.push({
        el: this.makeSubEntry('Change', function() {
          Names.change(Menus.uid);
          return $.event('CloseMenu');
        })
      });
      subEntries.push({
        el: this.makeSubEntry('Filter', function() {
          Filter.filter(Menus.uid);
          return $.event('CloseMenu');
        }),
        open: function() {
          var stored;

          return !(stored = Names.nameByID[Menus.uid]) || stored.n;
        }
      });
      subEntries.push({
        el: this.makeSubEntry('Reset', function() {
          Names.reset(Menus.uid);
          return $.event('CloseMenu');
        }),
        open: function() {
          return Names.blockedIDs[Menus.uid] === true;
        }
      });
      return $.event('AddMenuEntry', {
        detail: {
          type: 'post',
          el: $.el('div', {
            href: 'javascript:;',
            textContent: 'Name'
          }),
          open: function(post) {
            Menus.uid = post.info.uniqueID;
            return !/Heaven/.test(Menus.uid);
          },
          subEntries: subEntries
        }
      });
    },
    makeSubEntry: function(text, click) {
      var a;

      a = $.el('a', {
        href: 'javascript:;',
        textContent: text
      });
      $.on(a, 'click', click);
      return a;
    }
  };

  Names = {
    nameByPost: {},
    threads: {},
    init: function() {
      var expiry;

      $.sync("" + g.board + "-blocked", this.loadBlocked);
      $.sync("" + g.board + "-cached", this.loadCached);
      expiry = $.get("" + g.board + "-expires");
      if (!expiry || Date.now() > expiry) {
        this.clear();
      } else {
        this.loadBlocked();
        this.loadCached();
      }
      $.event('AddCallback', {
        detail: {
          type: 'Post',
          callback: {
            name: '4chan X Name Sync',
            cb: function() {
              if (g.board === this.board.ID) {
                return Names.updatePost.call(this);
              }
            }
          }
        }
      });
      return this.updateAllPosts();
    },
    change: function(id) {
      var name;

      name = prompt('What would you like this poster to be named?', 'Anonymous');
      if (name && name.trim() !== '') {
        this.nameByID[id] = {
          n: name
        };
        this.blockedIDs[id] = true;
        return this.updateAllPosts();
      }
    },
    reset: function(id) {
      this.nameByID[id] = {
        n: 'Anonymous'
      };
      this.blockedIDs[id] = false;
      return this.updateAllPosts();
    },
    clear: function() {
      var el;

      Names.nameByID = {};
      Names.blockedIDs = {};
      Names.store();
      el = $('#namesClear');
      if (el) {
        el.value = 'Cleared';
        el.disabled = true;
      }
      return $.set("" + g.board + "-expires", Date.now() + 86400000);
    },
    loadBlocked: function(synced) {
      var stored;

      stored = synced || $.get("" + g.board + "-blocked");
      return Names.blockedIDs = stored ? JSON.parse(stored) : {};
    },
    loadCached: function(synced) {
      var stored;

      stored = synced || $.get("" + g.board + "-cached");
      return Names.nameByID = stored ? JSON.parse(stored) : {};
    },
    store: function() {
      $.set("" + g.board + "-cached", JSON.stringify(this.nameByID));
      return $.set("" + g.board + "-blocked", JSON.stringify(this.blockedIDs));
    },
    updateAllPosts: function() {
      var clone, post, thread;

      for (thread in this.threads) {
        for (post in this.threads[thread].posts) {
          Names.updatePost.call(this.threads[thread].posts[post]);
          for (clone in this.threads[thread].posts[post].clones) {
            Names.updatePost.call(this.threads[thread].posts[post].clones[clone]);
          }
        }
      }
      return Names.store();
    },
    updatePost: function() {
      var email, emailspan, linfo, name, namespan, oinfo, subject, subjectspan, tripcode, tripspan;

      if (this.info.capcode) {
        return;
      }
      oinfo = Names.nameByPost[this.ID];
      linfo = Names.nameByID[this.info.uniqueID];
      if (oinfo && !Names.blockedIDs[this.info.uniqueID]) {
        name = oinfo.n;
        tripcode = oinfo.t;
        if (!/Heaven/.test(this.info.uniqueID)) {
          Names.nameByID[this.info.uniqueID] = {
            n: name,
            t: tripcode
          };
        }
        email = oinfo.e;
        subject = oinfo.s;
      } else if (linfo) {
        name = linfo.n;
        tripcode = linfo.t;
      } else {
        return;
      }
      namespan = this.nodes.name;
      subjectspan = this.nodes.subject;
      tripspan = $('.postertrip', this.nodes.info);
      emailspan = $('.useremail', this.nodes.info);
      if (namespan.textContent !== name) {
        namespan.textContent = name;
      }
      if (subject) {
        if (subjectspan.textContent !== subject) {
          subjectspan.textContent = subject;
        }
      } else {
        if (subjectspan.textContent !== '') {
          subjectspan.textContent = '';
        }
      }
      if (email) {
        if (emailspan === null) {
          emailspan = $.el('a', {
            className: 'useremail'
          });
          $.before(namespan, emailspan);
        }
        $.add(emailspan, namespan);
        if (tripspan != null) {
          $.after(namespan, $.tn(' '));
          $.add(emailspan, tripspan);
        }
        emailspan.href = "mailto:" + email;
      } else if (emailspan) {
        $.before(emailspan, namespan);
        $.rm(emailspan);
      }
      if (tripcode) {
        if (tripspan === null) {
          tripspan = $.el('span', {
            className: 'postertrip'
          });
          $.after(namespan, [$.tn(' '), tripspan]);
        }
        if (tripspan.textContent !== tripcode) {
          tripspan.textContent = tripcode;
        }
      } else if (tripspan) {
        $.rm(tripspan.previousSibling);
        $.rm(tripspan);
      }
      if (Set['Filter'] && Filter.names && RegExp(Filter.names).test(name) || Filter.tripcodes && tripcode && RegExp(Filter.tripcodes).test(tripcode) || Filter.subjects && subject && RegExp(Filter.subjects).test(subject) || Filter.emails && email && RegExp(Filter.emails).test(email)) {
        return $.addClass(this.nodes.post.parentNode, 'sync-filtered');
      }
    }
  };

  Settings = {
    init: function() {
      var section, setting, stored, val, _i, _len, _ref, _ref1;

      _ref = Object.keys(Config);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        section = _ref[_i];
        _ref1 = Config[section];
        for (setting in _ref1) {
          val = _ref1[setting];
          stored = $.get(setting);
          Set[setting] = stored === null ? val[0] : stored === 'true';
        }
      }
      return $.event('AddSettingsSection', {
        detail: {
          title: 'Name Sync',
          open: Settings.open
        }
      });
    },
    open: function(section) {
      var bgimage, check, checked, field, istrue, setting, stored, text, val, _i, _j, _len, _len1, _ref, _ref1, _ref2;

      section.innerHTML = "<fieldset>\n  <legend>\n    <label><input type='checkbox' name='Persona Fields' " + ($.get('Persona Fields') === 'true' ? 'checked' : '') + "> Persona</label>\n  </legend>\n  <p>Share these fields instead of the 4chan X quick reply fields</p>\n  <div>\n    <input type=text name=Name placeholder=Name>\n    <input type=text name=Email placeholder=Email>\n    <input type=text name=Subject placeholder=Subject>\n  </div>\n</fieldset>\n<fieldset>\n  <legend>\n    <label><input type='checkbox' name='Filter' " + ($.get('Filter') === 'true' ? 'checked' : '') + "> Filter</label>\n  </legend>\n  <p><code>^(?!Anonymous$)</code> to filter all names <code>!tripcode|!tripcode</code> to filter multiple tripcodes</p>\n  <div>\n    <input type=text name=FilterNames placeholder=Names>\n    <input type=text name=FilterTripcodes placeholder=Tripcodes>\n    <input type=text name=FilterEmails placeholder=Emails>\n    <input type=text name=FilterSubjects placeholder=Subjects>\n  </div>\n</fieldset>\n<fieldset>\n  <legend>Advanced</legend>\n  <div>\n    \n    <input id=syncUpdate type=button value='Check for update'>\n    \n    <input id=syncClear type=button value='Clear sync history' title='Clear your stored sync history from the server'>\n    <input id=namesClear type=button value='Clear name cache' title='Clear locally stored names'>\n  </div>\n  <div>Sync Delay: <input type=number name=Delay min=0 step=100 placeholder=300 title='Delay before downloading new names when a new post is inserted'> ms</div>\n</fieldset>\n<fieldset>\n  <legend>About</legend>\n  <div>4chan X Name Sync v" + g.VERSION + "</div>\n  <div><a href='http://milkytiptoe.github.io/Name-Sync/' target='_blank'>Web page</a></div>\n  <div><a href='https://github.com/milkytiptoe/Name-Sync/issues/new' target='_blank'>Report an issue</a></div>\n  <div><a href='https://raw.github.com/milkytiptoe/Name-Sync/master/changelog' target='_blank'>Changelog</a></div>\n</fieldset>\n<img id=bgimage src='https://www.namesync.org/namesync/bg.png' />";
      bgimage = $('#bgimage', section);
      bgimage.ondragstart = function() {
        return false;
      };
      bgimage.oncontextmenu = function() {
        return false;
      };
      field = $.el('fieldset');
      $.add(field, $.el('legend', {
        textContent: 'Main'
      }));
      _ref = Config.main;
      for (setting in _ref) {
        val = _ref[setting];
        stored = $.get(setting);
        istrue = stored === null ? val[0] : stored === 'true';
        checked = istrue ? 'checked' : '';
        $.add(field, $.el('div', {
          innerHTML: "<label><input type='checkbox' name='" + setting + "' " + checked + ">" + setting + "</label><span class='description'>: " + val[1] + "</span>"
        }));
      }
      $.prepend(section, field);
      _ref1 = $$('input[type=checkbox]', section);
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        check = _ref1[_i];
        $.on(check, 'click', function() {
          return $.set(this.name, this.checked);
        });
      }
      _ref2 = $$('input[type=text], input[type=number]', section);
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        text = _ref2[_j];
        text.value = $.get(text.name) || '';
        $.on(text, 'input', function() {
          var err, regexp;

          if (/^Filter/.test(this.name)) {
            try {
              regexp = RegExp(this.value);
            } catch (_error) {
              err = _error;
              alert(err.message);
              return this.value = $.get(this.name);
            }
          }
          return $.set(this.name, this.value);
        });
      }
      $.on($('#syncUpdate', section), 'click', Updater.update);
      $.on($('#syncClear', section), 'click', Sync.clear);
      return $.on($('#namesClear', section), 'click', Names.clear);
    }
  };

  Sync = {
    lastModified: '0',
    disabled: false,
    delay: null,
    init: function() {
      if (!Set['Read-only Mode']) {
        $.on(d, 'QRPostSuccessful', Sync.requestSend);
      }
      if (g.threads.length === 1) {
        $.on(d, 'ThreadUpdate', this.checkThreadUpdate);
        return this.sync(true);
      } else {
        return this.sync();
      }
    },
    checkThreadUpdate: function(e) {
      if (!e.detail.newPosts.length) {
        return;
      }
      if (e.detail[404]) {
        return Sync.disabled = true;
      }
      clearTimeout(Sync.delay);
      return Sync.delay = setTimeout(Sync.sync, $.get('Delay') || 300);
    },
    sync: function(repeat) {
      $.ajax('qp', 'GET', "t=" + g.threads + "&b=" + g.board, {
        onloadend: function() {
          var poster, _i, _len, _ref;

          if (!(this.status === 200 && this.response)) {
            return;
          }
          Sync.lastModified = this.getResponseHeader('Last-Modified') || Sync.lastModified;
          _ref = JSON.parse(this.response);
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            poster = _ref[_i];
            Names.nameByPost[poster.p] = poster;
          }
          return Names.updateAllPosts();
        }
      });
      if (repeat && !Sync.disabled) {
        return setTimeout(Sync.sync, 30000, true);
      }
    },
    requestSend: function(e) {
      var currentEmail, currentName, currentSubject, postID, qr, threadID;

      postID = e.detail.postID;
      threadID = e.detail.threadID;
      if (Set['Persona Fields']) {
        currentName = $.get('Name') || '';
        currentEmail = $.get('Email') || '';
        currentSubject = $.get('Subject') || '';
      } else {
        qr = $.id('qr');
        currentName = $('input[data-name=name]', qr).value;
        currentEmail = $('input[data-name=email]', qr).value;
        currentSubject = $('input[data-name=sub]', qr).value;
      }
      currentName = currentName.trim();
      currentEmail = currentEmail.trim();
      currentSubject = currentSubject.trim();
      if (!$.get("" + g.board + "-" + threadID + "-last-name") && currentName + currentEmail + currentSubject === '' || Set['Hide Sage'] && /sage/i.test(currentEmail)) {
        return;
      }
      $.set("" + g.board + "-" + threadID + "-last-name", currentName);
      return Sync.send(currentName, currentEmail, currentSubject, postID, threadID);
    },
    send: function(name, email, subject, postID, threadID) {
      return $.ajax('sp', 'POST', "p=" + postID + "&t=" + threadID + "&b=" + g.board + "&n=" + (encodeURIComponent(name)) + "&s=" + (encodeURIComponent(subject)) + "&e=" + (encodeURIComponent(email)) + "&dnt=" + (Set['Do Not Track'] ? '1' : '0'), {
        onerror: function() {
          return setTimeout(Sync.send, 2000, name, email, subject, postID, threadID);
        }
      });
    },
    clear: function() {
      $('#syncClear').disabled = true;
      return $.ajax('rm', 'POST', '', {
        onerror: function() {
          return $('#syncClear').value = 'Error';
        },
        onloadend: function() {
          if (this.status !== 200) {
            return;
          }
          return $('#syncClear').value = 'Cleared';
        }
      });
    }
  };

  Updater = {
    init: function() {
      var last;

      last = $.get('lastcheck');
      if (last === null || Date.now() > last + 86400000) {
        return this.update();
      }
    },
    update: function() {
      var el;

      el = $('#syncUpdate');
      if (el) {
        el.disabled = true;
      }
      return $.ajax('u3', 'GET', '', {
        onloadend: function() {
          $.set('lastcheck', Date.now());
          if (this.status !== 200 || this.response === g.VERSION) {
            if (el) {
              el.value = 'None available';
            }
            return;
          }
          $.event('CreateNotification', {
            detail: {
              type: 'info',
              content: $.el('span', {
                innerHTML: "An update for 4chan X Name Sync is available. <a href=https://www.namesync.org/ target=_blank>Get it here</a>."
              }),
              lifetime: 10
            }
          });
          el = $('#fourchanx-settings .close');
          if (el) {
            return el.click();
          }
        }
      });
    }
  };

  $.ready(Main.ready);

  $.on(d, '4chanXInitFinished', Main.init);

}).call(this);
