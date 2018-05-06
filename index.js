'use strict';

var parser = require("odata-parser");

var objectOperators = ["and", "or", "between", "notBetween", "in", "notIn",
    "any", "overlap", "contains", "contained"];
var valueOperators = ["gt", "gte", "lt", "lte", "ne", "eq",
    "not", "like", "notLike", "iLike", "notILike",
    "regexp", "notRegexp", "iRegexp", "notIRegexp", "col"];
var customOperators = ["substringof", "startswith", "tolower", "toupper", "trim",
    "year", "month", "day", "hour", "minute", "second"];
var mappedObjectOperators = [];
var mappedValueOperators = [];

var helpers = {
    mapOperators: (sequelize) => {
        mappedValueOperators = valueOperators.map(element => {
            return sequelize.Op[element];
        });

        mappedObjectOperators = objectOperators.map(element => {
            return sequelize.Op[element]
        });
    },

    getOperator: (strOperator, sequelize) => {
        if (!!!sequelize.Op) throw new Error("Sequelize operator not found.");

        var allOperators = objectOperators
                          .concat(valueOperators)
                          .concat(customOperators);
        if (!allOperators.includes(strOperator)) throw new Error("Operator not recognized.");

        var selectedOperator = sequelize.Op[strOperator];

        if (!!!selectedOperator) {
            switch (strOperator) {
                case "substringof":
                case "startswith":
                    return sequelize.Op.like;
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
                    return sequelize.Op.eq;
                    break;
                default: throw new Error("Sequelize operator not found.");
                    break;
            }
        }
        else return selectedOperator;
    },

    preOrderTraversal: (root, baseObj, operator, sequelize) => {
        var operator = operator || helpers.getOperator(root.type, sequelize);

        if (root.type === "functioncall") {
            helpers.parseFunctionCall(root, baseObj, operator, sequelize);
        }
        else {
            if (root.type === "property" || root.type === "literal") {
                if (root.type === "property") {
                    baseObj.push({});
                    var length = baseObj.length;
                    baseObj[length - 1][root.name] = "";
                }
                else {
                    var length = baseObj.length;
                    var key = Object.keys(baseObj[length - 1])[0];

                    if (baseObj[length - 1][key].hasOwnProperty("logic")) {
                        baseObj[length - 1][key].logic = root.value;
                    }
                    else {
                        baseObj[length - 1][key] = root.value;
                    }
                }
            }
            else {
                if (baseObj instanceof Array) {
                    baseObj.push({});
    
                    var length = baseObj.length;
                    baseObj[length - 1][operator] = []
                }
                else {
                    baseObj[operator] = [];
                }
            }
        }

        if (root.left) {
            if (baseObj instanceof Array && baseObj.length > 0) {
                var length = baseObj.length;
                helpers.preOrderTraversal(root.left, baseObj[length - 1][operator], operator, sequelize);    
            }
            else {
                helpers.preOrderTraversal(root.left, baseObj[operator], operator, sequelize);
            }
        }

        if (root.right) {
            if (baseObj instanceof Array && baseObj.length > 0) {
                var length = baseObj.length;
                helpers.preOrderTraversal(root.right, baseObj[length - 1][operator], operator, sequelize);
            }
            else {
                helpers.preOrderTraversal(root.right, baseObj[operator], operator, sequelize);
            }
        }
        
        return baseObj;
    },

    transformTree: (root, sequelize) => {
        if (!!!sequelize.Op) throw new Error("Sequelize operator not found.");

        Object.getOwnPropertySymbols(root).forEach(rootSymbol => {
            if (mappedValueOperators.includes(rootSymbol)) {
                var tmp = root[rootSymbol];
                delete root[rootSymbol];

                var targetObj = tmp[0];
                var key = Object.keys(targetObj)[0];
                var value = targetObj[key];

                if (!!value.constructor && value.constructor.name === "Where") {
                    root = tmp[0];
                }
                else {
                    root[key] = {};
                    root[key][rootSymbol] = value;
                }
            }
            else {
                root[rootSymbol].forEach((obj, index) => {
                    root[rootSymbol][index] = helpers.transformTree(obj, sequelize);
                });
            }
        });        

        return root;
    },

    parseFunctionCall: (obj, root, operator, sequelize) => {
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
                helpers.parseFunction(obj, root, operator, sequelize);
                break; 
            default: throw new Error("Function not found.");
                break;
        }
    },

    parseFunction: (obj, root, baseOperator, sequelize) => {
        if (obj.type !== "functioncall") throw new Error("Type is not a functioncall.");
        if (!obj.hasOwnProperty("func")) throw new Error("Function not found.");
        if (!obj.hasOwnProperty("args")) throw new Error("Args not found.");
        if (!!!sequelize.where) throw new Error("Sequelize where function not found.");

        var dbFunction = ["tolower", "toupper", "trim",
                          "year", "month", "day", 
                          "hour", "minute", "second"];
        var func = obj.func;
        var args = obj.args;
        var tmp = {};
        var value = "";
        var operator = baseOperator || helpers.getOperator(obj.func, sequelize);
        var key = args.filter(t => {
            return t.hasOwnProperty("name");
        })[0].name;
        var setValue = function (functionName) {
            if (root instanceof Array) {
                tmp[key] = sequelize.where(sequelize.fn(functionName, sequelize.col(key)), operator, value);
            }
            else {
                root[key] = sequelize.where(sequelize.fn(functionName, sequelize.col(key)), operator, value);
            }
        };

        if (root instanceof Array && !dbFunction.includes(obj.func)) {
            var tmpObj = {};
            tmpObj[operator] = [];
            root.push(tmpObj);
        }
        else {
            if (root instanceof Array) {
                root.push({});
            }
            else {
                root[key] = {};
            }
        }

        switch (obj.func) {
            case "substringof":
                value = "%" + args[0].value + "%";
                break;
            case "startswith":
                value = args[0].value + "%";
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
            default: throw new Error("Function not mapped.");
                break;
        }
        
        if (root instanceof Array) {
            if (!dbFunction.includes(obj.func)) {
                tmp[key] = value;
                root[root.length - 1][operator].push(tmp);
            }
            else {
                root[root.length - 1] = tmp;
            }
        }
        else {
            if (!dbFunction.includes(obj.func)) {
                root[key][operator] = value;
            }
        }
    }
};

/**
 * Parse OData expression
 * @param {string} expression
 * @return {object} parsed object
 */
var parseExpression = function (expression) {
    return parser.parse(expression);
};

/**
 * Parse $select
 * @param {string} $select
 * @return {object} parsed object
 */
var parseSelect = function ($select) {
    var attributes = [];

    if (!!$select) {
        $select.forEach(element => {
            attributes.push(element);
        });
    }

    return attributes.length > 0 ? { attributes: attributes } : {};
};

/**
 * Parse $top
 * @param {string} $top
 * @return {number} number of registers to fetch
 */
var parseTop = function ($top) {
    var limit = 0;

    if (!!$top) {
        limit = $top;
    }

    return limit > 0 ? { limit: limit } : {};
};

/**
 * Parse $skip
 * @param {string} $skip
 * @return {number} number of registers to skip
 */
var parseSkip = function ($skip) {
    var offset = 0;

    if (!!$skip) {
        offset = $skip;
    }

    return offset > 0 ? { offset: offset } : {};
};

/**
 * Parse $filter
 * @param {string} $filter
 * @return {object} parsed object
 */
var parseFilter = function ($filter, sequelize) {
    if (!!!sequelize.Op) throw new Error("Sequelize operator not found.");

    if (!!$filter) {
        var tree = helpers.preOrderTraversal($filter, {}, null, sequelize);
        var parsed = helpers.transformTree(tree, sequelize);
    }
    else return {};

    return parsed !== {} ? { where: parsed } : {};
};

/**
 * Parse $orderby
 * @param {string} $orderby
 * @return {object} parsed object
 */
var parseOrderBy = function ($orderby) {
    var order = [];

    if (!!$orderby) {
        $orderby.forEach(element => {
            var arr = [];
            var key = Object.keys(element)[0];

            arr.push(key);
            arr.push((element[key] || "asc").toUpperCase());
            order.push(arr);
        })
    }

    return order.length > 0 ? { order: order } : {};
};

/**
 * Parse an OData string to a sequelize query object
 * @param {string2Parse} OData string to parse
 * @param {sequelize} Sequelize instance
 * @return {object} filled object to pass as query argument
 */
module.exports = function (string2Parse, sequelize) {
    if (!!!sequelize) throw new Error("Sequelize instance is required.");
    if (!!!sequelize.Op) throw new Error("Sequelize operator not found.");

    helpers.mapOperators(sequelize);

    var expression = parseExpression(string2Parse);
    var attributes = parseSelect(expression.$select);
    var top = parseTop(expression.$top);
    var skip = parseSkip(expression.$skip);
    var orderby = parseOrderBy(expression.$orderby);
    var filter = parseFilter(expression.$filter, sequelize);

    return Object.assign({}, attributes, top, skip, orderby, filter);
};