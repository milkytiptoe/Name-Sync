# This file contains code from 4chan X (https://github.com/MayhemYDG/4chan-x)
# @license: https://github.com/MayhemYDG/4chan-x/blob/v3/LICENSE
class Post
  toString: -> @ID

  constructor: (root) ->
    @ID    = +root.id[2..]

    post   = $ '.post',     root
    info   = $ '.postInfo', post
    @nodes =
      root: root
      post: post
      info: info

    @isReply = $.hasClass post, 'reply'

    @info = {}
    if subject        = $ '.subject',      info
      @nodes.subject  = subject
    if name           = $ '.name',         info
      @nodes.name     = name
    if email          = $ '.useremail',    info
      @nodes.email    = email
    if tripcode       = $ '.postertrip',   info
      @nodes.tripcode = tripcode
    if capcode        = $ '.capcode.hand', info
      @info.capcode   = capcode.textContent.replace '## ', ''
