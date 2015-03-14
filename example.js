'use strict';

var _ = require('lodash');
var async = require('async');
var AsyncHelpers = require('./');

var asyncHelpers = new AsyncHelpers();

var helperList = {
  upper: function (str) {
    return str.toUpperCase();
  },
  lower: function (str, options, done) {
    if (typeof options === 'function') {
      done = options;
      options = {};
    }
    done(null, str.toLowerCase());
  },
  spacer: function (str, delim, options, done) {
    if (typeof delim === 'object') {
      done = options;
      options = delim;
      delim = ' ';
    }
    if (typeof options === 'function') {
      done = options;
      options = {};
    }
    if (typeof delim === 'function') {
      done = delim;
      delim = '';
      options = {};
    }
    done(null, str.split('').join(delim));
  }
};
helperList.lower.async = true;
helperList.spacer.async = true;

Object.keys(helperList).forEach(function (key) {
  asyncHelpers.set(key, helperList[key]);
});

var helpers = asyncHelpers.get({wrap: true});

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

var lodash = [
  'input: <%= name %>',
  'upper: <%= upper(name) %>',
  'lower: <%= lower(name) %>',
  'spacer: <%= spacer(name) %>',
  'spacer-delim: <%= spacer(name, "-") %>',
  'lower(upper): <%= lower(upper(name)) %>',
  'spacer(upper, lower): <%= spacer(upper(name), lower("X")) %>'
].join('\n');

Handlebars.registerHelper(helpers);
var hbsFn = Handlebars.compile(hbs);
var hbsRendered = hbsFn({name: 'brian'});
console.log('Handlebars rendered:');
console.log(hbsRendered);
console.log();

var stashed = asyncHelpers._stash;
var keys = Object.keys(stashed);
async.eachSeries(keys, function (key, next) {
  var i = hbsRendered.indexOf(key);
  if (i === -1) {
    return next(null);
  }
  asyncHelpers.resolve(key, function (err, value) {
    if (err) return next(err);
    hbsRendered = hbsRendered.replace(key, value);
    next(null);
  });
}, function (err) {
  console.log('Handlebars resolved');
  console.log(hbsRendered);
  console.log();
});

var _fn = _.template(lodash, { imports: helpers});
var _rendered = _fn({name: 'brian'});
console.log('lodash rendered:');
console.log(_rendered);
console.log();

var stashed = asyncHelpers._stash;
var keys = Object.keys(stashed);
async.eachSeries(keys, function (key, next) {
  var i = _rendered.indexOf(key);
  if (i === -1) {
    return next(null);
  }
  asyncHelpers.resolve(key, function (err, value) {
    if (err) return next(err);
    _rendered = _rendered.replace(key, value);
    next(null);
  });
}, function (err) {
  console.log('Lodash resolved');
  console.log(_rendered);
  console.log();
});


// function run (keys, value) {
//   keys = Array.isArray(keys) ? keys : [keys];
//   keys.forEach(function (key) {
//     value = helpers[key](value);
//   });
//   console.log('value', value);
//   return value;
// }

// function resolve (id, done) {
//   asyncHelpers.resolve(id, function (err, results) {
//     console.log(id, results);
//     done(err, results);
//   });
// }

// var id = run('upper', 'brian');
// resolve(id, function (err, results) {
//   console.log();

//   id = run(['upper', 'lower'], 'brian');
//   resolve(id, function (err, results) {
//     console.log();

//     id = run(['upper', 'lower'], 'brian');
//     id = helpers.spacer(id, '-');

//     resolve(id, function (err, results) {
//       console.log();

//       id = run(['upper', 'lower', 'upper'], 'brian');
//       resolve(id, function(err, results) {
//         console.log();

//         var uid = helpers.upper('brian');
//         var lid = helpers.lower(uid);

//         resolve(uid, function (err, results) {
//           console.log();
//           resolve(lid, function (err, results) {
//             console.log();
//             resolve(uid, function (err, results) {
//               console.log();
//               resolve(lid, function (err, results) {
//                 console.log();
//               });
//             });
//           });
//         });
//       });
//     });
//   });
// });


/**
 * ```hbs
 * {{lower (upper "brian")}}
 * ```
 */
