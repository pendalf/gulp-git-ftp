var exec = require('child_process').execFile,
   which = require('which');

var git_opts = { env: process.env };

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

Git.prototype.getConfig = function (env, cb) {
  var args = [],
    copts = [
        'host', 'port', 'user', 'password', 'path',
        'secure', 'connTimeout', 'pasvTimeout', 'keepalive'
      ];

  args.push('config');
  args.push('--get-regexp');
  args.push('^' + env);

  this.cmd(args, git_opts, function (err, stdout, stderr) {
    if( err ) {
      return cb('Set "git config ' + env + '.<propertie> <value>"');
    }

    var opts = {}, replace = new RegExp(env + '.', 'g');

    stdout.trim().replace(replace, '').split('\n').forEach(function(opt) {
      var opt = opt.split(' ');
      opts[opt[0]] = opt[1].trim();
    });

    cb(null, opts);
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

Git.prototype.getFiles = function(prevCommit, lastCommit, cb) {
  // console.log(Git.getConfig('gulp-gitftp'))
  if(lastCommit == '') {
    this.getLsFiles(cb);
  } else {
    this.getDiffFiles(prevCommit, lastCommit, cb);
  }
}

Git.prototype.getLsFiles = function(cb) {
  var args = [];

  args.push('ls-files');

  this.cmd(args, git_opts, function(err, stdout, stderr) {
    if( err ) {
      return cb(new Error('Error trying to get ls files'));
    }

    var files = {};
    stdout.trim().split(/\n/gm).forEach(function(filename) {
      files[filename.trim()] = true;
    });

    return cb(null, files);
  });
}

Git.prototype.getDiffFiles = function(prevCommit, lastCommit, cb) {
  var args = [],
   commits = [lastCommit, '..', prevCommit].join('');

  args.push('diff');
  args.push('--name-status');
  args.push(commits);

  this.cmd(args, git_opts, function(err, stdout, stderr) {
    var files = {};

    if( err ) {
      return cb(new Error('Error trying to get diff'));
    }

    if(stdout == '') {
      return cb(null, files);
    }

    stdout.trim().match(/([A-Z]{1})\W(.+)/gm).forEach(function(filename) {
      files[filename.slice(1).trim()] = filename.slice(0, 1) != 'D';
    });
    return cb(null, files);
  });
}

module.exports = new Git();