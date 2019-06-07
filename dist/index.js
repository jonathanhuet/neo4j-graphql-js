'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.inferSchema = exports.augmentTypeDefs = exports.makeAugmentedSchema = exports.augmentSchema = exports.neo4jgraphql = undefined;

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(
  _objectWithoutProperties2
);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var neo4jgraphql = (exports.neo4jgraphql = (function() {
  var _ref = (0, _asyncToGenerator3.default)(
    /*#__PURE__*/ _regenerator2.default.mark(function _callee(
      object,
      params,
      context,
      resolveInfo
    ) {
      var debug =
        arguments.length > 4 && arguments[4] !== undefined
          ? arguments[4]
          : true;

      var query,
        cypherParams,
        cypherFunction,
        _cypherFunction,
        _cypherFunction2,
        scopedCypher,
        session,
        result;

      return _regenerator2.default.wrap(
        function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                if (!(0, _auth.checkRequestError)(context)) {
                  _context.next = 2;
                  break;
                }

                throw new Error((0, _auth.checkRequestError)(context));

              case 2:
                query = void 0;
                cypherParams = void 0;
                cypherFunction = (0, _utils.isMutation)(resolveInfo)
                  ? cypherMutation
                  : cypherQuery;
                _cypherFunction = cypherFunction(params, context, resolveInfo);
                _cypherFunction2 = (0, _slicedToArray3.default)(
                  _cypherFunction,
                  2
                );
                query = _cypherFunction2[0];
                cypherParams = _cypherFunction2[1];
                scopedCypher = addScoping(
                  query,
                  cypherParams,
                  context,
                  resolveInfo
                );

                query = scopedCypher.query;
                cypherParams = scopedCypher.cypherParams;

                if (debug) {
                  console.log(query);
                  console.log((0, _stringify2.default)(cypherParams, null, 2));
                }

                session = context.driver.session();
                result = void 0;
                _context.prev = 15;

                if (!(0, _utils.isMutation)(resolveInfo)) {
                  _context.next = 22;
                  break;
                }

                _context.next = 19;
                return session.writeTransaction(function(tx) {
                  return tx.run(query, cypherParams);
                });

              case 19:
                result = _context.sent;
                _context.next = 25;
                break;

              case 22:
                _context.next = 24;
                return session.readTransaction(function(tx) {
                  return tx.run(query, cypherParams);
                });

              case 24:
                result = _context.sent;

              case 25:
                _context.prev = 25;

                session.close();
                return _context.finish(25);

              case 28:
                return _context.abrupt(
                  'return',
                  (0, _utils.extractQueryResult)(result, resolveInfo.returnType)
                );

              case 29:
              case 'end':
                return _context.stop();
            }
          }
        },
        _callee,
        this,
        [[15, , 25, 28]]
      );
    })
  );

  return function neo4jgraphql(_x2, _x3, _x4, _x5) {
    return _ref.apply(this, arguments);
  };
})());

exports.cypherQuery = cypherQuery;
exports.cypherMutation = cypherMutation;

var _utils = require('./utils');

var _augment = require('./augment');

var _auth = require('./auth');

var _translate = require('./translate');

var _Neo4jSchemaTree = require('./neo4j-schema/Neo4jSchemaTree');

var _Neo4jSchemaTree2 = _interopRequireDefault(_Neo4jSchemaTree);

var _graphQLMapper = require('./neo4j-schema/graphQLMapper');

var _graphQLMapper2 = _interopRequireDefault(_graphQLMapper);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function cypherQuery(_ref2, context, resolveInfo) {
  var _ref2$first = _ref2.first,
    first = _ref2$first === undefined ? -1 : _ref2$first,
    _ref2$offset = _ref2.offset,
    offset = _ref2$offset === undefined ? 0 : _ref2$offset,
    _id = _ref2._id,
    orderBy = _ref2.orderBy,
    otherParams = (0, _objectWithoutProperties3.default)(_ref2, [
      'first',
      'offset',
      '_id',
      'orderBy'
    ]);

  var _typeIdentifiers = (0, _utils.typeIdentifiers)(resolveInfo.returnType),
    typeName = _typeIdentifiers.typeName,
    variableName = _typeIdentifiers.variableName;

  var schemaType = resolveInfo.schema.getType(typeName);
  var selections = (0, _utils.getPayloadSelections)(resolveInfo);
  return (0, _translate.translateQuery)({
    resolveInfo: resolveInfo,
    context: context,
    schemaType: schemaType,
    selections: selections,
    variableName: variableName,
    typeName: typeName,
    first: first,
    offset: offset,
    _id: _id,
    orderBy: orderBy,
    otherParams: otherParams
  });
}

function cypherMutation(_ref3, context, resolveInfo) {
  var _ref3$first = _ref3.first,
    first = _ref3$first === undefined ? -1 : _ref3$first,
    _ref3$offset = _ref3.offset,
    offset = _ref3$offset === undefined ? 0 : _ref3$offset,
    _id = _ref3._id,
    orderBy = _ref3.orderBy,
    otherParams = (0, _objectWithoutProperties3.default)(_ref3, [
      'first',
      'offset',
      '_id',
      'orderBy'
    ]);

  var _typeIdentifiers2 = (0, _utils.typeIdentifiers)(resolveInfo.returnType),
    typeName = _typeIdentifiers2.typeName,
    variableName = _typeIdentifiers2.variableName;

  var schemaType = resolveInfo.schema.getType(typeName);
  var selections = (0, _utils.getPayloadSelections)(resolveInfo);
  return (0, _translate.translateMutation)({
    resolveInfo: resolveInfo,
    context: context,
    schemaType: schemaType,
    selections: selections,
    variableName: variableName,
    typeName: typeName,
    first: first,
    offset: offset,
    otherParams: otherParams
  });
}

var augmentSchema = (exports.augmentSchema = function augmentSchema(schema) {
  var config =
    arguments.length > 1 && arguments[1] !== undefined
      ? arguments[1]
      : {
          query: true,
          mutation: true,
          temporal: true,
          debug: true
        };

  var typeMap = (0, _augment.extractTypeMapFromSchema)(schema);
  var resolvers = (0, _augment.extractResolversFromSchema)(schema);
  return (0, _augment.augmentedSchema)(typeMap, resolvers, config);
});

var makeAugmentedSchema = (exports.makeAugmentedSchema = function makeAugmentedSchema(
  _ref4
) {
  var schema = _ref4.schema,
    typeDefs = _ref4.typeDefs,
    _ref4$resolvers = _ref4.resolvers,
    resolvers = _ref4$resolvers === undefined ? {} : _ref4$resolvers,
    logger = _ref4.logger,
    _ref4$allowUndefinedI = _ref4.allowUndefinedInResolve,
    allowUndefinedInResolve =
      _ref4$allowUndefinedI === undefined ? false : _ref4$allowUndefinedI,
    _ref4$resolverValidat = _ref4.resolverValidationOptions,
    resolverValidationOptions =
      _ref4$resolverValidat === undefined ? {} : _ref4$resolverValidat,
    _ref4$directiveResolv = _ref4.directiveResolvers,
    directiveResolvers =
      _ref4$directiveResolv === undefined ? null : _ref4$directiveResolv,
    _ref4$schemaDirective = _ref4.schemaDirectives,
    schemaDirectives =
      _ref4$schemaDirective === undefined ? {} : _ref4$schemaDirective,
    _ref4$parseOptions = _ref4.parseOptions,
    parseOptions = _ref4$parseOptions === undefined ? {} : _ref4$parseOptions,
    _ref4$inheritResolver = _ref4.inheritResolversFromInterfaces,
    inheritResolversFromInterfaces =
      _ref4$inheritResolver === undefined ? false : _ref4$inheritResolver,
    _ref4$config = _ref4.config,
    config =
      _ref4$config === undefined
        ? {
            query: true,
            mutation: true,
            temporal: true,
            debug: true
          }
        : _ref4$config;

  if (schema) {
    return augmentSchema(schema, config);
  }
  if (!typeDefs) throw new Error('Must provide typeDefs');
  return (0, _augment.makeAugmentedExecutableSchema)({
    typeDefs: typeDefs,
    resolvers: resolvers,
    logger: logger,
    allowUndefinedInResolve: allowUndefinedInResolve,
    resolverValidationOptions: resolverValidationOptions,
    directiveResolvers: directiveResolvers,
    schemaDirectives: schemaDirectives,
    parseOptions: parseOptions,
    inheritResolversFromInterfaces: inheritResolversFromInterfaces,
    config: config
  });
});

var augmentTypeDefs = (exports.augmentTypeDefs = function augmentTypeDefs(
  typeDefs,
  config
) {
  var typeMap = (0, _utils.extractTypeMapFromTypeDefs)(typeDefs);
  // overwrites any provided declarations of system directives
  typeMap = (0, _utils.addDirectiveDeclarations)(typeMap, config);
  // adds managed types; tepmoral, spatial, etc.
  typeMap = (0, _augment.addTemporalTypes)(typeMap, config);
  return (0, _utils.printTypeMap)(typeMap);
});

/**
 * Infer a GraphQL schema by inspecting the contents of a Neo4j instance.
 * @param {} driver
 * @returns a GraphQL schema.
 */
var inferSchema = (exports.inferSchema = function inferSchema(driver) {
  var config =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var tree = new _Neo4jSchemaTree2.default(driver, config);

  return tree.initialize().then(_graphQLMapper2.default);
});

var addScoping = function addScoping(
  query,
  cypherParams,
  context,
  resolveInfo
) {
  if (!(0, _utils.isMutation)(resolveInfo)) {
    var queryRegex = /^MATCH (\(`(?<mainVariable>.+)`:`(?<mainNode>.+)`(?<mainNodeProperties> \{[a-zA-Z0-9:$]*\})?\))(?<mainWhereClause> WHERE (?<mainWhereConditions>.*?))?( WITH (?<withClause>.*?))?(?<orderByClause> ORDER BY (.*?))?(?<returnClause> RETURN (.*))$/g;
    console.log('cypherParams--> ', cypherParams);
    console.log('query--> ', query);
    var _queryRegex$exec$grou = queryRegex.exec(query).groups,
      mainVariable = _queryRegex$exec$grou.mainVariable,
      mainNode = _queryRegex$exec$grou.mainNode,
      mainNodeProperties = _queryRegex$exec$grou.mainNodeProperties,
      mainWhereClause = _queryRegex$exec$grou.mainWhereClause,
      mainWhereConditions = _queryRegex$exec$grou.mainWhereConditions,
      withClause = _queryRegex$exec$grou.withClause,
      orderByClause = _queryRegex$exec$grou.orderByClause,
      returnClause = _queryRegex$exec$grou.returnClause;

    var mainWhereScopingConditions = '';
    var mainWhereClauseScoped = '';
    if (context.scopeParams.companyId) {
      if (mainNode === 'Company') {
      } else {
        mainWhereScopingConditions =
          '(`' +
          mainVariable +
          '`)<-[*]-(:Company{id:' +
          context.scopeParams.companyId +
          '}) ' +
          (mainWhereClause ? ' AND ' : '');
      }
    }
    if (mainWhereClause || mainWhereScopingConditions) {
      mainWhereClauseScoped =
        ' WHERE (' +
        mainWhereScopingConditions +
        (mainWhereConditions ? mainWhereConditions : '') +
        ')';
    }
    var queryScoped =
      'MATCH (`' +
      mainVariable +
      '`:`' +
      mainNode +
      '`' +
      (mainNodeProperties ? ' ' + mainNodeProperties : '') +
      ')' +
      mainWhereClauseScoped +
      (withClause ? 'WITH ' + withClause : '') +
      (orderByClause ? orderByClause : '') +
      ' ' +
      returnClause;

    console.log('queryScoped--> ', queryScoped);

    return { query: queryScoped, cypherParams: cypherParams };
  } else {
    return { query: query, cypherParams: cypherParams };
  }
};
