# [gulp](http://gulpjs.com)-git-ftp

> Gulp plugin to upload files based on diff between 2 commits. Based on [gulp-gitmodified](https://github.com/mikaelbr/gulp-gitmodified)


## Install

```bash
$ npm install --save-dev gulp-git-ftp
```


## Usage

```js
var gulp = require('gulp');
var gitftp = require('gulp-git-ftp');

gulp.task('default', function () {
	return gulp.src('./**', /* avoid node_modules files = faster */ '!./**/node_modules/**')
		.pipe(gitftp())
		.pipe(gulp.dest('dist'));
});
```


## API

### gitftp(options)

#### options

##### host

Type: `String`  
Default: `localhost`

Lorem ipsum.


## License

MIT © [Joseadrian](https://github.com/joseadrian)
