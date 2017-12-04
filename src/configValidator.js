import { isNumber, isFunction, isObj, isDefined } from './is';

const minNum = Number.MIN_SAFE_INTEGER;
const maxNum = Number.MAX_SAFE_INTEGER;

const evaluateRules = (rules, value) =>
  rules.reduce((r, check) => {
    const test = check(value);
    return r && test;
  }, true);

const setMinMaxRange = (defaultValue, minValue, maxValue) => userValue => {
  // Do the evaluation only for numerical datatype
  if (!isNumber(defaultValue)) {
    return defaultValue;
  }

  let result;
  if (userValue < minValue) {
    result = minValue;
  } else if (userValue > maxValue) {
    result = maxValue;
  } else {
    result = defaultValue;
  }
  return result;
};

/* eslint-disable no-param-reassign */
export const validateConfig = (base, config = {}, target = {}) =>
  Object.keys(base).reduce((result, prop) => {
    const subItem = base[prop];
    const { defaultValue: subValue, rules = [] } = subItem;

    // When the item contains a default value it means that it's a leaf
    if (isDefined(subValue)) {
      const defaultValue = isFunction(subValue) ? subValue() : subValue;
      const { minValue, maxValue } = subItem;
      const setRange = setMinMaxRange(defaultValue, minValue, maxValue);
      const userValue =
        isDefined(config) && isDefined(config[prop])
          ? config[prop]
          : defaultValue;
      const isValid = evaluateRules(rules, userValue);
      result[prop] = isValid ? userValue : setRange(userValue);
      // If the default value has a number data type, and minValue or maxValue
      // has been defined for the current property, use them (if any) or set
      // them as the minimum or maximum safe number respectively
      if (
        isNumber(defaultValue) &&
        (isDefined(minValue) || isDefined(maxValue))
      ) {
        result[`${prop}_min`] = minValue || minNum;
        result[`${prop}_max`] = maxValue || maxNum;
      }
    } else if (!isObj(subItem)) {
      result[prop] = subItem;
    } else {
      // When the subItem is an Object itself
      // Use recursion to iterate its items
      result[prop] = validateConfig(subItem, config[prop], result[prop]);
    }

    return result;
  }, target);
/* eslint-enable no-param-reassign */
