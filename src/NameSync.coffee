# This script contains code from 4chan X (https://github.com/MayhemYDG/4chan-x)
# @license: https://github.com/MayhemYDG/4chan-x/blob/v3/LICENSE
Set = {}
d   = document
g   =
  NAMESPACE: 'NameSync.'
  VERSION:   '<%= version %>'
  threads:   []

$$ = (selector, root = d.body) ->
  root.querySelectorAll selector
$ = (selector, root = d.body) ->
  root.querySelector selector

$.el = (tag, properties) ->
  el = d.createElement tag
  $.extend el, properties if properties
  el
$.tn = (text) ->
  d.createTextNode text
$.id = (id) ->
  d.getElementById id
$.event = (type, detail = {}) ->
  d.dispatchEvent new CustomEvent type, detail
$.on = (el, type, handler) ->
  el.addEventListener type, handler, false
$.off = (el, type, handler) ->
  el.removeEventListener type, handler, false
$.addClass = (el, className) ->
  el.classList.add className
$.add = (parent, children) ->
  parent.appendChild $.nodes children
$.rm = (el) ->
  el.parentNode.removeChild el
$.prepend = (parent, children) ->
  parent.insertBefore $.nodes(children), parent.firstChild
$.after = (root, el) ->
  root.parentNode.insertBefore $.nodes(el), root.nextSibling
$.before = (root, el) ->
  root.parentNode.insertBefore $.nodes(el), root
$.nodes = (nodes) ->
  unless nodes instanceof Array
    return nodes
  frag = d.createDocumentFragment()
  for node in nodes
    frag.appendChild node
  frag
$.ajax = (file, type, data, callbacks) ->
  r = new XMLHttpRequest()
  r.overrideMimeType 'application/json' if file is 'qp'
  url = "<%= meta.page %>namesync/#{file}.php"
  url += "?#{data}" if type is 'GET'
  r.open type, url, true
  r.setRequestHeader 'X-Requested-With', 'NameSync<%= version %>'
  r.setRequestHeader 'If-Modified-Since', Sync.lastModified if file is 'qp'
  r.setRequestHeader 'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8' if type is 'POST'
  $.extend r, callbacks
  r.withCredentials = true
  r.send data
  r
$.extend = (object, properties) ->
  for key, val of properties
    object[key] = val
  return
$.syncing = {}
$.sync = do ->
  $.on window, 'storage', (e) ->
    if cb = $.syncing[e.key]
      cb e.newValue
  (key, cb) -> $.syncing[g.NAMESPACE + key] = cb
$.ready = (fc) ->
  if d.readyState in ['interactive', 'complete']
    fc()
    return
  cb = ->
    $.off d, 'DOMContentLoaded', cb
    fc()
  $.on d, 'DOMContentLoaded', cb
$.get = (name) ->
  localStorage.getItem "#{g.NAMESPACE}#{name}"
$.set = (name, value) ->
  localStorage.setItem "#{g.NAMESPACE}#{name}", value

Config =
  main:
    'Sync on /b/':       [true,  'Enable sync on /b/.']
    'Sync on /q/':       [true,  'Enable sync on /q/.']
    'Sync on /soc/':     [true,  'Enable sync on /soc/.']
    'Read-only Mode':    [false, 'Share none of your fields.']
    'Hide Sage':         [false, 'Share none of your fields when sage is in the email field.']
    'Hide IDs':          [false, 'Hide Unique IDs next to names.']
    'Do Not Track':      [false, 'Opt out of name tracking by third party websites.']
    'Post Delay':        [true, 'Hide posts while fields are attempted to be updated on them.']
    <% if (type !== 'crx') { %>
    'Automatic Updates': [true,  'Check for updates automatically.']
    <% } %>
  other:
    'Persona Fields':    [false]
    'Filter':            [false]

CSS =
  init: ->
    css = """
    .section-name-sync input[type='text'] {
      border: 1px solid #CCC;
      width: 148px;
      padding: 2px;
    }
    .section-name-sync input[type='button'] {
      padding: 3px;
      margin-bottom: 6px;
    }
    .section-name-sync p {
      margin: 0 0 8px 0;
    }
    .section-name-sync ul {
      list-style: none;
      margin: 0;
      padding: 8px;
    }
    .section-name-sync div label {
      text-decoration: underline;
    }
    #bgimage {
      bottom: 0px;
      right: 0px;
      position: absolute;
    }
    #menu a[data-type=name] {
      display: none;
    }
    """
    if Set['Hide IDs']
      css += """
    .posteruid {
      display: none;
    }
    """
    if Set['Filter']
      css += """
    .sync-filtered {
      display: none !important;
    }
    """
    $.add d.body, $.el 'style',
      textContent: css

Filter =
  init: ->
    @names     = $.get 'FilterNames'
    @tripcodes = $.get 'FilterTripcodes'
    @emails    = $.get 'FilterEmails'
    @subjects  = $.get 'FilterSubjects'
  filter: (id) ->
    stored = Names.nameByID[id]
    name = if stored then Names.nameByID[id].n.replace /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&' else 'Anonymous'
    stored = $.get 'FilterNames'
    $.set 'FilterNames', if stored then "#{stored}|#{name}" else name
    $.event 'OpenSettings',
      detail: 'Name Sync'
    $('input[name=FilterNames]').focus()

Main =
  init: ->
    $.off d, '4chanXInitFinished', Main.init
    path = location.pathname.slice(1).split '/'
    return if path[1] is 'catalog'
    g.board = path[0]
    for thread in $$ '.thread'
      g.threads.push +thread.id[1..]

    Settings.init()
    if Set['Filter']
      Filter.init()
    Names.init()
    CSS.init()
    Menus.init()
    if Set["Sync on /#{g.board}/"]
      Sync.init()
    <% if (type !== 'crx') { %>
    if Set['Automatic Updates']
      Updater.init()
    <% } %>
  ready: ->
    $.event 'AddCallback',
      detail:
        type: 'Post'
        callback:
          name: '4chan X Name Sync'
          cb: ->
            Names.threads = @board.threads if !g.board or g.board is @board.ID

Menus =
  uid: null
  init: ->
    $.event 'AddMenuEntry',
      detail:
        type: 'header'
        el: @makeSubEntry '4chan X Name Sync Settings', ->
          $.event 'OpenSettings',
            detail: 'Name Sync'
        order: 112
    subEntries = []
    subEntries.push
      el: @makeSubEntry 'Change', ->
        Names.change Menus.uid
        $.event 'CloseMenu'
    subEntries.push
      el: @makeSubEntry 'Filter', ->
        Filter.filter Menus.uid
        $.event 'CloseMenu'
      open: ->
        !(stored = Names.nameByID[Menus.uid]) or stored.n
    subEntries.push
      el: @makeSubEntry 'Reset', ->
        Names.reset Menus.uid
        $.event 'CloseMenu'
      open: ->
        Names.blockedIDs[Menus.uid] is true
    $.event 'AddMenuEntry',
      detail:
        type: 'post'
        el: $.el 'div',
          href: 'javascript:;'
          textContent: 'Name'
        open: (post) ->
          Menus.uid = post.info.uniqueID
          !/Heaven/.test Menus.uid
        subEntries: subEntries
  makeSubEntry: (text, click) ->
    a = $.el 'a',
      href: 'javascript:;'
      textContent: text
    $.on a, 'click', click
    a

Names =
  nameByPost: {}
  threads:    {}
  init: ->
    $.sync "#{g.board}-blocked", @loadBlocked
    $.sync "#{g.board}-cached",  @loadCached
    expiry = $.get "#{g.board}-expires"
    if !expiry or Date.now() > expiry
      @clear()
    else
      @loadBlocked()
      @loadCached()
    $.event 'AddCallback',
      detail:
        type: 'Post'
        callback:
          name: '4chan X Name Sync'
          cb: ->
            return unless @board.ID is g.board
            if Set['Post Delay'] and !@isClone and !@isHidden and g.threads.length is 1 and @thread.ID is g.threads[0]
              that = @nodes.post.parentNode
              that.style.visibility = 'hidden'
              # How long should we wait for non-sync posters and (shit) proxy users?
              setTimeout ->
                if that.style.visibility is 'hidden'
                  that.style.visibility = 'visible'
              , 2000
            Names.updatePost.call @
    @updateAllPosts()
  change: (id) ->
    name = prompt 'What would you like this poster to be named?', 'Anonymous'
    if name and name.trim() isnt ''
      @nameByID[id] =
        n: name
      @blockedIDs[id] = true
      @updateAllPosts()
  reset: (id) ->
    @nameByID[id] =
      n: 'Anonymous'
    @blockedIDs[id] = false
    @updateAllPosts()
  clear: ->
    Names.nameByID   = {}
    Names.blockedIDs = {}
    Names.store()
    el = $ '#namesClear'
    if el
      el.value = 'Cleared'
      el.disabled = true
    $.set "#{g.board}-expires", Date.now() + 86400000
  loadBlocked: (synced) ->
    stored = synced or $.get "#{g.board}-blocked"
    Names.blockedIDs = if stored then JSON.parse stored else {}
  loadCached: (synced) ->
    stored = synced or $.get "#{g.board}-cached"
    Names.nameByID = if stored then JSON.parse stored else {}
  store: ->
    $.set "#{g.board}-cached",  JSON.stringify @nameByID
    $.set "#{g.board}-blocked", JSON.stringify @blockedIDs
  updateAllPosts: ->
    # SANIC
    for thread of @threads
      for post of @threads[thread].posts
        Names.updatePost.call @threads[thread].posts[post]
        for clone of @threads[thread].posts[post].clones
          Names.updatePost.call @threads[thread].posts[post].clones[clone]
    Names.store()
  updatePost: ->
    return if !@info or @info.capcode

    oinfo = Names.nameByPost[@ID]
    linfo = Names.nameByID[@info.uniqueID]
    if oinfo and !Names.blockedIDs[@info.uniqueID]
      name     = oinfo.n
      tripcode = oinfo.t
      unless /Heaven/.test @info.uniqueID
        Names.nameByID[@info.uniqueID] =
          n: name
          t: tripcode
      email   = oinfo.e
      subject = oinfo.s
    else if linfo
      name     = linfo.n
      tripcode = linfo.t
    else
      return

    namespan      = @nodes.name
    subjectspan   = @nodes.subject
    tripspan      = $ '.postertrip', @nodes.info
    emailspan     = $ '.useremail',  @nodes.info
    if namespan.textContent isnt name
      namespan.textContent = name
    if subject
      if subjectspan.textContent isnt subject
        subjectspan.textContent = subject
    else
      if subjectspan.textContent isnt ''
        subjectspan.textContent = ''
    if email
      if emailspan is null
        emailspan = $.el 'a',
          className: 'useremail'
        $.before namespan, emailspan
      $.add emailspan, namespan
      if tripspan?
        $.after namespan, $.tn ' '
        $.add emailspan, tripspan
      emailspan.href = "mailto:#{email}"
    else if emailspan
      $.before emailspan, namespan
      $.rm emailspan
    if tripcode
      if tripspan is null
        tripspan = $.el 'span',
          className: 'postertrip'
        $.after namespan, [$.tn ' '; tripspan]
      if tripspan.textContent isnt tripcode
        tripspan.textContent = tripcode
    else if tripspan
      $.rm tripspan.previousSibling
      $.rm tripspan

    # If this post has fields loaded already, show it
    if Set['Post Delay'] and oinfo and @nodes.post.parentNode.style.visibility is 'hidden'
      @nodes.post.parentNode.style.visibility = 'visible'

    if Set['Filter'] and Filter.names and RegExp(Filter.names).test(name) or Filter.tripcodes and tripcode and RegExp(Filter.tripcodes).test(tripcode) or Filter.subjects and subject and RegExp(Filter.subjects).test(subject) or Filter.emails and email and RegExp(Filter.emails).test(email)
      $.addClass @nodes.post.parentNode, 'sync-filtered'

Settings =
  init: ->
    for section in Object.keys Config
      for setting, val of Config[section]
        stored = $.get setting
        Set[setting] = if stored is null then val[0] else stored is 'true'
    $.event 'AddSettingsSection',
      detail:
        title: 'Name Sync'
        open:  Settings.open
  open: (section) ->
    section.innerHTML = """
      <fieldset>
        <legend>
          <label><input type='checkbox' name='Persona Fields' #{if $.get('Persona Fields') is 'true' then 'checked' else ''}> Persona</label>
        </legend>
        <p>Share these fields instead of the 4chan X quick reply fields</p>
        <div>
          <input type=text name=Name placeholder=Name>
          <input type=text name=Email placeholder=Email>
          <input type=text name=Subject placeholder=Subject>
        </div>
      </fieldset>
      <fieldset>
        <legend>
          <label><input type='checkbox' name='Filter' #{if $.get('Filter') is 'true' then 'checked' else ''}> Filter</label>
        </legend>
        <p><code>^(?!Anonymous$)</code> to filter all names <code>!tripcode|!tripcode</code> to filter multiple tripcodes</p>
        <div>
          <input type=text name=FilterNames placeholder=Names>
          <input type=text name=FilterTripcodes placeholder=Tripcodes>
          <input type=text name=FilterEmails placeholder=Emails>
          <input type=text name=FilterSubjects placeholder=Subjects>
        </div>
      </fieldset>
      <fieldset>
        <legend>Advanced</legend>
        <div>
          <% if (type !== 'crx') { %>
          <input id=syncUpdate type=button value='Check for update'>
          <% } %>
          <input id=syncClear type=button value='Clear sync history' title='Clear your stored sync history from the server'>
          <input id=namesClear type=button value='Clear name cache' title='Clear locally stored names'>
        </div>
        <div>Sync Delay: <input type=number name=Delay min=0 step=100 placeholder=300 title='Delay before downloading new names when a new post is inserted'> ms</div>
      </fieldset>
      <fieldset>
        <legend>About</legend>
        <div>4chan X Name Sync v#{g.VERSION}</div>
        <div><a href='http://milkytiptoe.github.io/Name-Sync/' target='_blank'>Web page</a></div>
        <div><a href='https://github.com/milkytiptoe/Name-Sync/issues/new' target='_blank'>Report an issue</a></div>
        <div><a href='https://raw.github.com/milkytiptoe/Name-Sync/master/changelog' target='_blank'>Changelog</a></div>
      </fieldset>
      <img id=bgimage src='<%= meta.page %>namesync/bg.png' />
    """
    bgimage = $ '#bgimage', section
    bgimage.ondragstart = -> false
    bgimage.oncontextmenu = -> false
    field = $.el 'fieldset'
    $.add field, $.el 'legend',
      textContent: 'Main'

    for setting, val of Config.main
      stored  = $.get setting
      istrue  = if stored is null then val[0] else stored is 'true'
      checked = if istrue then 'checked' else ''
      $.add field, $.el 'div',
        innerHTML: "<label><input type='checkbox' name='#{setting}' #{checked}>#{setting}</label><span class='description'>: #{val[1]}</span>"
    $.prepend section, field
    for check in $$ 'input[type=checkbox]', section
      $.on check, 'click', ->
        $.set @name, @checked

    for text in $$ 'input[type=text], input[type=number]', section
      text.value = $.get(text.name) or ''
      $.on text, 'input', ->
        if /^Filter/.test @name
          try
            regexp = RegExp @value
          catch err
            alert err.message
            return @value = $.get @name
        $.set @name, @value

    <% if (type !== 'crx') { %>
    $.on $('#syncUpdate', section), 'click', Updater.update
    <% } %>
    $.on $('#syncClear',  section), 'click', Sync.clear
    $.on $('#namesClear', section), 'click', Names.clear

Sync =
  lastModified: '0'
  disabled: false
  delay: 300
  init: ->
    @delay = (parseInt $.get 'Delay') or @delay
    unless Set['Read-only Mode']
      $.on d, 'QRPostSuccessful', Sync.requestSend
    if g.threads.length is 1
      $.on d, 'ThreadUpdate', @checkThreadUpdate
      @sync true
    else
      @sync()
  checkThreadUpdate: (e) ->
    return Sync.disabled = true if e.detail[404]
    return unless e.detail.newPosts.length
    clearTimeout Sync.handle
    Sync.handle = setTimeout Sync.sync, Sync.delay
  sync: (repeat) ->
    start = Date.now()
    $.ajax 'qp',
      'GET'
      "t=#{g.threads}&b=#{g.board}"
      onloadend: ->
        return unless @status is 200 and @response
        Sync.lastModified = @getResponseHeader('Last-Modified') or Sync.lastModified
        for poster in JSON.parse @response
          Names.nameByPost[poster.p] = poster
        Names.updateAllPosts()
    if repeat and !Sync.disabled
      setTimeout Sync.sync, 30000, true
  requestSend: (e) ->
    postID   = e.detail.postID
    threadID = e.detail.threadID
    if Set['Persona Fields']
      currentName    = $.get('Name')    or ''
      currentEmail   = $.get('Email')   or ''
      currentSubject = $.get('Subject') or ''
    else
      qr             = $.id 'qr'
      currentName    = $('input[data-name=name]',  qr).value
      currentEmail   = $('input[data-name=email]', qr).value
      currentSubject = $('input[data-name=sub]',   qr).value
    currentName    = currentName.trim()
    currentEmail   = currentEmail.trim()
    currentSubject = currentSubject.trim()
    return if !$.get("#{g.board}-#{threadID}-last-name") and currentName+currentEmail+currentSubject is '' or Set['Hide Sage'] and /sage/i.test currentEmail
    $.set "#{g.board}-#{threadID}-last-name", currentName
    Sync.send currentName, currentEmail, currentSubject, postID, threadID
  send: (name, email, subject, postID, threadID) ->
    $.ajax 'sp',
      'POST'
      "p=#{postID}&t=#{threadID}&b=#{g.board}&n=#{encodeURIComponent name}&s=#{encodeURIComponent subject}&e=#{encodeURIComponent email}&dnt=#{if Set['Do Not Track'] then '1' else '0'}"
      onerror: ->
        setTimeout Sync.send, 2000, name, email, subject, postID, threadID
  clear: ->
    $('#syncClear').disabled = true
    $.ajax 'rm',
      'POST'
      ''
      onerror: ->
        $('#syncClear').value = 'Error'
      onloadend: ->
        return if @status isnt 200
        $('#syncClear').value = 'Cleared'

<% if (type !== 'crx') { %>
Updater =
  init: ->
    last = $.get 'lastcheck'
    if last is null or Date.now() > last + 86400000
      @update()
  update: ->
    el = $ '#syncUpdate'
    el.disabled = true if el
    $.ajax 'u3',
      'GET'
      ''
      onloadend: ->
        $.set 'lastcheck', Date.now()
        if @status isnt 200 or @response is g.VERSION
          el.value = 'None available' if el
          return
        $.event 'CreateNotification',
          detail:
            type: 'info'
            content: $.el 'span',
              innerHTML: "An update for 4chan X Name Sync is available.<% if (type === 'userscript') { %> <a href=<%= meta.builds %>firefox/NameSync.user.js target=_blank>Install now</a>. <% } else { %> <a href=<%= meta.page %> target=_blank>Get it here</a>.<% } %>"
            lifetime: 10
        el = $ '#fourchanx-settings .close'
        el.click() if el
<% } %>

$.ready Main.ready
$.on d, '4chanXInitFinished', Main.init
