'use strict';

var _ = require('lodash');
var assert = require('assert');

var AsyncHelpers = require('../');
var helpers = require('./lib/helpers').lodash;

describe('lodash', function () {
  it('should work in lodash', function () {

    var asyncHelpers = new AsyncHelpers();

    // add the helpers to asyncHelpers
    asyncHelpers.set('upper', helpers.upper.async ? 'async' : 'sync', helpers.upper);
    asyncHelpers.set('lower', helpers.lower.async ? 'async' : 'sync', helpers.lower);
    asyncHelpers.set('spacer', helpers.spacer.async ? 'async' : 'sync', helpers.spacer);

    // pull the helpers back out and wrap them
    // with async handling functionality
    var wrapped = asyncHelpers.get();

    // using Lodash, render a template with helpers
    var tmpl = [
      'input: <%= name %>',
      'upper: <%= upper(name) %>',
      'lower: <%= lower(name) %>',
      'spacer: <%= spacer(name) %>',
      'spacer-delim: <%= spacer(name, "-") %>',
      'lower(upper): <%= lower(upper(name)) %>',
      'spacer(upper, lower): <%= spacer(upper(name), lower("X")) %>'
    ].join('\n');

    // compile the template passing `helpers` in as `imports`
    var fn = _.template(tmpl, { imports: wrapped});

    // render the compiled template with the simple context object
    var rendered = fn({name: 'doowb'});

    assert.deepEqual(rendered, [
      'input: doowb',
      'upper: DOOWB',
      'lower: doowb',
      'spacer: d o o w b',
      'spacer-delim: d-o-o-w-b',
      'lower(upper): doowb',
      'spacer(upper, lower): DxOxOxWxB'
    ].join('\n'));
  });
});
