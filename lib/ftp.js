var Ftp = require('ftp'),
  async = require('async'),
   path = require('path');

/**
 * Transforms an string into an array
 *
 * from: this/is/a/directory/file.php
 *   to: this, this/is, ..., this/is/a/directory/file.php
 *
 * @param boolean Option to reverse the result
 */
String.prototype.dirPaths = function (reverse) {
  var tmp = [];

  tmp = this.split('/').map(function (filename, index) {
    tmp.push(filename);
    return tmp.join('/');
  });

  return reverse ? tmp.reverse() : tmp;
}

/*
 * Get the last hash uploaded
 */
Ftp.prototype.getHash = function (cb) {
  this.get('.gulpftp', function (err, stream) {
    if( err ) {
      if( err.code == 550 ) {
        return cb(null, '');
      }

      return cb(err);
    }

    var hashFTP = '';
    stream.on('data', function (response) {
      hashFTP += response;
    }).on('end', function () {
      cb(null, hashFTP.trim());
    });
  });
}

/*
 * Upload file and create its path if doesn't exist
 */
Ftp.prototype.upload = function (input, filename, cb) {
  var self = this;
  this.mkdir(path.dirname(filename), true, function (err) {
    if( err ) {
      return cb(err);
    }

    self.put(input, filename, cb);
  });
}

Ftp.prototype.place = function (files, each, finishCb) {
  var self = this;

  async.eachLimit(Object.keys(files), 10, function (filename, next) {
    if( files[filename] ) {
      self.upload(filename, filename, function (err) {
        each(err, { name: filename, action: 'uploaded' }, next);
      });
    } else {
      self.remove(filename, function (err) {
        each(err, { name: filename, action: 'deleted' }, next);
      });
    }
  }, finishCb);
}

/*
 * Remove file. If there are no more files isnide folder, remove it.
 */
Ftp.prototype.remove = function (filename, cb) {
  var self = this;

  self.delete(filename, function (err) {
    if( err ) {
      return cb("Can't remove file");
    }

    var paths = path.dirname(filename).dirPaths(true);

    async.eachSeries(paths, function (filepath, cdup) {
      filepath = filepath + '/';

      self.list(filepath, false, function (err, list) {
        if( err ) {
          return cdup("Can't list files");
        }

        if( list.length == 0 ) {
          self.rmdir(filepath, function (err) {
            if( err ) {
              return cdup("Can't remove dir");
            }

            cdup();
          });
        } else {
          cdup(-1);
        }
      });
    }, function (err) {
      if( typeof err == "string" ) {
        return cb(err);
      }

      cb();
    });
  });
}

module.exports = new Ftp();
