// Generated by CoffeeScript 1.3.3
(function() {
  var assert, balUtil, joe, wait;

  assert = (typeof require === "function" ? require('assert') : void 0) || this.assert;

  joe = (typeof require === "function" ? require('joe') : void 0) || this.joe;

  balUtil = (typeof require === "function" ? require(__dirname + '/../lib/balutil') : void 0) || this.balUtil;

  wait = function(delay, fn) {
    return setTimeout(fn, delay);
  };

  joe.describe('flow', function(describe, it) {
    it('should detect arrays', function(done) {
      var arr, obj, str;
      arr = [];
      obj = {};
      str = '';
      assert.equal(true, balUtil.isArray(arr), 'array vs array comparison');
      assert.equal(false, balUtil.isArray(obj), 'object vs array comparison');
      assert.equal(false, balUtil.isArray(str), 'string vs array comparison');
      return done();
    });
    it('should cycle arrays', function(done) {
      var arr, out;
      arr = ['a', 'b', 'c'];
      out = [];
      balUtil.each(arr, function(value, key) {
        return out[key] = value;
      });
      assert.deepEqual(arr, out, 'cycling an array produced the expected results');
      return done();
    });
    return it('should cycle objects', function(done) {
      var obj, out;
      obj = {
        'a': 1,
        'b': 2,
        'c': 3
      };
      out = {};
      balUtil.each(obj, function(value, key) {
        return out[key] = value;
      });
      assert.deepEqual(obj, out, 'cycling an object produced the expected results');
      return done();
    });
  });

  joe.describe('Group', function(describe, it) {
    it('should work when tasks are specified manually', function(done) {
      var finished, firstTaskFinished, secondTaskFinished, tasks;
      firstTaskFinished = false;
      secondTaskFinished = false;
      finished = false;
      tasks = new balUtil.Group(function(err) {
        assert.equal(false, finished, 'the group of tasks only finished once');
        finished = true;
        return assert.equal(false, err != null, 'no error is present');
      });
      tasks.total = 2;
      wait(1000, function() {
        firstTaskFinished = true;
        assert.equal(true, secondTaskFinished, 'the first task ran second as expected');
        return tasks.complete();
      });
      wait(500, function() {
        secondTaskFinished = true;
        assert.equal(false, firstTaskFinished, 'the second task ran first as expected');
        return tasks.complete();
      });
      assert.equal(0, tasks.completed, 'no tasks should have started yet');
      return wait(2000, function() {
        assert.equal(2, tasks.completed, 'only the expected number of tasks ran');
        assert.equal(false, tasks.isRunning(), 'isRunning() returned false');
        assert.equal(true, tasks.hasCompleted(), 'hasCompleted() returned true');
        assert.equal(true, tasks.hasExited(), 'hasExited() returned true');
        return done();
      });
    });
    it('should work when run synchronously', function(done) {
      var finished, firstTaskFinished, firstTaskRun, secondTaskFinished, secondTaskRun, tasks;
      firstTaskRun = false;
      secondTaskRun = false;
      firstTaskFinished = false;
      secondTaskFinished = false;
      finished = false;
      tasks = new balUtil.Group(function(err) {
        assert.equal(false, finished, 'the group of tasks only finished once');
        finished = true;
        return assert.equal(false, err != null, 'no error is present');
      });
      tasks.push(function(complete) {
        firstTaskRun = true;
        assert.equal(false, secondTaskRun, 'the first task ran first as expected');
        return wait(1000, function() {
          firstTaskFinished = true;
          assert.equal(false, secondTaskFinished, 'the first task completed first as expected');
          return complete();
        });
      });
      tasks.push(function(complete) {
        secondTaskRun = true;
        assert.equal(true, firstTaskRun, 'the second task ran second as expected');
        return wait(500, function() {
          secondTaskFinished = true;
          assert.equal(true, firstTaskFinished, 'the second task completed second as expected');
          return complete();
        });
      });
      assert.equal(0, tasks.completed, 'no tasks should have started yet');
      tasks.sync();
      assert.equal(true, tasks.isRunning(), 'isRunning() returned true');
      return wait(2000, function() {
        assert.equal(2, tasks.completed, 'only the expected number of tasks ran');
        assert.equal(false, tasks.isRunning(), 'isRunning() returned false');
        assert.equal(true, tasks.hasCompleted(), 'hasCompleted() returned true');
        assert.equal(true, tasks.hasExited(), 'hasExited() returned true');
        return done();
      });
    });
    it('should work when run asynchronously', function(done) {
      var finished, firstTaskFinished, firstTaskRun, secondTaskFinished, secondTaskRun, tasks;
      firstTaskRun = false;
      secondTaskRun = false;
      firstTaskFinished = false;
      secondTaskFinished = false;
      finished = false;
      tasks = new balUtil.Group(function(err) {
        assert.equal(false, finished, 'the group of tasks only finished once');
        finished = true;
        return assert.equal(false, err != null, 'no error is present');
      });
      tasks.push(function(complete) {
        firstTaskRun = true;
        assert.equal(false, secondTaskRun, 'the first task ran first as expected');
        return wait(1000, function() {
          firstTaskFinished = true;
          assert.equal(true, secondTaskFinished, 'the first task completed second as expected');
          return complete();
        });
      });
      tasks.push(function(complete) {
        secondTaskRun = true;
        assert.equal(true, firstTaskRun, 'the second task ran second as expected');
        return wait(500, function() {
          secondTaskFinished = true;
          assert.equal(false, firstTaskFinished, 'the second task completed first as expected');
          return complete();
        });
      });
      assert.equal(0, tasks.completed, 'no tasks should have started yet');
      tasks.async();
      assert.equal(true, tasks.isRunning(), 'isRunning() returned true');
      return wait(2000, function() {
        assert.equal(2, tasks.completed, 'only the expected number of tasks ran');
        assert.equal(false, tasks.isRunning(), 'isRunning() returned false');
        assert.equal(true, tasks.hasCompleted(), 'hasCompleted() returned true');
        assert.equal(true, tasks.hasExited(), 'hasExited() returned true');
        return done();
      });
    });
    it('should handle errors correctly', function(done) {
      var finished, firstTaskFinished, firstTaskRun, secondTaskFinished, secondTaskRun, tasks;
      firstTaskRun = false;
      secondTaskRun = false;
      firstTaskFinished = false;
      secondTaskFinished = false;
      finished = false;
      tasks = new balUtil.Group(function(err) {
        assert.equal(false, finished, 'the group of tasks only finished once');
        finished = true;
        return assert.equal(true, err != null, 'an error is present');
      });
      tasks.push(function(complete) {
        firstTaskRun = true;
        assert.equal(false, secondTaskRun, 'the first task ran first as expected');
        return wait(1000, function() {
          firstTaskFinished = true;
          assert.equal(false, secondTaskFinished, 'the first task completed first as expected');
          return complete();
        });
      });
      tasks.push(function(complete) {
        secondTaskRun = true;
        assert.equal(true, firstTaskRun, 'the second task ran second as expected');
        return wait(500, function() {
          secondTaskFinished = true;
          assert.equal(true, firstTaskFinished, 'the second task completed second as expected');
          return complete(new Error('deliberate error'));
        });
      });
      assert.equal(0, tasks.completed, 'no tasks should have started yet');
      tasks.sync();
      assert.equal(true, tasks.isRunning(), 'isRunning() returned true');
      return wait(2000, function() {
        assert.equal(1, tasks.completed, 'only the expected number of tasks ran');
        assert.equal(false, tasks.isRunning(), 'isRunning() returned false');
        assert.equal(false, tasks.hasCompleted(), 'hasCompleted() returned true');
        assert.equal(true, tasks.hasExited(), 'hasExited() returned true');
        return done();
      });
    });
    it('should push and run synchronous tasks correctly', function(done) {
      var finished, firstTaskFinished, firstTaskRun, secondTaskFinished, secondTaskRun, tasks;
      firstTaskRun = false;
      secondTaskRun = false;
      firstTaskFinished = false;
      secondTaskFinished = false;
      finished = false;
      tasks = new balUtil.Group('sync', function(err) {
        assert.equal(false, finished, 'the group of tasks only finished once');
        finished = true;
        return assert.equal(false, err != null, 'no error is present');
      });
      assert.equal('sync', tasks.mode, 'mode was correctly set to sync');
      tasks.pushAndRun(function(complete) {
        firstTaskRun = true;
        assert.equal(false, secondTaskRun, 'the first task ran first as expected');
        return wait(1000, function() {
          firstTaskFinished = true;
          assert.equal(false, secondTaskFinished, 'the first task completed first as expected');
          return complete();
        });
      });
      assert.equal(true, tasks.isRunning(), 'isRunning() returned true');
      tasks.pushAndRun(function(complete) {
        secondTaskRun = true;
        assert.equal(true, firstTaskRun, 'the second task ran second as expected');
        return wait(500, function() {
          secondTaskFinished = true;
          assert.equal(true, firstTaskFinished, 'the second task completed second as expected');
          return complete();
        });
      });
      return wait(4000, function() {
        assert.equal(2, tasks.completed, 'only the expected number of tasks ran');
        assert.equal(false, tasks.isRunning(), 'isRunning() returned false');
        assert.equal(true, tasks.hasCompleted(), 'hasCompleted() returned true');
        assert.equal(true, tasks.hasExited(), 'hasExited() returned true');
        return done();
      });
    });
    it('should push and run asynchronous tasks correctly (queued)', function(done) {
      var finished, firstTaskFinished, firstTaskRun, secondTaskFinished, secondTaskRun, tasks;
      firstTaskRun = false;
      secondTaskRun = false;
      firstTaskFinished = false;
      secondTaskFinished = false;
      finished = false;
      tasks = new balUtil.Group('async', function(err) {
        assert.equal(false, finished, 'the group of tasks only finished once');
        finished = true;
        return assert.equal(false, err != null, 'no error is present');
      });
      assert.equal('async', tasks.mode, 'mode was correctly set to async');
      tasks.pushAndRun(function(complete) {
        firstTaskRun = true;
        assert.equal(false, secondTaskRun, 'the first task ran first as expected');
        return wait(1000, function() {
          firstTaskFinished = true;
          assert.equal(true, secondTaskFinished, 'the first task completed second as expected');
          return complete();
        });
      });
      assert.equal(true, tasks.isRunning(), 'isRunning() returned true');
      tasks.pushAndRun(function(complete) {
        secondTaskRun = true;
        assert.equal(true, firstTaskRun, 'the second task ran second as expected');
        return wait(500, function() {
          secondTaskFinished = true;
          assert.equal(false, firstTaskFinished, 'the second task completed first as expected');
          return complete();
        });
      });
      return wait(4000, function() {
        assert.equal(2, tasks.completed, 'only the expected number of tasks ran');
        assert.equal(false, tasks.isRunning(), 'isRunning() returned false');
        assert.equal(true, tasks.hasCompleted(), 'hasCompleted() returned true');
        assert.equal(true, tasks.hasExited(), 'hasExited() returned true');
        return done();
      });
    });
    return it('should push and run synchronous tasks correctly (multiple times)', function(done) {
      var finished, tasks;
      finished = 0;
      tasks = new balUtil.Group('sync', {
        autoClear: true
      }, function(err) {
        ++finished;
        return assert.equal(false, err != null, 'no error is present');
      });
      assert.equal('sync', tasks.mode, 'mode was correctly set to sync');
      assert.equal(true, tasks.autoClear, 'autoClear was correctly set to true');
      tasks.pushAndRun(function(complete) {
        return complete();
      });
      wait(500, function() {
        tasks.pushAndRun(function(complete) {
          return wait(500, function() {
            return complete();
          });
        });
        return assert.equal(true, tasks.isRunning(), 'isRunning() returned true');
      });
      return wait(2000, function() {
        assert.equal(2, finished, 'it exited the correct number of times');
        assert.equal(false, tasks.isRunning(), 'isRunning() returned false');
        assert.equal(false, tasks.hasCompleted(), 'hasCompleted() returned false');
        assert.equal(false, tasks.hasExited(), 'hasExited() returned false');
        return done();
      });
    });
  });

}).call(this);
