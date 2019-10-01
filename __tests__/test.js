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
      order: [["name", "DESC"], ["ranking", "ASC"]]
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
});
