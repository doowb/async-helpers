'use strict';

/* deps:mocha */
var assert = require('assert');
var AsyncHelpers = require('../');
var asyncHelpers = null;

describe('async-helpers', function() {
  beforeEach(function() {
    asyncHelpers = new AsyncHelpers();
  });

  it('should set a sync helper', function() {
    var upper = function(str) {
      return str.toUpperCase();
    };
    asyncHelpers.set('upper', upper);
    assert(typeof asyncHelpers.helpers.upper !== 'undefined', 'upper should be defined on `helpers`');
    assert.deepEqual(asyncHelpers.helpers.upper.toString(), upper.toString());
  });

  it('should set an async helper', function() {
    var upper = function(str, cb) {
      cb(null, str.toUpperCase());
    };
    // upper.async = true;
    asyncHelpers.set('upper', 'async', upper);
    assert(typeof asyncHelpers.helpers.upper !== 'undefined', 'upper should be defined on `helpers`');
  });

  it('should get the helper as is', function() {
    var upper = function(str) {
      return str.toUpperCase();
    };
    asyncHelpers.set('upper', upper);
    assert.deepEqual(asyncHelpers.get('upper').toString(), upper.toString());
  });

  it('should return actual value when not wrapped', function() {
    var upper = function(str) {
      return str.toUpperCase();
    };
    asyncHelpers.set('upper', upper);
    assert.deepEqual(asyncHelpers.get('upper')('doowb'), 'DOOWB');
  });

  it('should support helpers used as arguments that return objects', function() {
    var profile = function(user, next) {
      if (typeof user !== 'object') {
        return next(new Error('Expected user to be an object but got ' + (typeof user)));
      }
      next(null, user.name);
    };
    // profile.async = true;

    var user = function(name, next) {
      var res = {
        id: name,
        name: name
      };
      next(null, res);
    };
    // user.async = true;

    asyncHelpers.set('user', 'async', user);
    asyncHelpers.set('profile', 'async', profile);
    var userHelper = asyncHelpers.get('user');
    var userVal = userHelper('doowb');
    assert.deepEqual(userVal, {id: 'doowb', name: 'doowb'});

    var profileHelper = asyncHelpers.get('profile');
    var val = profileHelper(userVal);
    assert.deepEqual(val, 'doowb');
  });

  it.skip('should handle errors in sync helpers', function() {
    var upper = function(str) {
      throw new Error('UPPER Error');
    };
    asyncHelpers.set('upper', upper);
    var helper = asyncHelpers.get('upper');
    var val = helper('doowb');
    console.log(val);
    // if (!err) throw new Error('Expected an error.');
  });

  it.skip('should handle errors in async helpers', function() {
    var upper = function(str, next) {
      throw new Error('UPPER Error');
    };
    // upper.async = true;
    asyncHelpers.set('upper', 'async', upper);
    var helper = asyncHelpers.get('upper');
    var val = helper('doowb');
    console.log(val);
  });

  it.skip('should handle returned errors in async helpers', function() {
    var upper = function(str, next) {
      next(new Error('UPPER Error'));
    };
    // upper.async = true;
    asyncHelpers.set('upper', 'async', upper);
    var helper = asyncHelpers.get('upper');
    var val = helper('doowb');
    console.log(val);
  });

  it.skip('should handle errors with arguments with circular references', function() {
    var upper = function(str, next) {
      throw new Error('UPPER Error');
    };
    // upper.async = true;
    asyncHelpers.set('upper', 'async', upper);
    var helper = asyncHelpers.get('upper');
    var obj = {username: 'doowb'};
    obj.profile = obj;
    var val = helper(obj);
  });
});
