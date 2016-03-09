/*!
 * async-helpers <https://github.com/doowb/async-helpers>
 *
 * Copyright (c) 2015, Brian Woodward.
 * Licensed under the MIT License.
 */

'use strict';

var handlers = require('./lib/handlers');
var utils = require('./lib/utils');
var cache = {};

/**
 * Create a new instance of AsyncHelpers
 *
 * ```js
 * var asyncHelpers = new AsyncHelpers();
 * ```
 *
 * @param {Object} `options` options to pass to instance
 * @param {Function} `createPrefix` Create the id prefix given a prefix and current global counter.
 * @param {Function} `createId` Create the entire id given an already generated prefix and the current instance counter.
 * @param {Function} `createRegExp` Create the regex string that will be passed to `new RegExp` for testing if an async id placeholder exists. Takes the current prefix value.
 * @return {Object} new AsyncHelpers instance
 * @api public
 */

function AsyncHelpers (options) {
  if (!(this instanceof AsyncHelpers)) {
    return new AsyncHelpers(options);
  }
  options = options || {};
  this.options = options;
  this.helpers = {};
}

/**
 * Add a helper to the cache.
 *
 * ```js
 * asyncHelpers.set('upper', 'async', function (str, cb) {
 *   cb(null, str.toUpperCase());
 * });
 * ```
 *
 * @param {String} `name` Name of the helper
 * @param {String} `type` Type of helper to add. (Defaults to `sync`)
 * @param {Function} `fn` Helper function
 * @return {Object} Returns `this` for chaining
 * @api public
 */

AsyncHelpers.prototype.set = function(name, type, fn) {
  if (typeof name !== 'string') {
    throw new TypeError('AsyncHelpers#set expects `name` to be a string.');
  }
  if (typeof type === 'function') {
    fn = type;
    type = 'sync';
  }

  var handler = handlers[type];
  if (!handler) {
    throw new Error('AsyncHelpers#set unable to find handler for type "' + type + '". Valid types are [' + Object.keys(handlers).join(', ') + '].');
  }
  this.helpers[name] = handler(fn);
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
 * @return {Function|Object} Single helper function when `name` is provided, otherwise object of all helpers
 * @api public
 */

AsyncHelpers.prototype.get = function(name) {
  return typeof name === 'string'
    ? this.helpers[name]
    : this.helpers;
};

function formatError(err, helper, args) {
  args = args.filter(function (arg) {
    if (!arg || typeof arg === 'function') {
      return false;
    }
    return true;
  }).map(function (arg) {
    return utils.stringify(arg);
  });

  err.reason = '"' +  helper.name
    + '" helper cannot resolve: `'
    + args.join(', ') + '`';
  err.helper = helper;
  err.args = args;
  return err;
}

/**
 * Expose `AsyncHelpers`
 */

module.exports = AsyncHelpers;
