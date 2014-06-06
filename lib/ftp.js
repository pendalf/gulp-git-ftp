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
  var _ftp = this;
  this.mkdir(path.dirname(filename), true, function (err) {
    if( err ) {
      return cb(err);
    }

    _ftp.put(input, filename, cb);
  });
}

/*
 * Remove file. If there are no more files isnide folder, remove it.
 */
Ftp.prototype.remove = function (filename, cb) {
  var _ftp = this;

  _ftp.delete(filename, function (err) {
    if( err ) {
      return cb("Can't remove file");
    }

    var paths = path.dirname(filename).dirPaths(true);

    async.eachSeries(paths, function (filepath, cdup) {
      filepath = filepath + '/';

      _ftp.list(filepath, false, function (err, list) {
        if( err ) {
          return cdup("Can't list files");
        }

        if( list.length == 0 ) {
          _ftp.rmdir(filepath, function (err) {
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
