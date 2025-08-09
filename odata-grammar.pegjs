// OData Grammar for PEG.js
// Supports comprehensive OData query syntax

start
  = query

query
  = parts:(queryPart ('&' queryPart)*)?
  {
    const result = {};
    if (parts) {
      const [first, rest] = parts;
      result[first.key] = first.value;
      
      if (rest) {
        for (const [, part] of rest) {
          result[part.key] = part.value;
        }
      }
    }
    return result;
  }

queryPart
  = select / top / skip / orderby / filter / expand / format

select
  = '$select=' fields:selectFieldList
  { return { key: '$select', value: fields }; }

top
  = '$top=' value:integer
  { return { key: '$top', value: value }; }

skip
  = '$skip=' value:integer
  { return { key: '$skip', value: value }; }

orderby
  = '$orderby=' items:orderByList
  { return { key: '$orderby', value: items }; }

filter
  = '$filter=' expr:filterExpression
  { return { key: '$filter', value: expr }; }

expand
  = '$expand=' fields:expandFieldList
  { return { key: '$expand', value: fields }; }

format
  = '$format=' format:identifier
  { return { key: '$format', value: format }; }

// Field lists for $select
selectFieldList
  = first:identifier rest:(',' identifier)*
  {
    const fields = [first];
    if (rest) {
      for (const [, field] of rest) {
        fields.push(field);
      }
    }
    return fields;
  }

// Field lists for $expand (supports nested paths)
expandFieldList
  = first:expandField rest:(',' expandField)*
  {
    const fields = [first];
    if (rest) {
      for (const [, field] of rest) {
        fields.push(field);
      }
    }
    return fields;
  }

// Support nested expand with '/' separator (e.g., "Orders/OrderItems")
expandField
  = first:identifier rest:('/' identifier)*
  {
    if (rest.length === 0) return first;
    
    let result = first;
    for (const [, field] of rest) {
      result += '/' + field;
    }
    return result;
  }

// Order by list
orderByList
  = first:orderByItem rest:(',' orderByItem)*
  {
    const items = [first];
    if (rest) {
      for (const [, item] of rest) {
        items.push(item);
      }
    }
    return items;
  }

orderByItem
  = field:identifier direction:(' ' ('asc' / 'desc'))?
  {
    const result = {};
    result[field] = direction ? direction[1] : 'asc';
    return result;
  }

// Filter expressions
filterExpression
  = orExpression

orExpression
  = left:andExpression right:(' or ' andExpression)*
  {
    if (right.length === 0) return left;
    
    let result = left;
    for (const [, expr] of right) {
      result = {
        type: 'or',
        left: result,
        right: expr
      };
    }
    return result;
  }

andExpression
  = left:notExpression right:(' and ' notExpression)*
  {
    if (right.length === 0) return left;
    
    let result = left;
    for (const [, expr] of right) {
      result = {
        type: 'and',
        left: result,
        right: expr
      };
    }
    return result;
  }

notExpression
  = 'not' ' '+ expr:primaryExpression
  {
    return {
      type: 'not',
      left: expr
    };
  }
  / primaryExpression

primaryExpression
  = '(' expr:filterExpression ')'
  { return expr; }
  / lambdaExpression
  / booleanFunctionExpression
  / comparisonExpression

// Boolean functions that can stand alone (return true/false)
booleanFunctionExpression
  = func:('substringof' / 'startswith' / 'endswith') '(' args:argumentList ')'
  {
    return {
      type: 'functioncall',
      func: func,
      args: args
    };
  }

comparisonExpression
  = left:(functionExpression / pathProperty / identifier) ' '+ op:comparisonOperator ' '+ right:(functionExpression / literal / identifier / pathProperty)
  {
    const leftNode = typeof left === 'string' 
      ? { type: 'property', name: left }
      : left;
      
    const rightNode = typeof right === 'string'
      ? { type: 'property', name: right }
      : (right.type ? right : { type: 'literal', value: right });
    
    return {
      type: op,
      left: leftNode,
      right: rightNode
    };
  }

// Handle path properties - can be variable references (in lambda) or navigation properties (in regular filters)
pathProperty
  = entity:identifier '/' property:identifier
  {
    return {
      type: 'pathProperty',
      entity: entity,
      property: property
    };
  }

functionExpression
  = regularFunctionExpression

lambdaExpression
  = path:identifier '/' operator:('any'i / 'all'i) '(' variable:identifier ':' ' '* condition:lambdaCondition ')'
  {
    return {
      type: 'lambda',
      operator: operator,
      path: path,
      variable: variable,
      condition: condition
    };
  }

regularFunctionExpression
  = func:functionName '(' args:argumentList ')'
  {
    // Handle functions that return boolean (like substringof, startswith, endswith)
    if (['substringof', 'startswith', 'endswith'].includes(func)) {
      return {
        type: 'functioncall',
        func: func,
        args: args
      };
    }
    
    // Other functions return values and need to be used in comparisons
    return {
      type: 'functioncall',
      func: func,
      args: args,
      name: args.length > 0 && args[0].type === 'property' ? args[0].name : null
    };
  }

// Navigation path supports dotted paths like Orders/OrderItems (simplified for now)
navigationPath
  = identifier

// Lambda condition (simplified to avoid recursion)
lambdaCondition
  = left:(pathProperty / identifier) ' '+ op:comparisonOperator ' '+ right:(literal / identifier)
  {
    const leftNode = typeof left === 'string' 
      ? { type: 'property', name: left }
      : left;
      
    const rightNode = typeof right === 'string'
      ? { type: 'property', name: right }
      : (right.type ? right : { type: 'literal', value: right });
    
    return {
      type: op,
      left: leftNode,
      right: rightNode
    };
  }

functionName
  = 'substringof' / 'startswith' / 'endswith' / 'tolower' / 'toupper' / 'trim' 
  / 'concat' / 'substring' / 'replace' / 'indexof' / 'length'
  / 'year' / 'month' / 'day' / 'hour' / 'minute' / 'second'
  / identifier  // Allow any identifier as function name

argumentList
  = first:argument rest:(',' ' '* argument)*
  {
    const args = [first];
    if (rest) {
      for (const [, , arg] of rest) {
        args.push(arg);
      }
    }
    return args;
  }

argument
  = functionExpression / literal / pathProperty / identifier

comparisonOperator
  = 'eq' / 'ne' / 'gt' / 'ge' / 'lt' / 'le'

// Literals
literal
  = stringLiteral / datetimeLiteral / numberLiteral / booleanLiteral

stringLiteral
  = "'" chars:stringChar* "'"
  { return { type: 'literal', value: chars.join('') }; }

stringChar
  = [^']
  / "''"
  { return "'"; }

datetimeLiteral
  = "datetime'" date:datetimeValue "'"
  { return { type: 'literal', value: new Date(date) }; }

datetimeValue
  = chars:[0-9T:\-\.Z]+
  { return chars.join(''); }

numberLiteral
  = digits:[0-9]+ decimal:('.' fractional:[0-9]+)?
  {
    const intPart = digits.join('');
    if (decimal) {
      return parseFloat(intPart + '.' + decimal[1].join(''));
    }
    return parseInt(intPart, 10);
  }

booleanLiteral
  = 'true'
  { return true; }
  / 'false'
  { return false; }

// Identifiers
identifier
  = first:[a-zA-Z_] rest:[a-zA-Z0-9_]*
  { return first + rest.join(''); }

integer
  = digits:[0-9]+
  { return parseInt(digits.join(''), 10); }

// Whitespace (ignored)
_
  = [ \t\n\r]*