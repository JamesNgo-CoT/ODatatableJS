const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const cssnano = require('gulp-cssnano');
const del = require('del');
const gulp = require('gulp');
const print = require('gulp-print');
const rename = require("gulp-rename");
const sass = require('gulp-sass');
const uglify = require('gulp-uglify');

const fileName = 'odatatable';

gulp.task('_cleanCss', () => {
  return del(['dist/css']);
});

gulp.task('_compileCss', ['_cleanCss'], () => {
  return gulp.src(['src/scss/odatatable.scss'])
    .pipe(print())
    .pipe(concat(fileName + '.css'))
    .pipe(sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['> 2% in CA', 'last 2 versions']
    }))
    .pipe(gulp.dest('dist/css'));
});

gulp.task('uglifyCss', ['_compileCss'], () => {
  return gulp.src(['./dist/css/*.css'])
    .pipe(print())
    .pipe(rename((path) => {
      path.basename += '.min';
    }))
    .pipe(cssnano({zindex: false}))
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('_cleanJs', () => {
  return del(['dist/js']);
});

gulp.task('_compileJs', ['_cleanJs'], () => {
  return gulp.src(['src/js/odatatable.js'])
    .pipe(print())
    .pipe(concat(fileName + '.js'))
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
  gulp.watch('src/scss/*.scss', ['uglifyCss']);
  gulp.watch('src/js/*.js', ['uglifyJs']);
});

gulp.task('default', ['uglifyCss', 'uglifyJs', 'watch']);
