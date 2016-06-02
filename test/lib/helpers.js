'use strict';

var helpers = {
  handlebars: {
    upper: function(str) {
      return str.toUpperCase();
    },
    lower: function(str, options, cb) {
      cb(null, str.toLowerCase());
    },
    spacer: function(str, delim, options, cb) {
      if (typeof delim === 'object') {
        cb = options;
        options = delim;
        delim = ' ';
      }
      cb(null, str.split('').join(delim));
    },
    block: function(options) {
      return options.fn(this);
    }
  },
  lodash: {
    upper: function(str) {
      return str.toUpperCase();
    },
    lower: function(str, cb) {
      cb(null, str.toLowerCase());
    },
    spacer: function(str, delim, cb) {
      if (typeof delim === 'function') {
        cb = delim;
        delim = ' ';
      }
      cb(null, str.split('').join(delim));
    }
  }
};


// async helpers must have an `async` property
helpers.handlebars.lower.async = true;
helpers.handlebars.spacer.async = true;
helpers.lodash.lower.async = true;
helpers.lodash.spacer.async = true;

module.exports = helpers;
