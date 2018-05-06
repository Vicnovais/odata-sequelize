# sequelize-odata-parser

## Objective

This library is intended to take an OData query string as a parameter and transform it on a sequelize-compliant query.

## Requirements

 - Node.JS
 - NPM
 - Sequelize.JS

## Installing

Simply run a npm command to install it in your project:

    npm install sequelize-odata-parser

## How does it work?

The OData query string is first parsed by [node-odata-parser](https://github.com/auth0/node-odata-parser) and then the resulting object is recursively iterated to build a new object that is compliant to sequelize's standard.

## Roadmap

### WIP

 - [ ] Test (Mocha)
 - [ ] Query in children tables
 - [ ] $expand

### Boolean Operators

 - [x] AND
 - [x] OR
 - [ ] NOT

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
 - [ ] endswith
 - [x] startswith
 - [x] tolower
 - [x] toupper
 - [x] trim
 - [ ] concat
 - [ ] substring
 - [ ] replace
 - [ ] indexof

2. Date Functions
 - [x] day
 - [x] hour
 - [x] minute
 - [x] month
 - [x] second
 - [x] year

### Others

 - [x] Complex query with precedence
 - [x] top
 - [x] select
 - [x] filter
 - [x] skip
 - [ ] expand
 - [ ] query children tables
 - [ ] test (Mocha)

## How to Use

You just need to pass an OData query string as parameter with your sequelize object instance, and automagically it is converted to a sequelize query.

**Usage Example:**
```javascript
    var parseOData = require('sequelize-odata-parser');
    var sequelize = require('sequelize');
    var query = parseOData("$top=5&$skip=1&$select=Foo,Bar&$filter=Foo eq 'Test' or Bar eq 'Test'&$orderby=Foo desc", sequelize);
    
    // Supposing you have your sequelize model
    Model.findAll(query);
```

See the examples below to checkout what's created under the hood:

**1) Simple Query with Top, Skip, Select, Filter and OrderBy**
```javascript
    var parseOData = require('sequelize-odata-parser');
    var sequelize = require('sequelize');
    var query = parseOData("$top=5&$skip=1&$select=Foo,Bar&$filter=Foo eq 'Test' or Bar eq 'Test'&$orderby=Foo desc", sequelize);
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
    var parseOData = require('sequelize-odata-parser');
    var sequelize = require('sequelize');
    var query = parseOData("$filter=(Foo eq 'Test' or Bar eq 'Test') and ((Foo neq 'Lorem' or Bar neq 'Ipsum') and (Year gt 2017))", sequelize);
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
                                    [Op.neq]: "Lorem"
                                },
                            },
                            {
                                Bar: {
                                    [Op.neq]: "Ipsum"
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
    var parseOData = require('sequelize-odata-parser');
    var sequelize = require('sequelize');
    var query = parseOData("$filter=Foo eq 'Test' and Date gt datetime'2012-09-27T21:12:59'");
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
    var parseOData = require('sequelize-odata-parser');
    var sequelize = require('sequelize');
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
    var parseOData = require('sequelize-odata-parser');
    var sequelize = require('sequelize');
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
    var parseOData = require('sequelize-odata-parser');
    var sequelize = require('sequelize');
    var query = parseOData("$filter=startswith('Foo', Name) and Bar eq 'Test'");
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
    var parseOData = require('sequelize-odata-parser');
    var sequelize = require('sequelize');
    var query = parseOData("$filter=trim(Name) eq 'Foo' and Bar eq 'Test'");
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
    var parseOData = require('sequelize-odata-parser');
    var sequelize = require('sequelize');
    var query = parseOData("$filter=tolower(Name) eq 'foobaz' and Name eq 'bar'");
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
    var parseOData = require('sequelize-odata-parser');
    var sequelize = require('sequelize');
    var query = parseOData("$filter=toupper(Name) eq 'FOOBAZ' and Name eq 'bar'");
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
- The same logic applies to all 6 date functions. The only difference resides in attribute object, whose "fn" property reflects the called function.

```javascript
    var parseOData = require('sequelize-odata-parser');
    var sequelize = require('sequelize');
    var query = parseOData("$filter=year(StartDate) gt 2017");
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
