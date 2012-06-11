// Generated by CoffeeScript 1.3.3
(function() {
  var balUtilFlow, balUtilModules,
    __slice = [].slice;

  balUtilModules = null;

  balUtilFlow = require(__dirname + '/flow');

  balUtilModules = {
    spawn: function(commands, options, callback) {
      var command, createHandler, exec, results, spawn, tasks, _i, _len, _ref;
      _ref = require('child_process'), spawn = _ref.spawn, exec = _ref.exec;
      results = [];
      options || (options = {});
      tasks = new balUtilFlow.Group(function(err) {
        return callback.apply(callback, [err, results]);
      });
      createHandler = function(command) {
        return function() {
          var err, pid, stderr, stdout;
          pid = null;
          err = null;
          stdout = '';
          stderr = '';
          if (typeof command === 'string') {
            command = command.split(' ');
          }
          if (command instanceof Array) {
            pid = spawn(command[0], command.slice(1), options);
          } else {
            pid = spawn(command.command, command.args || [], command.options || options);
          }
          pid.stdout.on('data', function(data) {
            var dataStr;
            dataStr = data.toString();
            if (options.output) {
              process.stdout.write(dataStr);
            }
            return stdout += dataStr;
          });
          pid.stderr.on('data', function(data) {
            var dataStr;
            dataStr = data.toString();
            if (options.output) {
              process.stderr.write(dataStr);
            }
            return stderr += dataStr;
          });
          return pid.on('exit', function(code, signal) {
            err = null;
            if (code === 1) {
              err = new Error(stderr || 'exited with failure code');
            }
            results.push([err, stdout, stderr, code, signal]);
            return tasks.complete(err);
          });
        };
      };
      if (!(commands instanceof Array)) {
        commands = [commands];
      }
      for (_i = 0, _len = commands.length; _i < _len; _i++) {
        command = commands[_i];
        tasks.push(createHandler(command));
      }
      tasks.sync();
      return this;
    },
    exec: function(commands, options, callback) {
      var command, createHandler, exec, results, spawn, tasks, _i, _len, _ref;
      _ref = require('child_process'), spawn = _ref.spawn, exec = _ref.exec;
      results = [];
      tasks = new balUtilFlow.Group(function(err) {
        return callback.apply(callback, [err, results]);
      });
      createHandler = function(command) {
        return function() {
          return exec(command, options, function() {
            var args, err;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            err = args[0] || null;
            results.push(args);
            return tasks.complete(err);
          });
        };
      };
      if (!(commands instanceof Array)) {
        commands = [commands];
      }
      for (_i = 0, _len = commands.length; _i < _len; _i++) {
        command = commands[_i];
        tasks.push(createHandler(command));
      }
      tasks.sync();
      return this;
    },
    initGitRepo: function(opts) {
      var branch, commands, gitPath, logger, next, output, path, remote, url;
      if (opts == null) {
        opts = {};
      }
      path = opts.path, remote = opts.remote, url = opts.url, branch = opts.branch, gitPath = opts.gitPath, logger = opts.logger, output = opts.output, next = opts.next;
      gitPath || (gitPath = 'git');
      commands = [
        {
          command: gitPath,
          args: ['init']
        }, {
          command: gitPath,
          args: ['remote', 'add', remote, url]
        }, {
          command: gitPath,
          args: ['fetch', remote]
        }, {
          command: gitPath,
          args: ['pull', remote, branch]
        }, {
          command: gitPath,
          args: ['submodule', 'init']
        }, {
          command: gitPath,
          args: ['submodule', 'update', '--recursive']
        }
      ];
      if (logger) {
        logger.log('debug', "Initializing git repo with url [" + url + "] on directory [" + path + "]");
      }
      return balUtilModules.spawn(commands, {
        cwd: path,
        output: output
      }, function(err, results) {
        if (err) {
          return next(err, results);
        }
        if (logger) {
          logger.log('debug', "Initialized git repo with url [" + url + "] on directory [" + path + "]");
        }
        return next(err, results);
      });
    },
    initNodeModules: function(opts) {
      var command, force, logger, next, nodeModulesPath, nodePath, npmPath, packageJsonPath, path, pathUtil;
      if (opts == null) {
        opts = {};
      }
      pathUtil = require('path');
      path = opts.path, nodePath = opts.nodePath, npmPath = opts.npmPath, force = opts.force, logger = opts.logger, next = opts.next;
      npmPath || (npmPath = 'npm');
      packageJsonPath = pathUtil.join(path, 'package.json');
      nodeModulesPath = pathUtil.join(path, 'node_modules');
      if (force === false && pathUtil.existsSync(nodeModulesPath)) {
        return next();
      }
      if (!pathUtil.existsSync(packageJsonPath)) {
        return next();
      }
      if (opts.nodePath) {
        command = {
          command: nodePath,
          args: [npmPath, 'install']
        };
      } else {
        command = {
          command: npmPath,
          args: ['install']
        };
      }
      if (logger) {
        logger.log('debug', "Initializing node modules\non:   " + dirPath + "\nwith:", command);
      }
      balUtilModules.spawn(command, {
        cwd: path
      }, function(err, results) {
        if (logger) {
          if (logger) {
            logger.log('debug', "Initialized node modules\non:   " + dirPath + "\nwith:", command);
          }
        }
        return typeof next === "function" ? next(err, results) : void 0;
      });
      return this;
    }
  };

  module.exports = balUtilModules;

}).call(this);
