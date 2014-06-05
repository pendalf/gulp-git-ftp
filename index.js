'use strict';
var gutil = require('gulp-util'),
  through = require('through2'),
   ignore = require('ignore'),
      git = require('gift');

var repo = git('.git');

module.exports = function (options) {

  if(options.ignore === undefined) {
    options.ignore = [];
  }

  var ignoreFiles = ignore().addIgnoreFile(['.ftpignore'].concat(options.ignore));
  var gitdiffFiles = null;

  return through.obj(function (file, encoding, cb) {

    var stream = this;
    var filename = file.relative;

    var checkfiles = function () {
      if (file.isNull()) {
        stream.push(file);
        return cb();
      }

      if (file.isStream()) {
        stream.emit('error', new gutil.PluginError('gulp-src-ignore', 'Streaming not supported'));
        return cb();
      }

      if( ignoreFiles.filter([file.relative]).length > 0 && gitdiffFiles.indexOf(filename) >= 0) {
       stream.push(file);
       console.log(filename );
      }

      return cb();
    }

    if( !! gitdiffFiles) {
      return checkfiles();
    }

    repo.git("log --pretty=format:'%H' -n 1", function( err, hashLocal ) {
      if( err ) {
        return checkfiles();
      }

      repo.git("diff --name-status HEAD^.." + hashLocal + " -- " + filename, function( err, status ) {
        if( err ) {
          return checkfiles();
        }

        // Files from
        gitdiffFiles = status.match(/([A-Z]{1})\W(.+)/gm).filter(function(filename) {
          return filename.slice(0, 1) != 'D';
        }).map(function(filename) {
          return filename.slice(1).trim();
        });

        checkfiles();
      });
    });

  });
};
