// Taken from 4chan X (https://github.com/MayhemYDG/4chan-x)
// @license: https://github.com/MayhemYDG/4chan-x/blob/v3/LICENSE

module.exports = function(grunt) {

  var pkg = grunt.file.readJSON('package.json');
  var concatOptions = {
    process: {
      data: pkg
    }
  };

  // Project configuration.
  grunt.initConfig({
    pkg: pkg,
    concat: {
      coffee: {
        options: concatOptions,
        src: [
          'src/<%= pkg.name %>.coffee'
        ],
        dest: 'tmp-<%= pkg.type %>/<%= pkg.name %>.coffee'
      },
      crx: {
        options: concatOptions,
        files: {
          'builds/crx/manifest.json': 'src/manifest.json',
          'builds/crx/<%= pkg.name %>.js': [
            'src/banner.js',
            'tmp-<%= pkg.type %>/<%= pkg.name %>.js'
          ]
        }
      },
      userscript: {
        options: concatOptions,
        files: {
          'builds/<%= pkg.name %>.meta.js': 'src/metadata.js',
          'builds/<%= pkg.name %>.user.js': [
            'src/metadata.js',
            'src/banner.js',
            'tmp-<%= pkg.type %>/<%= pkg.name %>.js'
          ]
        }
      }
    },
    copy: {
      crx: {
        src: 'img/icon*.png',
        dest: 'builds/crx/',
        expand: true,
        flatten: true
      },
      nex: {
        src:  'builds/<%= pkg.name %>.zip',
        dest: 'builds/<%= pkg.name %>.nex'
      }
    },
    coffee: {
      script: {
        src:  'tmp-<%= pkg.type %>/<%= pkg.name %>.coffee',
        dest: 'tmp-<%= pkg.type %>/<%= pkg.name %>.js'
      }
    },
    concurrent: {
      build: ['build-crx', 'build-userscript']
    },
    watch: {
      all: {
        options: {
          interrupt: true
        },
        files: [
          'Gruntfile.js',
          'package.json',
          'src/*',
          'img/*'
        ],
        tasks: 'build'
      }
    },
    compress: {
      crx: {
        options: {
          archive: 'builds/<%= pkg.name %>.zip',
          level: 9,
          pretty: true
        },
        expand: true,
        flatten: true,
        src: 'builds/crx/*',
        dest: '/'
      }
    },
    crx: {
      prod: {
        src: 'builds/crx/',
        dest: 'builds/NameSync.crx',
        privateKey: 'builds/crx.pem'
      }
    },
    clean: {
      builds: 'builds',
      tmpcrx: 'tmp-crx',
      tmpuserscript: 'tmp-userscript'
    }
  });

  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-crx');

  grunt.registerTask('default', ['build']);

  grunt.registerTask('set-build', 'Set the build type variable', function(type) {
    pkg.type = type;
    grunt.log.ok('pkg.type = %s', type);
  });
  grunt.registerTask('build', ['concurrent:build']);
  grunt.registerTask('build-crx', [
    'set-build:crx',
    'concat:coffee',
    'coffee:script',
    'concat:crx',
    'copy:crx',
    'compress:crx',
    'copy:nex',
    'clean:tmpcrx',
    'crx:prod'
  ]);
  grunt.registerTask('build-userscript', [
    'set-build:userscript',
    'concat:coffee',
    'coffee:script',
    'concat:userscript',
    'clean:tmpuserscript'
  ]);

};
