Set = {}
d = document
g =
  NAMESPACE: "NameSync."
  VERSION:   "4.0.0"
  threads:   []
  board:     null

# 4chan X API-based snippets
# https://github.com/ihavenoface/4chan-x
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
    d.createElement(type)
  # Fire event to 4chan X
  event: (type, detail) ->
    d.dispatchEvent new CustomEvent type, detail
  on: (el, type, handler) ->
    el.addEventListener type, handler, false
  off: (el, type, handler) ->
    el.removeEventListener type, handler, false
    
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
    if Set["Hide IDs"]
      css += """
          .posteruid {
            display: none;
          }
          """

Main =
  init: ->
    path = location.pathname.slice(1).split("/")
    return if path[1] is "catalog"
    g.board = path[0]
    g.threads.push thread.id[1..] for thread in $$ ".thread"
    Settings.init()
    Settings.init()
    Names.init()
    CSS.init()
    Menus.init()
    if (Set["Sync on /#{g.board}/"])
      Sync.init()
    if (Set["Automatic Updates"])
      Updater.init()

Menus =
  uid: null
  init: ->
    # Bug: Doesn't work, also opens X settings on page load for some reason, might be related to two sections bug in Settings.init
    # this.add "4chan X Name Sync Settings", "header", $.event "OpenSettings",
      # detail: "Name Sync"
    # Works despite above not
    this.add "Change name", "post",
      ->
        Names.change Menus.uid
      (post) ->
        Menus.uid = post.info.uniqueID
        return not /Heaven/.test Menus.uid
  add: (text, type, click, open) ->
      a = $.el "a"
      a.href = "javascript:;"
      a.textContent = text
      $.on a, "click", click
      $.event "AddMenuEntry",
        detail:
          type: type
          el: a
          open: open

Names =
  init: ->
  change: (uid) ->

Settings =
  main:
    "Sync on /b/":       ["Enable sync on /b/", true]
    "Sync on /q/":       ["Enable sync on /q/", true]
    "Sync on /soc/":     ["Enable sync on /soc/", true]
    "Hide IDs":          ["Hide Unique IDs next to names", false]
    "Automatic Updates": ["Check for updates automatically", true]
    "Persona Fields":    ["Share persona fields instead of the 4chan X quick reply fields", false]
  init: ->
    for setting, val of Settings.main
      Set[setting] = if stored = Settings.get(val) is null then val[1] else stored is "true"
    # Bug: Creates two sections in X settings for unknown reason
    $.event "AddSettingsSection",
      detail:
        title: "Name Sync"
        open: Settings.open
  open: (section, g) ->
  get: (name) ->
    localStorage.getItem "#{g.NAMESPACE}#{name}"
  set: (name, value) ->
    localStorage.setItem "#{g.NAMESPACE}#{name}", value

Sync =
  init: ->

Updater =
  init: ->
    this.update() if last = Settings.get("lastcheck") is null or Date.now() > last + 86400000
  update: ->

Main.init()