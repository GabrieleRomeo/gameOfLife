import { type, isDefined } from './is';

const MathFloor = Math.floor;
const MathRnd = Math.random;

/**
  * Take a function and returns another function which takes a list of arguments
  * and applies the first function to the arguments swapped in reverse order.
  */
const flip = fn => (...args) => fn.apply(this, args.reverse());

/**
 * Takes a Function with {N} parameters and splits it in a series of
 * functions each taking a single argument. It allows you to provide an
 * optional parameter 'n' which sets the function's arity.
 * @param {Function} fn A function to be curried
 * @param {Integer}   n An optional integer representing the arity of the
 *                      fn function
 *
 * @returns {Function} It returns a series of functions each taking a
 *                     single argument.
 */
export const curry = (fn, n) => {
  const arity = n || fn.length;

  return function curried(...args) {
    const context = this;

    return args.length >= arity
      ? fn.apply(context, args)
      : (...remain) => curried.apply(this, args.concat(remain));
  };
};

/**
 * Takes a Function with {N} parameters and splits it in a series of
 * functions each taking a single argument. It allows you to provide an
 * optional parameter 'n' which sets the function's arity.
 * @param {Function} fn A function to be curried
 * @param {Integer}   n An optional integer representing the arity of the
 *                      fn function
 *
 * @returns {Function} It returns a series of functions each taking a
 *                     single argument.
 *
 */
export const run = (fn, n) => curry(flip(fn), n);

/**
 * Executes a shallow copy of the provided source objects into a target object
 */
export const copy = (t, ...ss) =>
  ss.reduce((o, s) => Object.assign(o, { ...s }), { ...t });

/**
 * Makes a deep merge between a Target object and a Source
 * @private
 * @param     {Object}   [target]    The target object
 * @return    {Object}   source   A source object
 * @return    {Object}     The merged Object
 *
 */
const innerMergeDeep = (target, source) => {
  const isObj = x => type(x) === 'Object';
  if (isObj(target) && isObj(source)) {
    Object.keys(source).forEach(key => {
      if (isObj(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        innerMergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    });
  }
  return target;
};

/**
 * Makes a deep merge copy of the provided sources Object
 *
 * @param     {Object}   [target]    The target object
 * @return    {Object}      A list of sources
 * @return    {Object}     The merged Object
 *
 */
export const deepMerge = (target = {}, ...sources) =>
  sources.reduce((o, s) => innerMergeDeep(o, s), { ...target });

/**
 * Evaluates if the provided item satisfies a predicate
 *
 * @param      {Function}  pred    The predicate
 * @return    {Function}  A function which takes either a default value or an
 *                        alternative
 * @param      {Any}   d    The default value
 * @param      {Any}   a    The alternative value
 * @return     {Any}    When the predicate is satisfied, it returns the value
 *                      otherwise it returns the alternative value
 */
export const evaluate = pred => (d, a) => (pred(d) ? d : a);

/**
 * Given an object it flattens it (make it single-level)
 *
 * @param     {Object}   obj    The object that needs to be flattened
 * @return    {String}   [name]  An optional name for the stem
 * @return    {String}   [stem]  An optional stem
 *
 */
export const flatten = (obj, name, stem) => {
  let out = {};
  const isObj = is('Object');
  const newStem = isDefined(stem) ? `${stem}_${name}` : name;

  if (!isObj(obj)) {
    out[newStem] = obj;
    return out;
  }

  Object.keys(obj).forEach(p => {
    const prop = flatten(obj[p], p, newStem);
    out = Object.assign({}, out, prop);
  });

  return out;
};

/**
 * Get a random integer
 * @param  {Number} [max]  The upper limit (defualt 10 - not included)
 * @param  {Number} [min]  The lower limit (default 0 - included)
 * @return {Number}      A random integer from min to max
 */
export const getRandomInt = (max = 10, min = 0) =>
  MathFloor(MathRnd() * (max - min)) + min;

/**
 * Get a random rgb color
 * @return {String}      A random rgb color in the format
 *                       rgb([0-255], [0-255], [0-255])
 */
export const randomRGB = () => {
  const r = getRandomInt(256);
  const g = getRandomInt(256);
  const b = getRandomInt(256);

  return `rgb(${r},${g},${b})`;
};

/**
 * Get a random rgba color
 * @return {String}      A random rgba color in the format
 *                       rgba([0-255], [0-255], [0-255], [0-1])
 */
export const randomRGBA = () => {
  const r = getRandomInt(256);
  const g = getRandomInt(256);
  const b = getRandomInt(256);
  const a = Math.random(1.1);

  return `rgba(${r},${g},${b},${a})`;
};

/**
 * Returns an HTML element (if any)
 *
 * @param      {String}  selector     A css selector
 * @return     {HTMLNode} [ctx] An optional parent context
 */
export const $ = (selector, ctx = document.body) => ctx.querySelector(selector);
