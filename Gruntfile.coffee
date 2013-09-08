# Taken from 4chan X (https://github.com/MayhemYDG/4chan-x)
# @license: https://github.com/MayhemYDG/4chan-x/blob/v3/LICENSE
module.exports = (grunt) ->

  # Project configuration.
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    concat:
      options: process: Object.create(null, data:
        get: -> grunt.config 'pkg'
        enumerable: true
      )
      coffee:
        src: [
          'src/<%= pkg.name %>.coffee'
        ]
        dest: 'tmp-<%= pkg.type %>/<%= pkg.name %>.coffee'
      crx:
        files:
          'builds/crx/manifest.json': 'src/manifest.json'
          'builds/crx/<%= pkg.name %>.js': [
            'src/banner.js'
            'tmp-<%= pkg.type %>/<%= pkg.name %>.js'
          ]
      userscript:
        files:
          'builds/<%= pkg.name %>.meta.js': 'src/metadata.js'
          'builds/<%= pkg.name %>.user.js': [
            'src/metadata.js'
            'src/banner.js'
            'tmp-<%= pkg.type %>/<%= pkg.name %>.js'
          ]
    copy:
      crx:
        src: 'img/icon*.png'
        dest: 'builds/crx/'
        expand: true
        flatten: true
    coffee:
      script:
        src:  'tmp-<%= pkg.type %>/<%= pkg.name %>.coffee'
        dest: 'tmp-<%= pkg.type %>/<%= pkg.name %>.js'
    concurrent:
      build: ['build-crx', 'build-userscript']
    shell:
      options:
        stdout: true
        stderr: true
        failOnError: true
    watch:
      options:
        interrupt: true
      all:
        files: [
          'Gruntfile.coffee'
          'package.json'
          'src/*'
          'img/*'
        ]
        tasks: 'build'
    compress:
      crx:
        options:
          archive: 'builds/<%= pkg.name %>.zip'
          level: 9
          pretty: true
        expand:  true
        flatten: true
        src: 'builds/crx/*'
        dest: '/'
    crx:
      prod:
        src: 'builds/crx/'
        dest: 'builds/<%= pkg.name %>.crx'
        privateKey: 'builds/crx.pem'
    clean:
      builds: 'builds'
      tmpcrx: 'tmp-crx'
      tmpuserscript: 'tmp-userscript'

  require('load-grunt-tasks') grunt

  grunt.registerTask 'default', ['build']

  grunt.registerTask 'set-build', 'Set the build type variable', (type) ->
    pkg = grunt.config 'pkg'
    pkg.type = type
    grunt.config 'pkg', pkg
    grunt.log.ok 'pkg.type = %s', type
  grunt.registerTask 'build', ['concurrent:build']
  grunt.registerTask 'build-crx', [
    'set-build:crx'
    'concat:coffee'
    'coffee:script'
    'concat:crx'
    'copy:crx'
    'compress:crx'
    'clean:tmpcrx'
    'crx:prod'
  ]
  grunt.registerTask 'build-userscript', [
    'set-build:userscript'
    'concat:coffee'
    'coffee:script'
    'concat:userscript'
    'clean:tmpuserscript'
  ]
