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
          [sequelize.Op.eq]: 42
        }
      }
    });
  });

  it("should parse filter ne", () => {
    const result = parser("$filter=age ne 42", sequelize);
    expect(result).toStrictEqual({
      where: {
        age: {
          [sequelize.Op.ne]: 42
        }
      }
    });
  });

  it("should parse filter gt", () => {
    const result = parser("$filter=age gt 42", sequelize);
    expect(result).toStrictEqual({
      where: {
        age: {
          [sequelize.Op.gt]: 42
        }
      }
    });
  });

  it("should parse filter lt", () => {
    const result = parser("$filter=age lt 42", sequelize);
    expect(result).toStrictEqual({
      where: {
        age: {
          [sequelize.Op.lt]: 42
        }
      }
    });
  });

  it("should parse filter substringof", () => {
    const result = parser("$filter=substringof('prefix', foo)", sequelize);
    expect(result).toStrictEqual({
      where: {
        foo: {
          [sequelize.Op.like]: "%prefix%"
        }
      }
    });
  });

  it("should parse filter startswith", () => {
    const result = parser("$filter=startswith('prefix', foo)", sequelize);
    expect(result).toStrictEqual({
      where: {
        foo: {
          [sequelize.Op.like]: "prefix%"
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
          comparator: sequelize.Op.eq,
          logic: "bar"
        }
      }
    });
  });

  it("should parse filter toupper", () => {
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
          comparator: sequelize.Op.eq,
          logic: "bar"
        }
      }
    });
  });

  it("should parse filter trim", () => {
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
          comparator: sequelize.Op.eq,
          logic: "bar"
        }
      }
    });
  });

  it("should parse filter year", () => {
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
          comparator: sequelize.Op.eq,
          logic: 2000
        }
      }
    });
  });

  it("should parse filter month", () => {
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
          comparator: sequelize.Op.eq,
          logic: 12
        }
      }
    });
  });

  it("should parse filter day", () => {
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
          comparator: sequelize.Op.eq,
          logic: 12
        }
      }
    });
  });

  it("should parse filter hour", () => {
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
          comparator: sequelize.Op.eq,
          logic: 12
        }
      }
    });
  });

  it("should parse filter minute", () => {
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
          comparator: sequelize.Op.eq,
          logic: 12
        }
      }
    });
  });

  it("should parse filter second", () => {
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
          comparator: sequelize.Op.eq,
          logic: 12
        }
      }
    });
  });

  it("should parse filter and", () => {
    const result = parser("$filter=age eq 42 and type eq 'answer'", sequelize);
    expect(result).toStrictEqual({
      where: {
        [sequelize.Op.and]: [
          {
            [sequelize.Op.and]: [{ age: 42 }]
          },
          {
            [sequelize.Op.and]: [{ type: "answer" }]
          }
        ]
      }
    });
  });

  it("should parse filter and", () => {
    const result = parser("$filter=age eq 42 and type eq 'answer'", sequelize);
    expect(result).toStrictEqual({
      where: {
        [sequelize.Op.and]: [
          {
            [sequelize.Op.and]: [{ age: 42 }]
          },
          {
            [sequelize.Op.and]: [{ type: "answer" }]
          }
        ]
      }
    });
  });
});