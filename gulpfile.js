const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const del = require('del');
const gulp = require('gulp');
const print = require('gulp-print');
const rename = require("gulp-rename");
const sass = require('gulp-sass');
const uglify = require('gulp-uglify');

gulp.task('_message', () => {
  console.log('**************************************************');
  console.log('ODATATABLE JS');
  console.log('**************************************************');
});

gulp.task('_cleanJs', () => {
  return del(['dist/js']);
});

gulp.task('_compileJs', ['_cleanJs'], () => {
  return gulp.src(['src/js/odatatable.js'])
    .pipe(print())
    .pipe(concat('odatatable.js'))
    .pipe(babel({
      presets: [
        ['env', {
          targets: {
            browsers: ['> 2% in CA', 'last 2 versions']
          }
        }]
      ]
    }))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('uglifyJs', ['_compileJs'], () => {
  return gulp.src(['./dist/js/*.js'])
    .pipe(print())
    .pipe(rename((path) => {
      path.basename += '.min';
    }))
    .pipe(uglify())
    .pipe(gulp.dest('./dist/js'));
});

gulp.task('watch', () => {
  gulp.watch('./src/js/*.js', ['_message', 'uglifyJs']);
});

gulp.task('default', ['_message', 'uglifyJs', 'watch']);
