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
  el: (tag, properties) ->
    el = d.createElement tag
    $.extend el, properties if properties
    el
  tn: (text) ->
    d.createTextNode text
  id: (id) ->
    d.getElementById id
  event: (type, detail) ->
    d.dispatchEvent new CustomEvent type, detail
  on: (el, type, handler) ->
    el.addEventListener type, handler, false
  off: (el, type, handler) ->
    el.removeEventListener type, handler, false
  addClass: (el, className) ->
    el.classList.add className
  add: (parent, children) ->
    parent.appendChild $.nodes children
  rm: (el) ->
    el.parentNode.removeChild el
  prepend: (parent, children) ->
    parent.insertBefore $.nodes(children), parent.firstChild
  after: (root, el) ->
    root.parentNode.insertBefore $.nodes(el), root.nextSibling
  before: (root, el) ->
    root.parentNode.insertBefore $.nodes(el), root
  nodes: (nodes) ->
    unless nodes instanceof Array
      return nodes
    frag = d.createDocumentFragment()
    for node in nodes
      frag.appendChild node
    frag
  ajax: (file, type, data, callbacks) ->
    r = new XMLHttpRequest()
    r.overrideMimeType 'application/json' if file is 'qp'
    url = "http://www.milkyis.me/namesync/#{file}.php"
    url += "?#{data}" if type is 'GET'
    r.open type, url, true
    r.setRequestHeader 'X-Requested-With', 'NameSync3'
    r.setRequestHeader 'If-Modified-Since', Sync.lastModified if file is 'qp'
    r.setRequestHeader 'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8' if type is 'POST'
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
      background: url(http://www.milkyis.me/namesync/bg.png) no-repeat #F0E0D6 bottom right;
    }
    """
    if Set['Hide IDs']
      css += """
    .posteruid {
      display: none;
    }
    """
    el = $.el 'style',
      textContent: css
    $.add d.body, el

Main =
  init: ->
    path = location.pathname.slice(1).split '/'
    return if path[1] is 'catalog'
    g.board = path[0]
    for thread in $$ '.thread'
      g.threads.push thread.id[1..]

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
        Names.change Menus.uid
        $.event 'CloseMenu'
      (post) ->
        Menus.uid = post.info.uniqueID
        !/Heaven/.test Menus.uid
    @add 'Reset name',
      'post', ->
        Names.reset Menus.uid
        $.event 'CloseMenu'
      (post) ->
        Menus.uid = post.info.uniqueID
        !/Heaven/.test Menus.uid
  add: (text, type, click, open) ->
      a = $.el 'a',
        href: 'javascript:;'
        textContent: text
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
          name: '4chan X Name Sync'
          cb: Names.cb
    return if g.threads.length > 1
    $.on d, 'ThreadUpdate', @checkThreadUpdate
    @updateAllPosts()
  cb: ->
    Names.updatePost @nodes.post
  change: (id) ->
    name = prompt 'What would you like this poster to be named?', 'Anonymous'
    if name and name.trim() isnt ''
      @nameByID[id] =
        n: name
        t: ''
      @blockedIDs[id] = true
      @updateAllPosts()
  reset: (id) ->
    @nameByID[id] =
      n: 'Anonymous'
      t: ''
    @blockedIDs[id] = false
    @updateAllPosts()
  checkThreadUpdate: (e) ->
    return Sync.disabled = true if e.detail[404]
    if Set["Sync on /#{g.board}/"]
      Sync.sync()
  load: ->
    stored = sessionStorage["#{g.board}-4-names"]
    @nameByID = if stored then JSON.parse(stored) else {}
    stored = sessionStorage["#{g.board}-blocked"]
    @blockedIDs = if stored then JSON.parse(stored) else {}
  store: ->
    sessionStorage["#{g.board}-4-names"] = JSON.stringify @nameByID
    sessionStorage["#{g.board}-blocked"] = JSON.stringify @blockedIDs
  updateAllPosts: ->
    @updatePost post for post in $$ '.thread .post'
    @store()
  updatePost: (post) ->
    idspan =         $('.hand', post)
    return if idspan is null
    id =             idspan.textContent
    return if /^##/.test id
    postnumspan = $ 'a[title="Quote this post"]', post
    namespan    = $ '.desktop .name', post
    tripspan    = $ '.desktop .postertrip', post
    subjectspan = $ '.desktop .subject', post
    postnum     = postnumspan.textContent
    oinfo       = Names.nameByPost[postnum]
    linfo       = Names.nameByID[id]
    if oinfo and not Names.blockedIDs[id]
      name      = oinfo.n
      tripcode  = oinfo.t
      if !/Heaven/.test id
        Names.nameByID[id] =
          n: name
          t: tripcode
      email   = oinfo.e
      subject = oinfo.s
    else if linfo
      name     = linfo.n
      tripcode = linfo.t
    else
      return

    if namespan.textContent isnt name
      namespan.textContent = name
    if subject and subject isnt '' and subjectspan.textContent isnt subject
      subjectspan.textContent = subject
    if email and email isnt ''
      emailspan = $ '.desktop .useremail', post
      if emailspan is null # Do we want to compare to null actually?
        nameblockspan = $ '.desktop .nameBlock', post
        emailspan = $.el 'a'
        $.addClass emailspan, 'useremail'
        $.before namespan, emailspan
      $.add emailspan, namespan
      if tripspan?
        $.after namespan, $.tn ' '
        $.add emailspan, tripspan
      emailspan.href = "mailto:#{email}"
    if tripcode and tripcode isnt ''
      if tripspan is null
        tripspan = $.el 'span'
        $.addClass tripspan, 'postertrip'
        $.after namespan, [tripspan, $.tn ' ']
      if tripspan.textContent isnt tripcode
        tripspan.textContent = tripcode
    else
      if tripspan?
        $.rm tripspan

Settings =
  main:
    'Sync on /b/':       ['Enable sync on /b/', true]
    'Sync on /q/':       ['Enable sync on /q/', true]
    'Sync on /soc/':     ['Enable sync on /soc/', true]
    'Hide IDs':          ['Hide Unique IDs next to names', false]
    'Automatic Updates': ['Check for updates automatically', true]
    'Persona Fields':    ['Share persona fields instead of the 4chan X quick reply fields', false]
    'Share Sage':        ['Blue names!', true] ## Needs proper description
    'Do Not Track':      ['Send a request to third party archives to not store your history', false]
  init: ->
    for setting, val of Settings.main
      stored = Settings.get setting
      Set[setting] = if stored is null then val[1] else stored is 'true'
    $.event 'AddSettingsSection',
      detail:
        title: 'Name Sync'
        open:  Settings.open
  open: (section, g) ->
    section.innerHTML = "<fieldset><legend>Persona</legend><div><input type='text' name='Name' placeholder='Name'><input type='text' name='Email' placeholder='Email'><input type='text' name='Subject' placeholder='Subject'></div></fieldset><fieldset><legend>Advanced</legend><input id='syncUpdate' type='button' value='Check for update'><input id='syncClear' type='button' value='Clear sync history'></fieldset>"
    field = $.el 'fieldset'
    $.add field, $.el 'legend',
      textContent: 'Main'

    for setting, val of Settings.main
      stored  = Settings.get setting
      istrue  = if stored is null then val[1] else stored is 'true'
      checked = if istrue then 'checked ' else ''
      $.add field, $.el 'div',
        innerHTML: "<label><input type='checkbox' name='#{setting}' #{checked}/>#{setting}</label><span class='description'>: #{val[0]}</span>"
    $.prepend section, field
    for check in $$ 'input[type=checkbox]', section
      $.on check, 'click', ->
        Settings.set @name, @checked

    for text in $$ 'input[type=text]', section
      text.value = Settings.get(text.name) or ''
      $.on text, 'input', ->
        Settings.set @name, @value

    $.on $('#syncUpdate', section), 'click', Updater.update
    $.on $('#syncClear',  section), 'click', Sync.clear
  get: (name) ->
    localStorage.getItem "#{g.NAMESPACE}#{name}"
  set: (name, value) ->
    localStorage.setItem "#{g.NAMESPACE}#{name}", value

Sync =
  lastModified: '0'
  disabled: false
  init: ->
    return unless Set['Share Sage']
    $.on d, 'QRPostSuccessful', Sync.requestSend
    @sync true
    if sessionStorage["#{g.board}-namesync-tosend"]
      r = JSON.parse(sessionStorage["#{g.board}-namesync-tosend"])
      @send r.name, r.email, r.subject, r.postID, r.threadID, true
  canSync: ->
    !@disabled and g.threads.length is 1
  sync: (repeat) ->
    $.ajax "qp",
      "GET"
      "t=#{g.threads}&b=#{g.board}"
      onloadend: ->
        if @status is 200
          Sync.lastModified = @getResponseHeader 'Last-Modified'
          for poster in JSON.parse @response
            Names.nameByPost[poster.p] = poster
          Names.updateAllPosts()
    if repeat and Sync.canSync()
      setTimeout Sync.sync, 30000, true
  requestSend: (e) ->
    postID   = e.detail.postID
    threadID = e.detail.threadID
    if Set['Persona Fields']
      cName    = Settings.get 'Name'
      cEmail   = Settings.get 'Email'
      cSubject = Settings.get 'Subject'
    else
      qr       = $.id 'qr'
      cName    = $('input[name=name]',  qr).value
      cEmail   = $('input[name=email]', qr).value
      cSubject = $('input[name=sub]',   qr).value
    cName    = cName.trim()
    cEmail   = cEmail.trim()
    cSubject = cSubject.trim()
    unless cName is '' and cEmail is '' and cSubject is ''
      Sync.send cName, cEmail, cSubject, postID, threadID
  send: (cName, cEmail, cSubject, postID, threadID, isLateOpSend) ->
    return if isLateOpSend and not sessionStorage["#{g.board}-namesync-tosend"]
    if g.threads.length > 1
      isLateOpSend = true
      sessionStorage["#{g.board}-namesync-tosend"] = JSON.stringify
        name:     cName
        email:    cEmail
        subject:  cSubject
        postID:   postID
        threadID: threadID
    else
      $.ajax 'sp',
        'POST'
        "p=#{postID}&t=#{threadID}&b=#{g.board}&n=#{encodeURIComponent cName}&s=#{encodeURIComponent cSubject}&e=#{encodeURIComponent cEmail}&dnt=#{if Set['Do Not Track'] then '1' else '0'}"
        onerror: ->
          setTimeout Sync.send, 2000, cName, cEmail, cSubject, postID, threadID, isLateOpSend
        onloadend: ->
          return @onerror() if @status isnt 200
          if isLateOpSend
            delete sessionStorage["#{g.board}-namesync-tosend"]
            Sync.sync()
  clear: ->
    return if not confirm 'This will remove 4chan X Name Sync name, email and subject history stored online by you. Continue?'
    $.ajax 'rm',
      'POST'
      ''
      onerror: ->
        alert 'Error removing history'
      onloadend: ->
        return @onerror() if @status isnt 200
        alert @response

Updater =
  init: ->
    last = Settings.get 'lastcheck'
    if last is null or Date.now() > last + 86400000
      @update()
  update: ->
    $.ajax 'u3',
      'GET'
      ''
      onloadend: ->
        return if @status isnt 200
        Settings.set 'lastcheck', Date.now()
        if @response isnt g.VERSION.replace(/\./g, '') and confirm "A new update for 4chan Name Sync is available, install now?"
          window.location = 'https://github.com/milkytiptoe/Name-Sync/raw/master/NameSync.user.js'

$.on d, '4chanXInitFinished', Main.init
