# odata-sequelize

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![npm](https://img.shields.io/npm/v/odata-sequelize)
[![Build Status](https://travis-ci.org/Vicnovais/odata-sequelize.svg?branch=master)](https://travis-ci.org/Vicnovais/odata-sequelize)
![npm](https://img.shields.io/npm/dw/odata-sequelize)

[![NPM](https://nodei.co/npm/odata-sequelize.png?compact=true)](https://nodei.co/npm/odata-sequelize/)

## Objective

This library is intended to take an OData query string as a parameter and transform it on a
sequelize-compliant query.

## 🚀 **Latest Features (v2.0)**

- **Navigation Properties**: Filter on related entity properties (`Customer/CompanyName eq 'Acme'`)
- **Lambda Expressions**: Query child tables with `any`/`all` operators (`Orders/any(o: o/Amount gt 100)`)
- **Complex Mixed Logic**: Advanced AND/OR combinations with deep parentheses nesting
- **Smart Include Merging**: Automatic merging of `$expand` and navigation filters
- **0 deps**: Now the library has no dependencies!

## Requirements

- Node.JS
- NPM
- Sequelize.JS

## Installing

Simply run a npm command to install it in your project:

    npm install odata-sequelize

## How does it work?

The OData query string is parsed using a custom PEG.js grammar that handles the complete OData specification. The resulting abstract syntax tree (AST) is then transformed using a visitor pattern to build a sequelize-compliant query object.

## Roadmap

### Completed Features

All planned features have been implemented!

### Boolean Operators

- [x] AND
- [x] OR
- [x] NOT

### Comparison Operators

- [x] Equal (eq)
- [x] Not Equal (ne)
- [x] Greater Than (gt)
- [x] Greater Than or Equal (ge)
- [x] Less Than (lt)
- [x] Less Than or Equal (le)

### Functions

1. String Functions

- [x] substringof
- [x] endswith
- [x] startswith
- [x] tolower
- [x] toupper
- [x] trim
- [x] concat
- [x] substring
- [x] replace
- [x] indexof

2. Date Functions

- [x] day
- [x] hour
- [x] minute
- [x] month
- [x] second
- [x] year

### Advanced Features

- [x] **$expand** - Eager loading associations with nested support
- [x] **Lambda expressions** - `any`/`all` operators for child table queries
- [x] **Navigation properties** - Filter on related entity properties (e.g., `Customer/CompanyName`)
- [x] **Mixed logical operators** - Complex AND/OR combinations with parentheses
- [x] **Function integration** - Functions combined with navigation and lambda expressions
- [x] **Include merging** - Smart merging of $expand and navigation filters
- [x] **Precedence handling** - Proper parentheses and operator precedence support

### Core OData Query Options

- [x] **$filter** - Complex filtering with all operators and functions
- [x] **$select** - Choose specific fields to return
- [x] **$expand** - Eager load related entities
- [x] **$top** - Limit number of results
- [x] **$skip** - Pagination offset
- [x] **$orderby** - Sorting with multiple fields

### Development & Quality

- [x] Test (Jest) - Thanks to [@remcohaszing](https://github.com/remcohaszing)
- [x] Lint & Prettier - Thanks to [@remcohaszing](https://github.com/remcohaszing)
- [x] **86 comprehensive tests** - Including complex integration scenarios
- [x] **76% code coverage** - High-quality test coverage

## How to Use

You just need to pass an OData query string as parameter with your sequelize object instance, and
automagically it is converted to a sequelize query.

**Usage Example:**

```javascript
var parseOData = require("odata-sequelize");
var sequelize = require("sequelize");
var query = parseOData(
  "$top=5&$skip=1&$select=Foo,Bar&$filter=Foo eq 'Test' or Bar eq 'Test'&$orderby=Foo desc",
  sequelize
);

// Supposing you have your sequelize model
Model.findAll(query);
```

See the examples below to checkout what's created under the hood:

**1) Simple Query with Top, Skip, Select, Filter and OrderBy**

```javascript
var parseOData = require("odata-sequelize");
var sequelize = require("sequelize");
var query = parseOData(
  "$top=5&$skip=1&$select=Foo,Bar&$filter=Foo eq 'Test' or Bar eq 'Test'&$orderby=Foo desc",
  sequelize
);
```

query becomes...

```javascript
{
    attributes: ['Foo', 'Bar'],
    limit: 5,
    offset: 1,
    order: [
        ['Foo', 'DESC']
    ],
    where: {
        [Op.or]: [
            {
                Foo: {
                    [Op.eq]: "Test"
                }
            },
            {
                Bar: {
                    [Op.eq]: "Test"
                }
            }
        ]
    }
}
```

**2) Complex Query with Precedence**

```javascript
var parseOData = require("odata-sequelize");
var sequelize = require("sequelize");
var query = parseOData(
  "$filter=(Foo eq 'Test' or Bar eq 'Test') and ((Foo ne 'Lorem' or Bar ne 'Ipsum') and (Year gt 2017))",
  sequelize
);
```

query becomes...

```javascript
{
    where: {
        [Op.and]: [
            {
                [Op.or]: [
                    {
                        Foo: {
                            [Op.eq]: "Test"
                        }
                    },
                    {
                        Bar: {
                            [Op.eq]: "Test"
                        }
                    }
                ]
            },
            {
                [Op.and]: [
                    {
                        [Op.or]: [
                            {
                                Foo: {
                                    [Op.ne]: "Lorem"
                                },
                            },
                            {
                                Bar: {
                                    [Op.ne]: "Ipsum"
                                }
                            }
                        ]
                    },
                    {
                        Year: {
                            [Op.gt]: 2017
                        }
                    }
                ]
            }
        ]
    }
}
```

**3) Using Date**

```javascript
var parseOData = require("odata-sequelize");
var sequelize = require("sequelize");
var query = parseOData(
  "$filter=Foo eq 'Test' and Date gt datetime'2012-09-27T21:12:59'",
  sequelize
);
```

query becomes...

```javascript
{
    where: {
        [Op.and]: [
            {
                Foo: {
                    [Op.eq]: "Test"
                }
            },
            {
                Date: {
                    [Op.gt]: new Date("2012-09-27T21:12:59")
                }
            }
        ]
    }
}
```

**4) startswith function**

```javascript
var parseOData = require("odata-sequelize");
var sequelize = require("sequelize");
var query = parseOData("$filter=startswith('lorem', Foo) and Bar eq 'Test'", sequelize);
```

query becomes...

```javascript
{
    where: {
        [Op.and]: [
            {
                Foo: {
                    [Op.like]: "lorem%"
                }
            },
            {
                Bar: {
                    [Op.eq]: "Test"
                }
            }
        ]
    }
}
```

**5) substringof function**

```javascript
var parseOData = require("odata-sequelize");
var sequelize = require("sequelize");
var query = parseOData("$filter=substringof('lorem', Foo) and Bar eq 'Test'", sequelize);
```

query becomes...

```javascript
{
    where: {
        [Op.and]: [
            {
                Foo: {
                    [Op.like]: "%lorem%"
                }
            },
            {
                Bar: {
                    [Op.eq]: "Test"
                }
            }
        ]
    }
}
```

**6) startswith function**

```javascript
var parseOData = require("odata-sequelize");
var sequelize = require("sequelize");
var query = parseOData("$filter=startswith('Foo', Name) and Bar eq 'Test'", sequelize);
```

query becomes...

```javascript
{
    where: {
        [Op.and]: [
            {
                Name: {
                    [Op.like]: "Foo%"
                }
            },
            {
                Bar: {
                    [Op.eq]: "Test"
                }
            }
        ]
    }
}
```

**7) trim function**

```javascript
var parseOData = require("odata-sequelize");
var sequelize = require("sequelize");
var query = parseOData("$filter=trim(Name) eq 'Foo' and Bar eq 'Test'", sequelize);
```

query becomes...

```javascript
{
    where: {
        [Op.and]: [
            {
                Name: {
                    comparator: [Op.eq],
                    logic: "Foo",
                    attribute: {
                        fn: "trim",
                        args: [
                            {
                                col: "Name"
                            }
                        ]
                    }
                }
            },
            {
                Bar: {
                    [Op.eq]: "Test"
                }
            }
        ]
    }
}
```

**8) tolower function**

```javascript
var parseOData = require("odata-sequelize");
var sequelize = require("sequelize");
var query = parseOData("$filter=tolower(Name) eq 'foobaz' and Name eq 'bar'", sequelize);
```

query becomes...

```javascript
{
    where: {
        [Op.and]: [
            {
                Name: {
                    comparator: [Op.eq],
                    logic: "foobaz",
                    attribute: {
                        fn: "lower",
                        args: [
                            {
                                col: "Name"
                            }
                        ]
                    }
                }
            },
            {
                Bar: {
                    [Op.eq]: "Test"
                }
            }
        ]
    }
}
```

**9) toupper function**

```javascript
var parseOData = require("odata-sequelize");
var sequelize = require("sequelize");
var query = parseOData("$filter=toupper(Name) eq 'FOOBAZ' and Name eq 'bar'", sequelize);
```

query becomes...

```javascript
{
    where: {
        [Op.and]: [
            {
                Name: {
                    comparator: [Op.eq],
                    logic: "FOOBAZ",
                    attribute: {
                        fn: "upper",
                        args: [
                            {
                                col: "Name"
                            }
                        ]
                    }
                }
            },
            {
                Bar: {
                    [Op.eq]: "Test"
                }
            }
        ]
    }
}
```

**10) year, month, day, hour, minute, second function**

- The same logic applies to all 6 date functions. The only difference resides in attribute object,
  whose "fn" property reflects the called function.

```javascript
var parseOData = require("odata-sequelize");
var sequelize = require("sequelize");
var query = parseOData("$filter=year(StartDate) gt 2017", sequelize);
```

becomes...

```javascript
{
    where: {
        {
            StartDate: {
                comparator: [Op.gt],
                logic: 2017,
                attribute: {
                    fn: "year",
                    args: [
                        {
                            col: "StartDate"
                        }
                    ]
                }
            }
        }
    }
}
```

**11) $expand for eager loading associations**

```javascript
var parseOData = require("odata-sequelize");
var sequelize = require("sequelize");
var query = parseOData("$expand=Orders", sequelize);
```

becomes...

```javascript
{
    include: [
        {
            association: "Orders"
        }
    ]
}
```

**12) Multiple $expand**

```javascript
var parseOData = require("odata-sequelize");
var sequelize = require("sequelize");
var query = parseOData("$expand=Orders,Customer", sequelize);
```

becomes...

```javascript
{
    include: [
        {
            association: "Orders"
        },
        {
            association: "Customer"
        }
    ]
}
```

**13) Nested $expand**

```javascript
var parseOData = require("odata-sequelize");
var sequelize = require("sequelize");
var query = parseOData("$expand=Orders/OrderItems", sequelize);
```

becomes...

```javascript
{
    include: [
        {
            association: "Orders",
            include: [
                {
                    association: "OrderItems"
                }
            ]
        }
    ]
}
```

**14) Complex query with $expand**

```javascript
var parseOData = require("odata-sequelize");
var sequelize = require("sequelize");
var query = parseOData(
  "$select=Name,Id&$expand=Orders&$top=10&$filter=Active eq true",
  sequelize
);
```

becomes...

```javascript
{
    attributes: ["Name", "Id"],
    limit: 10,
    include: [
        {
            association: "Orders"
        }
    ],
    where: {
        Active: {
            [Op.eq]: true
        }
    }
}
```

**15) Query in children tables (Lambda expressions)**

The library fully supports OData lambda expressions (`any` and `all` operators) for filtering parent entities based on child entity properties. This powerful feature allows you to query related data with complex conditions.

```javascript
// Filter customers who have orders with amount > 100
var query = parseOData("$filter=Orders/any(o: o/Amount gt 100)", sequelize);

// Filter customers where all orders are shipped
var query = parseOData("$filter=Orders/all(o: o/Status eq 'Shipped')", sequelize);
```

Expected output format:

```javascript
{
    include: [
        {
            association: "Orders",
            where: {
                Amount: {
                    [Op.gt]: 100
                }
            },
            required: true // 'any' uses INNER JOIN, 'all' uses different logic
        }
    ]
}
```

**Key Features of Lambda Expressions:**
- **`any` operator**: Returns parent records if at least one child matches the condition (uses `required: true` for INNER JOIN)
- **`all` operator**: Returns parent records if all children match the condition
- **Variable scoping**: Supports variable names in lambda expressions (e.g., `o: o/Amount`)
- **Complex conditions**: Supports nested property access and multiple comparison operators
- **Sequelize integration**: Converts to appropriate `include` structures with `where` clauses

**16) Navigation Properties - Filtering on Related Entity Properties**

You can filter parent entities based on properties of related entities using navigation syntax:

```javascript
var parseOData = require("odata-sequelize");
var sequelize = require("sequelize");
var query = parseOData("$filter=Customer/CompanyName eq 'Acme Corp'", sequelize);
```

becomes...

```javascript
{
    include: [
        {
            association: "Customer",
            where: {
                CompanyName: {
                    [Op.eq]: "Acme Corp"
                }
            },
            required: true
        }
    ]
}
```

**17) Navigation Properties with $expand**

Navigation filters automatically merge with $expand when targeting the same association:

```javascript
var query = parseOData(
    "$filter=Customer/Country ne 'USA'&$expand=Customer",
    sequelize
);
```

becomes...

```javascript
{
    include: [
        {
            association: "Customer",
            where: {
                Country: {
                    [Op.ne]: "USA"
                }
            },
            required: true
        }
    ]
}
```

**18) Complex Mixed AND/OR with Parentheses**

The parser handles deeply nested logical expressions with proper precedence:

```javascript
var query = parseOData(
    "$filter=((Type eq 'A' or Type eq 'B') and Status eq 'Active') or (Category eq 'Premium' and Year gt 2020)",
    sequelize
);
```

becomes...

```javascript
{
    where: {
        [Op.or]: [
            {
                [Op.and]: [
                    {
                        [Op.or]: [
                            {
                                Type: {
                                    [Op.eq]: "A"
                                }
                            },
                            {
                                Type: {
                                    [Op.eq]: "B"
                                }
                            }
                        ]
                    },
                    {
                        Status: {
                            [Op.eq]: "Active"
                        }
                    }
                ]
            },
            {
                [Op.and]: [
                    {
                        Category: {
                            [Op.eq]: "Premium"
                        }
                    },
                    {
                        Year: {
                            [Op.gt]: 2020
                        }
                    }
                ]
            }
        ]
    }
}
```

**19) Mixed Function and Navigation Filters**

Complex queries combining function calls, navigation properties, and $expand:

```javascript
var query = parseOData(
    "$filter=tolower(CompanyName) eq 'acme corp' and Customer/Country ne 'USA'&$expand=Customer&$orderby=OrderDate desc",
    sequelize
);
```

becomes...

```javascript
{
    order: [["OrderDate", "DESC"]],
    where: {
        [Op.and]: [
            {
                CompanyName: {
                    attribute: {
                        fn: "tolower",
                        args: [{ col: "CompanyName" }]
                    },
                    comparator: [Op.eq],
                    logic: "acme corp"
                }
            }
        ]
    },
    include: [
        {
            association: "Customer",
            where: {
                Country: {
                    [Op.ne]: "USA"
                }
            },
            required: true
        }
    ]
}
```

**20) Complete Integration Example**

Real-world complex query combining all features:

```javascript
var query = parseOData(
    "$select=Name,Status,Priority&$expand=Customer,Orders&$top=20&$skip=10&$orderby=Priority desc,Name asc&$filter=((Status eq 'Active' and Priority ge 3) or (Customer/Country eq 'USA' and Orders/any(o: o/Amount gt 500))) and year(CreatedDate) ge 2023",
    sequelize
);
```

This generates a comprehensive Sequelize query with:
- **Attributes selection** (`$select`)
- **Eager loading** (`$expand`)
- **Pagination** (`$top`, `$skip`)
- **Ordering** (`$orderby`)
- **Complex filtering** with nested logic, navigation properties, lambda expressions, and function calls
