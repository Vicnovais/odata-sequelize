const expect = require("chai").expect;
const parser = require("../index");
const mockSequelize = require("./mock");

describe("#odataParser", () => {
  it("should parse top", () => {
    const result = parser("$top=10", mockSequelize);
    expect(result).to.deep.equal({
      limit: 10
    });
  });

  it("should parse skip", () => {
    const result = parser("$skip=5", mockSequelize);
    expect(result).to.deep.equal({
      offset: 5
    });
  });

  it("should parse top skip", () => {
    const result = parser("$top=10&$skip=5", mockSequelize);
    expect(result).to.deep.equal({
      limit: 10,
      offset: 5
    });
  });

  it("should parse select", () => {
    const result = parser("$select=foo", mockSequelize);
    expect(result).to.deep.equal({
      attributes: ["foo"]
    });
  });

  it("should parse orderby", () => {
    const result = parser("$orderby=name desc", mockSequelize);
    expect(result).to.deep.equal({
      order: [["name", "DESC"]]
    });
  });

  it("should parse orderby with multiple columns", () => {
    const result = parser("$orderby=name desc,ranking", mockSequelize);
    expect(result).to.deep.equal({
      order: [["name", "DESC"], ["ranking", "ASC"]]
    });
  });
});
