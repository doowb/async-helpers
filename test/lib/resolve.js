'use strict';

var async = require('async');

module.exports = function (asyncHelpers) {
  return function resolve (str, done) {
    var stashed = asyncHelpers.stash;
    var keys = Object.keys(stashed);
    async.eachSeries(keys, function (key, next) {
      // check to see if the async ID is in the str string
      var i = str.indexOf(key);
      if (i === -1) {
        // if not go on to the next one
        return next(null);
      }
      asyncHelpers.resolve(key, function (err, value) {
        if (err) return next(err);
        // replace the async ID with the resolved value
        str = str.replace(key, value);
        next(null);
      });
    }, function (err) {
      if (err) return done(err);
      done(null, str);
    });
  };
};
