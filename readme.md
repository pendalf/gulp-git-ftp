# [gulp](http://gulpjs.com)-git-ftp

> Gulp plugin to upload files based on the hash of the last commit found on the ftp-server inside a .gulpfile. If the file is not found or is empty, the files from ls-files are uploaded. Based on [gulp-gitmodified](https://github.com/mikaelbr/gulp-gitmodified)


## Before installing

The uploads are going to be uploaded to the root. It depends on the ftp user you are using. 

## Install

```bash
$ npm install --save-dev git://github.com/joseadrian/gulp-git-ftp.git#dev
```

## Usage

```js
var gulp = require('gulp');
var gitftp = require('gulp-git-ftp');

gulp.task('upload', function () {
  /*                       avoid node_modules files = faster */ 
  return gulp.src(['./**', '!./**/node_modules/**'])
             .pipe(gitftp());
});
```


## API

### gitftp()

Instead of adding the options to connect to the FTP server inside de gulpfile.s, which in some cases would be commited, the options are gotten from the git config file. 

```
git config gulp-gitftp.host localhost
git config gulp-gitftp.port 21
git config gulp-gitftp.user username
git config gulp-gitftp.password pass
```

## .ftpignore file
If you want to ignore files, create a file .ftpignore the same way you create .gitignore files.

## TO DO

- Option to set the path

## License

MIT © [Joseadrian](https://github.com/joseadrian)
