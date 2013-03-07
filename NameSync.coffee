Set = {}
d = document
g =
  namespace: "NameSync."
  version:   "4.0.0"
  threads:   []
  board:     null

CSS =
  init: ->
    css =  """
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
  open: ->
  get: ->
  set: ->

Sync =
  init: ->

Updater =
  init: ->
  update: ->

Main.init()