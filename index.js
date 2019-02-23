const parser = require("odata-parser");

const objectOperators = [
  "and",
  "or",
  "between",
  "notBetween",
  "in",
  "notIn",
  "any",
  "overlap",
  "contains",
  "contained"
];
const valueOperators = [
  "gt",
  "gte",
  "lt",
  "lte",
  "ne",
  "eq",
  "not",
  "like",
  "notLike",
  "iLike",
  "notILike",
  "regexp",
  "notRegexp",
  "iRegexp",
  "notIRegexp",
  "col"
];
const customOperators = [
  "substringof",
  "startswith",
  "tolower",
  "toupper",
  "trim",
  "year",
  "month",
  "day",
  "hour",
  "minute",
  "second"
];
let mappedValueOperators = [];

function mapOperators(sequelize) {
  mappedValueOperators = valueOperators.map(element => sequelize.Op[element]);
}

function getOperator(strOperator, sequelize) {
  if (!sequelize.Op) throw new Error("Sequelize operator not found.");

  const allOperators = objectOperators.concat(valueOperators).concat(customOperators);
  if (!allOperators.includes(strOperator))
    throw new Error(`Operator not recognized: ${strOperator}`);

  const selectedOperator = sequelize.Op[strOperator];

  if (!selectedOperator) {
    switch (strOperator) {
      case "substringof":
      case "startswith":
        return sequelize.Op.like;
      case "tolower":
      case "toupper":
      case "trim":
      case "year":
      case "month":
      case "day":
      case "hour":
      case "minute":
      case "second":
        return sequelize.Op.eq;
      default:
        throw new Error("Sequelize operator not found.");
    }
  } else return selectedOperator;
}

function transformTree(root, sequelize) {
  if (!sequelize.Op) throw new Error("Sequelize operator not found.");

  Object.getOwnPropertySymbols(root).forEach(rootSymbol => {
    if (mappedValueOperators.includes(rootSymbol)) {
      const tmp = root[rootSymbol];
      delete root[rootSymbol];

      const targetObj = tmp[0];
      const key = Object.keys(targetObj)[0];
      const value = targetObj[key];

      if (!!value.constructor && value.constructor.name === "Where") {
        [root] = tmp;
      } else {
        root[key] = {};
        root[key][rootSymbol] = value;
      }
    } else {
      root[rootSymbol].forEach((obj, index) => {
        root[rootSymbol][index] = transformTree(obj, sequelize);
      });
    }
  });

  return root;
}

function parseFunction(obj, root, baseOperator, sequelize) {
  if (obj.type !== "functioncall") throw new Error("Type is not a functioncall.");
  if (!Object.prototype.hasOwnProperty.call(obj, "func")) throw new Error("Function not found.");
  if (!Object.prototype.hasOwnProperty.call(obj, "args")) throw new Error("Args not found.");
  if (!sequelize.where) throw new Error("Sequelize where function not found.");

  const dbFunction = [
    "tolower",
    "toupper",
    "trim",
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second"
  ];
  const { args } = obj;
  const tmp = {};
  let value = "";
  const operator = baseOperator || getOperator(obj.func, sequelize);
  const key = args.filter(t => Object.prototype.hasOwnProperty.call(t, "name"))[0].name;
  const setValue = functionName => {
    if (root instanceof Array) {
      tmp[key] = sequelize.where(sequelize.fn(functionName, sequelize.col(key)), operator, value);
    } else {
      root[key] = sequelize.where(sequelize.fn(functionName, sequelize.col(key)), operator, value);
    }
  };

  if (root instanceof Array && !dbFunction.includes(obj.func)) {
    const tmpObj = {};
    tmpObj[operator] = [];
    root.push(tmpObj);
  } else if (root instanceof Array) {
    root.push({});
  } else {
    root[key] = {};
  }

  switch (obj.func) {
    case "substringof":
      value = `%${args[0].value}%`;
      break;
    case "startswith":
      value = `${args[0].value}%`;
      break;
    case "tolower":
    case "toupper":
    case "trim":
    case "year":
    case "month":
    case "day":
    case "hour":
    case "minute":
    case "second":
      setValue(obj.func);
      break;
    default:
      break;
  }

  if (root instanceof Array) {
    if (!dbFunction.includes(obj.func)) {
      tmp[key] = value;
      root[root.length - 1][operator].push(tmp);
    } else {
      root[root.length - 1] = tmp;
    }
  } else if (!dbFunction.includes(obj.func)) {
    root[key][operator] = value;
  }
}

function parseFunctionCall(obj, root, operator, sequelize) {
  if (obj.type !== "functioncall") throw new Error("Type is not a functioncall.");

  switch (obj.func) {
    case "substringof":
    case "startswith":
    case "tolower":
    case "toupper":
    case "trim":
    case "year":
    case "month":
    case "day":
    case "hour":
    case "minute":
    case "second":
      parseFunction(obj, root, operator, sequelize);
      break;
    default:
      break;
  }
}

function preOrderTraversal(root, baseObj, operator, sequelize) {
  const strOperator = root.type === "functioncall" ? root.func : root.type;
  if (root.type !== "property" && root.type !== "literal")
    operator = strOperator ? getOperator(strOperator, sequelize) : operator;

  if (root.type === "functioncall") {
    parseFunctionCall(root, baseObj, operator, sequelize);
  } else if (root.type === "property" || root.type === "literal") {
    if (root.type === "property") {
      baseObj.push({});
      const { length } = baseObj;
      baseObj[length - 1][root.name] = "";
    } else {
      const { length } = baseObj;
      const key = Object.keys(baseObj[length - 1])[0];

      if (Object.prototype.hasOwnProperty.call(baseObj[length - 1][key], "logic")) {
        baseObj[length - 1][key].logic = root.value;
      } else {
        baseObj[length - 1][key] = root.value;
      }
    }
  } else if (baseObj instanceof Array) {
    baseObj.push({});

    const { length } = baseObj;
    baseObj[length - 1][operator] = [];
  } else {
    baseObj[operator] = [];
  }

  if (root.left) {
    if (baseObj instanceof Array && baseObj.length > 0) {
      const { length } = baseObj;
      preOrderTraversal(root.left, baseObj[length - 1][operator], operator, sequelize);
    } else {
      preOrderTraversal(root.left, baseObj[operator], operator, sequelize);
    }
  }

  if (root.right) {
    if (baseObj instanceof Array && baseObj.length > 0) {
      const { length } = baseObj;
      preOrderTraversal(root.right, baseObj[length - 1][operator], operator, sequelize);
    } else {
      preOrderTraversal(root.right, baseObj[operator], operator, sequelize);
    }
  }

  return baseObj;
}

/**
 * Parse OData expression
 * @param {string} expression
 * @return {object} parsed object
 */
function parseExpression(expression) {
  return parser.parse(expression);
}

/**
 * Parse $select
 * @param {string} $select
 * @return {object} parsed object
 */
function parseSelect($select) {
  const attributes = [];

  if ($select) {
    $select.forEach(element => {
      attributes.push(element);
    });
  }

  return attributes.length > 0 ? { attributes } : {};
}

/**
 * Parse $top
 * @param {string} $top
 * @return {number} number of registers to fetch
 */
function parseTop($top) {
  let limit = 0;

  if ($top) {
    limit = $top;
  }

  return limit > 0 ? { limit } : {};
}

/**
 * Parse $skip
 * @param {string} $skip
 * @return {number} number of registers to skip
 */
function parseSkip($skip) {
  let offset = 0;

  if ($skip) {
    offset = $skip;
  }

  return offset > 0 ? { offset } : {};
}

/**
 * Parse $filter
 * @param {string} $filter
 * @return {object} parsed object
 */
function parseFilter($filter, sequelize) {
  if (!sequelize.Op) throw new Error("Sequelize operator not found.");

  if (!$filter) {
    return {};
  }
  const tree = preOrderTraversal($filter, {}, null, sequelize);
  const parsed = transformTree(tree, sequelize);

  return parsed !== {} ? { where: parsed } : {};
}

/**
 * Parse $orderby
 * @param {string} $orderby
 * @return {object} parsed object
 */
function parseOrderBy($orderby) {
  const order = [];

  if ($orderby) {
    $orderby.forEach(element => {
      const arr = [];
      const key = Object.keys(element)[0];

      arr.push(key);
      arr.push((element[key] || "asc").toUpperCase());
      order.push(arr);
    });
  }

  return order.length > 0 ? { order } : {};
}

/**
 * Parse an OData string to a sequelize query object
 * @param {string2Parse} OData string to parse
 * @param {sequelize} Sequelize instance
 * @return {object} filled object to pass as query argument
 */
module.exports = (string2Parse, sequelize) => {
  if (!sequelize) throw new Error("Sequelize instance is required.");
  if (!sequelize.Op) throw new Error("Sequelize operator not found.");

  mapOperators(sequelize);

  const expression = parseExpression(string2Parse);
  const attributes = parseSelect(expression.$select);
  const top = parseTop(expression.$top);
  const skip = parseSkip(expression.$skip);
  const orderby = parseOrderBy(expression.$orderby);
  const filter = parseFilter(expression.$filter, sequelize);

  return Object.assign({}, attributes, top, skip, orderby, filter);
};
