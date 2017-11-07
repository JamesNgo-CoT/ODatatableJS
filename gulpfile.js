const gulp = require('gulp');
const babel = require('gulp-babel');
const del = require('del');

gulp.task('auto', () => {
  gulp.watch('src/odatatable.js', ['clean', 'odatatable']);
});

gulp.task('clean', () => {
  del.sync(['dist']);
});

gulp.task('odatatable', () => {
  return gulp.src('src/**/*.js')
    .pipe(babel({ presets: [['env', { targets: { browsers: ['> 2% in CA', 'last 2 versions'] } }]]}))
    .pipe(gulp.dest('dist/'));
});
