Set = {}
d = document
g =
  NAMESPACE: "NameSync."
  VERSION:   "4.0.0"
  threads:   []
  board:     null

# api
$ = {}
  
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

Main =
  init: ->
    Settings.init()
    Settings.init()
    Names.init()
    CSS.init()
    Menus.init()

Menus =
  init: ->
  
Names =
  init: ->

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
    d.dispatchEvent new CustomEvent "AddSettingsSection",
      detail: 
        title: "Name Sync"
        open: Settings.open
  open: ->
    alert "Settings opened"
  get: (name) ->
    localStorage.getItem "#{g.NAMESPACE}#{name}"
  set: (name, value) ->
    localStorage.setItem "#{g.NAMESPACE}#{name}", value

Sync =
  init: ->

Updater =
  init: ->
  update: ->

Main.init()