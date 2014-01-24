// For more information on how to configure a task runner, please visit:
// https://github.com/gulpjs/gulp

var gulp        = require('gulp');
var gutil       = require('gulp-util');
var clean       = require('gulp-clean');
var concat      = require('gulp-concat');
var rename      = require('gulp-rename');
var uglify      = require('gulp-uglify');
var less        = require('gulp-less');
var csso        = require('gulp-csso');
var es          = require('event-stream');
var embedlr     = require("gulp-embedlr");
var livereload  = require('gulp-livereload');
var path        = require('path');
var express     = require('express');
var lr          = require('tiny-lr');
var server      = lr();

// Create a server for static files
// For more information, please visit: https://github.com/visionmedia/express
var app = express();
app.use(express.static(path.resolve('./dist')));
app.listen(8080, function() {
    gutil.log('Listening on http://localhost:8080');
});

gulp.task('clean', function() {
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
        .pipe(livereload(server));
});

gulp.task('styles', function () {
    // Compile LESS files
    return gulp.src('src/less/app.less')
        .pipe(less())
        .pipe(rename('app.css'))
        .pipe(csso())
        .pipe(gulp.dest('dist/css'))
        .pipe(livereload(server));
});

// The dist task (used to store all files that will go to the server)
gulp.task('dist', function () {
    gulp.run('clean', 'copy', 'scripts', 'styles');
});

// The default task (called when you run `gulp`)
gulp.task('default', function () {

    gulp.run('dist');

    // Create a LiveReload server and watch for modifications in *.less and *.js files
    // For more information, please visit: https://github.com/mklabs/tiny-lr
    server.listen(35729, function (err) {
        if (err) {
            return console.log(err);
        };

        // Watch .js files and run tasks if they change
        gulp.watch('src/js/**', function () {
            gulp.run('scripts');
        });

        // Watch .less files and run tasks if they change
        gulp.watch('src/less/**/*.less', function () {
            gulp.run('styles');
        });

        gulp.src("./src/*.html")
            .pipe(embedlr())
            .pipe(gulp.dest("./dist"));
    });
});
