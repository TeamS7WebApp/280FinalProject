'use strict';

var gulp = require('gulp');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var rename = require("gulp-rename");

gulp.task('js:plain', function () {
  return gulp.src('./rosefire.js')
    .pipe(uglify())
    .pipe(rename({suffix: ".min"}))
    .on('error', gutil.log)
    .pipe(gulp.dest('./dist/js/'));
});

gulp.task('js:angular', function () {
  return gulp.src(['./rosefire.js', './rosefire-angular.js'])
    .pipe(uglify())
    .pipe(concat('rosefire-angular.js'))
    .pipe(rename({suffix: ".min"}))
    .on('error', gutil.log)
    .pipe(gulp.dest('./dist/js/'));
});

gulp.task('js', ['js:plain', 'js:angular']);
gulp.task('default', ['js']);


