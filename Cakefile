{log}  = console
{exec} = require 'child_process'
fs     = require 'fs'

VERSION = '4.0.0'

HEADER  = """
// ==UserScript==
// @name           4chan X Name Sync
// @version        #{VERSION}
// @namespace      milky
// @description    Shares names with other posters on 4chan's forced anon boards. Requires 4chan X v3.
// @author         milkytiptoe
// @author         ihavenoface
// @run-at         document-idle
// @include        *://boards.4chan.org/b/*
// @include        *://boards.4chan.org/q/*
// @include        *://boards.4chan.org/soc/*
// @updateURL      https://github.com/milkytiptoe/Name-Sync/raw/master/NameSync.user.js
// @downloadURL    https://github.com/milkytiptoe/Name-Sync/raw/master/NameSync.user.js
// @homepage       http://milkytiptoe.github.com/Name-Sync/
// @icon           data:image/gif;base64,R0lGODlhIAAgAMQQABAQEM/Pz9/f3zAwMH9/f+/v7yAgIGBgYJ+fn6+vr4+Pj1BQUHBwcL+/v0BAQAAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABAALAAAAAAgACAAAAXNICSOZGmeaKqubOu6QvC+DSDPopAQfFOMjYdthhg8jsiHowEJKmGOpPToUFBbAcB0i3SwBNqkYUE4GLbeVRRpQJQaxmQ6lUgOfqKDYx/vqpEAeCJZXHMnAkkEJoRThiYISYIkAg2Vlg03OJqbnC8MDgcEbikBew5hQpkjBUkMKk5TQyQESaomsLECQHYruA8DTCUIqA/BKb4PBgpMAghrSAcsyFxIAy1OBsRcB5LHVAIH1AYJLwJGaQIEDmdKB+Q4BQMLnSkF7/T4+fr4IQA7
// ==/UserScript==

// Contributers: https://github.com/milkytiptoe/Name-Sync/graphs/contributors

// This script contains code from 4chan X (https://github.com/MayhemYDG/4chan-x)
// @license: https://github.com/MayhemYDG/4chan-x/blob/v3/LICENSE


"""

CAKEFILE  = 'Cakefile'
INFILE    = 'NameSync.coffee'
OUTFILE   = 'NameSync.user.js'

task 'build', ->
  exec 'coffee --print NameSync.coffee', {maxBuffer: 1024 * 1024}, (err, stdout, stderr) ->
    throw err if err
    fs.writeFile OUTFILE, HEADER + stdout, (err) ->
      throw err if err

task 'dev', ->
  invoke 'build'
  fs.watchFile INFILE, interval: 250, (curr, prev) ->
    if curr.mtime > prev.mtime
      invoke 'build'
