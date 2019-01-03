let Op = {
  eq: Symbol("eq"),
  ne: Symbol("ne"),
  gte: Symbol("gte"),
  gt: Symbol("gt"),
  lte: Symbol("lte"),
  lt: Symbol("lt"),
  not: Symbol("not"),
  like: Symbol("like"),
  contains: Symbol("contains"),
  and: Symbol("and"),
  or: Symbol("or"),
  any: Symbol("any"),
  all: Symbol("all")
};

let sequelize = {};
sequelize.Op = Op;

module.exports = sequelize;
