# This script contains code from 4chan X (https://github.com/MayhemYDG/4chan-x)
# @license: https://github.com/MayhemYDG/4chan-x/blob/v3/LICENSE
Set = {}
d = document
g =
  NAMESPACE: "NameSync."
  VERSION:   "4.0.0"
  threads:   []
  board:     null

$$ = (selector, root = d.body) ->
  root.querySelectorAll selector

$ = (selector, root = d.body) ->
  root.querySelector selector

$.extend = (object, properties) ->
  for key, val of properties
    object[key] = val
  return

$.extend $,
  # Create element
  el: (type) ->
    d.createElement type
  tn: (text) ->
    d.createTextNode text
  id: (id) ->
    d.getElementById id
  # Fire event to 4chan X
  event: (type, detail) ->
    d.dispatchEvent new CustomEvent type, detail
  on: (el, type, handler) ->
    el.addEventListener type, handler, false
  off: (el, type, handler) ->
    el.removeEventListener type, handler, false
  ajax: (file, type, data, headers, callbacks) ->
    r = new XMLHttpRequest()
    r.overrideMimeType 'application/json' if file is 'qp'
    url = "https://www.milkyis.me/namesync/#{file}.php"
    url += "?#{data}" if type is 'GET'
    r.open type, url, true
    r.setRequestHeader 'X-Requested-With', 'NameSync3'
    for key, val of headers
      r.setRequestHeader key, val
    $.extend r, callbacks
    r.withCredentials = true
    r.send data
    r

CSS =
  init: ->
    css = """
    .section-name-sync input[type='text'] {
      border: 1px solid #CCC;
      width: 148px;
      padding: 2px;
    }
    .section-name-sync input[type='button'] {
      width: 130px;
      height: 26px;
    }
    .section-name-sync ul {
      list-style: none;
      margin: 0;
      padding: 8px;
    }
    .section-name-sync label {
      text-decoration: underline;
    }
    .section-name-sync {
      background: url(//www.milkyis.me/namesync/bg.png) no-repeat #F0E0D6 bottom right;
    }
    """
    if Set['Hide IDs']
      css += """
    .posteruid {
      display: none;
    }
    """

Main =
  init: ->
    path = location.pathname.slice(1).split '/'
    return if path[1] is 'catalog'
    g.board = path[0]
    g.threads.push thread.id[1..] for thread in $$ '.thread'
    Settings.init()
    Names.init()
    CSS.init()
    Menus.init()
    if Set["Sync on /#{g.board}/"]
      Sync.init()
    if Set['Automatic Updates']
      Updater.init()

Menus =
  uid: null
  init: ->
    @add '4chan X Name Sync Settings',
      'header', ->
        $.event 'OpenSettings',
          detail: 'Name Sync'
    @add 'Change name',
      'post', ->
        Names.change Menus.uid,
      (post) ->
        Menus.uid = post.info.uniqueID
        !/Heaven/.test Menus.uid
  add: (text, type, click, open) ->
      a = $.el 'a'
      a.href = 'javascript:;'
      a.textContent = text
      $.on a, 'click', click
      $.event 'AddMenuEntry',
        detail:
          type: type
          el:   a
          open: open

Names =
  nameByID:   {}
  nameByPost: {}
  blockedIDs: {}
  init: ->
    @load()
    $.event 'AddCallback',
      detail:
        type: 'Post'
        callback:
          cb: Names.cb
    return if g.threads.length > 1
    $.on d, 'ThreadUpdate', @checkThreadUpdate
  cb: ->
    Names.updatePost @nodes.post
  change: (uid) ->
    name = prompt 'What would you like this poster to be named?', 'Anonymous'
    if name and trim(name) isnt ''
      @nameByID[id] =
        n: name,
        t: ''
      @blockedIDs[id] = true
      @updateAllPosts()
  checkThreadUpdate: (e) ->
    return Sync.disabled = true if e.detail[404]
    if Set["Sync on /#{g.board}/"]
      clearTimeout Sync.delay
      Sync.delay = setTimeout Sync.sync, 2000
  load: ->
    @nameByID =
      if stored = sessionStorage["#{g.board}-names"] is null
        {}
      else
        JSON.parse stored
    @blockedIDs =
      if stored = sessionStorage["#{g.board}-names-blocked"] is null
        {}
      else
        JSON.parse stored
  store: ->
    # bug: stores these as 'false'
    sessionStorage["#{g.board}-names"]   = JSON.stringify @nameByID
    sessionStorage["#{g.board}-blocked"] = JSON.stringify @blockedIDs
  updateAllPosts: ->
    @store()
  updatePost: (post) ->

Settings =
  main:
    'Sync on /b/':       ['Enable sync on /b/', true]
    'Sync on /q/':       ['Enable sync on /q/', true]
    'Sync on /soc/':     ['Enable sync on /soc/', true]
    'Hide IDs':          ['Hide Unique IDs next to names', false]
    'Automatic Updates': ['Check for updates automatically', true]
    'Persona Fields':    ['Share persona fields instead of the 4chan X quick reply fields', false]
  init: ->
    for setting, val of Settings.main
      Set[setting] = if stored = Settings.get(val) is null then val[1] else stored is 'true'
    $.event 'AddSettingsSection',
      detail:
        title: 'Name Sync'
        open:  Settings.open
  open: (section, g) ->

  get: (name) ->
    localStorage.getItem "#{g.NAMESPACE}#{name}"
  set: (name, value) ->
    localStorage.setItem "#{g.NAMESPACE}#{name}", value

Sync =
  lastModified: '0'
  disabled:     false
  init: ->
    @sync true
  canSync: ->
    !@disabled and g.threads.length is 1 and !/warning/.test $.id(imagecount).className
  sync: (repeat) ->
    $.ajax "qp",
      "GET"
      "t=#{g.threads}&b=#{g.board}"
      "If-Modified-Since": Sync.lastModified,
        onloadend: ->
          if @status is 200
            Sync.lastModified = @getResponseHeader 'Last-Modified'
            for poster in JSON.parse @response
              Names.nameByPost[poster.p] = poster
            Names.updateAllPosts()
    if repeat and @canSync is true
      setTimeout @sync, 30000, true

Updater =
  init: ->
    if last = Settings.get('lastcheck') is null or Date.now() > last + 86400000
      @update()
  update: ->

Main.init()