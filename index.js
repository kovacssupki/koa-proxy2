var assert =require('assert');
var thunkify = require('thunkify');
var request = thunkify(require('request'));
var resolvePath = require('./utils/utils.js').resolvePath;

var koaProxy = function(options) {
  assert.ok(options && Object === options.constructor, 'Options Object Required');

  return function* (next) {
    if (resolvePath(this.request.path, options.map)) {
      var opts = {
        method: this.request.method,
        url: resolvePath(this.request.path, options.map),
        headers: this.request.header,
        body: this.request.body
      };

      opts.json = this.request.is('json') === 'json';
      opts.qs = !!options.keepQueryString ? this.request.query : {};

      var response = yield request(opts);
      this.header = response[0].header;
      this.body = response[0].body;
      return null;
    }

    yield next;
  };
};

module.exports = koaProxy;