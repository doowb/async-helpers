'use strict';

var HelperAsync = require('./');

var helperAsync = new HelperAsync();

var async = {
  upper: function (str) {
    return str.toUpperCase();
  },
  lower: function (str, done) {
    done(null, str.toLowerCase());
  },
  spacer: function (str, delim, done) {
    if (typeof delim === 'function') {
      done = delim;
      delim = ' ';
    }
    done(null, str.split('').join(delim));
  }
};

Object.keys(async).forEach(function (key) {
  helperAsync.set(key, async[key]);
});

var helpers = helperAsync.get({wrap: true});

function run (keys, value) {
  keys = Array.isArray(keys) ? keys : [keys];
  keys.forEach(function (key) {
    value = helpers[key](value);
  });
  console.log('value', value);
  return value;
}

function resolve (id, done) {
  helperAsync.resolve(id, function (err, results) {
    console.log(id, results);
    done(err, results);
  });
}

var id = run('upper', 'brian');
resolve(id, function (err, results) {
  console.log();
  id = run(['upper', 'lower'], 'brian');
  resolve(id, function (err, results) {
    console.log();
    id = run(['upper', 'lower'], 'brian');
    id = helpers.spacer(id, '-');
    resolve(id, function (err, results) {
      console.log();
      id = run(['upper', 'lower', 'upper'], 'brian');
      resolve(id, function(err, results) {
        console.log();
        var uid = helpers.upper('brian');
        var lid = helpers.lower(uid);
        resolve(uid, function (err, results) {
          console.log();
          resolve(lid, function (err, results) {
            console.log();
            resolve(uid, function (err, results) {
              console.log();
              resolve(lid, function (err, results) {
                console.log();
              });
            });
          });
        });
      });
    });
  });
});


/**
 * ```hbs
 * {{lower (upper "brian")}}
 * ```
 */
