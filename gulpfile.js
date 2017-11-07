const babel = require('gulp-babel');

gulp.task('auto', () => {
  gulp.watch('src/odatatable.js', ['odatatable']);
});

gulp.task('odatatable', () => {
  return gulp.src('src/odatatable.js')
    .pipe(babel({ presets: [['env', { targets: { browsers: ['> 2% in CA', 'last 2 versions'] } }]]}))
    .on("error", notify.onError(function(error) {
      let msg = error.message;
      if (msg.indexOf('Couldn\'t find preset "env"') > -1) {
        msg += '\n\n!!!!!\nMake sure you\'ve installed the babel-preset-env npm package with: npm install babel-preset-env --save-dev\n!!!!!\n\n';
      }
      return msg;
    }))
    .pipe(gulp.dest('src/odatatable.js'));
});
