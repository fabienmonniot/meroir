module.exports = function (grunt) {

    grunt.initConfig({
        less: {
            dist: {
                src: ['_dev/less/index.less'],
                dest: '_dev/css/main.css'
            },
            options: {
                strictMath: true
            }
        },
        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            normal: {
                files: {
                    'www/css/libs.min.css' :
                    ['bower_components/bootstrap/dist/css/bootstrap.min.css'],
                    'www/css/main.min.css': ['_dev/css/*.css']
                }
            },
            watch: {
                files: {
                    'www/css/main.min.css': ['_dev/css/*.css']
                }
            }
        },
        uglify: {
            normal: {
                options: {
                    mangle: {
                        except: ['jQuery', 'initMap', 'handleClientLoad']
                    }
                },
                files: {
                    'www/js/libs.min.js' :
                    ['bower_components/jquery/dist/jquery.min.js',
                     'bower_components/bootstrap/dist/js/bootstrap.min.js'],
                    'www/js/main.min.js': ['_dev/js/*.js']
                }
            },
            watch: {
                options: {
                    mangle: {
                        except: ['jQuery', 'initMap', 'handleClientLoad']
                    }
                },
                files: {
                    'www/js/main.min.js': ['_dev/js/*.js']
                }
            }
        },
        watch: {
            files: ['_dev/**'],
            tasks: ['less:dist', 'cssmin:watch', 'uglify:watch']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['less:dist', 'cssmin:normal', 'uglify:normal']);
    grunt.registerTask('watch-src', ['watch']);

};