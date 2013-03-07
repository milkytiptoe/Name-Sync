Set = {}
d = document
g =
  namespace: "NameSync."
  version:   "4.0.0"
  threads:   []
  board:     null

CSS =
  init: ->
  
Main =
  init: ->
  
Menus =
  init: ->
  
Names =
  init: ->
  
Settings =
  main:
    "Sync on /b/":      ["Enable sync on /b/", true]
    "Sync on /q/":      ["Enable sync on /q/", true]
    "Sync on /soc/":     ["Enable sync on /soc/", true]
    "Hide IDs":         ["Hide Unique IDs next to names", false]
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