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
