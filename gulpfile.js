// For more information on how to configure a task runner, please visit:
// https://github.com/gulpjs/gulp

var gulp    = require('gulp');
var gutil   = require('gulp-util');
var clean   = require('gulp-clean');
var concat  = require('gulp-concat');
var rename  = require('gulp-rename');
var jshint  = require('gulp-jshint');
var inject  = require("gulp-inject");
var uglify  = require('gulp-uglify');
var less    = require('gulp-less');
var csso    = require('gulp-csso');
var es      = require('event-stream');
var embedlr = require('gulp-embedlr');
var refresh = require('gulp-livereload');
var express = require('express');
var http    = require('http');
var server      = require('tiny-lr')();
var rev = require('gulp-rev');

gulp.task('clean', function () {
    // Clear the destination folder
    return gulp.src('dist/**/*.*', { read: false })
        .pipe(clean({ force: true }));
});

gulp.task('copy', function () {
    // Copy all application files except *.less and .js into the `dist` folder
    return es.concat(
        gulp.src(['src/**/*', '!src/less/*.less', '!src/js/*.js'])
            .pipe(gulp.dest('dist'))
    );
});

gulp.task('scripts', function () {
    return es.concat(
        // Detect errors and potential problems in your JavaScript code
        // You can enable or disable default JSHint options in the .jshintrc file
        gulp.src(['src/js/**/*.js', '!src/js/vendor/**'])
            .pipe(jshint('.jshintrc'))
            .pipe(jshint.reporter(require('jshint-stylish'))),

        // Concatenate, minify and copy all JavaScript (except vendor scripts)
        gulp.src(['src/js/**/*.js', '!src/js/vendor/**'])
            .pipe(concat('app.js'))
            .pipe(uglify())
            .pipe(rev())
            .pipe(gulp.dest('dist/js'))
            .pipe(refresh(server))
    );
});

gulp.task('styles', function () {
    // Compile LESS files
    return gulp.src('src/less/app.less')
        .pipe(less())
        .pipe(rename('app.css'))
        .pipe(csso())
        .pipe(rev())
        .pipe(gulp.dest('dist/css'))
        .pipe(refresh(server));
});


gulp.task('server', function () {
    // Create a HTTP server for static files
    var port = 3000;
    var app = express();
    app.use(express.static(__dirname + '/src'));

    var server = http.createServer(app);
    server.on('listening', function () {
        gutil.log('Listening on http://localhost:' + server.address().port);
    });

    server.on('error', function (err) {
        if (err.code === 'EADDRINUSE') {
            gutil.log('Address in use, retrying...');
            setTimeout(function () {
                server.listen(port);
            }, 1000);
        }
    });

    server.listen(port);
});

gulp.task('lr-server', function () {
    // Create a LiveReload server
    server.listen(35729, function (err) {
        if (err) {
            gutil.log(err);
        }
    });
});

function notifyLivereload(event) {
    gulp.src(event.path, {read: false})
        .pipe(refresh(server));
}

gulp.task('watch', function () {
    // Watch .js files and run tasks if they change
    gulp.watch('src/js/**/*.js', notifyLivereload);

    // Watch .less files and run tasks if they change
    gulp.watch('src/less/**/*.less', notifyLivereload);

    gulp.watch('src/*.html', notifyLivereload);
});

// The dist task (used to store all files that will go to the server)
gulp.task('dist', ['clean', 'copy', 'scripts', 'styles'], function() {

    // Now we src all html files
    return gulp.src('src/*.html')
        .pipe(inject(gulp.src(["./dist/**/*.*", '!./dist/js/vendor/**'], {read: false}), {
            addRootSlash: false,  // ensures proper relative paths
            ignorePath: '/dist/' // ensures proper relative paths
        }))
        .pipe(gulp.dest("./dist"));
});

// The default task (called when you run `gulp`)
gulp.task('default', ['clean', 'copy', 'scripts', 'styles', 'lr-server', 'server', 'watch']);
