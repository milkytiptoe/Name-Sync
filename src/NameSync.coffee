# This script contains code from 4chan X (https://github.com/MayhemYDG/4chan-x)
# @license: https://github.com/MayhemYDG/4chan-x/blob/v3/LICENSE
Set = {}
d   = document
g   =
  NAMESPACE: '<%= name %>.'
  VERSION:   '<%= version %>'
  posts:     {}
  threads:   []
  boards:    ['b', 'soc', 's4s', 'trash']

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
$.hasClass = (el, className) ->
  el.classList.contains className
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
  r.setRequestHeader 'X-Requested-With', '<%= name %><%= version %>'
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
$.asap = (test, cb) ->
  if test()
    cb()
  else
    setTimeout $.asap, 25, test, cb
$.get = (name) ->
  localStorage.getItem "#{g.NAMESPACE}#{name}"
$.set = (name, value) ->
  localStorage.setItem "#{g.NAMESPACE}#{name}", value

Config =
  main:
    'Sync on /b/':     [true,  'Enable sync on /b/.']
    'Sync on /soc/':   [true,  'Enable sync on /soc/.']
    'Sync on /s4s/':   [true,  'Enable sync on /s4s/.']
    'Sync on /trash/':   [true,  'Enable sync on /trash/.']
    'Custom Names':    [false, 'Posters can be given custom names.']
    'Read-only Mode':  [false, 'Share none of your sync fields.']
    'Hide Sage':       [false, 'Share none of your sync fields when sage is in the email field.']
    'Mark Sync Posts': [false, 'Mark posts made by sync users.']
    'Do Not Track':    [false, 'Request no sync field tracking by third party archives.']
  other:
    'Persona Fields':  [false]
    'Filter':          [false]

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
    /* Appchan X description fix */
    .section-name-sync .description {
      display: inline;
    }
    /* ccd0 4chan X clear fix */
    .section-name-sync {
      clear: both;
    }
    /* Show sync fields in ccd0 4chan X */
    #qr.sync-enabled .persona input {
      display: inline-block !important;
    }
    """
    if Set['Filter']
      css += """
    .sync-filtered {
      display: none !important;
    }
    """
    if Set['Mark Sync Posts']
      css += """
    .sync-post {
      position: relative;
    }
    .sync-post:after {
      content: url('data:image/png;base64,<%= grunt.file.read('img/mark.png', {encoding: 'base64'}) %>');
      position: absolute;
      bottom: 2px;
      right: 5px;
    }
    """
    if Set['Custom Names']
      css += """
    div#qp .sync-custom, div.inline .sync-custom {
      display: none;
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

Main =
  init: ->
    lastView = g.view
    path = location.pathname.split '/'
    g.board = path[1]
    g.view = if path[2] in ['thread', 'catalog'] then path[2] else 'index'
    return if g.view is 'catalog'
    unless lastView
      Settings.init()
      CSS.init()
      if Set['Filter']
        Filter.init()
    if Set["Sync on /#{g.board}/"] or lastView
      Posts.init()
      Sync.init()
  boardLegit: ->
    g.board in g.boards

Posts =
  nameByPost: {}
  nameByID: {}
  init: ->
    g.posts = {}
    g.threads = []
    if @observer
      @observer.disconnect()
      delete @observer
    return if g.view isnt 'thread' or !Main.boardLegit()
    # Only observe changes when in a thread
    for post in $$ '.thread > .postContainer'
      g.posts[post.id[2..]] = new Post post
    target = $ '.thread'
    g.threads.push target.id[1..]
    @observer = new MutationObserver (mutations) ->
      foundNode = false
      for mutation in mutations
        for node in mutation.addedNodes
          unless $.hasClass node, 'postContainer'
            continue unless node = $ '.postContainer', node
          g.posts[node.id[2..]] = new Post node
          foundNode = true
      if foundNode
        # Single node positive:
        # Posts can be missed, cycle them all for now
        Posts.updateAllPosts()
    @observer.observe target, childList: true
    # Posts will not initially update if there is no sync data
    Posts.updateAllPosts() if Set['Custom Names']
  updateAllPosts: ->
    for key of (if Set['Custom Names'] then g.posts else Posts.nameByPost)
      Posts.updatePost.call g.posts[key]
    return
  updatePost: ->
    return if !@info or @info.capcode

    if linfo = Posts.nameByID[uID = @info.uID]
      name     = linfo.n
    else if oinfo = Posts.nameByPost[@ID]
      # Ignore sync posts made after the retry timer
      return if parseInt(oinfo.time) > parseInt(@info.date) + 60
      name     = oinfo.n
      tripcode = oinfo.t
      email    = oinfo.e
      subject  = oinfo.s

    if Set['Custom Names'] and uID isnt 'Heaven' and $('.sync-custom', @nodes.info) is null
      el = $.el 'a',
        className: 'sync-custom'
        textContent: '+'
        href: 'javascript:;'
        title: 'Custom Name'
      $.after $('[type="checkbox"]', @nodes.info), [el, $.tn ' ']
      $.on el, 'click', ->
        Posts.customName uID

    return if !linfo and !oinfo

    namespan    = @nodes.name
    subjectspan = @nodes.subject
    tripspan    = $ '.postertrip', @nodes.info
    emailspan   = $ '.useremail',  @nodes.info
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

    if Set['Mark Sync Posts'] and @isReply and Posts.nameByPost[@ID]
      $.addClass @nodes.post, 'sync-post'

    if Set['Filter']
      for type of obj = {name, tripcode, subject, email}
        continue if !(info = obj[type]) or !regex = Filter["#{type}s"]
        if ///#{regex}///.test info
          $.addClass @nodes.root, 'sync-filtered'
          return
      return
  customName: (uID) ->
    return unless n = prompt 'Custom Name', 'Anonymous'
    Posts.nameByID[uID] =
      n: n
    Posts.updateAllPosts()

Settings =
  init: ->
    for section in Object.keys Config
      for setting, val of Config[section]
        stored = $.get setting
        Set[setting] = if stored is null then val[0] else stored is 'true'
    el = $.el 'a',
      href: 'javascript:;'
      className: 'shortcut'
      textContent: 'NS'
      title: '<%= meta.name %> Settings'
    $.asap (-> $.id('shortcuts')), ->
      $.add $.id('shortcuts'), el
      $.on el, 'click', ->
        $.event 'OpenSettings', {detail: 'none'}
        section = $ '[class^="section-"]'
        section.className = 'section-name-sync'
        Settings.open section
  open: (section) ->
    section.innerHTML = """
      <fieldset>
        <legend>
          <label><input type=checkbox name='Persona Fields' #{if $.get('Persona Fields') is 'true' then 'checked' else ''}>Persona</label>
        </legend>
        <p>Share these fields instead of the 4chan X quick reply fields.</p>
        <div>
          <input type=text name=Name placeholder=Name>
          <input type=text name=Email placeholder=Email>
          <input type=text name=Subject placeholder=Subject>
        </div>
      </fieldset>
      <fieldset>
        <legend>
          <label><input type=checkbox name=Filter #{if $.get('Filter') is 'true' then 'checked' else ''}>Filter</label>
        </legend>
        <p><code>^(?!Anonymous$)</code> to filter all names <code>!tripcode|!tripcode</code> to filter multiple tripcodes. Only applies to sync posts.</p>
        <div>
          <input type=text name=FilterNames placeholder=Names>
          <input type=text name=FilterTripcodes placeholder=Tripcodes>
          <input type=text name=FilterEmails placeholder=Email>
          <input type=text name=FilterSubjects placeholder=Subjects>
        </div>
      </fieldset>
      <fieldset>
        <legend>Advanced</legend>
        <div>
          <input id=syncClear type=button value='Clear my sync history' title='Clear your sync history from the server'>
          Sync Delay: <input type=number name=Delay min=0 step=100 placeholder=300 title='Delay before synchronising after a thread or index update'> ms
        </div>
      </fieldset>
      <fieldset>
        <legend>About</legend>
        <div><%= meta.name %> v#{g.VERSION}</div>
        <div>
          <a href='http://milkytiptoe.github.io/Name-Sync/' target=_blank>Website</a> |
          <a href='https://github.com/milkytiptoe/Name-Sync/wiki/Support' target=_blank>Support</a> |
          <a href='https://raw.githubusercontent.com/milkytiptoe/Name-Sync/master/license' target=_blank>License</a> |
          <a href='https://raw.githubusercontent.com/milkytiptoe/Name-Sync/master/changelog' target=_blank>Changelog</a> |
          <a href='https://github.com/milkytiptoe/Name-Sync/issues/new' target=_blank>Issues</a>
        </div>
      </fieldset>
    """
    field = $.el 'fieldset'
    $.add field, $.el 'legend',
      textContent: 'Main'

    for setting, val of Config.main
      stored  = $.get setting
      istrue  = if stored is null then val[0] else stored is 'true'
      checked = if istrue then 'checked' else ''
      $.add field, $.el 'div',
        innerHTML: "<label><input type=checkbox name='#{setting}' #{checked}>#{setting}</label><span class=description>: #{val[1]}</span>"
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

    $.on $('#syncClear',  section), 'click', Sync.clear

    $('div[id$="x-settings"] nav').style.visibility = 'hidden'

Sync =
  init: ->
    @disabled = false
    @lastModified = '0'
    @delay = (parseInt $.get 'Delay') or 300
    @failedSends = 0
    @canRetry = true

    unless Main.boardLegit()
      $.off d, 'QRPostSuccessful<% if (type === "crx") { %>_<% } %>', @requestSend
      $.off d, 'ThreadUpdate', @threadUpdate
      $.off d, 'IndexRefresh', @indexRefresh
      return

    unless Set['Read-only Mode']
      @setupQR()
      $.on d, 'QRPostSuccessful<% if (type === "crx") { %>_<% } %>', @requestSend

    $.on d, 'ThreadUpdate', @threadUpdate
    $.on d, 'IndexRefresh', @indexRefresh

    @sync true
  indexRefresh: ->
    # Rebuild posts and resync every index refresh
    setTimeout ->
      g.posts = {}
      g.threads = []
      for thread in $$ '.thread'
        g.threads.push thread.id[1..]
      for post in $$ '.thread > .postContainer'
        g.posts[post.id[2..]] = new Post post
      clearTimeout Sync.handle
      Sync.handle = setTimeout Sync.sync, Sync.delay
    , Sync.delay
  threadUpdate: (e) ->
    return Sync.disabled = true if e.detail[404]
    return unless l = e.detail.newPosts.length > 0
    clearTimeout Sync.handle
    Sync.handle = setTimeout Sync.sync, Sync.delay
  sync: (repeat) ->
    return if g.threads.length is 0
    $.ajax 'qp',
      'GET'
      "t=#{g.threads}&b=#{g.board}"
      onloadend: ->
        return unless @status is 200 and @response
        Sync.lastModified = @getResponseHeader('Last-Modified') or Sync.lastModified if g.view is 'thread'
        for poster in JSON.parse @response
          Posts.nameByPost[poster.p] = poster
        Posts.updateAllPosts()
        $.event 'NamesSynced'
    if repeat and g.view is 'thread' and !Sync.disabled
      setTimeout Sync.sync, 30000, true
  setupQR: ->
    unless qr = $.id 'qr'
      $.on d, 'QRDialogCreation', Sync.setupQR
      return
    $.addClass qr, 'sync-enabled'
    $('input[data-name=email]', qr).placeholder = 'E-mail'
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
    return if Set['Hide Sage'] and /sage/i.test currentEmail
    if /since4pass/i.test currentEmail
      currentEmail = ''
    return if currentName+currentEmail+currentSubject is ''
    Sync.send currentName, currentEmail, currentSubject, postID, threadID
  send: (name, email, subject, postID, threadID, retryTimer) ->
    $.ajax 'sp',
      'POST'
      "p=#{postID}&t=#{threadID}&b=#{g.board}&n=#{encodeURIComponent name}&s=#{encodeURIComponent subject}&e=#{encodeURIComponent email}&dnt=#{if Set['Do Not Track'] then '1' else '0'}"
      onerror: ->
        # Retrying sending can only be done on an incremental timer of 2, 4, 6, 11 then stops
        # After 2 failed stores a notification is shown
        # After 3 or more, there is a 60 second cooldown on the ability to retry for each
        return unless Sync.canRetry
        retryTimer = retryTimer or 0
        if retryTimer > 10000
          ++Sync.failedSends
          <% if (type == 'userscript') { %>
          if Sync.failedSends is 2
            $.event 'CreateNotification',
              detail:
                type: 'warning'
                content: 'Connection errors with sync server. Fields may not appear.'
                lifetime: 8
          <% } %>
          if Sync.failedSends >= 3
            Sync.canRetry = false
            setTimeout ->
              Sync.canRetry = true
            , 60000
          return
        retryTimer += if retryTimer < 5000 then 2000 else 5000
        setTimeout Sync.send, retryTimer, name, email, subject, postID, threadID, retryTimer
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

$.on d, '4chanXInitFinished', Main.init
