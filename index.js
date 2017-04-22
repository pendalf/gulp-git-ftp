'use strict';
var gutil = require('gulp-util'),
  through = require('through2'),
   ignore = require('ignore')(),
    async = require('async'),
      git = require('./lib/git'),
      ftp = require('./lib/ftp');

var pluginName = 'gulp-git-ftp:';

module.exports = function (patterns) {

  var remoteDir = patterns.remoteDir || '';

  var ignoreFiles = ignore.addIgnoreFile(['.gitignore', '.ftpignore']),
         gitFiles = null;

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
          ftp.getHash(remoteDir, cb);
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

          ftp.upload(new Buffer(commits.local, 'utf-8'), remoteDir + '.gulpftp', function(err) {
            if( err ) {

            }

            checkFiles();
          });

          gitFiles = files;

          for (var key in gitFiles){
            if( ignoreFiles.filter([key]).length < 1 &&
                typeof gitFiles[key] != "undefined" ) {

              delete gitFiles[key];
            }
          }
        });
      });
    }).on('error', function(err) {
      gutil.log(pluginName, gutil.colors.red(err.message));
    });

    git.getConfig('gulp-gitftp', function(err, connProperties) {
      if (err) {
        throw new gutil.PluginError(pluginName, err);
      }

      ftp.connect(connProperties);
    });

  }, function(finish) {
    ftp.place(gitFiles, function(err, file, next) {
      var message = 'File ' + file.name + ': ' + file.action;
      gutil.log(pluginName, gutil.colors[err ? 'red' : 'green'](message));
      next();
    }, remoteDir, function(err) {
      ftp.end();
      finish();
    })
  });
};
