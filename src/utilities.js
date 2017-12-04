export const MathFloor = Math.floor;
export const MathRnd = Math.random;

/**
 * Returns the data type of the provided argument
 *
 * @param      {Any}  x       The value under the test
 * @return     {string}  The data type of the provided argument
 */
export const type = x => {
  if (x === null) return 'Null';
  if (x === undefined) return 'Undefined';
  return Object.prototype.toString.call(x).slice(8, -1);
};

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
 * Checks if the provided value is of an intended data type
 *
 * @param      {String}   what    The name of the expected data type
 * @return    {Function}      A function which takes an item as argument
 * @param      {String}   item    The item under the test
 * @return     {boolean}      True if the item's data type is the same as the
 *                            expected one, False otherwise
 */
export const is = what => item => type(item) === what;

/**
 * Evaluates if the provided item is defined
 *
 * @param      {Any}  item    The item under test
 * @return    {Boolean}  True if the item is neither Null nor Undefined, False
 *                            otherwise
 */
export const isDefined = item => !is('Null')(item) && !is('Undefined')(item);

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
 * Checks that the input parameter matches all of the following:
 *
 * - input is greater than or equal to the floor parameter
 * - input is less than or equal to the ceil parameter.
 * @param {Number | String } input The value to analyze.
 * @param {Number | String} floor The lower threshold
 * @param {Number | String} ceil The upper threshold
 *
 * @returns {boolean} True or False
 */
const isBetween = (input, floor, ceil) => +input >= +floor && +input <= +ceil;

/**
 * Checks if the input string is a hexadecimal color, such as #3677bb.
 * Hexadecimal colors are strings with a length of 7 (including the #),
 * using the characters 0—9 and A—F. isHex should also work on shorthand
 * hexadecimal colors, such as #333.
 * The input must start with a # to be considered valid.

 * @param {string} input A valid Hexadecimal color
 * @returns {boolean} True or False
 */
const isHex = input => {
  if (!isDefined(input)) {
    return false;
  }
  const len = input.length;
  const chars = input.substr(1).split('');

  if (input.charAt(0) !== '#') return false;
  if (len !== 4 && len !== 7) return false;

  return chars.reduce((prev, curr) => {
    const chk1 = isBetween(curr, 'a', 'f');
    const chk2 = isBetween(curr, '0', '9');
    return chk1 || chk2 ? prev : false;
  }, true);
};

/**
 * Checks if the input string is an RGB color, such as rgb(200, 26, 131).
 * An RGB color consists of:
 * - Three numbers between 0 and 255
 * - A comma between each number
 * - The three numbers should be contained within “rgb(” and “)“.

 * @param {string} input A valid RGB color
 * @returns {boolean} True or False
 */
const isRGB = input => {
  if (!isDefined(input)) {
    return false;
  }
  const sanitized = input
    .split('rgb(')
    .join('')
    .split(')')
    .join('');
  const values = sanitized.split(',');

  if (values.length !== 3) return false;

  return values.reduce(
    (prev, curr) => (isBetween(curr.trim(), '0', '255') ? prev : false),
    true,
  );
};

/**
 * Checks if the input string is an HSL color, such as hsl(122, 1, 1).
 * An HSL color consists of:
 * - Three numbers:
 *   • the first number, Hue, is between 0 and 360
 *   • the second and third numbers, Saturation and Lightness,
 *     are between 0 and 1
 * - A comma between each number
 * - The three numbers should be contained within “hsl(” and “)“.
 *
 * @param {string} input A valid HSL color
 * @returns {boolean} True or False
 */
const isHSL = input => {
  if (!isDefined(input)) {
    return false;
  }

  const sanitized = input
    .split('hsl(')
    .join('')
    .split(')')
    .join('');
  const values = sanitized.split(',');

  if (values.length !== 3) return false;

  if (!isBetween(values[0].trim(), 0, 360)) return false;
  if (!isBetween(values[1].trim(), 0, 1)) return false;
  if (!isBetween(values[2].trim(), 0, 1)) return false;

  return true;
};

/**
 * Checks if the input parameter is a hex, RGB, or HSL color type.
 * @param {string} input A valid color (Hex, RGB, HSL)
 *
 * @returns {boolean} True or False
 */
export const isColor = input => isHex(input) || isRGB(input) || isHSL(input);

/**
 * Returns an HTML element (if any)
 *
 * @param      {String}  selector     A css selector
 * @return     {HTMLNode} [ctx] An optional parent context
 */
export const $ = (selector, ctx = document.body) => ctx.querySelector(selector);
