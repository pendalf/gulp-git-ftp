var exec = require('child_process').execFile,
   which = require('which');

var git_opts = { env: process.env },
    status = {
      'M': 'modified',
      'A': 'added',
      'D': 'deleted',
      'R': 'renamed'
    };

var Git = function () {
};

Git.prototype.cmd = function (args, opts, cb) {
  which('git', function( err ) {
    if( err ) {
      return cb(new Error('git not found'));
    }

    exec('git', args, opts, cb);
  });
}

Git.prototype.getLastCommit = function(cb) {
  var args = [];

  args.push('rev-parse');
  args.push("HEAD");

  this.cmd(args, git_opts, function(err, stdout, stderr) {

    if( err ) {
      return cb(new Error('Error trying to get last commit'));
    }

    cb(null, stdout.trim());
  });
}

Git.prototype.getDiffFiles = function(prevCommit, lastCommit, file, cb) {
  var args = [],
   commits = [prevCommit, '..', lastCommit].join('');

  args.push('diff');
  args.push('--name-status');
  args.push(commits);

  this.cmd(args, git_opts, function(err, stdout, stderr) {
    if( err ) {
      return cb(new Error('Error trying to get diff'));
    }

    var files = {};
    stdout.match(/([A-Z]{1})\W(.+)/gm).forEach(function(filename) {
      files[filename.slice(1).trim()] = status[filename.slice(0, 1)];
    });

    return cb(null, files);
  });
}

module.exports = new Git();
