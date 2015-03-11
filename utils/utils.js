/**
 * @external formidable
 * @see https://www.npmjs.com/package/formidable
 */

/*
 * module dependency
 */
var assert = require('assert');
var fs = require('fs');
var formidable = require('formidable');

/**
 * Export several useful method
 * @exports utils
 * @requires formidable
 * @author bornkiller <hjj491229492@hotmail.com>
 * @version v0.6.6
 * @license MIT
 * @copyright bornkiller NPM package 2014
 */
var utils = {};

/**
 * Judge map rules match, return final URL when match, false when mismatch
 * @param path
 * @param map
 * @returns {boolean|string}
 */
utils.resolvePath = function(path, map) {
  assert.ok(map && Object === map.constructor, 'Map Object Required');

  var normal = []
    , regExp = []
    , insRegExp = []
    , url
    , pathRegExp;

  var keys = Object.keys(map);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].indexOf('=') !== 0 && keys[i].indexOf('~') !== 0 && keys[i].indexOf('~*') !== 0) normal.push(keys[i]);
    if (keys[i].indexOf('=') === 0) normal.push(keys[i].slice(1));
    if (keys[i].indexOf('~') === 0 && keys[i].indexOf('~*') !== 0) regExp.push(new RegExp(keys[i].slice(1)));
    if (keys[i].indexOf('~*') === 0) insRegExp.push(new RegExp(keys[i].slice(2), 'i'));
  }

  if (normal.some(function(value) { return value === path})) {
    url = map[path] ? map[path] : map['=' + path];
    return url.replace(new RegExp('https?:\/\/'), '').indexOf('/') === -1 ? url + path : url;
  }

  pathRegExp = regExp.filter(function(value) { return value.test(path);});
  if (pathRegExp.length !== 0) {
    url = map['~' + pathRegExp[0].toString().replace(new RegExp('^\/'), '').replace(new RegExp('\/$'), '')];
    return url.replace(new RegExp('https?:\/\/'), '').indexOf('/') === -1 ? url + path : url;
  }

  pathRegExp = insRegExp.filter(function(value) { return value.test(path);});
  if (pathRegExp.length !== 0) {
    url = map['~*' + pathRegExp[0].toString().replace(new RegExp('^\/'), '').replace(new RegExp('\/i$'), '')];
    return url.replace(new RegExp('https?:\/\/'), '').indexOf('/') === -1 ? url + path : url;
  }

  return false;
};

/**
 * revert parsed body into original structure
 * @param {object} request - koa context or origin request
 * @returns {string|object|null}
 */
utils.resolveBody = function(request) {
  request = request.request || request;
  if (request.is('application/x-www-form-urlencoded')) return utils.serialize(request.body);
  if (request.is('json')) return request.body;
  return null;
};

/**
 * serialize object into x-www-form-urlencoded string
 * @param {object} obj - parsed body
 * @returns {string}
 */
utils.serialize = function(obj) {
  if (!(Object == obj.constructor)) return '';
  var result = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      result.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
    }
  }
  return result.join('&');
};

/**
 * parse multipart/form-data body and stream next
 * @param {object} req - koa context or koa request wrapper
 * @param {object} opts - options pass to formidable module
 * @returns {Function} - yieldable function
 */
utils.resolveMultipart = function(req, opts) {
  req = req.req || req;

  return function(done) {
    var data = {};
    var form = new formidable.IncomingForm(opts);
    form
      .on('field', function(name, value) {
        data[name] = value;
      })
      .on('file', function(name, file) {
        data[name] = fs.readFileSync(file.path)
      })
      .on('error', function(error) {
        done(error);
      })
      .on('end', function() {
        done(null, data);
      });
    form.parse(req);
  }
};

/**
 * transform multipart/form-data body into normal object(No buffer)
 * @param {object} multipart - request body generated by formidable
 * @returns {Object} - normal object
 */
utils.objectNormalize = function(multipart) {
  if (!multipart || Object !== multipart.constructor) return multipart;
  var keys = Object.keys(multipart);
  for (var i = 0; i < keys.length; i++) {
    multipart[keys[i]] = multipart[keys[i]].toString();
  }
  return multipart;
};

/**
 * shallow merge two normal object
 * @param {object} destiny - the final object to override with source
 * @param {object} source - the origin object wait to merge
 * @returns {Object} - final merged object
 */
utils.merge = function(destiny, source) {
  for (var key in source) {
    if (source.hasOwnProperty(key)) {
      destiny[key] = source[key];
    }
  }
  return destiny;
};

module.exports = utils;