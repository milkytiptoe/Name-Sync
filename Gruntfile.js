// Taken from 4chan X (https://github.com/MayhemYDG/4chan-x)
// @license: https://github.com/MayhemYDG/4chan-x/blob/v3/LICENSE

module.exports = function(grunt) {

  var pkg = grunt.file.readJSON('package.json');

  // Project configuration.
  grunt.initConfig({
    pkg: pkg,
    concat: {
      coffee: {
        options: { process: { data: pkg } },
        src: [
          'src/<%= pkg.name %>.coffee',
        ],
        dest: 'tmp/script.coffee'
      },
      crx: {
        options: { process: { data: pkg } },
        files: {
          'builds/chrome/manifest.json': 'src/manifest.json',
          'builds/chrome/<%= pkg.name %>.js': [
            'src/banner.js',
            'tmp/script.js'
          ]
        }
      },
      userjs: {
        options: { process: { data: pkg } },
        src: [
          'src/metadata.js',
          'src/banner.js',
          'tmp/script.js'
        ],
        dest: 'builds/opera/<%= pkg.name %>.js'
      },
      userscript: {
        options: { process: { data: pkg } },
        files: {
          'builds/firefox/<%= pkg.name %>.meta.js': 'src/metadata.js',
          'builds/firefox/<%= pkg.name %>.user.js': [
            'src/metadata.js',
            'src/banner.js',
            'tmp/script.js'
          ]
        }
      }
    },
    copy: {
      crx: {
        src: 'img/icon*.png',
        dest: 'builds/chrome/',
        expand: true,
        flatten: true
      }
    },
    coffee: {
      script: {
        src:  'tmp/script.coffee',
        dest: 'tmp/script.js'
      }
    },
    compress: {
      crx: {
        options: {
          archive: 'builds/chrome/<%= pkg.name %>.zip',
          level: 9,
          pretty: true
        },
        expand: true,
        flatten: true,
        src: 'builds/chrome/*',
        dest: '/'
      }
    },
    clean: {
      builds: 'builds/*',
      tmp: 'tmp'
    }
  });

  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['clean', 'build']);
  grunt.registerTask('set-build', 'Set the build type variable', function(type) {
    pkg.type = type;
    grunt.log.ok('pkg.type = %s', type);
  });
  grunt.registerTask('build', ['build-crx', 'build-userjs', 'build-userscript']);
  grunt.registerTask('build-crx', [
    'set-build:crx',
    'concat:coffee',
    'coffee:script',
    'concat:crx',
    'copy:crx',
    'compress:crx',
    'clean:tmp'
  ]);
  grunt.registerTask('build-userjs', [
    'set-build:userjs',
    'concat:coffee',
    'coffee:script',
    'concat:userjs',
    'clean:tmp'
  ]);
  grunt.registerTask('build-userscript', [
    'set-build:userscript',
    'concat:coffee',
    'coffee:script',
    'concat:userscript',
    'clean:tmp'
  ]);

};
