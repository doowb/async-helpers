'use strict';

require('mocha');
var assert = require('assert');
var Handlebars = require('handlebars');
var helpers = require('./support/helpers').handlebars;
var AsyncHelpers = require('../');
var asyncHelpers;
var hbs;

// using Handlebars, render a template with the helpers
var tmpl = [
  'input: {{> (partialName name="foo") }}',
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
    hbs = Handlebars.create();
    hbs.registerPartial('custom', 'a partial');

    asyncHelpers = new AsyncHelpers();
    asyncHelpers.set(hbs.helpers);
    helpers.getPartial.async = true;
    helpers.partialName.async = true;

    // add the helpers to asyncHelpers
    asyncHelpers.set('if', hbs.helpers.if);
    asyncHelpers.set('getPartial', helpers.getPartial);
    asyncHelpers.set('equals', helpers.equals);
    asyncHelpers.set('partialName', helpers.partialName);
    asyncHelpers.set('upper', helpers.upper);
    asyncHelpers.set('lower', helpers.lower);
    asyncHelpers.set('spacer', helpers.spacer);
    asyncHelpers.set('block', helpers.block);
    asyncHelpers.set('useHash', helpers.useHash);
    asyncHelpers.set('lookup', helpers.lookup);
  });

  it('should work in handlebars', function(done) {
    var invokePartial = hbs.VM.invokePartial;
    hbs.VM.invokePartial = function(name, context, options) {
      // do stuff
      return invokePartial.call(hbs.VM, name, context, options);
    };

    // pull the helpers back out and wrap them
    // with async handling functionality
    var wrappedHelpers = asyncHelpers.get({wrap: true});

    // register the helpers with Handlebars
    hbs.registerHelper(wrappedHelpers);
    tmpl = tmpl.split('{{>').join('{{getPartial');

    // compile the template
    var fn = hbs.compile(tmpl);

    // render the template with a simple context object
    var rendered = fn({
      name: 'doowb',
      customName: 'custom',
      person: {first: 'Brian', last: 'Woodward'},
      bar: 'baz'
    });

    asyncHelpers.resolveIds(rendered, function(err, content) {
      if (err) return done(err);
      assert.deepEqual(content, [
        'input: custom',
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
