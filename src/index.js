import {
  extractQueryResult,
  isMutation,
  typeIdentifiers,
  extractTypeMapFromTypeDefs,
  addDirectiveDeclarations,
  printTypeMap,
  getPayloadSelections
} from './utils';
import {
  extractTypeMapFromSchema,
  extractResolversFromSchema,
  augmentedSchema,
  makeAugmentedExecutableSchema,
  addTemporalTypes
} from './augment';
import { checkRequestError } from './auth';
import { translateMutation, translateQuery } from './translate';
import Neo4jSchemaTree from './neo4j-schema/Neo4jSchemaTree';
import graphQLMapper from './neo4j-schema/graphQLMapper';

export async function neo4jgraphql(
  object,
  params,
  context,
  resolveInfo,
  debug = true
) {
  // throw error if context.req.error exists
  if (checkRequestError(context)) {
    throw new Error(checkRequestError(context));
  }

  let query;
  let cypherParams;

  const cypherFunction = isMutation(resolveInfo) ? cypherMutation : cypherQuery;
  [query, cypherParams] = cypherFunction(params, context, resolveInfo);

  let scopedCypher = addScoping(query, cypherParams, context, resolveInfo);
  query = scopedCypher.query;
  cypherParams = scopedCypher.cypherParams;

  if (debug) {
    console.log(query);
    console.log(JSON.stringify(cypherParams, null, 2));
  }

  const session = context.driver.session();
  let result;

  try {
    if (isMutation(resolveInfo)) {
      result = await session.writeTransaction(tx => {
        return tx.run(query, cypherParams);
      });
    } else {
      result = await session.readTransaction(tx => {
        return tx.run(query, cypherParams);
      });
    }
  } finally {
    session.close();
  }
  return extractQueryResult(result, resolveInfo.returnType);
}

export function cypherQuery(
  { first = -1, offset = 0, _id, orderBy, ...otherParams },
  context,
  resolveInfo
) {
  const { typeName, variableName } = typeIdentifiers(resolveInfo.returnType);
  const schemaType = resolveInfo.schema.getType(typeName);
  const selections = getPayloadSelections(resolveInfo);
  return translateQuery({
    resolveInfo,
    context,
    schemaType,
    selections,
    variableName,
    typeName,
    first,
    offset,
    _id,
    orderBy,
    otherParams
  });
}

export function cypherMutation(
  { first = -1, offset = 0, _id, orderBy, ...otherParams },
  context,
  resolveInfo
) {
  const { typeName, variableName } = typeIdentifiers(resolveInfo.returnType);
  const schemaType = resolveInfo.schema.getType(typeName);
  const selections = getPayloadSelections(resolveInfo);
  return translateMutation({
    resolveInfo,
    context,
    schemaType,
    selections,
    variableName,
    typeName,
    first,
    offset,
    otherParams
  });
}

export const augmentSchema = (
  schema,
  config = {
    query: true,
    mutation: true,
    temporal: true,
    debug: true
  }
) => {
  const typeMap = extractTypeMapFromSchema(schema);
  const resolvers = extractResolversFromSchema(schema);
  return augmentedSchema(typeMap, resolvers, config);
};

export const makeAugmentedSchema = ({
  schema,
  typeDefs,
  resolvers = {},
  logger,
  allowUndefinedInResolve = false,
  resolverValidationOptions = {},
  directiveResolvers = null,
  schemaDirectives = {},
  parseOptions = {},
  inheritResolversFromInterfaces = false,
  config = {
    query: true,
    mutation: true,
    temporal: true,
    debug: true
  }
}) => {
  if (schema) {
    return augmentSchema(schema, config);
  }
  if (!typeDefs) throw new Error('Must provide typeDefs');
  return makeAugmentedExecutableSchema({
    typeDefs,
    resolvers,
    logger,
    allowUndefinedInResolve,
    resolverValidationOptions,
    directiveResolvers,
    schemaDirectives,
    parseOptions,
    inheritResolversFromInterfaces,
    config
  });
};

export const augmentTypeDefs = (typeDefs, config) => {
  let typeMap = extractTypeMapFromTypeDefs(typeDefs);
  // overwrites any provided declarations of system directives
  typeMap = addDirectiveDeclarations(typeMap, config);
  // adds managed types; tepmoral, spatial, etc.
  typeMap = addTemporalTypes(typeMap, config);
  return printTypeMap(typeMap);
};

/**
 * Infer a GraphQL schema by inspecting the contents of a Neo4j instance.
 * @param {} driver
 * @returns a GraphQL schema.
 */
export const inferSchema = (driver, config = {}) => {
  const tree = new Neo4jSchemaTree(driver, config);

  return tree.initialize().then(graphQLMapper);
};

const addScoping = (query, cypherParams, context, resolveInfo) => {
  if (!isMutation(resolveInfo)) {
    let queryRegex = /^MATCH (\(`(?<mainVariable>.+)`:`(?<mainNode>.+)`(?<mainNodeProperties> \{[a-zA-Z0-9:$]*\})?\))(?<mainWhereClause> WHERE (?<mainWhereConditions>.*?))?( WITH (?<withClause>.*?))?(?<orderByClause> ORDER BY (.*?))?(?<returnClause> RETURN (.*))$/g;
    console.log('cypherParams--> ', cypherParams);
    console.log('query--> ', query);
    let {
      mainVariable,
      mainNode,
      mainNodeProperties,
      mainWhereClause,
      mainWhereConditions,
      withClause,
      orderByClause,
      returnClause
    } = queryRegex.exec(query).groups;
    let mainWhereScopingConditions = '';
    let mainWhereClauseScoped = '';
    if (context.scopeParams.companyId) {
      if (mainNode === 'Company') {
      } else {
        mainWhereScopingConditions = `(\`${mainVariable}\`)<-[*]-(:Company{id:${
          context.scopeParams.companyId
        }}) ${mainWhereClause ? ' AND ' : ''}`;
      }
    }
    if (mainWhereClause || mainWhereScopingConditions) {
      mainWhereClauseScoped = ` WHERE (${mainWhereScopingConditions}${
        mainWhereConditions ? mainWhereConditions : ''
      })`;
    }
    let queryScoped = `MATCH (\`${mainVariable}\`:\`${mainNode}\`${
      mainNodeProperties ? ` ${mainNodeProperties}` : ''
    })${mainWhereClauseScoped}${withClause ? `WITH ${withClause}` : ''}${
      orderByClause ? orderByClause : ''
    } ${returnClause}`;

    console.log('queryScoped--> ', queryScoped);

    return { query: queryScoped, cypherParams };
  } else {
    return { query, cypherParams };
  }
};
