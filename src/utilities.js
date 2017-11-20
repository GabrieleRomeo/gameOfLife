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
const curry = (fn, n) => {
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
 * optional parameter 'n' which sets the function's arity. Unlike curry,
 * rcurry curries a function's arguments from right to left.
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
