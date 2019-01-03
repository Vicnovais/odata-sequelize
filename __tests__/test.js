const parser = require("../index");

const sequelize = jest.requireMock("sequelize");

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

  it("should parse filter", () => {
    const result = parser("$filter=age eq 42", sequelize);
    expect(result).toStrictEqual({
      where: {
        age: {
          [sequelize.Op.eq]: 42
        }
      }
    });
  });
});
