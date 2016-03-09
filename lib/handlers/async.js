'use strict';

var utils = require('../utils');

module.exports = function(fn) {
  return utils.deasync(fn);
};
