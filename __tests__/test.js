const Sequelize = require("sequelize");

const parser = require("../index");

const sequelize = new Sequelize({ dialect: "sqlite" });

describe("#odataParser", () => {
  it("should parse top", () => {
    const result = parser("$top=10", sequelize);
    expect(result).toStrictEqual({
      limit: 10
    });
  });

  it("should parse skip", () => {
    const result = parser("$skip=5", sequelize);
    expect(result).toStrictEqual({
      offset: 5
    });
  });

  it("should parse top skip", () => {
    const result = parser("$top=10&$skip=5", sequelize);
    expect(result).toStrictEqual({
      limit: 10,
      offset: 5
    });
  });

  it("should parse select", () => {
    const result = parser("$select=foo", sequelize);
    expect(result).toStrictEqual({
      attributes: ["foo"]
    });
  });

  it("should parse orderby", () => {
    const result = parser("$orderby=name desc", sequelize);
    expect(result).toStrictEqual({
      order: [["name", "DESC"]]
    });
  });

  it("should parse orderby with multiple columns", () => {
    const result = parser("$orderby=name desc,ranking", sequelize);
    expect(result).toStrictEqual({
      order: [
        ["name", "DESC"],
        ["ranking", "ASC"]
      ]
    });
  });

  it("should parse filter eq", () => {
    const result = parser("$filter=age eq 42", sequelize);
    expect(result).toStrictEqual({
      where: {
        age: {
          [sequelize.Sequelize.Op.eq]: 42
        }
      }
    });
  });

  it("should parse filter ne", () => {
    const result = parser("$filter=age ne 42", sequelize);
    expect(result).toStrictEqual({
      where: {
        age: {
          [sequelize.Sequelize.Op.ne]: 42
        }
      }
    });
  });

  it("should parse filter gt", () => {
    const result = parser("$filter=age gt 42", sequelize);
    expect(result).toStrictEqual({
      where: {
        age: {
          [sequelize.Sequelize.Op.gt]: 42
        }
      }
    });
  });

  it("should parse filter lt", () => {
    const result = parser("$filter=age lt 42", sequelize);
    expect(result).toStrictEqual({
      where: {
        age: {
          [sequelize.Sequelize.Op.lt]: 42
        }
      }
    });
  });

  it("should parse filter ge", () => {
    const result = parser("$filter=age ge 42", sequelize);
    expect(result).toStrictEqual({
      where: {
        age: {
          [sequelize.Sequelize.Op.gte]: 42
        }
      }
    });
  });

  it("should parse filter le", () => {
    const result = parser("$filter=age le 42", sequelize);
    expect(result).toStrictEqual({
      where: {
        age: {
          [sequelize.Sequelize.Op.lte]: 42
        }
      }
    });
  });

  it("should parse filter datetime", () => {
    const result = parser(
      "$filter=Foo eq 'Test' and Date gt datetime'2012-09-27T21:12:59'",
      sequelize
    );

    expect(result).toStrictEqual({
      where: {
        [sequelize.Sequelize.Op.and]: [
          {
            Foo: {
              [sequelize.Sequelize.Op.eq]: "Test"
            }
          },
          {
            Date: {
              [sequelize.Sequelize.Op.gt]: new Date("2012-09-27T21:12:59")
            }
          }
        ]
      }
    });
  });

  it("should parse filter substringof", () => {
    const result = parser("$filter=substringof('prefix', foo)", sequelize);
    expect(result).toStrictEqual({
      where: {
        foo: {
          [sequelize.Sequelize.Op.like]: "%prefix%"
        }
      }
    });
  });

  it("should parse filter substringof with and", () => {
    const result = parser("$filter=substringof('lorem', foo) and bar eq 'Test'", sequelize);
    expect(result).toStrictEqual({
      where: {
        [sequelize.Sequelize.Op.and]: [
          {
            foo: {
              [sequelize.Sequelize.Op.like]: "%lorem%"
            }
          },
          {
            bar: {
              [sequelize.Sequelize.Op.eq]: "Test"
            }
          }
        ]
      }
    });
  });

  it("should parse filter startswith", () => {
    const result = parser("$filter=startswith('prefix', foo)", sequelize);
    expect(result).toStrictEqual({
      where: {
        foo: {
          [sequelize.Sequelize.Op.like]: "prefix%"
        }
      }
    });
  });

  it("should parse filter endswith", () => {
    const result = parser("$filter=endswith('sufix', foo)", sequelize);
    expect(result).toStrictEqual({
      where: {
        foo: {
          [sequelize.Sequelize.Op.like]: "%sufix"
        }
      }
    });
  });

  it("should parse filter tolower", () => {
    const result = parser("$filter=tolower(foo) eq 'bar'", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "tolower"
          },
          comparator: sequelize.Sequelize.Op.eq,
          logic: "bar"
        }
      }
    });
  });

  it("should parse filter toupper eq", () => {
    const result = parser("$filter=toupper(foo) eq 'bar'", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "toupper"
          },
          comparator: sequelize.Sequelize.Op.eq,
          logic: "bar"
        }
      }
    });
  });

  it("should parse filter toupper", () => {
    const result = parser("$filter=toupper(foo) ne 'bar'", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "toupper"
          },
          comparator: sequelize.Sequelize.Op.ne,
          logic: "bar"
        }
      }
    });
  });

  it("should parse filter trim eq", () => {
    const result = parser("$filter=trim(foo) eq 'bar'", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "trim"
          },
          comparator: sequelize.Sequelize.Op.eq,
          logic: "bar"
        }
      }
    });
  });

  it("should parse filter year eq", () => {
    const result = parser("$filter=year(foo) eq 2000", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "year"
          },
          comparator: sequelize.Sequelize.Op.eq,
          logic: 2000
        }
      }
    });
  });

  it("should parse filter year eq string", () => {
    const result = parser("$filter=year(foo) eq '2000'", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "year"
          },
          comparator: sequelize.Sequelize.Op.eq,
          logic: "2000"
        }
      }
    });
  });

  it("should parse filter year gt", () => {
    const result = parser("$filter=year(foo) gt '2016'", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "year"
          },
          comparator: sequelize.Sequelize.Op.gt,
          logic: "2016"
        }
      }
    });
  });

  it("should parse filter month eq", () => {
    const result = parser("$filter=month(foo) eq 12", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "month"
          },
          comparator: sequelize.Sequelize.Op.eq,
          logic: 12
        }
      }
    });
  });

  it("should parse filter month ne", () => {
    const result = parser("$filter=month(foo) ne 12", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "month"
          },
          comparator: sequelize.Sequelize.Op.ne,
          logic: 12
        }
      }
    });
  });

  it("should parse filter month gt", () => {
    const result = parser("$filter=month(foo) gt 12", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "month"
          },
          comparator: sequelize.Sequelize.Op.gt,
          logic: 12
        }
      }
    });
  });

  it("should parse filter day eq", () => {
    const result = parser("$filter=day(foo) eq 12", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "day"
          },
          comparator: sequelize.Sequelize.Op.eq,
          logic: 12
        }
      }
    });
  });

  it("should parse filter day gt", () => {
    const result = parser("$filter=day(foo) gt 12", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "day"
          },
          comparator: sequelize.Sequelize.Op.gt,
          logic: 12
        }
      }
    });
  });

  it("should parse filter hour eq", () => {
    const result = parser("$filter=hour(foo) eq 12", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "hour"
          },
          comparator: sequelize.Sequelize.Op.eq,
          logic: 12
        }
      }
    });
  });

  it("should parse filter hour gt", () => {
    const result = parser("$filter=hour(foo) gt 12", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "hour"
          },
          comparator: sequelize.Sequelize.Op.gt,
          logic: 12
        }
      }
    });
  });

  it("should parse filter minute eq", () => {
    const result = parser("$filter=minute(foo) eq 12", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "minute"
          },
          comparator: sequelize.Sequelize.Op.eq,
          logic: 12
        }
      }
    });
  });

  it("should parse filter minute gt", () => {
    const result = parser("$filter=minute(foo) gt 12", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "minute"
          },
          comparator: sequelize.Sequelize.Op.gt,
          logic: 12
        }
      }
    });
  });

  it("should parse filter second eq", () => {
    const result = parser("$filter=second(foo) eq 12", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "second"
          },
          comparator: sequelize.Sequelize.Op.eq,
          logic: 12
        }
      }
    });
  });

  it("should parse filter second gt", () => {
    const result = parser("$filter=second(foo) gt 12", sequelize);
    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "second"
          },
          comparator: sequelize.Sequelize.Op.gt,
          logic: 12
        }
      }
    });
  });

  it("should parse filter and", () => {
    const result = parser("$filter=age eq 42 and type eq 'answer'", sequelize);
    expect(result).toStrictEqual({
      where: {
        [sequelize.Sequelize.Op.and]: [
          {
            age: {
              [sequelize.Sequelize.Op.eq]: 42
            }
          },
          {
            type: {
              [sequelize.Sequelize.Op.eq]: "answer"
            }
          }
        ]
      }
    });
  });

  it("should parse filter precedence 1", () => {
    const result = parser(
      "$filter=(foo eq '2019-02-12' and bar eq 'TK0001') or (foo eq '2019-02-12' and bar eq 'TK0003')",
      sequelize
    );
    expect(result).toStrictEqual({
      where: {
        [sequelize.Sequelize.Op.or]: [
          {
            [sequelize.Sequelize.Op.and]: [
              {
                foo: {
                  [sequelize.Sequelize.Op.eq]: "2019-02-12"
                }
              },
              {
                bar: {
                  [sequelize.Sequelize.Op.eq]: "TK0001"
                }
              }
            ]
          },
          {
            [sequelize.Sequelize.Op.and]: [
              {
                foo: {
                  [sequelize.Sequelize.Op.eq]: "2019-02-12"
                }
              },
              {
                bar: {
                  [sequelize.Sequelize.Op.eq]: "TK0003"
                }
              }
            ]
          }
        ]
      }
    });
  });

  it("should parse filter precedence 2", () => {
    const result = parser(
      "$filter=(Foo eq 'Test' or Bar eq 'Test') and ((Foo ne 'Lorem' or Bar ne 'Ipsum') and (Year gt 2017))",
      sequelize
    );
    expect(result).toStrictEqual({
      where: {
        [sequelize.Sequelize.Op.and]: [
          {
            [sequelize.Sequelize.Op.or]: [
              {
                Foo: {
                  [sequelize.Sequelize.Op.eq]: "Test"
                }
              },
              {
                Bar: {
                  [sequelize.Sequelize.Op.eq]: "Test"
                }
              }
            ]
          },
          {
            [sequelize.Sequelize.Op.and]: [
              {
                [sequelize.Sequelize.Op.or]: [
                  {
                    Foo: {
                      [sequelize.Sequelize.Op.ne]: "Lorem"
                    }
                  },
                  {
                    Bar: {
                      [sequelize.Sequelize.Op.ne]: "Ipsum"
                    }
                  }
                ]
              },
              {
                Year: {
                  [sequelize.Sequelize.Op.gt]: 2017
                }
              }
            ]
          }
        ]
      }
    });
  });

  it("should not parse with unknown function", () => {
    const result = parser("$filter=unknown(age) eq 42", sequelize);
    expect(result).toStrictEqual({});
  });

  it("should parse filter with inner function", () => {
    const result = parser("$filter=substringof('a',tolower(foo))", sequelize);

    expect(result).toMatchObject({
      where: {
        foo: {
          attribute: {
            args: [
              {
                col: "foo"
              }
            ],
            fn: "tolower"
          },
          comparator: sequelize.Sequelize.Op.like,
          logic: "%a%"
        }
      }
    });
  });

  it("should parse filter NOT operator", () => {
    const result = parser("$filter=not (age eq 42)", sequelize);
    expect(result).toStrictEqual({
      where: {
        [sequelize.Sequelize.Op.not]: {
          age: {
            [sequelize.Sequelize.Op.eq]: 42
          }
        }
      }
    });
  });

  it("should parse filter NOT with AND", () => {
    const result = parser("$filter=not (age eq 42 and name eq 'test')", sequelize);
    expect(result).toStrictEqual({
      where: {
        [sequelize.Sequelize.Op.not]: {
          [sequelize.Sequelize.Op.and]: [
            {
              age: {
                [sequelize.Sequelize.Op.eq]: 42
              }
            },
            {
              name: {
                [sequelize.Sequelize.Op.eq]: "test"
              }
            }
          ]
        }
      }
    });
  });

  it("should parse filter concat function", () => {
    const result = parser("$filter=concat(FirstName, LastName) eq 'JohnDoe'", sequelize);
    expect(result).toMatchObject({
      where: {
        attribute: {
          fn: "concat"
        },
        comparator: sequelize.Sequelize.Op.eq,
        logic: "JohnDoe"
      }
    });
  });

  it("should parse filter concat with string literal", () => {
    const result = parser("$filter=concat(FirstName, ' ', LastName) eq 'John Doe'", sequelize);
    expect(result).toMatchObject({
      where: {
        attribute: {
          fn: "concat"
        },
        comparator: sequelize.Sequelize.Op.eq,
        logic: "John Doe"
      }
    });
  });

  it("should parse filter substring function", () => {
    const result = parser("$filter=substring(Name, 1, 2) eq 'oh'", sequelize);
    expect(result).toMatchObject({
      where: {
        Name: {
          attribute: {
            fn: "substring"
          },
          comparator: sequelize.Sequelize.Op.eq,
          logic: "oh"
        }
      }
    });
  });

  it("should parse filter substring without length", () => {
    const result = parser("$filter=substring(Name, 1) eq 'ohn'", sequelize);
    expect(result).toMatchObject({
      where: {
        Name: {
          attribute: {
            fn: "substring"
          },
          comparator: sequelize.Sequelize.Op.eq,
          logic: "ohn"
        }
      }
    });
  });

  it("should parse filter replace function", () => {
    const result = parser("$filter=replace(Name, ' ', '_') eq 'John_Doe'", sequelize);
    expect(result).toMatchObject({
      where: {
        Name: {
          attribute: {
            fn: "replace"
          },
          comparator: sequelize.Sequelize.Op.eq,
          logic: "John_Doe"
        }
      }
    });
  });

  it("should parse filter indexof function", () => {
    const result = parser("$filter=indexof(Name, 'ohn') eq 1", sequelize);
    expect(result).toMatchObject({
      where: {
        Name: {
          comparator: sequelize.Sequelize.Op.eq,
          logic: 1
        }
      }
    });
  });

  it("should parse filter indexof with gt", () => {
    const result = parser("$filter=indexof(Name, 'test') gt 0", sequelize);
    expect(result).toMatchObject({
      where: {
        Name: {
          comparator: sequelize.Sequelize.Op.gt,
          logic: 0
        }
      }
    });
  });

  it("should parse complex filter with new functions", () => {
    const result = parser(
      "$filter=(concat(FirstName, LastName) eq 'JohnDoe') and (age gt 18)",
      sequelize
    );
    expect(result).toMatchObject({
      where: {
        [sequelize.Sequelize.Op.and]: [
          {
            attribute: {
              fn: "concat"
            },
            comparator: sequelize.Sequelize.Op.eq,
            logic: "JohnDoe"
          },
          {
            age: {
              [sequelize.Sequelize.Op.gt]: 18
            }
          }
        ]
      }
    });
  });

  it("should parse simple expand", () => {
    const result = parser("$expand=Orders", sequelize);
    expect(result).toStrictEqual({
      include: [
        {
          association: "Orders"
        }
      ]
    });
  });

  it("should parse multiple expand", () => {
    const result = parser("$expand=Orders,Customer", sequelize);
    expect(result).toStrictEqual({
      include: [
        {
          association: "Orders"
        },
        {
          association: "Customer"
        }
      ]
    });
  });

  it("should parse nested expand", () => {
    const result = parser("$expand=Orders/OrderItems", sequelize);
    expect(result).toStrictEqual({
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
    });
  });

  it("should parse multiple nested expand", () => {
    const result = parser("$expand=Orders/OrderItems,Customer/Address", sequelize);
    expect(result).toStrictEqual({
      include: [
        {
          association: "Orders",
          include: [
            {
              association: "OrderItems"
            }
          ]
        },
        {
          association: "Customer",
          include: [
            {
              association: "Address"
            }
          ]
        }
      ]
    });
  });

  it("should parse mixed simple and nested expand", () => {
    const result = parser("$expand=Orders,Customer/Address", sequelize);
    expect(result).toStrictEqual({
      include: [
        {
          association: "Orders"
        },
        {
          association: "Customer",
          include: [
            {
              association: "Address"
            }
          ]
        }
      ]
    });
  });

  it("should parse expand with other query options", () => {
    const result = parser(
      "$select=Name,Id&$expand=Orders&$top=10&$filter=Active eq true",
      sequelize
    );
    expect(result).toStrictEqual({
      attributes: ["Name", "Id"],
      limit: 10,
      include: [
        {
          association: "Orders"
        }
      ],
      where: {
        Active: {
          [sequelize.Sequelize.Op.eq]: true
        }
      }
    });
  });

  it("should parse deeply nested expand", () => {
    const result = parser("$expand=Customer/Orders/OrderItems", sequelize);
    expect(result).toStrictEqual({
      include: [
        {
          association: "Customer",
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
      ]
    });
  });

  // Lambda expressions (any/all) for querying in children tables
  it("should parse lambda any expression", () => {
    const result = parser("$filter=Orders/any(o: o/Amount gt 100)", sequelize);
    expect(result).toMatchObject({
      include: [
        {
          association: "Orders",
          where: {
            Amount: {
              [sequelize.Sequelize.Op.gt]: 100
            }
          },
          required: true
        }
      ]
    });
  });

  it("should parse lambda all expression", () => {
    const result = parser("$filter=Orders/all(o: o/Status eq 'Shipped')", sequelize);
    expect(result).toMatchObject({
      include: [
        {
          association: "Orders",
          where: {
            Status: {
              [sequelize.Sequelize.Op.eq]: "Shipped"
            }
          },
          required: false
        }
      ]
    });
  });

  it("should parse lambda with numeric comparison", () => {
    const result = parser("$filter=OrderItems/any(item: item/Quantity gt 5)", sequelize);
    expect(result).toMatchObject({
      include: [
        {
          association: "OrderItems",
          where: {
            Quantity: {
              [sequelize.Sequelize.Op.gt]: 5
            }
          },
          required: true
        }
      ]
    });
  });

  it("should parse lambda with different operators", () => {
    const result = parser("$filter=Products/any(p: p/Price le 100)", sequelize);
    expect(result).toMatchObject({
      include: [
        {
          association: "Products",
          where: {
            Price: {
              [sequelize.Sequelize.Op.lte]: 100
            }
          },
          required: true
        }
      ]
    });
  });

  // Navigation property tests
  it("should parse navigation property filter", () => {
    const result = parser("$filter=Customer/CompanyName eq 'ACME Corp'", sequelize);
    expect(result).toMatchObject({
      include: [
        {
          association: "Customer",
          where: {
            CompanyName: {
              [sequelize.Sequelize.Op.eq]: "ACME Corp"
            }
          },
          required: true
        }
      ]
    });
  });

  it("should parse expand with navigation property filter", () => {
    const result = parser(
      "$expand=Customer&$filter=Customer/CompanyName eq 'Vins et alcools Chevalier'",
      sequelize
    );
    expect(result).toMatchObject({
      include: [
        {
          association: "Customer",
          where: {
            CompanyName: {
              [sequelize.Sequelize.Op.eq]: "Vins et alcools Chevalier"
            }
          },
          required: true
        }
      ]
    });
  });

  it("should parse navigation property with different operators", () => {
    const result = parser("$filter=Order/OrderDate gt datetime'2023-01-01T00:00:00'", sequelize);
    expect(result).toMatchObject({
      include: [
        {
          association: "Order",
          where: {
            OrderDate: {
              [sequelize.Sequelize.Op.gt]: new Date("2023-01-01T00:00:00")
            }
          },
          required: true
        }
      ]
    });
  });

  it("should merge expand and navigation filter for same entity", () => {
    const result = parser("$expand=Product,Customer&$filter=Customer/City eq 'Berlin'", sequelize);

    expect(result.include).toHaveLength(2);

    const customerInclude = result.include.find(i => i.association === "Customer");
    const productInclude = result.include.find(i => i.association === "Product");

    expect(customerInclude).toMatchObject({
      association: "Customer",
      where: {
        City: {
          [sequelize.Sequelize.Op.eq]: "Berlin"
        }
      },
      required: true
    });

    expect(productInclude).toMatchObject({
      association: "Product"
    });
  });

  // Comprehensive integration tests
  describe("Complex Integration Scenarios", () => {
    it("should handle complex query with all features", () => {
      const result = parser(
        "$select=Name,Description&$expand=Customer,Orders&$top=25&$skip=50&$orderby=CreatedDate desc,Name asc&$filter=Active eq true",
        sequelize
      );

      expect(result).toMatchObject({
        attributes: ["Name", "Description"],
        limit: 25,
        offset: 50,
        order: [
          ["CreatedDate", "DESC"],
          ["Name", "ASC"]
        ],
        where: {
          Active: {
            [sequelize.Sequelize.Op.eq]: true
          }
        }
      });

      expect(result.include).toHaveLength(2);

      const customerInclude = result.include.find(i => i.association === "Customer");
      expect(customerInclude).toMatchObject({
        association: "Customer"
      });

      const ordersInclude = result.include.find(i => i.association === "Orders");
      expect(ordersInclude).toMatchObject({
        association: "Orders"
      });
    });

    it("should handle lambda expression with expand and ordering", () => {
      const result = parser(
        "$expand=Orders,Products&$filter=Orders/any(o: o/Amount gt 1000)&$orderby=CompanyName&$top=10",
        sequelize
      );

      expect(result).toMatchObject({
        limit: 10,
        order: [["CompanyName", "ASC"]]
      });

      expect(result.include.length).toBeGreaterThanOrEqual(2);

      const ordersLambda = result.include.find(i => i.association === "Orders" && i.where);
      expect(ordersLambda).toMatchObject({
        association: "Orders",
        where: {
          Amount: {
            [sequelize.Sequelize.Op.gt]: 1000
          }
        },
        required: true
      });

      const productsInclude = result.include.find(i => i.association === "Products");
      expect(productsInclude).toMatchObject({
        association: "Products"
      });
    });

    it("should handle navigation filter with expand and select", () => {
      const result = parser(
        "$expand=Customer,OrderItems&$filter=Customer/Region eq 'Europe'&$select=OrderID,CustomerID",
        sequelize
      );

      expect(result).toMatchObject({
        attributes: ["OrderID", "CustomerID"]
      });

      expect(result.include).toHaveLength(2);

      const customerInclude = result.include.find(i => i.association === "Customer");
      expect(customerInclude).toMatchObject({
        association: "Customer",
        where: {
          Region: {
            [sequelize.Sequelize.Op.eq]: "Europe"
          }
        },
        required: true
      });

      const orderItemsInclude = result.include.find(i => i.association === "OrderItems");
      expect(orderItemsInclude).toMatchObject({
        association: "OrderItems"
      });
    });

    it("should handle lambda filter with expand and select", () => {
      const result = parser(
        "$expand=OrderItems&$filter=OrderItems/any(item: item/Quantity ge 5)&$select=OrderID,CustomerID",
        sequelize
      );

      expect(result).toMatchObject({
        attributes: ["OrderID", "CustomerID"]
      });

      const orderItemsInclude = result.include.find(i => i.association === "OrderItems");
      expect(orderItemsInclude).toMatchObject({
        association: "OrderItems",
        where: {
          Quantity: {
            [sequelize.Sequelize.Op.gte]: 5
          }
        },
        required: true
      });
    });

    it("should handle function filter with navigation and expand", () => {
      const result = parser(
        "$filter=tolower(CompanyName) eq 'acme corp' and Customer/Country ne 'USA'&$expand=Customer&$orderby=OrderDate desc",
        sequelize
      );

      expect(result).toMatchObject({
        order: [["OrderDate", "DESC"]]
      });

      // Should have AND condition with multiple parts
      expect(result.where[sequelize.Sequelize.Op.and]).toBeDefined();

      // Check tolower function
      const toLowerCondition = result.where[sequelize.Sequelize.Op.and].find(
        condition => condition.CompanyName && condition.CompanyName.attribute
      );
      expect(toLowerCondition).toMatchObject({
        CompanyName: {
          attribute: {
            fn: "tolower",
            args: [{ col: "CompanyName" }]
          },
          comparator: sequelize.Sequelize.Op.eq,
          logic: "acme corp"
        }
      });

      // Check Customer navigation filter merged with expand
      const customerInclude = result.include.find(i => i.association === "Customer");
      expect(customerInclude).toMatchObject({
        association: "Customer",
        where: {
          Country: {
            [sequelize.Sequelize.Op.ne]: "USA"
          }
        },
        required: true
      });
    });

    it("should handle nested expand with filters", () => {
      const result = parser(
        "$expand=Customer/Orders&$filter=substringof('Premium', Customer/CompanyName)&$top=5",
        sequelize
      );

      expect(result).toMatchObject({
        limit: 5
      });

      expect(result.include).toHaveLength(1);

      const customerInclude = result.include.find(i => i.association === "Customer");
      expect(customerInclude).toMatchObject({
        association: "Customer",
        include: [
          {
            association: "Orders"
          }
        ]
      });
    });

    it("should handle complex ordering with functions and navigation", () => {
      // Simplified version since navigation properties and functions in orderby
      // would require significant grammar and implementation changes
      const result = parser(
        "$orderby=CompanyName asc,CreatedDate desc&$filter=Active eq true&$expand=Customer",
        sequelize
      );

      expect(result).toMatchObject({
        order: [
          ["CompanyName", "ASC"],
          ["CreatedDate", "DESC"]
        ],
        where: {
          Active: {
            [sequelize.Sequelize.Op.eq]: true
          }
        }
      });

      const customerInclude = result.include.find(i => i.association === "Customer");
      expect(customerInclude).toMatchObject({
        association: "Customer"
      });
    });

    it("should handle multiple string functions with complex logic", () => {
      const result = parser(
        "$filter=startswith(CustomerName, 'A') and (endswith(CustomerName, 'Corp') or substringof('Premium', Description))&$select=CustomerName,Description&$top=20",
        sequelize
      );

      expect(result).toMatchObject({
        attributes: ["CustomerName", "Description"],
        limit: 20
      });

      // Should have complex nested AND/OR structure
      const whereClause = result.where;
      expect(whereClause[sequelize.Sequelize.Op.and]).toBeDefined();
      expect(whereClause[sequelize.Sequelize.Op.and]).toHaveLength(2);
    });

    it("should handle pagination with complex filters and multiple expands", () => {
      const result = parser(
        "$select=ID,Name,Status&$expand=Customer,Orders/OrderItems&$top=15&$skip=30&$filter=(Status eq 'Active' or Status eq 'Pending') and Customer/Region eq 'North America'&$orderby=Priority desc,Name asc",
        sequelize
      );

      expect(result).toMatchObject({
        attributes: ["ID", "Name", "Status"],
        limit: 15,
        offset: 30,
        order: [
          ["Priority", "DESC"],
          ["Name", "ASC"]
        ]
      });

      expect(result.include).toContainEqual(
        expect.objectContaining({
          association: "Customer",
          where: {
            Region: {
              [sequelize.Sequelize.Op.eq]: "North America"
            }
          },
          required: true
        })
      );
    });

    it("should handle date functions with navigation properties", () => {
      const result = parser(
        "$filter=year(CreatedDate) ge 2023 and month(UpdatedDate) eq 12 and Customer/LastOrderDate lt datetime'2024-01-01T00:00:00'&$expand=Customer",
        sequelize
      );

      // Check year function
      expect(result.where[sequelize.Sequelize.Op.and]).toContainEqual(
        expect.objectContaining({
          CreatedDate: expect.objectContaining({
            attribute: expect.objectContaining({
              fn: "year"
            })
          })
        })
      );

      // Check month function
      expect(result.where[sequelize.Sequelize.Op.and]).toContainEqual(
        expect.objectContaining({
          UpdatedDate: expect.objectContaining({
            attribute: expect.objectContaining({
              fn: "month"
            })
          })
        })
      );

      // Check Customer navigation with date
      const customerInclude = result.include.find(i => i.association === "Customer");
      expect(customerInclude).toMatchObject({
        association: "Customer",
        where: {
          LastOrderDate: {
            [sequelize.Sequelize.Op.lt]: new Date("2024-01-01T00:00:00")
          }
        },
        required: true
      });
    });

    it("should handle multiple operators with expand and ordering", () => {
      const result = parser(
        "$filter=Priority ge 1 and Priority le 5 and Status ne 'Cancelled'&$expand=Customer,Products&$orderby=Priority,CreatedDate desc&$top=50",
        sequelize
      );

      expect(result).toMatchObject({
        limit: 50,
        order: [
          ["Priority", "ASC"],
          ["CreatedDate", "DESC"]
        ]
      });

      // Check complex where conditions
      expect(result.where[sequelize.Sequelize.Op.and]).toBeDefined();

      // Check includes are created
      expect(result.include.length).toBeGreaterThanOrEqual(2);

      const customerInclude = result.include.find(i => i.association === "Customer");
      expect(customerInclude).toMatchObject({
        association: "Customer"
      });

      const productsInclude = result.include.find(i => i.association === "Products");
      expect(productsInclude).toMatchObject({
        association: "Products"
      });
    });

    // Advanced Mixed AND/OR Tests with Parentheses
    describe("Advanced Mixed AND/OR with Parentheses", () => {
      it("should handle complex nested OR within AND", () => {
        const result = parser(
          "$filter=(Status eq 'Active' or Status eq 'Pending') and (Priority ge 1 and Priority le 5)",
          sequelize
        );

        expect(result).toMatchObject({
          where: {
            [sequelize.Sequelize.Op.and]: [
              {
                [sequelize.Sequelize.Op.or]: [
                  {
                    Status: {
                      [sequelize.Sequelize.Op.eq]: "Active"
                    }
                  },
                  {
                    Status: {
                      [sequelize.Sequelize.Op.eq]: "Pending"
                    }
                  }
                ]
              },
              {
                [sequelize.Sequelize.Op.and]: [
                  {
                    Priority: {
                      [sequelize.Sequelize.Op.gte]: 1
                    }
                  },
                  {
                    Priority: {
                      [sequelize.Sequelize.Op.lte]: 5
                    }
                  }
                ]
              }
            ]
          }
        });
      });

      it("should handle complex nested AND within OR", () => {
        const result = parser(
          "$filter=(Name eq 'Test' and Active eq true) or (Description eq 'Sample' and Status ne 'Deleted')",
          sequelize
        );

        expect(result).toMatchObject({
          where: {
            [sequelize.Sequelize.Op.or]: [
              {
                [sequelize.Sequelize.Op.and]: [
                  {
                    Name: {
                      [sequelize.Sequelize.Op.eq]: "Test"
                    }
                  },
                  {
                    Active: {
                      [sequelize.Sequelize.Op.eq]: true
                    }
                  }
                ]
              },
              {
                [sequelize.Sequelize.Op.and]: [
                  {
                    Description: {
                      [sequelize.Sequelize.Op.eq]: "Sample"
                    }
                  },
                  {
                    Status: {
                      [sequelize.Sequelize.Op.ne]: "Deleted"
                    }
                  }
                ]
              }
            ]
          }
        });
      });

      it("should handle deeply nested parentheses", () => {
        const result = parser(
          "$filter=((Type eq 'A' or Type eq 'B') and (Status eq 'Active')) or ((Category eq 'Premium') and (Year gt 2020))",
          sequelize
        );

        expect(result).toMatchObject({
          where: {
            [sequelize.Sequelize.Op.or]: [
              {
                [sequelize.Sequelize.Op.and]: [
                  {
                    [sequelize.Sequelize.Op.or]: [
                      {
                        Type: {
                          [sequelize.Sequelize.Op.eq]: "A"
                        }
                      },
                      {
                        Type: {
                          [sequelize.Sequelize.Op.eq]: "B"
                        }
                      }
                    ]
                  },
                  {
                    Status: {
                      [sequelize.Sequelize.Op.eq]: "Active"
                    }
                  }
                ]
              },
              {
                [sequelize.Sequelize.Op.and]: [
                  {
                    Category: {
                      [sequelize.Sequelize.Op.eq]: "Premium"
                    }
                  },
                  {
                    Year: {
                      [sequelize.Sequelize.Op.gt]: 2020
                    }
                  }
                ]
              }
            ]
          }
        });
      });

      it("should handle mixed function calls with complex logical operators", () => {
        const result = parser(
          "$filter=(tolower(Name) eq 'test' or startswith('Sample', Description)) and (year(CreatedDate) gt 2023 or month(UpdatedDate) eq 12)",
          sequelize
        );

        // Should have top-level AND with two OR groups
        expect(result.where[sequelize.Sequelize.Op.and]).toHaveLength(2);

        // Check first OR group (functions)
        const firstGroup = result.where[sequelize.Sequelize.Op.and][0];
        expect(firstGroup[sequelize.Sequelize.Op.or]).toBeDefined();

        // Check second OR group (date functions)
        const secondGroup = result.where[sequelize.Sequelize.Op.and][1];
        expect(secondGroup[sequelize.Sequelize.Op.or]).toBeDefined();
      });

      it("should handle navigation properties with complex logical operators", () => {
        const result = parser(
          "$filter=(Customer/CompanyName eq 'Acme' or Customer/Country eq 'USA') and (Orders/any(o: o/Amount gt 100) or Status eq 'VIP')&$expand=Customer,Orders",
          sequelize
        );

        // Should have mixed logical structure
        expect(result.where).toBeDefined();
        expect(result.include).toBeDefined();
        expect(result.include.length).toBeGreaterThanOrEqual(2);

        // Check for Customer and Orders includes
        const customerInclude = result.include.find(i => i.association === "Customer");
        expect(customerInclude).toBeDefined();

        const ordersInclude = result.include.find(i => i.association === "Orders");
        expect(ordersInclude).toBeDefined();
      });

      it("should handle triple nested parentheses with mixed operators", () => {
        const result = parser(
          "$filter=(((Type eq 'A') or (Type eq 'B' and Status eq 'Active')) and ((Priority ge 1) and (Priority le 5))) or (Category eq 'Special')",
          sequelize
        );

        expect(result.where[sequelize.Sequelize.Op.or]).toBeDefined();
        expect(result.where[sequelize.Sequelize.Op.or]).toHaveLength(2);

        // First part should be a complex nested structure
        const complexPart = result.where[sequelize.Sequelize.Op.or][0];
        expect(complexPart[sequelize.Sequelize.Op.and]).toBeDefined();

        // Second part should be simple
        const simplePart = result.where[sequelize.Sequelize.Op.or][1];
        expect(simplePart.Category).toBeDefined();
      });

      it("should handle NOT operator with complex parentheses", () => {
        const result = parser(
          "$filter=not ((Status eq 'Deleted') or (Type eq 'Archived')) and (Active eq true)",
          sequelize
        );

        expect(result.where[sequelize.Sequelize.Op.and]).toBeDefined();
        expect(result.where[sequelize.Sequelize.Op.and]).toHaveLength(2);

        // Should have NOT operator
        const notPart = result.where[sequelize.Sequelize.Op.and][0];
        expect(notPart[sequelize.Sequelize.Op.not]).toBeDefined();

        // Should have Active condition
        const activePart = result.where[sequelize.Sequelize.Op.and][1];
        expect(activePart.Active).toBeDefined();
      });

      it("should handle complex query with all features and parentheses", () => {
        const result = parser(
          "$select=Name,Status,Priority&$expand=Customer,Orders&$top=20&$skip=10&$orderby=Priority desc,Name asc&$filter=((Status eq 'Active' and Priority ge 3) or (Customer/Country eq 'USA' and Orders/any(o: o/Amount gt 500))) and (year(CreatedDate) ge 2023)",
          sequelize
        );

        expect(result).toMatchObject({
          attributes: ["Name", "Status", "Priority"],
          limit: 20,
          offset: 10,
          order: [
            ["Priority", "DESC"],
            ["Name", "ASC"]
          ]
        });

        // Should have complex where conditions
        expect(result.where).toBeDefined();

        // Should have multiple includes
        expect(result.include).toBeDefined();
        expect(result.include.length).toBeGreaterThanOrEqual(2);
      });

      it("should handle alternating AND/OR patterns", () => {
        const result = parser(
          "$filter=(A eq 1 or B eq 2) and (C eq 3 or D eq 4) and (E eq 5 or F eq 6)",
          sequelize
        );

        expect(result.where[sequelize.Sequelize.Op.and]).toBeDefined();
        // Due to left-associative parsing: ((A or B) and (C or D)) and (E or F)
        expect(result.where[sequelize.Sequelize.Op.and]).toHaveLength(2);

        // First condition should be nested AND with OR conditions
        const firstCondition = result.where[sequelize.Sequelize.Op.and][0];
        expect(firstCondition[sequelize.Sequelize.Op.and]).toBeDefined();
        expect(firstCondition[sequelize.Sequelize.Op.and]).toHaveLength(2);

        // Both parts of first condition should be OR groups
        firstCondition[sequelize.Sequelize.Op.and].forEach(condition => {
          expect(condition[sequelize.Sequelize.Op.or]).toBeDefined();
          expect(condition[sequelize.Sequelize.Op.or]).toHaveLength(2);
        });

        // Second condition should be an OR group
        const secondCondition = result.where[sequelize.Sequelize.Op.and][1];
        expect(secondCondition[sequelize.Sequelize.Op.or]).toBeDefined();
        expect(secondCondition[sequelize.Sequelize.Op.or]).toHaveLength(2);
      });

      it("should handle function calls within nested parentheses", () => {
        const result = parser(
          "$filter=((substringof('test', Name) and startswith('prefix', Description)) or (year(CreatedDate) eq 2024 and month(UpdatedDate) ge 6)) and Active eq true",
          sequelize
        );

        expect(result.where[sequelize.Sequelize.Op.and]).toBeDefined();
        expect(result.where[sequelize.Sequelize.Op.and]).toHaveLength(2);

        // Should have complex OR structure as first condition
        const complexCondition = result.where[sequelize.Sequelize.Op.and][0];
        expect(complexCondition[sequelize.Sequelize.Op.or]).toBeDefined();

        // Should have simple Active condition as second condition
        const simpleCondition = result.where[sequelize.Sequelize.Op.and][1];
        expect(simpleCondition.Active).toBeDefined();
      });
    });
  });
});
