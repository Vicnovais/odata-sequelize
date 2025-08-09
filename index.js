const parser = require("./odata-parser-generated");

/**
 * Operator mapping from OData to Sequelize
 */
class OperatorMapper {
  constructor(sequelize) {
    this.Op = sequelize.Sequelize.Op;
    if (!this.Op) {
      throw new Error("Sequelize operator not found.");
    }
  }

  getOperator(odataOperator) {
    const mapping = {
      eq: this.Op.eq,
      ne: this.Op.ne,
      gt: this.Op.gt,
      lt: this.Op.lt,
      ge: this.Op.gte,
      gte: this.Op.gte,
      le: this.Op.lte,
      lte: this.Op.lte,
      and: this.Op.and,
      or: this.Op.or,
      not: this.Op.not,
      like: this.Op.like
    };

    return mapping[odataOperator];
  }
}

/**
 * Function handler for OData functions
 */
class FunctionHandler {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.Op = sequelize.Sequelize.Op;
  }

  handle(funcName, args, operator) {
    const handlers = {
      substringof: () => this.handleSubstringOf(args),
      startswith: () => this.handleStartsWith(args),
      endswith: () => this.handleEndsWith(args),
      tolower: () => this.handleDatabaseFunction("tolower", args, operator),
      toupper: () => this.handleDatabaseFunction("toupper", args, operator),
      trim: () => this.handleDatabaseFunction("trim", args, operator),
      concat: () => this.handleConcat(args, operator),
      substring: () => this.handleSubstring(args, operator),
      replace: () => this.handleReplace(args, operator),
      indexof: () => this.handleIndexOf(args, operator),
      year: () => this.handleDatabaseFunction("year", args, operator),
      month: () => this.handleDatabaseFunction("month", args, operator),
      day: () => this.handleDatabaseFunction("day", args, operator),
      hour: () => this.handleDatabaseFunction("hour", args, operator),
      minute: () => this.handleDatabaseFunction("minute", args, operator),
      second: () => this.handleDatabaseFunction("second", args, operator)
    };

    const handler = handlers[funcName];
    return handler ? handler() : null;
  }

  handleSubstringOf(args) {
    const value = this.extractValue(args[0]);
    const field = this.extractFieldName(args[1]);

    if (args[1].type === "functioncall") {
      const innerFunc = args[1].func;
      const innerField = this.extractFieldName(args[1].args[0]);
      return {
        field: innerField,
        value: `%${value}%`,
        operator: this.Op.like,
        dbFunction: innerFunc
      };
    }

    return {
      field,
      value: `%${value}%`,
      operator: this.Op.like
    };
  }

  handleStartsWith(args) {
    const value = this.extractValue(args[0]);
    const field = this.extractFieldName(args[1]);
    return {
      field,
      value: `${value}%`,
      operator: this.Op.like
    };
  }

  handleEndsWith(args) {
    const value = this.extractValue(args[0]);
    const field = this.extractFieldName(args[1]);
    return {
      field,
      value: `%${value}`,
      operator: this.Op.like
    };
  }

  handleDatabaseFunction(funcName, args, operator) {
    const field = this.extractFieldName(args[0]);
    return {
      field,
      dbFunction: funcName,
      operator: operator || this.Op.eq
    };
  }

  handleConcat(args, operator) {
    const values = args.map(arg => {
      if (typeof arg === "string") {
        return this.sequelize.col(arg);
      }
      if (arg.type === "literal") {
        return arg.value;
      }
      return arg.value || arg;
    });

    return {
      dbFunction: "concat",
      concatValues: values,
      operator: operator || this.Op.eq
    };
  }

  handleSubstring(args, operator) {
    const field = this.extractFieldName(args[0]);
    const start = this.extractValue(args[1]) + 1; // OData is 0-based, SQL is 1-based
    const length = args[2] ? this.extractValue(args[2]) : undefined;

    return {
      field,
      dbFunction: "substring",
      substringArgs: { start, length },
      operator: operator || this.Op.eq
    };
  }

  handleReplace(args, operator) {
    const field = this.extractFieldName(args[0]);
    const search = this.extractValue(args[1]);
    const replaceWith = this.extractValue(args[2]);

    return {
      field,
      dbFunction: "replace",
      replaceArgs: { search, replaceWith },
      operator: operator || this.Op.eq
    };
  }

  handleIndexOf(args, operator) {
    const field = this.extractFieldName(args[0]);
    const search = this.extractValue(args[1]);

    return {
      field,
      dbFunction: "indexof",
      indexOfSearch: search,
      operator: operator || this.Op.eq
    };
  }

  extractValue(arg) {
    if (typeof arg === "string") return arg;
    if (arg && arg.type === "literal") return arg.value;
    return arg;
  }

  extractFieldName(arg) {
    if (typeof arg === "string") return arg;
    if (arg && arg.name) return arg.name;
    if (arg && arg.type === "functioncall" && arg.args[0]) {
      return this.extractFieldName(arg.args[0]);
    }
    return null;
  }
}

/**
 * Filter visitor for traversing and transforming the filter AST
 */
class FilterVisitor {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.operatorMapper = new OperatorMapper(sequelize);
    this.functionHandler = new FunctionHandler(sequelize);
  }

  visit(node, parentOperator = null) {
    if (!node) return null;

    const visitors = {
      eq: () => this.visitComparison(node, "eq"),
      ne: () => this.visitComparison(node, "ne"),
      gt: () => this.visitComparison(node, "gt"),
      lt: () => this.visitComparison(node, "lt"),
      ge: () => this.visitComparison(node, "ge"),
      le: () => this.visitComparison(node, "le"),
      and: () => this.visitLogical(node, "and"),
      or: () => this.visitLogical(node, "or"),
      not: () => this.visitNot(node),
      functioncall: () => this.visitFunction(node, parentOperator),
      lambda: () => this.visitLambda(node)
    };

    const visitor = visitors[node.type];
    return visitor ? visitor() : null;
  }

  visitComparison(node, operator) {
    const { left } = node;
    const { right } = node;
    const op = this.operatorMapper.getOperator(operator);

    if (left.type === "functioncall") {
      return this.buildFunctionComparison(left, right, op);
    }

    // Handle navigation properties (Entity/Property)
    if (left.type === "pathProperty") {
      return this.buildNavigationPropertyComparison(left, right, op);
    }

    return {
      [left.name]: {
        [op]: right.value
      }
    };
  }

  buildNavigationPropertyComparison(left, right, operator) {
    // For navigation properties like Customer/CompanyName
    // This should generate a Sequelize include with where clause
    const { entity } = left;
    const { property } = left;
    const { value } = right;

    // Return a navigation filter structure
    return {
      type: "navigationFilter",
      entity,
      property,
      operator,
      value
    };
  }

  visitLogical(node, operator) {
    const op = this.operatorMapper.getOperator(operator);
    const left = this.visit(node.left, operator);
    const right = this.visit(node.right, operator);

    // Handle mixed regular conditions and special conditions (navigation/lambda)
    const regularConditions = [];
    const specialConditions = [];

    // Helper function to extract conditions from nested structures
    const extractConditions = result => {
      if (!result) return;

      if (result.type === "navigationFilter" || result.type === "lambdaExpression") {
        specialConditions.push(result);
      } else if (result.type === "mixedLogical") {
        // Flatten mixed logical results - this is safe because mixed results
        // are already processed and don't need precedence preservation
        if (result.regularConditions) {
          regularConditions.push(...result.regularConditions);
        }
        if (result.specialConditions) {
          specialConditions.push(...result.specialConditions);
        }
      } else {
        // Don't flatten regular conditions - preserve precedence grouping
        regularConditions.push(result);
      }
    };

    extractConditions(left);
    extractConditions(right);

    // If we only have regular conditions, return them as usual
    if (specialConditions.length === 0) {
      return regularConditions.length > 0 ? { [op]: regularConditions } : null;
    }

    // If we have special conditions, we need to return a mixed result structure
    // This will be handled at the query builder level
    return {
      type: "mixedLogical",
      operator: op,
      regularConditions,
      specialConditions
    };
  }

  visitNot(node) {
    const op = this.operatorMapper.getOperator("not");
    const inner = this.visit(node.left);

    if (!inner) return null;

    return { [op]: inner };
  }

  visitFunction(node, parentOperator) {
    // Handle boolean functions (substringof, startswith, endswith)
    if (["substringof", "startswith", "endswith"].includes(node.func)) {
      const result = this.functionHandler.handle(node.func, node.args, parentOperator);
      if (!result) return null;

      if (result.dbFunction) {
        return {
          [result.field]: this.sequelize.where(
            this.sequelize.fn(result.dbFunction, this.sequelize.col(result.field)),
            result.operator,
            result.value || ""
          )
        };
      }

      return {
        [result.field]: {
          [result.operator]: result.value
        }
      };
    }

    // Other functions should be handled in comparison context
    return null;
  }

  visitLambda(node) {
    // Process lambda expressions like Orders/any(o: o/Amount gt 100)
    const { operator, path, variable, condition } = node;

    // Build the where condition for the child table
    const childWhere = this.buildLambdaWhere(condition, variable);
    if (!childWhere) return null;

    // Return a special structure that the QueryBuilder can convert to include
    return {
      type: "lambdaExpression",
      association: path,
      operator, // 'any' or 'all'
      where: childWhere,
      required: operator === "any" // 'any' requires at least one match (INNER JOIN)
    };
  }

  buildLambdaWhere(condition, lambdaVariable) {
    if (!condition) return null;

    // Handle comparison expressions
    if (["eq", "ne", "gt", "lt", "ge", "le"].includes(condition.type)) {
      const op = this.operatorMapper.getOperator(condition.type);

      // Extract field name from path property in lambda context (o/Amount -> Amount)
      let field;
      if (condition.left.type === "pathProperty" && condition.left.entity === lambdaVariable) {
        field = condition.left.property;
      } else {
        field = condition.left.name || condition.left;
      }

      const { value } = condition.right;

      return {
        [field]: {
          [op]: value
        }
      };
    }

    // Handle logical expressions (and, or) within lambda
    if (["and", "or"].includes(condition.type)) {
      const op = this.operatorMapper.getOperator(condition.type);
      const left = this.buildLambdaWhere(condition.left, lambdaVariable);
      const right = this.buildLambdaWhere(condition.right, lambdaVariable);

      const conditions = [];
      if (left) conditions.push(left);
      if (right) conditions.push(right);

      return conditions.length > 0 ? { [op]: conditions } : null;
    }

    return null;
  }

  buildFunctionComparison(left, right, operator) {
    const { func, args } = left;
    const rightValue = right.value;

    // Handle database functions that need the specific test format
    if (
      ["tolower", "toupper", "trim", "year", "month", "day", "hour", "minute", "second"].includes(
        func
      )
    ) {
      const field = this.functionHandler.extractFieldName(args[0]);
      return {
        [field]: {
          attribute: {
            fn: func,
            args: [{ col: field }]
          },
          comparator: operator,
          logic: rightValue
        }
      };
    }

    // Handle concat function
    if (func === "concat") {
      const concatArgs = args.map(arg => {
        if (typeof arg === "string") {
          return this.sequelize.col(arg);
        }
        if (arg.type === "literal") {
          return arg.value;
        }
        return arg.value;
      });
      return this.sequelize.where(this.sequelize.fn("concat", ...concatArgs), operator, rightValue);
    }

    if (func === "substring") {
      const field = this.functionHandler.extractFieldName(args[0]);
      const start = this.functionHandler.extractValue(args[1]) + 1; // OData is 0-based, SQL is 1-based
      const substringArgs = args[2]
        ? [this.sequelize.col(field), start, this.functionHandler.extractValue(args[2])]
        : [this.sequelize.col(field), start];
      return {
        [field]: {
          attribute: {
            fn: "substring",
            args: substringArgs
          },
          comparator: operator,
          logic: rightValue
        }
      };
    }

    if (func === "replace") {
      const field = this.functionHandler.extractFieldName(args[0]);
      return {
        [field]: {
          attribute: {
            fn: "replace",
            args: [
              this.sequelize.col(field),
              this.functionHandler.extractValue(args[1]),
              this.functionHandler.extractValue(args[2])
            ]
          },
          comparator: operator,
          logic: rightValue
        }
      };
    }

    if (func === "indexof") {
      const field = this.functionHandler.extractFieldName(args[0]);
      const search = this.functionHandler.extractValue(args[1]);
      return {
        [field]: this.sequelize.where(
          this.sequelize.literal(`POSITION('${search}' IN "${field}") - 1`),
          operator,
          rightValue
        )
      };
    }

    // Default handling for other functions - return null for unknown functions
    return null;
  }
}

/**
 * Query builder for constructing Sequelize queries
 */
class QueryBuilder {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.filterVisitor = new FilterVisitor(sequelize);
  }

  build(parsedExpression) {
    const query = {};

    if (parsedExpression.$select) {
      Object.assign(query, QueryBuilder.buildSelect(parsedExpression.$select));
    }

    if (parsedExpression.$top) {
      Object.assign(query, QueryBuilder.buildTop(parsedExpression.$top));
    }

    if (parsedExpression.$skip) {
      Object.assign(query, QueryBuilder.buildSkip(parsedExpression.$skip));
    }

    if (parsedExpression.$orderby) {
      Object.assign(query, QueryBuilder.buildOrderBy(parsedExpression.$orderby));
    }

    // Handle $filter and $expand together (they might both create includes)
    const filterResult = parsedExpression.$filter ? this.buildFilter(parsedExpression.$filter) : {};
    const expandResult = parsedExpression.$expand
      ? QueryBuilder.buildExpand(parsedExpression.$expand)
      : {};

    // Merge the results, handling include arrays specially
    this.mergeQueryResults(query, filterResult);
    this.mergeQueryResults(query, expandResult);

    return query;
  }

  mergeQueryResults(target, source) {
    Object.entries(source).forEach(([key, value]) => {
      if (key === "include") {
        // Merge include arrays
        if (target.include) {
          target.include = QueryBuilder.mergeIncludes(target.include, value);
        } else {
          target.include = value;
        }
      } else {
        target[key] = value;
      }
    });
  }

  static mergeIncludes(existingIncludes, newIncludes) {
    // Create a map of associations for easy lookup
    const includeMap = new Map();

    // Add existing includes to map
    existingIncludes.forEach(include => {
      includeMap.set(include.association, include);
    });

    // Merge or add new includes
    newIncludes.forEach(newInclude => {
      if (includeMap.has(newInclude.association)) {
        // Merge with existing include
        const existing = includeMap.get(newInclude.association);
        if (newInclude.where && existing.where) {
          // Merge where clauses (complex logic might be needed here)
          existing.where = { ...existing.where, ...newInclude.where };
        } else if (newInclude.where) {
          existing.where = newInclude.where;
        }
        if (newInclude.required !== undefined) {
          existing.required = newInclude.required;
        }
      } else {
        // Add new include
        includeMap.set(newInclude.association, newInclude);
      }
    });

    return Array.from(includeMap.values());
  }

  static buildSelect(select) {
    return select && select.length > 0 ? { attributes: select } : {};
  }

  static buildTop(top) {
    return top > 0 ? { limit: top } : {};
  }

  static buildSkip(skip) {
    return skip > 0 ? { offset: skip } : {};
  }

  static buildOrderBy(orderby) {
    if (!orderby || orderby.length === 0) return {};

    const order = orderby.map(item => {
      const key = Object.keys(item)[0];
      const direction = (item[key] || "asc").toUpperCase();
      return [key, direction];
    });

    return { order };
  }

  static buildExpand(expand) {
    if (!expand || expand.length === 0) return {};

    // Convert expand fields to Sequelize include format
    const include = expand.map(field => {
      // Handle nested expand (e.g., "Orders/OrderItems")
      if (field.includes("/")) {
        return QueryBuilder.buildNestedExpand(field);
      }

      // Simple expand - just the model name/association
      return { association: field };
    });

    return { include };
  }

  static buildNestedExpand(field) {
    const parts = field.split("/");
    const current = { association: parts[0] };
    let pointer = current;

    // Build nested include structure
    for (let i = 1; i < parts.length; i += 1) {
      pointer.include = [{ association: parts[i] }];
      [pointer] = pointer.include;
    }

    return current;
  }

  buildFilter(filter) {
    try {
      const result = this.filterVisitor.visit(filter);

      // Check if result contains lambda expressions that need to be converted to includes
      if (result && result.type === "lambdaExpression") {
        return this.convertLambdaToInclude(result);
      }

      // Check if result contains navigation filters that need to be converted to includes
      if (result && result.type === "navigationFilter") {
        return this.convertNavigationFilterToInclude(result);
      }

      // Check if result contains mixed logical conditions
      if (result && result.type === "mixedLogical") {
        return this.convertMixedLogicalToQuery(result);
      }

      return result ? { where: result } : {};
    } catch (error) {
      // Return empty object for unknown functions or parsing errors
      return {};
    }
  }

  convertNavigationFilterToInclude(navigationResult) {
    // Convert navigation property filter to Sequelize include format
    return {
      include: [
        {
          association: navigationResult.entity,
          where: {
            [navigationResult.property]: {
              [navigationResult.operator]: navigationResult.value
            }
          },
          required: true // Navigation property filters typically require the relationship
        }
      ]
    };
  }

  convertLambdaToInclude(lambdaResult) {
    // Convert lambda expression result to Sequelize include format
    return {
      include: [
        {
          association: lambdaResult.association,
          where: lambdaResult.where,
          required: lambdaResult.required
        }
      ]
    };
  }

  convertMixedLogicalToQuery(mixedResult) {
    // Handle mixed logical expressions that combine regular filters with navigation/lambda filters
    const query = {};

    // Handle regular conditions (put them in where clause)
    if (mixedResult.regularConditions && mixedResult.regularConditions.length > 0) {
      // For mixed logical results, flatten any nested same-operator structures
      const flattenedConditions = [];
      mixedResult.regularConditions.forEach(condition => {
        if (condition[mixedResult.operator] && Array.isArray(condition[mixedResult.operator])) {
          flattenedConditions.push(...condition[mixedResult.operator]);
        } else {
          flattenedConditions.push(condition);
        }
      });
      query.where = { [mixedResult.operator]: flattenedConditions };
    }

    // Handle special conditions (convert to includes)
    if (mixedResult.specialConditions && mixedResult.specialConditions.length > 0) {
      const includes = [];

      mixedResult.specialConditions.forEach(specialCondition => {
        if (specialCondition.type === "navigationFilter") {
          includes.push({
            association: specialCondition.entity,
            where: {
              [specialCondition.property]: {
                [specialCondition.operator]: specialCondition.value
              }
            },
            required: true
          });
        } else if (specialCondition.type === "lambdaExpression") {
          includes.push({
            association: specialCondition.association,
            where: specialCondition.where,
            required: specialCondition.required
          });
        }
      });

      query.include = includes;
    }

    return query;
  }
}

/**
 * Main parser function
 */
module.exports = (string2Parse, sequelize) => {
  if (!sequelize) {
    throw new Error("Sequelize instance is required.");
  }

  if (!sequelize.Sequelize.Op) {
    throw new Error("Sequelize operator not found.");
  }

  // Set up operators aliases for compatibility
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

  const mappedValueOperators = valueOperators.map(op => sequelize.Sequelize.Op[op]);
  sequelize.options.operatorsAliases = mappedValueOperators;

  // Parse OData expression using our new parser
  const parsedExpression = parser.parse(string2Parse);

  // Build Sequelize query
  const queryBuilder = new QueryBuilder(sequelize);
  return queryBuilder.build(parsedExpression);
};
