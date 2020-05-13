import type { QueryOptions, Sequelize } from 'sequelize';

/**
 * This library is intended to take an OData query string as a parameter and transform it into a
 * sequelize-compliant query.
 */
declare function parseOData(query: string, sequelize: Sequelize): QueryOptions;

export = parseOData;
