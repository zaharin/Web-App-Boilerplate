// For more information on how to configure a task runner, please visit:
// https://github.com/gulpjs/gulp

var gulp       = require('gulp');
var gutil      = require('gulp-util');
var clean      = require('gulp-clean');
var concat     = require('gulp-concat');
var rename     = require('gulp-rename');
var uglify     = require('gulp-uglify');
var less       = require('gulp-less');
var csso       = require('gulp-csso');
var es         = require('event-stream');
var embedlr    = require("gulp-embedlr");
var refresh    = require('gulp-livereload');
var express    = require('express');
var http       = require('http');
var lr         = require('tiny-lr')();

gulp.task('clean', function () {
    // Clear the destination folder
    gulp.src('dist/**/*.*', { read: false })
        .pipe(clean());
});

gulp.task('copy', function () {
    // Copy all application files except *.less and .js into the `dist` folder
    return es.concat(
        gulp.src(['src/img/**'])
            .pipe(gulp.dest('dist/img')),
        gulp.src(['src/js/vendor/**'])
            .pipe(gulp.dest('dist/js/vendor')),
        gulp.src(['src/*.*'])
            .pipe(gulp.dest('dist'))
    );
});

gulp.task('scripts', function () {
    // Concatenate, minify and copy all JavaScript (except vendor scripts)
    return gulp.src(['src/js/**/*.js', '!src/js/vendor/**'])
        .pipe(concat('app.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'))
        .pipe(refresh(lr));
});

gulp.task('styles', function () {
    // Compile LESS files
    return gulp.src('src/less/app.less')
        .pipe(less())
        .pipe(rename('app.css'))
        .pipe(csso())
        .pipe(gulp.dest('dist/css'))
        .pipe(refresh(lr));
});

gulp.task('server', function () {
    // Create a HTTP server for static files
    var port = 3000;
    var app = express();
    var server = http.createServer(app);
    
    app.use(express.static(__dirname + '/dist'));

    server.on("listening", function () {
        gutil.log("Listening on http://locahost:" + server.address().port);
    });

    server.on('error', function(err) {
        if (err.code === 'EADDRINUSE') {
            gutil.log('Address in use, retrying...');
            setTimeout(function () {
                server.close();
                server.listen(port);
            }, 1000);
        }
    });

    server.listen(port);
});

gulp.task('lr-server', function () {
    // Create a LiveReload server
    lr.listen(35729, function (err) {
        if (err) {
            gutil.log(err);
        }
    });
});

gulp.task('watch', function () {
    // Watch .js files and run tasks if they change
    gulp.watch('src/js/**', ['scripts']);

    // Watch .less files and run tasks if they change
    gulp.watch('src/less/**/*.less', ['styles']);

    gulp.src("./src/*.html")
        .pipe(embedlr())
        .pipe(gulp.dest("./dist"));
});

// The dist task (used to store all files that will go to the server)
gulp.task('dist', ['clean', 'copy', 'scripts', 'styles']);

// The default task (called when you run `gulp`)
gulp.task('default', ['clean', 'copy', 'scripts', 'styles', 'lr-server', 'server', 'watch']);
