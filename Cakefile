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
// @icon           http://i.imgur.com/o7QVJ04.png
// ==/UserScript==


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
