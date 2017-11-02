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
