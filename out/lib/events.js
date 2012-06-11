// Generated by CoffeeScript 1.3.3
(function() {
  var Event, EventEmitter, EventSystem, balUtilFlow, debug,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  EventEmitter = require('events').EventEmitter;

  balUtilFlow = require(__dirname + '/flow');

  debug = false;

  Event = (function() {

    Event.prototype.name = null;

    Event.prototype.locked = false;

    Event.prototype.finished = false;

    function Event(_arg) {
      this.name = _arg.name;
    }

    return Event;

  })();

  EventSystem = (function(_super) {

    __extends(EventSystem, _super);

    function EventSystem() {
      return EventSystem.__super__.constructor.apply(this, arguments);
    }

    EventSystem.prototype._eventSystemEvents = null;

    EventSystem.prototype.event = function(eventName) {
      var _base;
      this._eventSystemEvents || (this._eventSystemEvents = {});
      return (_base = this._eventSystemEvents)[eventName] || (_base[eventName] = new Event(eventName));
    };

    EventSystem.prototype.lock = function(eventName, next) {
      var event,
        _this = this;
      event = this.event(eventName);
      if (event.locked === false) {
        event.locked = true;
        try {
          this.emit(eventName + ':locked');
        } catch (err) {
          next(err);
          return this;
        } finally {
          next();
        }
      } else {
        this.onceUnlocked(eventName, function(err) {
          if (err) {
            return next(err);
          }
          return _this.lock(eventName, next);
        });
      }
      return this;
    };

    EventSystem.prototype.unlock = function(eventName, next) {
      var event;
      event = this.event(eventName);
      event.locked = false;
      try {
        this.emit(eventName + ':unlocked');
      } catch (err) {
        next(err);
        return this;
      } finally {
        next();
      }
      return this;
    };

    EventSystem.prototype.start = function(eventName, next) {
      var _this = this;
      this.lock(eventName, function(err) {
        var event;
        if (err) {
          return next(err);
        }
        event = _this.event(eventName);
        event.finished = false;
        try {
          return _this.emit(eventName + ':started');
        } catch (err) {
          next(err);
          return _this;
        } finally {
          next();
        }
      });
      return this;
    };

    EventSystem.prototype.finish = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this.finished.apply(this, args);
    };

    EventSystem.prototype.finished = function(eventName, next) {
      var event,
        _this = this;
      event = this.event(eventName);
      event.finished = true;
      this.unlock(eventName, function(err) {
        if (err) {
          return next(err);
        }
        try {
          return _this.emit(eventName + ':finished');
        } catch (err) {
          next(err);
          return _this;
        } finally {
          next();
        }
      });
      return this;
    };

    EventSystem.prototype.onceUnlocked = function(eventName, next) {
      var event;
      if (debug) {
        console.log("onceUnlocked " + eventName);
      }
      event = this.event(eventName);
      if (event.locked) {
        this.once(eventName + ':unlocked', next);
      } else {
        next();
      }
      return this;
    };

    EventSystem.prototype.onceFinished = function(eventName, next) {
      var event;
      event = this.event(eventName);
      if (event.finished) {
        next();
      } else {
        this.once(eventName + ':finished', next);
      }
      return this;
    };

    EventSystem.prototype.whenFinished = function(eventName, next) {
      var event;
      event = this.event(eventName);
      if (event.finished) {
        next();
      }
      this.on(eventName + ':finished', next);
      return this;
    };

    EventSystem.prototype.when = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this.on.apply(this, args);
    };

    EventSystem.prototype.block = function(eventNames, next) {
      var done, err, eventName, total, _i, _len;
      if ((eventNames instanceof Array) === false) {
        if (typeof eventNames === 'string') {
          eventNames = eventNames.split(/[,\s]+/g);
        } else {
          err = new Error('Unknown eventNames type');
          return next(err);
        }
      }
      total = eventNames.length;
      done = 0;
      for (_i = 0, _len = eventNames.length; _i < _len; _i++) {
        eventName = eventNames[_i];
        this.lock(eventName, function(err) {
          if (err) {
            done = total;
            return next(err);
          }
          done++;
          if (done === total) {
            return next();
          }
        });
      }
      return this;
    };

    EventSystem.prototype.unblock = function(eventNames, next) {
      var done, err, eventName, total, _i, _len;
      if ((eventNames instanceof Array) === false) {
        if (typeof eventNames === 'string') {
          eventNames = eventNames.split(/[,\s]+/g);
        } else {
          err = new Error('Unknown eventNames type');
          return next(err);
        }
      }
      total = eventNames.length;
      done = 0;
      for (_i = 0, _len = eventNames.length; _i < _len; _i++) {
        eventName = eventNames[_i];
        this.unlock(eventName, function(err) {
          if (err) {
            done = total;
            return next(err);
          }
          done++;
          if (done === total) {
            return next();
          }
        });
      }
      return this;
    };

    EventSystem.prototype.emitAsync = function(eventName, data, next) {
      var listeners, tasks;
      listeners = this.listeners(eventName);
      tasks = new balUtilFlow.Group(next);
      balUtilFlow.each(listeners, function(listener) {
        return tasks.push(function(complete) {
          return listener(data, complete);
        });
      });
      tasks.async();
      return this;
    };

    EventSystem.prototype.emitSync = function(eventName, data, next) {
      var listeners, tasks;
      listeners = this.listeners(eventName);
      tasks = new balUtilFlow.Group(next);
      balUtilFlow.each(listeners, function(listener) {
        return tasks.push(function(complete) {
          return listener(data, complete);
        });
      });
      tasks.sync();
      return this;
    };

    return EventSystem;

  })(EventEmitter);

  module.exports = {
    Event: Event,
    EventSystem: EventSystem
  };

}).call(this);
