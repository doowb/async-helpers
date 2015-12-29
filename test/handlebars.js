'use strict';

var Handlebars = require('handlebars');
var assert = require('assert');

var AsyncHelpers = require('../');
var helpers = require('./lib/helpers').handlebars;

describe('handlebars', function () {
  it('should work in handlebars', function (done) {

    var asyncHelpers = new AsyncHelpers();

    // add the helpers to asyncHelpers
    asyncHelpers.set('upper', helpers.upper);
    asyncHelpers.set('lower', helpers.lower);
    asyncHelpers.set('spacer', helpers.spacer);
    asyncHelpers.set('block', helpers.block);

    // pull the helpers back out and wrap them
    // with async handling functionality
    var wrapped = asyncHelpers.get({wrap: true});

    // using Handlebars, render a template with the helpers
    var tmpl = [
      'input: {{name}}',
      'upper: {{upper name}}',
      'lower: {{lower name}}',
      'spacer: {{spacer name}}',
      'spacer-delim: {{spacer name "-"}}',
      'lower(upper): {{lower (upper name)}}',
      'spacer(upper, lower): {{spacer (upper name) (lower "X")}}',
      'block: {{#block}}{{upper ../name}}{{/block}}'
    ].join('\n');

    // register the helpers with Handlebars
    Handlebars.registerHelper(wrapped);

    // compile the template
    var fn = Handlebars.compile(tmpl);

    // render the template with a simple context object
    var rendered = fn({name: 'doowb'});

    asyncHelpers.resolveIds(rendered, function (err, content) {
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
      ].join('\n'));
      done();
    });
  });
});
