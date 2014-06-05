'use strict';
var gutil = require('gulp-util'),
  through = require('through2'),
   ignore = require('ignore'),
      git = require('gift'),
      ftp = require('ftp');

var repo = git('.git');
var ftp_client = new ftp();

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
        ftp_client.put(file.contents, file.relative, function(err) {
          gutil.log('File uploaded: ' + file.relative);
          cb();
        });
        stream.push(file);
      } else {
        cb();
      }
    }

    if( !! gitdiffFiles) {
      return checkfiles();
    }

    repo.git("log --pretty=format:'%H' -n 1", function( err, hashLocal ) {
      if( err ) {
        return checkfiles();
      }

      repo.git("diff --name-status HEAD~1.." + hashLocal + " -- " + filename, function( err, status ) {
        if( err ) {
          return checkfiles();
        }

        // Files from
        gitdiffFiles = status.match(/([A-Z]{1})\W(.+)/gm).filter(function(filename) {
          return filename.slice(0, 1) != 'D';
        }).map(function(filename) {
          return filename.slice(1).trim();
        });

        ftp_client.on('ready', checkfiles);
        ftp_client.connect({
          host: '127.0.0.1',
          port: '5000',
          user: 'admin',
          password: 'admin'
        });
      });
    });

  }, function(cb) {
    ftp_client.end();
    return cb();
  });
};
