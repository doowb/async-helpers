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
  this.prefix = options.prefix || '__async';
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
 * asyncHelpers.set('upper', function (str, cb) {
 *   cb(null, str.toUpperCase());
 * });
 * ```
 *
 * @param {String} `name` Name of the helper
 * @param {Function} `fn` Helper function
 * @return {Object} Returns `this` for chaining
 * @api public
 */

AsyncHelpers.prototype.set = function(name, fn) {
  if (typeof name !== 'string') {
    throw new TypeError('AsyncHelpers#set expects `name` to be a string.');
  }
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

AsyncHelpers.prototype.get = function(name, opts) {
  if (name == null) {
    throw new TypeError('AsyncHelpers#get expects a string or object.');
  }

  if (typeof name === 'object') {
    opts = name;
    name = null;
  }

  opts = opts || {};
  if (opts.wrap) {
    return this.wrap(name);
  }

  return typeof name === 'string'
    ? this.helpers[name]
    : this.helpers;
};

/**
 * Wrap a helper or object of helpers with an async handler function.
 *
 * @param  {String|Object} `name` Helper or object of helpers
 * @return {Object} Wrapped helper(s)
 */

function wrap(name) {
  if (name == null) {
    throw new TypeError('async-helpers wrap expects a string or object.');
  }
  var helper = this.helpers[name];
  if (typeof helper === 'object') {
    for (var key in helper) {
      helper[key] = wrapper(key, helper[key], this);
    }
    return helper;
  } else {
    return wrapper(name, helper, this);
  }
}

/**
 * Returns a wrapper function for a single helper.
 *
 * @param  {String} `name` The name of the helper
 * @param  {Function} `fn` The actual helper function
 * @param  {Object} `thisArg` Context
 * @return {String} Returns an async ID to use for resolving the value. ex: `__async18__`
 */

function wrapper(name, fn, thisArg) {
  return function() {
    var argRefs = [];
    var len = arguments.length;
    var args = new Array(len);

    for (var i = len - 1; i >= 0; i--) {
      var arg = args[i] = arguments[i];

      // store references to other async helpers
      if (typeof arg === 'string' && arg.indexOf(thisArg.prefix) === 0) {
        argRefs.push({arg: arg, idx: i});
      }
    }

    // generate a unique ID for the wrapped helper
    var id = thisArg.prefix + thisArg.globalCounter + (thisArg.counter++) + '__';
    var obj = {
      id: id,
      name: name,
      fn: fn,
      args: args,
      argRefs: argRefs
    };

    thisArg.stash[obj.id] = obj;
    return obj.id;
  }
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
  if (name) return wrap.call(this, name);

  var res = {};
  for (var key in this.helpers) {
    res[key] = this.wrap(key);
  }
  return res;
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
 * @param  {Function} `cb` Callback function with the results of executing the async helper.
 * @api public
 */

AsyncHelpers.prototype.resolve = function(key, cb) {
  if (typeof cb !== 'function') {
    throw new Error('AsyncHelpers#resolve() expects a callback function.');
  }

  if (typeof key !== 'string') {
    cb(new Error('AsyncHelpers#resolve() expects `key` to be a string.'));
  }

  var stashed = this.stash[key];
  if (!stashed) {
    return cb(new Error('Unable to resolve ' + key + '. Not Found'));
  }

  if (typeof stashed.fn !== 'function') {
    return cb(null, stashed.fn);
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
      var args = stashed.args;
      if (stashed.fn.async) {
        args = args.concat(next);
      }
      res = stashed.fn.apply(stashed.thisArg, args);
      if (!stashed.fn.async) {
        return next(null, res);
      }
    }
  ], function (err, results) {
    if (typeof results[1] !== 'undefined') {
      // update the fn so if it's called again it'll just return the true results
      stashed.fn = results[1];
      return cb(err, stashed.fn);
    } else {
      return cb(err, '');
    }
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
