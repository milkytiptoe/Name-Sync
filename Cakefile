{log}  = console
{exec} = require 'child_process'
fs     = require 'fs'

VERSION = '4.0.2'

HEADERUS = """
// ==UserScript==
// @name           4chan X Name Sync
// @version        #{VERSION}
// @namespace      milky
// @description    Enables names on 4chan's forced anon boards. Requires 4chan X v3.
// @author         milkytiptoe
// @author         ihavenoface
// @run-at         document-start
// @include        *://boards.4chan.org/b/*
// @include        *://boards.4chan.org/q/*
// @include        *://boards.4chan.org/soc/*
// @updateURL      https://github.com/milkytiptoe/Name-Sync/raw/master/builds/firefox/NameSync.user.js
// @downloadURL    https://github.com/milkytiptoe/Name-Sync/raw/master/builds/firefox/NameSync.user.js
// @icon           http://www.milkyis.me/namesync/logo.png
// ==/UserScript==


"""

HEADERJS = """
/*
  4chan X Name Sync v#{VERSION}  
  http://milkytiptoe.github.io/Name-Sync/
  
  Developers: milkytiptoe and ihavenoface
  
  Contributers: https://github.com/milkytiptoe/Name-Sync/graphs/contributors
  
  This script contains code from 4chan X (https://github.com/MayhemYDG/4chan-x)
  @license: https://github.com/MayhemYDG/4chan-x/blob/v3/LICENSE
*/


"""


CAKEFILE  = 'Cakefile'
INFILE    = 'NameSync.coffee'

task 'build', ->
  exec 'coffee --print ' + INFILE, {maxBuffer: 1024 * 1024}, (err, stdout, stderr) ->
    throw err if err
    fs.writeFile 'builds/firefox/NameSync.user.js', HEADERUS + HEADERJS + stdout, (err) ->
      throw err if err
    fs.writeFile 'builds/opera/NameSync.js', HEADERUS + HEADERJS + stdout, (err) ->
      throw err if err
    fs.writeFile 'builds/chrome/NameSync.js', HEADERJS + stdout, (err) ->
      throw err if err
      
task 'dev', ->
  invoke 'build'
  fs.watchFile INFILE, interval: 250, (curr, prev) ->
    if curr.mtime > prev.mtime
      invoke 'build'
