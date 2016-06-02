'use strict';

var AsyncHelpers = require('./');

// create a new instance of AsyncHelpers
var asyncHelpers = new AsyncHelpers();

// some simple sync helpers
function upper(str) {
  return str.toUpperCase();
}

// some simple async helpers
function lower(str, options, cb) {
  // handle Handlebars or Lodash templates
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  cb(null, str.toLowerCase());
}

function spacer(str, delim, options, cb) {
  // handle Handlebars or Lodash templates
  if (typeof delim === 'function') {
    cb = delim; options = {}; delim = ' ';
  }
  if (typeof options === 'function') {
    cb = options; options = {}; delim = ' ';
  }
  cb(null, str.split('').join(delim));
}

// async helpers must have an `async` property
lower.async = true;
spacer.async = true;

// add the helpers to asyncHelpers
asyncHelpers.set('upper', upper);
asyncHelpers.set('lower', lower);
asyncHelpers.set('spacer', spacer);

// pull the helpers back out and wrap them
// with async handling functionality
var helpers = asyncHelpers.get({wrap: true});

// using Handlebars, render a template with the helpers
var Handlebars = require('handlebars');
var hbs = [
  'input: {{name}}',
  'upper: {{upper name}}',
  'lower: {{lower name}}',
  'spacer: {{spacer name}}',
  'spacer-delim: {{spacer name "-"}}',
  'lower(upper): {{lower (upper name)}}',
  'spacer(upper, lower): {{spacer (upper name) (lower "X")}}'
].join('\n');

// register the helpers with Handlebars
Handlebars.registerHelper(helpers);

// compile the template
var hbsFn = Handlebars.compile(hbs);

// render the template with a simple context object
var hbsRendered = hbsFn({name: 'brian'});

// rendered output will contain async IDs that need to be replaced
console.log('Handlebars rendered:');
console.log(hbsRendered);
console.log();

resolve(hbsRendered, function(err, rendered) {
  if (err) return console.error(err);
  // show the final rendered output after all async IDs have been resolved
  console.log('Handlebars resolved');
  console.log(rendered);
  console.log();
});

// using Lodash, render a template with helpers
var _ = require('lodash');
var lodash = [
  'input: <%= name %>',
  'upper: <%= upper(name) %>',
  'lower: <%= lower(name) %>',
  'spacer: <%= spacer(name) %>',
  'spacer-delim: <%= spacer(name, "-") %>',
  'lower(upper): <%= lower(upper(name)) %>',
  'spacer(upper, lower): <%= spacer(upper(name), lower("X")) %>'
].join('\n');

// compile the template passing `helpers` in as `imports`
var _fn = _.template(lodash, { imports: helpers});

// render the compiled template with the simple context object
var _rendered = _fn({name: 'brian'});

// rendered output will contain async IDs that need to be replaced
console.log('lodash rendered:');
console.log(_rendered);
console.log();

resolve(_rendered, function(err, rendered) {
  if (err) return console.error(err);
  // show the final rendered output after all async IDs have been resolved
  console.log('lodash resolved');
  console.log(rendered);
  console.log();
});

function resolve(rendered, done) {
  asyncHelpers.resolveIds(rendered, done);
}
