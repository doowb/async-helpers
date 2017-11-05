'use strict';

var AsyncHelpers = require('..');

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

function partialName(name, options) {
  if (typeof name === 'object') {
    options = name;
    name = null;
  }
  return name || 'my-partial';
}

/**
 * Method mostly from Handlebars/runtime#invokePartialWrapper
 */

function invokePartialWrapper(partial, context, options) {
  var env = Handlebars;
  if (options.hash) {
    context = Object.assign({}, context, options.hash);
    if (options.ids) {
      options.ids[0] = true;
    }
  }

  partial = env.VM.resolvePartial.call(env.VM, partial, context, options);
  var result = env.VM.invokePartial.call(env.VM, partial, context, options);

  if (result == null && env.compile) {
    options.partials[options.name] = env.compile(partial, options);
    result = options.partials[options.name](context, options);
  }
  if (result != null) {
    if (options.indent) {
      let lines = result.split('\n');
      for (let i = 0, l = lines.length; i < l; i++) {
        if (!lines[i] && i + 1 === l) {
          break;
        }

        lines[i] = options.indent + lines[i];
      }
      result = lines.join('\n');
    }
    return result;
  } else {
    throw new Exception('The partial ' + options.name + ' could not be compiled when running in runtime-only mode');
  }
}

function __async_helpers_invokePartial(partial, context, options, cb) {
  var id = options.name;
  console.log(options);
  asyncHelpers.resolveIds(id, function(err, name) {
    if (err) return cb(err);
    options.name = name;
    var res = '';
    try {
      // similar to what's done in Handlebars invokePartialWrapper function
      // var partial = Handlebars.VM.resolvePartial.call(Handlebars.VM, partial, context, options);
      // res = invokePartial.call(Handlebars.VM, partial, context, options);
      // if (!res) {
      //   options.partials[options.name] = Handlebars.compile(partial, options);
      //   res = options.partials[options.name](context, options);
      // }
      res = invokePartialWrapper(partial, context, options);
    } catch (err) {
      cb(err);
      return;
    }
    cb(null, res);
  });
}

// async helpers must have an `async` property
lower.async = true;
spacer.async = true;
__async_helpers_invokePartial.async = true;

// add the helpers to asyncHelpers
asyncHelpers.set('upper', upper);
asyncHelpers.set('lower', lower);
asyncHelpers.set('spacer', spacer);
asyncHelpers.set('partialName', partialName);
asyncHelpers.set('__async_helpers_invokePartial', __async_helpers_invokePartial);

// pull the helpers back out and wrap them
// with async handling functionality
var helpers = asyncHelpers.get({wrap: true});

// using Handlebars, render a template with the helpers
var Handlebars = require('handlebars');
var invokePartial = Handlebars.VM.invokePartial;
Handlebars.VM.invokePartial = function(partial, context, options) {
  var name = options.name;
  if (asyncHelpers.hasAsyncId(name)) {
    // create inline helper to invoke the partial when the helper is ready
    return helpers.__async_helpers_invokePartial.apply(this, arguments);
  }
  // return 'foo';
  return invokePartial.apply(Handlebars.VM, arguments);
};

Handlebars.registerPartial('my-partial', `partial:

  - {{name}}
  - {{upper name}}
  - {{lower name}}
  - {{spacer name}}
  - {{spacer name "-"}}
  - {{lower (upper name)}}
  - {{spacer (upper name) (lower "X")}}
  - {{> (partialName "another-partial") }}

`);

Handlebars.registerPartial('another-partial', `another-partial:

  - {{name}}
  - {{upper name}}
  - {{lower name}}
  - {{spacer name}}
  - {{spacer name "-"}}
  - {{lower (upper name)}}
  - {{spacer (upper name) (lower "X")}}

`);

var hbs = [
  'input: {{name}}',
  'upper: {{upper name}}',
  'lower: {{lower name}}',
  'spacer: {{spacer name}}',
  'spacer-delim: {{spacer name "-"}}',
  'lower(upper): {{lower (upper name)}}',
  'spacer(upper, lower): {{spacer (upper name) (lower "X")}}',
  '  {{> another-partial }}',
  '  {{> (partialName) }}',
].join('\n');


// Handlebars.registerHelper('partialName', partialName);

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
