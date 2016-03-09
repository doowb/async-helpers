'use strict';

var AsyncHelpers = require('./');

// create a new instance of AsyncHelpers
var asyncHelpers = new AsyncHelpers();

// some simple sync helpers
function upper (str) {
  return str.toUpperCase();
}

// some simple async helpers
function lower (str, options, cb) {
  // handle Handlebars or Lodash templates
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  cb(null, str.toLowerCase());
}

function spacer (str, delim, options, cb) {
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
// lower.async = true;
// spacer.async = true;

// add the helpers to asyncHelpers
asyncHelpers.set('upper', upper);
asyncHelpers.set('lower', 'async', lower);
asyncHelpers.set('spacer', 'async', spacer);

// get the registered helpers
var helpers = asyncHelpers.get();

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

console.log('Handlebars rendered:');
console.log(hbsRendered);
console.log();

// using Lodash, render a template with helpers
var _ = require('lodash');
var lodash = [
  'input: <%= name %>',
  'upper: <%= upper(name) %>',
  'lower: <%= lower(name) %>',
  'spacer: <%= spacer(name) %>',
  'spacer-delim: <%= spacer(name, "-") %>',
  'lower(upper): <%= lower(upper(name)) %>',
  'spacer(upper, lower): <%= spacer(upper(name), lower("X")) %>',
  '',
  '--- if helper using an async helper results ---',
  '<% if (lower(name) === "brian") { %>',
  '<%= name %> is the best',
  '<% } else { %>',
  'I guess <%= name %> is okay',
  '<% } %>'
].join('\n');

// compile the template passing `helpers` in as `imports`
var _fn = _.template(lodash, { imports: helpers});

// render the compiled template with the simple context object
var _rendered1 = _fn({name: 'Jon'});
var _rendered2 = _fn({name: 'Brian'});

console.log('lodash rendered 1:');
console.log(_rendered1);
console.log();

console.log('lodash rendered 2:');
console.log(_rendered2);
console.log();

