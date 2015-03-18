/*!
 * async-helpers <https://github.com/doowb/async-helpers>
 *
 * Copyright (c) 2015, Brian Woodward.
 * Licensed under the MIT License.
 */

'use strict';

var async = require('async');

module.exports = AsyncHelpers;

/**
 * Create a new instance of AsyncHelpers
 *
 * ```js
 * var asyncHelpers = new AsyncHelpers();
 * ```
 *
 * @return {Object} new AsyncHelpers instance
 * @api public
 */

function AsyncHelpers (options) {
  if (!(this instanceof AsyncHelpers)) {
    return new AsyncHelpers(options);
  }
  options = options || {};
  this.prefix = options.prefix || '__async_';
  this.helpers = {};
  this.stash = {};
  this.counter = 0;
  this.globalCounter = AsyncHelpers.globalCounter++;
};

/**
 * Keep track of instances created for generating globally
 * unique ids
 *
 * @type {Number}
 */

AsyncHelpers.globalCounter = 0;

/**
 * Add a helper to the cache.
 *
 * ```js
 * asyncHelpers.set('upper', function (str, done) {
 *   done(null, str.toUpperCase());
 * });
 * ```
 *
 * @param {String} `name` Name of the helper
 * @param {Function} `fn` Helper function
 * @return {Object} Returns `this` for chaining
 * @api public
 */

AsyncHelpers.prototype.set = function(name, fn) {
  this.helpers[name] = fn;
  return this;
};

/**
 * Get all helpers or a helper with the given name.
 *
 * ```js
 * var helpers = asyncHelpers.get();
 * var wrappedHelpers = helperAync.get({wrap: true});
 * ```
 *
 * @param  {String} `name` Optionally pass in a name of a helper to get.
 * @param  {Object} `options` Additional options to use.
 *   @option {Boolean} `wrap` Wrap the helper(s) with async processing capibilities
 * @return {Function|Object} Single helper function when `name` is provided, otherwise object of all helpers
 * @api public
 */

AsyncHelpers.prototype.get = function(name, options) {
  if (typeof name === 'object') {
    options = name;
    name = null;
  }
  options = options || {};
  if (options.wrap) {
    return this.wrap(name);
  }
  return name == null ? this.helpers : this.helpers[name];
};


function wrapper (name) {
  var self = this;
  return function () {
    var obj = {
      name: name,
      id: self.prefix + self.globalCounter + '_' + (self.counter++) + '__',
      fn: self.helpers[name],
      args: [].concat.apply([], arguments),
      argRefs: []
    };

    // store references to other async helpers
    obj.args.forEach(function (arg, i) {
      if (typeof arg === 'string' && arg.indexOf(self.prefix) === 0) {
        obj.argRefs.push({arg: arg, idx: i});
      }
    });

    self.stash[obj.id] = obj;
    return obj.id;
  };
}

/**
 * Wrap a helper with async handling capibilities.
 *
 * ```js
 * var wrappedHelper = asyncHelpers.wrap('upper');
 * var wrappedHelpers = asyncHelpers.wrap();
 * ```
 *
 * @param  {String} `name` Optionally pass the name of the helper to wrap
 * @return {Function|Object} Single wrapped helper function when `name` is provided, otherwise object of all wrapped helpers.
 * @api public
 */

AsyncHelpers.prototype.wrap = function(name) {
  var self = this;
  if (name) {
    return wrapper.call(this, name);
  }
  var keys = Object.keys(this.helpers);
  return keys.reduce(function (res, key) {
    res[key] = self.wrap(key);
    return res;
  }, {});
};

/**
 * Reset all the stashed helpers.
 *
 * ```js
 * asyncHelpers.reset();
 * ```
 *
 * @return {Object} Returns `this` to enable chaining
 * @api public
 */

AsyncHelpers.prototype.reset = function() {
  this.stash = {};
  this.counter = 0;
  return this;
};

/**
 * Resolve a stashed helper by the generated id.
 *
 * ```js
 * var upper = asyncHelpers.get('upper', {wrap: true});
 * var id = upper('doowb');
 * asyncHelpers.resolve(id, function (err, result) {
 *   console.log(result);
 *   //=> DOOWB
 * });
 * ```
 *
 * @param  {String} `key` ID generated when from executing a wrapped helper.
 * @param  {Function} `done` Callback function with the results of executing the async helper.
 * @api public
 */

AsyncHelpers.prototype.resolve = function(key, done) {
  var stashed = this.stash[key];
  if (!stashed) {
    return done(new Error('Unable to resolve ' + key + '. Not Found'));
  }

  if (typeof stashed.fn !== 'function') {
    return done(null, stashed.fn);
  }

  var self = this;
  async.series([
    function (next) {
      if (stashed.argRefs.length > 0) {
        async.each(stashed.argRefs, function (arg, nextArg) {
          self.resolve(arg.arg, function (err, value) {
            if (err) return nextArg(err);
            stashed.args[arg.idx] = value;
            nextArg();
          });
        }, next);
      } else {
        next();
      }
    },
    function (next) {
      next = once(next);

      var res = null;
      var args = [].concat.call([], stashed.args);
      if (stashed.fn.async) {
        args = args.concat(next);
      }
      res = stashed.fn.apply(stashed.thisArg, args);
      if (!stashed.fn.async) {
        return next(null, res);
      }
    }
  ], function (err, results) {
    // update the fn so if it's called again it'll just return the true reults
    stashed.fn = results[1];
    done(err, stashed.fn);
  });

};

function once (fn) {
  return function () {
    if (fn.called) return fn.value;
    fn.called = true;
    fn.value = fn.apply(fn, arguments);
    return fn.value;
  };
}
