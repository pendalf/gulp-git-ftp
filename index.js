'use strict';
var gutil = require('gulp-util'),
  through = require('through2'),
   ignore = require('ignore'),
    async = require('async'),
      git = require('./lib/git'),
      ftp = require('./lib/ftp');

var pluginName = 'gulp-git-ftp';

module.exports = function (options, files) {

  var ignoreFiles = ignore().addIgnoreFile(['.ftpignore']), gitFiles = null;

  return through.obj(function (file, encoding, keep) {

    var stream = this;

    var checkFiles = function () {
      if (file.isNull()) {
        stream.push(file);
        return keep();
      }

      if (file.isStream()) {
        stream.emit('error', new gutil.PluginError(pluginName, 'Streaming not supported'));
        return keep();
      }

      if( ignoreFiles.filter([file.relative]).length > 0 &&
          typeof gitFiles[file.relative] != "undefined" ) {

        stream.push(file);
        return keep();
      }

      return keep();
    }

    if( !! gitFiles) {
      return checkFiles();
    }

    ftp.on('ready', function() {
      async.series({
        local: function(cb) {
          git.getLastCommit(cb);
        },
        server: function(cb) {
          ftp.getHash(cb);
        }
      }, function(err, commits) {
        if( err ) {
          throw new gutil.PluginError(pluginName, err);
        }

        git.getFiles(commits.local, commits.server, function(err, files) {
          if( err ) {
            throw new gutil.PluginError(pluginName, err);
          }

          if( ! Object.keys(files).length ) {
            gutil.log(pluginName, gutil.colors.green('Everything up-to-date'));
            return ftp.end();
          }

          ftp.upload(new Buffer(commits.local, 'utf-8'), '.gulpftp', function(err) {
            if( err ) {

            }

            checkFiles();
          });

          gitFiles = files;
        });
      });
    });

    ftp.connect(options);

  }, function(finish) {
    ftp.place(gitFiles, function(err, file, next) {
      var message = 'File ' + file.name + ': ' + file.action;
      gutil.log(pluginName, gutil.colors[err ? 'red' : 'green'](message));
      next();
    }, function(err) {
      ftp.end();
      finish();
    })
  });
};
