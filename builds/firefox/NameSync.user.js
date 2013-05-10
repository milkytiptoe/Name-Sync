// ==UserScript==
// @name         4chan X Name Sync
// @version      4.1.4
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
// @icon         http://www.namesync.org/namesync/logo.png
// ==/UserScript==

/*
  4chan X Name Sync v4.1.4
  http://www.namesync.org/
  
  Developers: milkytiptoe and ihavenoface
  
  Contributers: https://github.com/milkytiptoe/Name-Sync/graphs/contributors
  
  This script contains code from 4chan X (https://github.com/MayhemYDG/4chan-x)
  @license: https://github.com/MayhemYDG/4chan-x/blob/v3/LICENSE
*/

(function() {
  var $, $$, CSS, Filter, Main, Menus, Names, Set, Settings, Sync, Updater, d, g;

  Set = {};

  d = document;

  g = {
    NAMESPACE: 'NameSync.',
    VERSION: '4.1.4',
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
    url = "http://www.namesync.org/namesync/" + file + ".php";
    if (type === 'GET') {
      url += "?" + data;
    }
    r.open(type, url, true);
    r.setRequestHeader('X-Requested-With', 'NameSync3');
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

  $.get = function(name) {
    return localStorage.getItem("" + g.NAMESPACE + name);
  };

  $.set = function(name, value) {
    return localStorage.setItem("" + g.NAMESPACE + name, value);
  };

  CSS = {
    init: function() {
      var css;

      css = ".section-name-sync input[type='text'] {\n  border: 1px solid #CCC;\n  width: 148px;\n  padding: 2px;\n}\n.section-name-sync input[type='button'] {\n  width: 130px;\n  height: 26px;\n}\n.section-name-sync ul {\n  list-style: none;\n  margin: 0;\n  padding: 8px;\n}\n.section-name-sync label {\n  text-decoration: underline;\n}\n#bgimage {\n  bottom: 0px;\n  right: 0px;\n  position: absolute;\n}";
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
    names: null,
    tripcodes: null,
    emails: null,
    subjects: null,
    init: function() {
      this.names = $.get('FilterNames');
      this.tripcodes = $.get('FilterTripcodes');
      this.emails = $.get('FilterEmails');
      return this.subjects = $.get('FilterSubjects');
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
    init: function() {
      this.load();
      $.event('AddCallback', {
        detail: {
          type: 'Post',
          callback: {
            name: '4chan X Name Sync',
            cb: Names.cb
          }
        }
      });
      return this.updateAllPosts();
    },
    cb: function() {
      return Names.updatePost(this.nodes.post);
    },
    change: function(id) {
      var name;

      name = prompt('What would you like this poster to be named?', 'Anonymous');
      if (name && name.trim() !== '') {
        this.nameByID[id] = {
          n: name,
          t: ''
        };
        this.blockedIDs[id] = true;
        return this.updateAllPosts();
      }
    },
    reset: function(id) {
      this.nameByID[id] = {
        n: 'Anonymous',
        t: ''
      };
      this.blockedIDs[id] = false;
      return this.updateAllPosts();
    },
    load: function() {
      var stored;

      stored = sessionStorage["" + g.board + "-4-names"];
      this.nameByID = stored ? JSON.parse(stored) : {};
      stored = sessionStorage["" + g.board + "-blocked"];
      return this.blockedIDs = stored ? JSON.parse(stored) : {};
    },
    store: function() {
      sessionStorage["" + g.board + "-4-names"] = JSON.stringify(this.nameByID);
      return sessionStorage["" + g.board + "-blocked"] = JSON.stringify(this.blockedIDs);
    },
    updateAllPosts: function() {
      var post, _i, _len, _ref;

      _ref = $$('.thread .post');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        post = _ref[_i];
        this.updatePost(post);
      }
      return this.store();
    },
    updatePost: function(post) {
      var email, emailspan, id, idspan, linfo, name, nameblockspan, namespan, oinfo, postnum, postnumspan, subject, subjectspan, tripcode, tripspan;

      idspan = $('.hand', post);
      if (idspan === null) {
        return;
      }
      id = idspan.textContent;
      if (/^##/.test(id)) {
        return;
      }
      postnumspan = $('a[title="Quote this post"]', post);
      namespan = $('.desktop .name', post);
      tripspan = $('.desktop .postertrip', post);
      subjectspan = $('.desktop .subject', post);
      postnum = postnumspan.textContent;
      oinfo = Names.nameByPost[postnum];
      linfo = Names.nameByID[id];
      if (oinfo && !Names.blockedIDs[id]) {
        name = oinfo.n;
        tripcode = oinfo.t;
        if (!/Heaven/.test(id)) {
          Names.nameByID[id] = {
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
      if (namespan.textContent !== name) {
        namespan.textContent = name;
      }
      if (subject && subject !== '' && subjectspan.textContent !== subject) {
        subjectspan.textContent = subject;
      }
      if (email && email !== '') {
        emailspan = $('.desktop .useremail', post);
        if (emailspan === null) {
          nameblockspan = $('.desktop .nameBlock', post);
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
      }
      if (tripcode && tripcode !== '') {
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
        $.rm(tripspan);
      }
      if (Set['Filter']) {
        if (Filter.names && RegExp(Filter.names).test(name)) {
          return $.addClass(post.parentNode, 'sync-filtered');
        }
        if (Filter.tripcodes && tripcode && RegExp(Filter.tripcodes).test(tripcode)) {
          return $.addClass(post.parentNode, 'sync-filtered');
        }
        if (oinfo) {
          if (Filter.subjects && subject && RegExp(Filter.subjects).test(subject)) {
            return $.addClass(post.parentNode, 'sync-filtered');
          }
          if (Filter.emails && email && RegExp(Filter.emails).test(email)) {
            return $.addClass(post.parentNode, 'sync-filtered');
          }
        }
      }
    }
  };

  Settings = {
    main: {
      'Sync on /b/': ['Enable sync on /b/.', true],
      'Sync on /q/': ['Enable sync on /q/.', true],
      'Sync on /soc/': ['Enable sync on /soc/.', true],
      'Read-only Mode': ['Hide your fields.', false],
      'Hide IDs': ['Hide Unique IDs next to names.', false],
      'Hide Sage': ['Hide your fields when sage is in the email fied.', false],
      'Do Not Track': ['Opt out of name tracking by third party websites.', false],
      'Persona Fields': ['Share persona fields instead of the 4chan X quick reply fields.', false],
      'Filter': ['Hide posts by sync users that match filter regular expressions.', false],
      'Automatic Updates': ['Check for updates automatically.', true]
    },
    init: function() {
      var setting, stored, val, _ref;

      _ref = Settings.main;
      for (setting in _ref) {
        val = _ref[setting];
        stored = $.get(setting);
        Set[setting] = stored === null ? val[1] : stored === 'true';
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

      section.innerHTML = "<fieldset>\n  <legend>Persona</legend>\n  <div>\n    <input type=text name=Name placeholder=Name>\n    <input type=text name=Email placeholder=Email>\n    <input type=text name=Subject placeholder=Subject>\n  </div>\n</fieldset>\n<fieldset>\n  <legend>Filter</legend>\n  <div>Example: ^(?!Anonymous$) to filter all named posters.</div>\n  <br />\n  <input type=text name=FilterNames placeholder=Names>\n  <input type=text name=FilterTripcodes placeholder=Tripcodes>\n  <input type=text name=FilterEmails placeholder=Emails>\n  <input type=text name=FilterSubjects placeholder=Subjects>\n</fieldset>\n<fieldset>\n  <legend>Advanced</legend>\n  <input id=syncUpdate type=button value='Check for update'>\n  <input id=syncClear type=button value='Clear sync history' title='Clear your stored sync history from the server'>\n  <div>Sync Delay: <input type=number name=Delay min=0 step=100 placeholder=300 title='Delay before downloading new names when a new post is inserted'> ms</div>\n</fieldset>\n<fieldset>\n  <legend>About</legend>\n  <div>4chan X Name Sync v" + g.VERSION + "</div>\n  <div><a href='http://milkytiptoe.github.io/Name-Sync/' target='_blank'>Visit web page</a></div>\n  <div><a href='https://github.com/milkytiptoe/Name-Sync/issues/new' target='_blank'>Report an issue</a></div>\n  <div><a href='https://raw.github.com/milkytiptoe/Name-Sync/master/changelog' target='_blank'>View changelog</a></div>\n</fieldset>\n<img id=bgimage src='http://www.namesync.org/namesync/bg.png' />";
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
      _ref = Settings.main;
      for (setting in _ref) {
        val = _ref[setting];
        stored = $.get(setting);
        istrue = stored === null ? val[1] : stored === 'true';
        checked = istrue ? 'checked ' : '';
        $.add(field, $.el('div', {
          innerHTML: "<label><input type='checkbox' name='" + setting + "' " + checked + "/>" + setting + "</label><span class='description'>: " + val[0] + "</span>"
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
      return $.on($('#syncClear', section), 'click', Sync.clear);
    }
  };

  Sync = {
    lastModified: '0',
    disabled: false,
    delay: null,
    init: function() {
      if (!(g.threads.length > 1)) {
        $.on(d, 'ThreadUpdate', this.checkThreadUpdate);
      }
      if (!Set['Read-only Mode']) {
        $.on(d, 'QRPostSuccessful', Sync.requestSend);
      }
      if (g.threads.length === 1) {
        return setTimeout(Sync.sync, 30000, true);
      } else {
        return this.sync();
      }
    },
    checkThreadUpdate: function(e) {
      if (e.detail[404]) {
        return Sync.disabled = true;
      }
      if (Set["Sync on /" + g.board + "/"]) {
        return Sync.requestSync();
      }
    },
    requestSync: function() {
      clearTimeout(Sync.delay);
      return Sync.delay = setTimeout(Sync.sync, $.get('Delay') || 300);
    },
    sync: function(repeat) {
      $.ajax('qp', 'GET', "t=" + g.threads + "&b=" + g.board, {
        onloadend: function() {
          var poster, _i, _len, _ref;

          if (this.status === 200) {
            Sync.lastModified = this.getResponseHeader('Last-Modified') || Sync.lastModified;
            _ref = JSON.parse(this.response);
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              poster = _ref[_i];
              Names.nameByPost[poster.p] = poster;
            }
            return Names.updateAllPosts();
          }
        }
      });
      if (repeat && !Sync.disabled) {
        return setTimeout(Sync.sync, 30000, true);
      }
    },
    requestSend: function(e) {
      var cEmail, cName, cSubject, postID, qr, threadID;

      postID = e.detail.postID;
      threadID = e.detail.threadID;
      if (Set['Persona Fields']) {
        cName = $.get('Name') || '';
        cEmail = $.get('Email') || '';
        cSubject = $.get('Subject') || '';
      } else {
        qr = $.id('qr');
        cName = $('input[data-name=name]', qr).value;
        cEmail = $('input[data-name=email]', qr).value;
        cSubject = $('input[data-name=sub]', qr).value;
      }
      cName = cName.trim();
      cEmail = cEmail.trim();
      cSubject = cSubject.trim();
      if (!(cName === '' && cEmail === '' && cSubject === '' || Set['Hide Sage'] && /sage/i.test(cEmail))) {
        return Sync.send(cName, cEmail, cSubject, postID, threadID);
      }
    },
    send: function(cName, cEmail, cSubject, postID, threadID) {
      return $.ajax('sp', 'POST', "p=" + postID + "&t=" + threadID + "&b=" + g.board + "&n=" + (encodeURIComponent(cName)) + "&s=" + (encodeURIComponent(cSubject)) + "&e=" + (encodeURIComponent(cEmail)) + "&dnt=" + (Set['Do Not Track'] ? '1' : '0'), {
        onerror: function() {
          return setTimeout(Sync.send, 2000, cName, cEmail, cSubject, postID, threadID, isLateOpSend);
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
      $('#syncUpdate').disabled = true;
      return $.ajax('u3', 'GET', '', {
        onloadend: function() {
          $.set('lastcheck', Date.now());
          if (this.status !== 200 || this.response === g.VERSION.replace(/\./g, '')) {
            return $('#syncUpdate').value = 'None available';
          }
          $.event('CreateNotification', {
            detail: {
              type: 'info',
              content: $.el('span', {
                innerHTML: "An update for 4chan X Name Sync is available. <a href=https://github.com/milkytiptoe/Name-Sync/raw/master/builds/firefox/NameSync.user.js target=_blank>Install now</a>. "
              }),
              lifetime: 10
            }
          });
          return $('#fourchanx-settings .close').click();
        }
      });
    }
  };

  $.on(d, '4chanXInitFinished', Main.init);

}).call(this);
