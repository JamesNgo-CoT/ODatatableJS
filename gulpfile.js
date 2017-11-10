const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');
const del = require('del');
const gulp = require('gulp');
const sass = require('gulp-sass');

gulp.task('watch', () => {
  gulp.watch('src/**/*.js', ['clean', 'styles', 'scripts']);
  gulp.watch('src/**/*.scss', ['clean', 'styles', 'scripts']);
});

gulp.task('clean', () => {
  del.sync(['dist']);
});

gulp.task('styles', () => {
  return gulp.src('src/**/*.scss')
    .pipe(sass.sync({ outputStyle: 'expanded', precision: 10, includePaths: ['.'] }))
    .pipe(autoprefixer({ browsers: ['> 2% in CA', 'last 2 versions'] }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('scripts', () => {
  return gulp.src('src/**/*.js')
    .pipe(babel({ presets: [['env', { targets: { browsers: ['> 2% in CA', 'last 2 versions'] } }]]}))
    .pipe(gulp.dest('dist/'));
});
