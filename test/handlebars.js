'use strict';

require('mocha');
var assert = require('assert');
var Handlebars = require('handlebars');
var helpers = require('./support/helpers').handlebars;
var AsyncHelpers = require('../');
var asyncHelpers;

// using Handlebars, render a template with the helpers
var tmpl = [
  'input: {{name}}',
  'upper: {{upper name}}',
  'lower: {{lower name}}',
  'spacer: {{spacer name}}',
  'spacer-delim: {{spacer name "-"}}',
  'lower(upper): {{lower (upper name)}}',
  'spacer(upper, lower): {{spacer (upper name) (lower "X")}}',
  'block: {{#block}}{{upper name}}{{/block}}',
  'ifConditional1: {{#if (equals "foo" foo)}}{{upper name}}{{/if}}',
  'ifConditional2: {{#if (equals "baz" bar)}}{{upper name}}{{/if}}',
  'useHash: {{#useHash me=(lookup this "person")}}{{me.first}} {{me.last}}{{/useHash}}'
].join('\n');

describe('handlebars', function() {
  beforeEach(function() {
    asyncHelpers = new AsyncHelpers();
    asyncHelpers.set(Handlebars.helpers);

    // add the helpers to asyncHelpers
    // asyncHelpers.set('if', Handlebars.helpers.if);
    asyncHelpers.set('equals', helpers.equals);
    asyncHelpers.set('upper', helpers.upper);
    asyncHelpers.set('lower', helpers.lower);
    asyncHelpers.set('spacer', helpers.spacer);
    asyncHelpers.set('block', helpers.block);
    asyncHelpers.set('useHash', helpers.useHash);
    asyncHelpers.set('lookup', helpers.lookup);
  });

  it('should work in handlebars', function(done) {
    // pull the helpers back out and wrap them
    // with async handling functionality
    var wrapped = asyncHelpers.get({wrap: true});

    // register the helpers with Handlebars
    Handlebars.registerHelper(wrapped);

    // compile the template
    var fn = Handlebars.compile(tmpl);

    // render the template with a simple context object
    var rendered = fn({
      name: 'doowb',
      person: {first: 'Brian', last: 'Woodward'},
      bar: 'baz'
    });

    asyncHelpers.resolveIds(rendered, function(err, content) {
      if (err) return done(err);
      assert.deepEqual(content, [
        'input: doowb',
        'upper: DOOWB',
        'lower: doowb',
        'spacer: d o o w b',
        'spacer-delim: d-o-o-w-b',
        'lower(upper): doowb',
        'spacer(upper, lower): DxOxOxWxB',
        'block: DOOWB',
        'ifConditional1: ',
        'ifConditional2: DOOWB',
        'useHash: Brian Woodward'
      ].join('\n'));
      done();
    });
  });
});
