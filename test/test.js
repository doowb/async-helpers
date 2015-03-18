'use strict';

var assert = require('assert');
var AsyncHelpers = require('../');
var asyncHelpers = null;

describe('async-helpers', function () {
  beforeEach(function () {
    AsyncHelpers.globalCounter = 0;
    asyncHelpers = new AsyncHelpers();
  });

  it('should set a sync helper', function () {
    var upper = function (str) {
      return str.toUpperCase();
    };
    asyncHelpers.set('upper', upper);
    assert(typeof asyncHelpers.helpers.upper !== 'undefined', 'upper should be defined on `helpers`');
    assert.deepEqual(asyncHelpers.helpers.upper.toString(), upper.toString());
  });

  it('should set an async helper', function () {
    var upper = function (str, cb) {
      cb(null, str.toUpperCase());
    };
    upper.async = true;
    asyncHelpers.set('upper', upper);
    assert(typeof asyncHelpers.helpers.upper !== 'undefined', 'upper should be defined on `helpers`');
    assert(asyncHelpers.helpers.upper.async);
  });

  it('should get the helper as is', function () {
    var upper = function (str) {
      return str.toUpperCase();
    };
    asyncHelpers.set('upper', upper);
    assert.deepEqual(asyncHelpers.get('upper').toString(), upper.toString());
  });

  it('should get a wrapped helper', function () {
    var upper = function (str) {
      return str.toUpperCase();
    };
    asyncHelpers.set('upper', upper);
    assert.notEqual(asyncHelpers.get('upper', { wrap: true }).toString(), upper.toString());
  });

  it('should return actual value when not wrapped', function () {
    var upper = function (str) {
      return str.toUpperCase();
    };
    asyncHelpers.set('upper', upper);
    assert.deepEqual(asyncHelpers.get('upper')('doowb'), 'DOOWB');
  });

  it('should return an async id when wrapped', function () {
    var upper = function (str) {
      return str.toUpperCase();
    }
    asyncHelpers.set('upper', upper);
    assert.deepEqual(asyncHelpers.get('upper', { wrap: true })('doowb'), '__async_0_0__');
  });

  it('should increment globalCounter for multiple instances of AsyncHelpers', function () {
    var asyncHelpers2 = new AsyncHelpers();
    assert.notEqual(asyncHelpers.globalCounter, asyncHelpers2.globalCounter);
    assert.equal(asyncHelpers.globalCounter, 0);
    assert.equal(asyncHelpers2.globalCounter, 1);
  });

  it('should return an async id with a custom prefix', function () {
    var asyncHelpers2 = new AsyncHelpers({prefix: '__custom_prefix__'});
    var upper = function (str) {
      return str.toUpperCase();
    };
    asyncHelpers2.set('upper', upper);
    assert.deepEqual(asyncHelpers2.get('upper', { wrap: true })('doowb'), '__custom_prefix__1_0__');
  });

});
