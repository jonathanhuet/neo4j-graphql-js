'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.addTemporalTypes = exports.possiblyAddArgument = exports.augmentTypeMap = exports.extractResolversFromSchema = exports.extractTypeMapFromSchema = exports.makeAugmentedExecutableSchema = exports.augmentedSchema = undefined;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _values = require('babel-runtime/core-js/object/values');

var _values2 = _interopRequireDefault(_values);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _entries = require('babel-runtime/core-js/object/entries');

var _entries2 = _interopRequireDefault(_entries);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _graphqlTools = require('graphql-tools');

var _graphql = require('graphql');

var _index = require('./index');

var _utils = require('./utils');

var _auth = require('./auth');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var augmentedSchema = (exports.augmentedSchema = function augmentedSchema(
  typeMap,
  resolvers,
  config
) {
  var augmentedTypeMap = augmentTypeMap(typeMap, resolvers, config);
  var augmentedResolvers = augmentResolvers(
    augmentedTypeMap,
    resolvers,
    config
  );
  var schemaDirectives = (0, _auth.possiblyAddDirectiveImplementations)(
    schemaDirectives,
    typeMap,
    config
  );
  return (0, _graphqlTools.makeExecutableSchema)({
    typeDefs: (0, _utils.printTypeMap)(augmentedTypeMap),
    resolvers: augmentedResolvers,
    resolverValidationOptions: {
      requireResolversForResolveType: false
    },
    schemaDirectives: schemaDirectives
  });
});

var makeAugmentedExecutableSchema = (exports.makeAugmentedExecutableSchema = function makeAugmentedExecutableSchema(
  _ref
) {
  var typeDefs = _ref.typeDefs,
    resolvers = _ref.resolvers,
    logger = _ref.logger,
    allowUndefinedInResolve = _ref.allowUndefinedInResolve,
    resolverValidationOptions = _ref.resolverValidationOptions,
    directiveResolvers = _ref.directiveResolvers,
    schemaDirectives = _ref.schemaDirectives,
    parseOptions = _ref.parseOptions,
    inheritResolversFromInterfaces = _ref.inheritResolversFromInterfaces,
    config = _ref.config;

  var typeMap = (0, _utils.extractTypeMapFromTypeDefs)(typeDefs);
  var augmentedTypeMap = augmentTypeMap(typeMap, resolvers, config);
  var augmentedResolvers = augmentResolvers(
    augmentedTypeMap,
    resolvers,
    config
  );
  resolverValidationOptions.requireResolversForResolveType = false;
  schemaDirectives = (0, _auth.possiblyAddDirectiveImplementations)(
    schemaDirectives,
    typeMap,
    config
  );
  return (0, _graphqlTools.makeExecutableSchema)({
    typeDefs: (0, _utils.printTypeMap)(augmentedTypeMap),
    resolvers: augmentedResolvers,
    logger: logger,
    allowUndefinedInResolve: allowUndefinedInResolve,
    resolverValidationOptions: resolverValidationOptions,
    directiveResolvers: directiveResolvers,
    schemaDirectives: schemaDirectives,
    parseOptions: parseOptions,
    inheritResolversFromInterfaces: inheritResolversFromInterfaces
  });
});

var extractTypeMapFromSchema = (exports.extractTypeMapFromSchema = function extractTypeMapFromSchema(
  schema
) {
  var typeMap = schema.getTypeMap();
  var directives = schema.getDirectives();
  var types = (0, _extends3.default)({}, typeMap, directives);
  var astNode = {};
  return (0, _keys2.default)(types).reduce(function(acc, t) {
    astNode = types[t].astNode;
    if (astNode !== undefined) {
      acc[astNode.name.value] = astNode;
    }
    return acc;
  }, {});
});

var extractResolversFromSchema = (exports.extractResolversFromSchema = function extractResolversFromSchema(
  schema
) {
  var _typeMap = schema && schema._typeMap ? schema._typeMap : {};
  var types = (0, _keys2.default)(_typeMap);
  var type = {};
  var schemaTypeResolvers = {};
  return types.reduce(function(acc, t) {
    // prevent extraction from schema introspection system keys
    if (
      t !== '__Schema' &&
      t !== '__Type' &&
      t !== '__TypeKind' &&
      t !== '__Field' &&
      t !== '__InputValue' &&
      t !== '__EnumValue' &&
      t !== '__Directive'
    ) {
      type = _typeMap[t];
      // resolvers are stored on the field level at a .resolve key
      schemaTypeResolvers = extractFieldResolversFromSchemaType(type);
      // do not add unless there exists at least one field resolver for type
      if (schemaTypeResolvers) {
        acc[t] = schemaTypeResolvers;
      }
    }
    return acc;
  }, {});
});

var extractFieldResolversFromSchemaType = function extractFieldResolversFromSchemaType(
  type
) {
  var fields = type._fields;
  var fieldKeys = fields ? (0, _keys2.default)(fields) : [];
  var fieldResolvers =
    fieldKeys.length > 0
      ? fieldKeys.reduce(function(acc, t) {
          // do not add entry for this field unless it has resolver
          if (fields[t].resolve !== undefined) {
            acc[t] = fields[t].resolve;
          }
          return acc;
        }, {})
      : undefined;
  // do not return value unless there exists at least 1 field resolver
  return fieldResolvers && (0, _keys2.default)(fieldResolvers).length > 0
    ? fieldResolvers
    : undefined;
};

var augmentTypeMap = (exports.augmentTypeMap = function augmentTypeMap(
  typeMap,
  resolvers,
  config
) {
  // IDEA: elevate into config as config.rootTypes?
  var rootTypes = {
    query: 'Query',
    mutation: 'Mutation'
  };
  config = (0, _utils.excludeIgnoredTypes)(typeMap, config);
  typeMap = initializeOperationTypes(typeMap, rootTypes, config);
  typeMap = addRelationTypeDirectives(typeMap);
  typeMap = addTemporalTypes(typeMap, config);
  (0, _entries2.default)(typeMap).forEach(function(_ref2) {
    var _ref3 = (0, _slicedToArray3.default)(_ref2, 2),
      name = _ref3[0],
      type = _ref3[1];

    if (!(0, _utils.isTemporalType)(name)) {
      typeMap[name] = augmentType(type, typeMap, resolvers, rootTypes, config);
      typeMap = possiblyAddQuery(type, typeMap, resolvers, rootTypes, config);
      typeMap = possiblyAddOrderingEnum(type, typeMap, resolvers, config);
      typeMap = possiblyAddTypeInput(type, typeMap, resolvers, config);
      typeMap = possiblyAddFilterInput(type, typeMap, resolvers, config);
      typeMap = possiblyAddTypeMutations(type, typeMap, resolvers, config);
      typeMap = handleRelationFields(type, typeMap, resolvers, config);
    }
  });
  typeMap = augmentQueryArguments(typeMap, config, rootTypes);
  typeMap = (0, _utils.addDirectiveDeclarations)(typeMap, config);
  return typeMap;
});

var augmentResolvers = function augmentResolvers(
  augmentedTypeMap,
  resolvers,
  config
) {
  var queryResolvers = resolvers && resolvers.Query ? resolvers.Query : {};
  var generatedQueryMap = (0, _utils.createOperationMap)(
    augmentedTypeMap.Query
  );
  queryResolvers = possiblyAddResolvers(
    generatedQueryMap,
    queryResolvers,
    config
  );
  if ((0, _keys2.default)(queryResolvers).length > 0) {
    resolvers.Query = queryResolvers;
  }
  var mutationResolvers =
    resolvers && resolvers.Mutation ? resolvers.Mutation : {};
  var generatedMutationMap = (0, _utils.createOperationMap)(
    augmentedTypeMap.Mutation
  );
  mutationResolvers = possiblyAddResolvers(
    generatedMutationMap,
    mutationResolvers,
    config
  );
  if ((0, _keys2.default)(mutationResolvers).length > 0) {
    resolvers.Mutation = mutationResolvers;
  }
  // must implement __resolveInfo for every Interface type
  // we use "FRAGMENT_TYPE" key to identify the Interface implementation
  // type at runtime, so grab this value
  var interfaceTypes = (0, _keys2.default)(augmentedTypeMap).filter(function(
    e
  ) {
    return augmentedTypeMap[e].kind === 'InterfaceTypeDefinition';
  });
  interfaceTypes.map(function(e) {
    resolvers[e] = {};

    resolvers[e]['__resolveType'] = function(obj, context, info) {
      return obj['FRAGMENT_TYPE'];
    };
  });

  return resolvers;
};

var possiblyAddOrderingArgument = function possiblyAddOrderingArgument(
  args,
  fieldName
) {
  var orderingType = '_' + fieldName + 'Ordering';
  if (
    args.findIndex(function(e) {
      return e.name.value === fieldName;
    }) === -1
  ) {
    args.push({
      kind: 'InputValueDefinition',
      name: {
        kind: 'Name',
        value: 'orderBy'
      },
      type: {
        kind: 'ListType',
        type: {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: orderingType
          }
        }
      }
    });
  }
  return args;
};

var possiblyAddArgument = (exports.possiblyAddArgument = function possiblyAddArgument(
  args,
  fieldName,
  fieldType
) {
  if (
    args.findIndex(function(e) {
      return e.name.value === fieldName;
    }) === -1
  ) {
    args.push({
      kind: 'InputValueDefinition',
      name: {
        kind: 'Name',
        value: fieldName
      },
      type: {
        kind: 'NamedType',
        name: {
          kind: 'Name',
          value: fieldType
        }
      }
    });
  }
  return args;
});

var augmentType = function augmentType(
  astNode,
  typeMap,
  resolvers,
  rootTypes,
  config
) {
  var queryType = rootTypes.query;
  if ((0, _utils.isNodeType)(astNode)) {
    if (shouldAugmentType(config, 'query', astNode.name.value)) {
      // Only add _id field to type if query API is generated for type
      astNode.fields = addOrReplaceNodeIdField(astNode, resolvers);
    }
    astNode.fields = possiblyAddTypeFieldArguments(
      astNode,
      typeMap,
      resolvers,
      config,
      queryType
    );
  }
  // FIXME: inferring where to add @neo4j_ignore directive improperly causes
  //        fields to be ignored when logger is added, so remove functionality
  //        until we refactor how to infer when @neo4j_ignore directive is needed
  //        see https://github.com/neo4j-graphql/neo4j-graphql-js/issues/189
  // astNode.fields = possiblyAddIgnoreDirective(
  //   astNode,
  //   typeMap,
  //   resolvers,
  //   config
  // );
  return astNode;
};

var augmentQueryArguments = function augmentQueryArguments(
  typeMap,
  config,
  rootTypes
) {
  var queryType = rootTypes.query;
  // adds first / offset / orderBy to queries returning node type lists
  var queryMap = (0, _utils.createOperationMap)(typeMap.Query);
  var args = [];
  var valueTypeName = '';
  var valueType = {};
  var field = {};
  var queryNames = (0, _keys2.default)(queryMap);
  if (queryNames.length > 0) {
    queryNames.forEach(function(t) {
      field = queryMap[t];
      valueTypeName = (0, _utils._getNamedType)(field).name.value;
      valueType = typeMap[valueTypeName];
      if (
        (0, _utils.isNodeType)(valueType) &&
        shouldAugmentType(config, 'query', valueTypeName)
      ) {
        // does not add arguments if the field value type is excluded
        args = field.arguments;
        if ((0, _utils._isListType)(field)) {
          queryMap[t].arguments = possiblyAddArgument(args, 'first', 'Int');
          queryMap[t].arguments = possiblyAddArgument(args, 'offset', 'Int');
          queryMap[t].arguments = possiblyAddOrderingArgument(
            args,
            valueTypeName
          );
        }
        if (!(0, _utils.getFieldDirective)(field, 'cypher')) {
          queryMap[t].arguments = possiblyAddArgument(
            args,
            'filter',
            '_' + valueTypeName + 'Filter'
          );
        }
      }
    });
    typeMap[queryType].fields = (0, _values2.default)(queryMap);
  }
  return typeMap;
};

var possiblyAddResolvers = function possiblyAddResolvers(
  operationTypeMap,
  resolvers,
  config
) {
  var operationName = '';
  return (0, _keys2.default)(operationTypeMap).reduce(function(acc, t) {
    // if no resolver provided for this operation type field
    operationName = operationTypeMap[t].name.value;
    if (acc[operationName] === undefined) {
      acc[operationName] = function() {
        for (
          var _len = arguments.length, args = Array(_len), _key = 0;
          _key < _len;
          _key++
        ) {
          args[_key] = arguments[_key];
        }

        return _index.neo4jgraphql.apply(
          undefined,
          args.concat([config.debug])
        );
      };
    }
    return acc;
  }, resolvers);
};

var possiblyAddTypeInput = function possiblyAddTypeInput(
  astNode,
  typeMap,
  resolvers,
  config
) {
  var typeName = astNode.name.value;
  if (shouldAugmentType(config, 'mutation', typeName)) {
    var inputName = '_' + astNode.name.value + 'Input';
    if ((0, _utils.isNodeType)(astNode)) {
      if (typeMap[inputName] === undefined) {
        var pk = (0, _utils.getPrimaryKey)(astNode);
        if (pk) {
          var nodeInputType =
            '\n            input ' +
            inputName +
            ' { ' +
            pk.name.value +
            ': ' +
            // Always exactly require the pk of a node type
            decideFieldType((0, _utils._getNamedType)(pk).name.value) +
            '! }';
          typeMap[inputName] = (0, _graphql.parse)(nodeInputType);
        }
      }
    } else if ((0, _utils.getTypeDirective)(astNode, 'relation')) {
      // Only used for the .data argument in generated  relation creation mutations
      if (typeMap[inputName] === undefined) {
        var fields = astNode.fields;
        // The .data arg on add relation mutations,
        // which is the only arg in the API that uses
        // relation input types, is only generate if there
        // is at least one non-directed field (property field)
        var hasSomePropertyField = fields.find(function(e) {
          return e.name.value !== 'from' && e.name.value !== 'to';
        });
        var fromField = fields.find(function(e) {
          return e.name.value === 'from';
        });
        var fromName = (0, _utils._getNamedType)(fromField).name.value;
        var toField = fields.find(function(e) {
          return e.name.value === 'to';
        });
        var toName = (0, _utils._getNamedType)(toField).name.value;
        // only generate an input type for the relationship if we know that both
        // the from and to nodes are not excluded, since thus we know that
        // relation mutations are generated for this relation, which would
        // make use of the relation input type
        if (
          hasSomePropertyField &&
          shouldAugmentRelationField(config, 'mutation', fromName, toName)
        ) {
          var relationInputFields = buildRelationTypeInputFields(
            astNode,
            fields,
            typeMap,
            resolvers
          );
          typeMap[inputName] = (0, _graphql.parse)(
            'input ' + inputName + ' {' + relationInputFields + '}'
          );
        }
      }
    }
  }
  return typeMap;
};

var possiblyAddQuery = function possiblyAddQuery(
  astNode,
  typeMap,
  resolvers,
  rootTypes,
  config
) {
  var typeName = astNode.name.value;
  var queryType = rootTypes.query;
  var queryMap = (0, _utils.createOperationMap)(typeMap.Query);
  if (
    (0, _utils.isNodeType)(astNode) &&
    shouldAugmentType(config, 'query', typeName)
  ) {
    var authDirectives = (0, _auth.possiblyAddScopeDirective)({
      entityType: 'node',
      operationType: 'Read',
      typeName: typeName,
      config: config
    });
    var name = astNode.name.value;
    if (queryMap[name] === undefined) {
      typeMap[queryType].fields.push({
        kind: 'FieldDefinition',
        name: {
          kind: 'Name',
          value: name
        },
        arguments: createQueryArguments(astNode, resolvers, typeMap),
        type: {
          kind: 'ListType',
          type: {
            kind: 'NamedType',
            name: {
              kind: 'Name',
              value: name
            }
          }
        },
        directives: [authDirectives]
      });
    }
  }
  return typeMap;
};

var possiblyAddFilterInput = function possiblyAddFilterInput(
  astNode,
  typeMap,
  resolvers,
  config
) {
  var typeName = astNode.name.value;
  var filterType = '_' + typeName + 'Filter';
  var filterFields = [];
  if (shouldAugmentType(config, 'query', typeName)) {
    if ((0, _utils.isNodeType)(astNode)) {
      astNode.fields.forEach(function(t) {
        var fieldName = t.name.value;
        var isList = (0, _utils._isListType)(t);
        var valueTypeName = (0, _utils._getNamedType)(t).name.value;
        var valueType = typeMap[valueTypeName];
        if (
          fieldIsNotIgnored(astNode, t, resolvers) &&
          isNotSystemField(fieldName) &&
          !(0, _utils.getFieldDirective)(t, 'cypher')
        ) {
          var relatedType = typeMap[valueTypeName];
          var relationTypeDirective = (0, _utils.getRelationTypeDirective)(
            relatedType
          );
          var isRelationType = false;
          var isReflexiveRelationType = false;
          var relationFilterName = '_' + typeName + valueTypeName + 'Filter';
          var reflexiveFilterName = '_' + valueTypeName + 'DirectionsFilter';
          if (relationTypeDirective) {
            isRelationType = true;
            var fromType = '';
            var toType = '';
            fromType = relationTypeDirective.from;
            toType = relationTypeDirective.to;
            if (fromType === toType) {
              isReflexiveRelationType = true;
              if (typeMap[reflexiveFilterName] === undefined) {
                relationFilterName = '_' + valueTypeName + 'Filter';
                typeMap[reflexiveFilterName] = (0, _graphql.parse)(
                  '\n                  input ' +
                    reflexiveFilterName +
                    ' {\n                    from: ' +
                    relationFilterName +
                    '\n                    to: ' +
                    relationFilterName +
                    '\n                  }\n                '
                );
                var relationTypeFilters = buildFilterFields({
                  filterType: relationFilterName,
                  astNode: relatedType,
                  typeMap: typeMap,
                  resolvers: resolvers,
                  config: config
                });
                relationTypeFilters.push(
                  '\n                  ' +
                    toType +
                    ': _' +
                    toType +
                    'Filter\n                '
                );
                typeMap[relationFilterName] = (0, _graphql.parse)(
                  'input ' +
                    relationFilterName +
                    ' {' +
                    relationTypeFilters.join('') +
                    '}'
                );
              }
            } else {
              if (typeMap[relationFilterName] === undefined) {
                var _relationTypeFilters = buildFilterFields({
                  filterType: relationFilterName,
                  astNode: relatedType,
                  typeMap: typeMap,
                  resolvers: resolvers,
                  config: config
                });
                var relatedTypeName = toType;
                if (typeName === toType) {
                  relatedTypeName = fromType;
                }
                _relationTypeFilters.push(
                  '\n                  ' +
                    relatedTypeName +
                    ': _' +
                    relatedTypeName +
                    'Filter\n                '
                );
                typeMap[relationFilterName] = (0, _graphql.parse)(
                  'input ' +
                    relationFilterName +
                    ' {' +
                    _relationTypeFilters.join('') +
                    '}'
                );
              }
            }
          }
          if (!isList) {
            if (valueTypeName === 'ID' || valueTypeName == 'String') {
              filterFields.push(
                fieldName +
                  ': ' +
                  valueTypeName +
                  '\n                ' +
                  fieldName +
                  '_not: ' +
                  valueTypeName +
                  '\n                ' +
                  fieldName +
                  '_in: [' +
                  valueTypeName +
                  '!]\n                ' +
                  fieldName +
                  '_not_in: [' +
                  valueTypeName +
                  '!]\n                ' +
                  fieldName +
                  '_contains: ' +
                  valueTypeName +
                  '\n                ' +
                  fieldName +
                  '_not_contains: ' +
                  valueTypeName +
                  '\n                ' +
                  fieldName +
                  '_starts_with: ' +
                  valueTypeName +
                  '\n                ' +
                  fieldName +
                  '_not_starts_with: ' +
                  valueTypeName +
                  '\n                ' +
                  fieldName +
                  '_ends_with: ' +
                  valueTypeName +
                  '\n                ' +
                  fieldName +
                  '_not_ends_with: ' +
                  valueTypeName +
                  '\n              '
              );
            } else if (
              valueTypeName === 'Int' ||
              valueTypeName === 'Float' ||
              (0, _utils.isTemporalType)(valueTypeName)
            ) {
              if ((0, _utils.isTemporalType)(valueTypeName)) {
                valueTypeName = valueTypeName + 'Input';
              }
              filterFields.push(
                '\n                ' +
                  fieldName +
                  ': ' +
                  valueTypeName +
                  '\n                ' +
                  fieldName +
                  '_not: ' +
                  valueTypeName +
                  '\n                ' +
                  fieldName +
                  '_in: [' +
                  valueTypeName +
                  '!]\n                ' +
                  fieldName +
                  '_not_in: [' +
                  valueTypeName +
                  '!]\n                ' +
                  fieldName +
                  '_lt: ' +
                  valueTypeName +
                  '\n                ' +
                  fieldName +
                  '_lte: ' +
                  valueTypeName +
                  '\n                ' +
                  fieldName +
                  '_gt: ' +
                  valueTypeName +
                  '\n                ' +
                  fieldName +
                  '_gte: ' +
                  valueTypeName +
                  '\n              '
              );
            } else if (valueTypeName === 'Boolean') {
              filterFields.push(
                '\n                ' +
                  fieldName +
                  ': ' +
                  valueTypeName +
                  '\n                ' +
                  fieldName +
                  '_not: ' +
                  valueTypeName +
                  '\n              '
              );
            } else if ((0, _utils.isKind)(valueType, 'EnumTypeDefinition')) {
              filterFields.push(
                '\n                ' +
                  fieldName +
                  ': ' +
                  valueTypeName +
                  '\n                ' +
                  fieldName +
                  '_not: ' +
                  valueTypeName +
                  '\n                ' +
                  fieldName +
                  '_in: [' +
                  valueTypeName +
                  '!]\n                ' +
                  fieldName +
                  '_not_in: [' +
                  valueTypeName +
                  '!]\n              '
              );
            } else if (
              (0, _utils.isKind)(valueType, 'ObjectTypeDefinition') &&
              shouldAugmentType(config, 'query', valueTypeName)
            ) {
              var relationFilterType = '';
              if ((0, _utils.getFieldDirective)(t, 'relation')) {
                relationFilterType = '_' + valueTypeName + 'Filter';
              } else if (isReflexiveRelationType) {
                relationFilterType = reflexiveFilterName;
              } else if (isRelationType) {
                relationFilterType = relationFilterName;
              }
              if (relationFilterType) {
                filterFields.push(
                  '\n                  ' +
                    fieldName +
                    ': ' +
                    relationFilterType +
                    '\n                  ' +
                    fieldName +
                    '_not: ' +
                    relationFilterType +
                    '\n                  ' +
                    fieldName +
                    '_in: [' +
                    relationFilterType +
                    '!]\n                  ' +
                    fieldName +
                    '_not_in: [' +
                    relationFilterType +
                    '!]\n                '
                );
              }
            }
          } else if (
            (0, _utils.isKind)(valueType, 'ObjectTypeDefinition') &&
            shouldAugmentType(config, 'query', valueTypeName)
          ) {
            var _relationFilterType = '';
            if ((0, _utils.getFieldDirective)(t, 'relation')) {
              _relationFilterType = '_' + valueTypeName + 'Filter';
            } else if (isReflexiveRelationType) {
              _relationFilterType = reflexiveFilterName;
            } else if (isRelationType) {
              _relationFilterType = relationFilterName;
            }
            if (_relationFilterType) {
              filterFields.push(
                '\n                ' +
                  fieldName +
                  ': ' +
                  _relationFilterType +
                  '\n                ' +
                  fieldName +
                  '_not: ' +
                  _relationFilterType +
                  '\n                ' +
                  fieldName +
                  '_in: [' +
                  _relationFilterType +
                  '!]\n                ' +
                  fieldName +
                  '_not_in: [' +
                  _relationFilterType +
                  '!]\n                ' +
                  fieldName +
                  '_some: ' +
                  _relationFilterType +
                  '\n                ' +
                  fieldName +
                  '_none: ' +
                  _relationFilterType +
                  '\n                ' +
                  fieldName +
                  '_single: ' +
                  _relationFilterType +
                  '\n                ' +
                  fieldName +
                  '_every: ' +
                  _relationFilterType +
                  '\n              '
              );
            }
          }
        }
      });
    }
  }
  if (filterFields.length) {
    filterFields.unshift(
      '\n    AND: [' + filterType + '!]\n    OR: [' + filterType + '!]\n  '
    );
  }
  if (typeMap[filterType] === undefined && filterFields.length) {
    typeMap[filterType] = (0, _graphql.parse)(
      'input ' + filterType + ' {' + filterFields.join('') + '}'
    );
  }
  return typeMap;
};

var buildFilterFields = function buildFilterFields(_ref4) {
  var filterType = _ref4.filterType,
    astNode = _ref4.astNode,
    typeMap = _ref4.typeMap,
    resolvers = _ref4.resolvers,
    config = _ref4.config;

  var filterFields = astNode.fields.reduce(function(filters, t) {
    var fieldName = t.name.value;
    var isList = (0, _utils._isListType)(t);
    var valueType = typeMap[valueTypeName];
    var valueTypeName = (0, _utils._getNamedType)(t).name.value;
    if (
      fieldIsNotIgnored(astNode, t, resolvers) &&
      isNotSystemField(fieldName) &&
      !(0, _utils.getFieldDirective)(t, 'cypher')
    ) {
      if (!isList) {
        if (valueTypeName === 'ID' || valueTypeName == 'String') {
          filters.push(
            fieldName +
              ': ' +
              valueTypeName +
              '\n            ' +
              fieldName +
              '_not: ' +
              valueTypeName +
              '\n            ' +
              fieldName +
              '_in: [' +
              valueTypeName +
              '!]\n            ' +
              fieldName +
              '_not_in: [' +
              valueTypeName +
              '!]\n            ' +
              fieldName +
              '_contains: ' +
              valueTypeName +
              '\n            ' +
              fieldName +
              '_not_contains: ' +
              valueTypeName +
              '\n            ' +
              fieldName +
              '_starts_with: ' +
              valueTypeName +
              '\n            ' +
              fieldName +
              '_not_starts_with: ' +
              valueTypeName +
              '\n            ' +
              fieldName +
              '_ends_with: ' +
              valueTypeName +
              '\n            ' +
              fieldName +
              '_not_ends_with: ' +
              valueTypeName +
              '\n          '
          );
        } else if (
          valueTypeName === 'Int' ||
          valueTypeName === 'Float' ||
          (0, _utils.isTemporalType)(valueTypeName)
        ) {
          if ((0, _utils.isTemporalType)(valueTypeName)) {
            valueTypeName = valueTypeName + 'Input';
          }
          filters.push(
            '\n            ' +
              fieldName +
              ': ' +
              valueTypeName +
              '\n            ' +
              fieldName +
              '_not: ' +
              valueTypeName +
              '\n            ' +
              fieldName +
              '_in: [' +
              valueTypeName +
              '!]\n            ' +
              fieldName +
              '_not_in: [' +
              valueTypeName +
              '!]\n            ' +
              fieldName +
              '_lt: ' +
              valueTypeName +
              '\n            ' +
              fieldName +
              '_lte: ' +
              valueTypeName +
              '\n            ' +
              fieldName +
              '_gt: ' +
              valueTypeName +
              '\n            ' +
              fieldName +
              '_gte: ' +
              valueTypeName +
              '\n          '
          );
        } else if (valueTypeName === 'Boolean') {
          filters.push(
            '\n            ' +
              fieldName +
              ': ' +
              valueTypeName +
              '\n            ' +
              fieldName +
              '_not: ' +
              valueTypeName +
              '\n          '
          );
        } else if ((0, _utils.isKind)(valueType, 'EnumTypeDefinition')) {
          filters.push(
            '\n            ' +
              fieldName +
              ': ' +
              valueTypeName +
              '\n            ' +
              fieldName +
              '_not: ' +
              valueTypeName +
              '\n            ' +
              fieldName +
              '_in: [' +
              valueTypeName +
              '!]\n            ' +
              fieldName +
              '_not_in: [' +
              valueTypeName +
              '!]\n          '
          );
        } else if (
          (0, _utils.isKind)(valueType, 'ObjectTypeDefinition') &&
          shouldAugmentType(config, 'query', valueTypeName)
        ) {
          if ((0, _utils.getFieldDirective)(t, 'relation')) {
            // one-to-one @relation field
            filters.push(
              '\n              ' +
                fieldName +
                ': _' +
                valueTypeName +
                'Filter\n              ' +
                fieldName +
                '_not: _' +
                valueTypeName +
                'Filter\n              ' +
                fieldName +
                '_in: [_' +
                valueTypeName +
                'Filter!]\n              ' +
                fieldName +
                '_not_in: [_' +
                valueTypeName +
                'Filter!]\n            '
            );
          }
        }
      } else if (
        (0, _utils.isKind)(valueType, 'ObjectTypeDefinition') &&
        shouldAugmentType(config, 'query', valueTypeName)
      ) {
        if ((0, _utils.getFieldDirective)(t, 'relation')) {
          filters.push(
            '\n            ' +
              fieldName +
              ': _' +
              valueTypeName +
              'Filter\n            ' +
              fieldName +
              '_not: _' +
              valueTypeName +
              'Filter\n            ' +
              fieldName +
              '_in: [_' +
              valueTypeName +
              'Filter!]\n            ' +
              fieldName +
              '_not_in: [_' +
              valueTypeName +
              'Filter!]\n            ' +
              fieldName +
              '_some: _' +
              valueTypeName +
              'Filter\n            ' +
              fieldName +
              '_none: _' +
              valueTypeName +
              'Filter\n            ' +
              fieldName +
              '_single: _' +
              valueTypeName +
              'Filter\n            ' +
              fieldName +
              '_every: _' +
              valueTypeName +
              'Filter\n        '
          );
        }
      }
    }
    return filters;
  }, []);
  if (filterFields.length) {
    filterFields.unshift(
      '\n      AND: [' +
        filterType +
        '!]\n      OR: [' +
        filterType +
        '!]\n    '
    );
  }
  return filterFields;
};

var possiblyAddOrderingEnum = function possiblyAddOrderingEnum(
  astNode,
  typeMap,
  resolvers,
  config
) {
  var typeName = astNode.name.value;
  if (
    (0, _utils.isNodeType)(astNode) &&
    shouldAugmentType(config, 'query', typeName)
  ) {
    var name = '_' + astNode.name.value + 'Ordering';
    var values = createOrderingFields(astNode, typeMap, resolvers);
    // Add ordering enum if it does not exist already and if
    // there is at least one basic scalar field on this type
    if (typeMap[name] === undefined && values.length > 0) {
      typeMap[name] = {
        kind: 'EnumTypeDefinition',
        name: {
          kind: 'Name',
          value: name
        },
        directives: [],
        values: values
      };
    }
  }
  return typeMap;
};

var possiblyAddTypeMutations = function possiblyAddTypeMutations(
  astNode,
  typeMap,
  resolvers,
  config
) {
  var typeName = astNode.name.value;
  if (shouldAugmentType(config, 'mutation', typeName)) {
    var mutationMap = (0, _utils.createOperationMap)(typeMap.Mutation);
    if (
      (0, _utils.isNodeType)(astNode) &&
      shouldAugmentType(config, 'mutation', typeName)
    ) {
      typeMap = possiblyAddTypeMutation(
        'Create',
        astNode,
        resolvers,
        typeMap,
        mutationMap,
        config
      );
      typeMap = possiblyAddTypeMutation(
        'Update',
        astNode,
        resolvers,
        typeMap,
        mutationMap,
        config
      );
      typeMap = possiblyAddTypeMutation(
        'Delete',
        astNode,
        resolvers,
        typeMap,
        mutationMap,
        config
      );
    }
  }
  return typeMap;
};

var possiblyAddTypeFieldArguments = function possiblyAddTypeFieldArguments(
  astNode,
  typeMap,
  resolvers,
  config,
  queryType
) {
  var fields = astNode.fields;
  fields.forEach(function(field) {
    var fieldTypeName = (0, _utils._getNamedType)(field).name.value;
    var fieldType = typeMap[fieldTypeName];
    var args = field.arguments;
    if (
      fieldType &&
      fieldIsNotIgnored(astNode, field, resolvers) &&
      shouldAugmentType(config, 'query', fieldTypeName)
    ) {
      var relationTypeDirective = (0, _utils.getRelationTypeDirective)(
        fieldType
      );
      if ((0, _utils.isNodeType)(fieldType)) {
        if ((0, _utils.getFieldDirective)(field, 'cypher')) {
          if ((0, _utils._isListType)(field)) {
            args = addPaginationArgs(args, fieldTypeName);
          }
        } else if ((0, _utils.getFieldDirective)(field, 'relation')) {
          if ((0, _utils._isListType)(field)) {
            args = addPaginationArgs(args, fieldTypeName);
          }
          args = possiblyAddArgument(
            args,
            'filter',
            '_' + fieldTypeName + 'Filter'
          );
        }
      } else if (relationTypeDirective) {
        var fromType = relationTypeDirective.from;
        var toType = relationTypeDirective.to;
        var filterTypeName =
          '_' + astNode.name.value + fieldTypeName + 'Filter';
        if (fromType === toType) {
          filterTypeName = '_' + fieldTypeName + 'Filter';
        }
        args = possiblyAddArgument(args, 'filter', filterTypeName);
      }
      field.arguments = args;
    }
  });
  return fields;
};

var addPaginationArgs = function addPaginationArgs(args, fieldTypeName) {
  args = possiblyAddArgument(args, 'first', 'Int');
  args = possiblyAddArgument(args, 'offset', 'Int');
  args = possiblyAddOrderingArgument(args, fieldTypeName);
  return args;
};

var possiblyAddObjectType = function possiblyAddObjectType(typeMap, name) {
  if (typeMap[name] === undefined) {
    typeMap[name] = {
      kind: 'ObjectTypeDefinition',
      name: {
        kind: 'Name',
        value: name
      },
      interfaces: [],
      directives: [],
      fields: []
    };
  }
  return typeMap;
};

var possiblyAddTypeMutation = function possiblyAddTypeMutation(
  mutationType,
  astNode,
  resolvers,
  typeMap,
  mutationMap,
  config
) {
  var typeName = astNode.name.value;
  var mutationName = mutationType + typeName;
  // Only generate if the mutation named mutationName does not already exist
  if (mutationMap[mutationName] === undefined) {
    var args = buildMutationArguments(
      mutationType,
      astNode,
      resolvers,
      typeMap
    );
    if (args.length > 0) {
      var _typeName = astNode.name.value;
      var authDirectives = (0, _auth.possiblyAddScopeDirective)({
        entityType: 'node',
        operationType: mutationType,
        typeName: _typeName,
        config: config
      });
      typeMap['Mutation'].fields.push({
        kind: 'FieldDefinition',
        name: {
          kind: 'Name',
          value: mutationName
        },
        arguments: args,
        type: {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: _typeName
          }
        },
        directives: [authDirectives]
      });
    }
  }
  return typeMap;
};

var possiblyAddRelationTypeFieldPayload = function possiblyAddRelationTypeFieldPayload(
  relationAstNode,
  capitalizedFieldName,
  typeName,
  typeMap,
  field
) {
  var fieldTypeName = '_' + typeName + capitalizedFieldName;
  if (!typeMap[fieldTypeName]) {
    var fieldName = '';
    var fieldValueName = '';
    var fromField = {};
    var toField = {};
    var _fromField = {};
    var _toField = {};
    var fromValue = undefined;
    var toValue = undefined;
    var fields = relationAstNode.fields;
    var relationTypeDirective = (0, _utils.getRelationTypeDirective)(
      relationAstNode
    );
    if (relationTypeDirective) {
      // TODO refactor
      var relationTypePayloadFields = fields
        .reduce(function(acc, t) {
          fieldValueName = (0, _utils._getNamedType)(t).name.value;
          fieldName = t.name.value;
          if (fieldName === 'from') {
            fromValue = fieldValueName;
            fromField = t;
          } else if (fieldName === 'to') {
            toValue = fieldValueName;
            toField = t;
          } else {
            // Exclude .to and .from, but gather them from along the way
            // using previous branches above
            acc.push((0, _graphql.print)(t));
          }
          return acc;
        }, [])
        .join('\n');

      if (fromValue && fromValue === toValue) {
        // If field is a list type, then make .from and .to list types
        var fieldIsList = (0, _utils._isListType)(field);
        var fieldArgs = getFieldArgumentsFromAst(
          field,
          typeName,
          fieldIsList,
          fieldTypeName
        );
        typeMap[fieldTypeName + 'Directions'] = (0, _graphql.parse)(
          '\n        type ' +
            fieldTypeName +
            'Directions ' +
            (0, _graphql.print)(relationAstNode.directives) +
            ' {\n            from' +
            fieldArgs +
            ': ' +
            (fieldIsList ? '[' : '') +
            fieldTypeName +
            (fieldIsList ? ']' : '') +
            '\n            to' +
            fieldArgs +
            ': ' +
            (fieldIsList ? '[' : '') +
            fieldTypeName +
            (fieldIsList ? ']' : '') +
            '\n      }'
        );

        typeMap[fieldTypeName] = (0, _graphql.parse)(
          '\n      type ' +
            fieldTypeName +
            ' ' +
            (0, _graphql.print)(relationAstNode.directives) +
            ' {\n        ' +
            relationTypePayloadFields +
            '\n        ' +
            fromValue +
            ': ' +
            fromValue +
            '\n      }\n      '
        );

        // remove arguments on field
        field.arguments = [];
      } else {
        // Non-reflexive case, (User)-[RATED]->(Movie)
        typeMap[fieldTypeName] = (0, _graphql.parse)(
          '\n      type ' +
            fieldTypeName +
            ' ' +
            (0, _graphql.print)(relationAstNode.directives) +
            ' {\n        ' +
            relationTypePayloadFields +
            '\n        ' +
            (typeName === toValue // If this is the from, the allow selecting the to
              ? fromValue + ': ' + fromValue // else this is the to, so allow selecting the from
              : typeName === fromValue
              ? toValue + ': ' + toValue
              : '') +
            '\n      }\n      '
        );
      }
    }
  }
  return typeMap;
};

var possiblyAddRelationMutationField = function possiblyAddRelationMutationField(
  typeName,
  capitalizedFieldName,
  fromName,
  toName,
  mutationMap,
  typeMap,
  relationName,
  relatedAstNode,
  relationHasProps,
  config
) {
  var mutationTypes = ['Add', 'Remove'];
  var mutationName = '';
  var payloadTypeName = '';
  var hasSomePropertyField = false;
  mutationTypes.forEach(function(action) {
    mutationName = '' + action + typeName + capitalizedFieldName;
    // Prevents overwriting
    if (mutationMap[mutationName] === undefined) {
      payloadTypeName = '_' + mutationName + 'Payload';
      hasSomePropertyField = relatedAstNode.fields.find(function(e) {
        return e.name.value !== 'from' && e.name.value !== 'to';
      });
      // If we know we should expect data properties (from context: relationHasProps)
      // and if there is at least 1 field that is not .to or .from (hasSomePropertyField)
      // and if we are generating the add relation mutation, then add the .data argument
      var shouldUseRelationDataArgument =
        relationHasProps && hasSomePropertyField && action === 'Add';
      var authDirectives = (0, _auth.possiblyAddScopeDirective)({
        entityType: 'relation',
        operationType: action,
        typeName: typeName,
        relatedTypeName: toName,
        config: config
      });
      // Relation mutation type
      typeMap.Mutation.fields.push(
        (0, _utils.parseFieldSdl)(
          '\n          ' +
            mutationName +
            '(from: _' +
            fromName +
            'Input!, to: _' +
            toName +
            'Input!' +
            (shouldUseRelationDataArgument
              ? ', data: _' + relatedAstNode.name.value + 'Input!'
              : '') +
            '): ' +
            payloadTypeName +
            ' @MutationMeta(relationship: "' +
            relationName +
            '", from: "' +
            fromName +
            '", to: "' +
            toName +
            '") ' +
            (authDirectives ? authDirectives : '') +
            '\n      '
        )
      );
      // Prevents overwriting
      if (typeMap[payloadTypeName] === undefined) {
        typeMap[payloadTypeName] = (0, _graphql.parse)(
          '\n        type ' +
            payloadTypeName +
            ' @relation(name: "' +
            relationName +
            '", from: "' +
            fromName +
            '", to: "' +
            toName +
            '") {\n          from: ' +
            fromName +
            '\n          to: ' +
            toName +
            '\n          ' +
            (shouldUseRelationDataArgument
              ? (0, _utils.getRelationMutationPayloadFieldsFromAst)(
                  relatedAstNode
                )
              : '') +
            '\n        }\n        '
        );
      }
    }
  });
  return typeMap;
};

var decideFieldType = function decideFieldType(name) {
  if ((0, _utils.isTemporalType)(name)) {
    name = name + 'Input';
  }
  return name;
};

var validateRelationTypeDirectedFields = function validateRelationTypeDirectedFields(
  typeName,
  fromName,
  toName
) {
  // directive to and from are not the same and neither are equal to this
  if (fromName !== toName && toName !== typeName && fromName !== typeName) {
    throw new Error(
      "The '" +
        field.name.value +
        "' field on the '" +
        typeName +
        "' type uses the '" +
        relatedAstNode.name.value +
        "'\n    but '" +
        relatedAstNode.name.value +
        "' comes from '" +
        fromName +
        "' and goes to '" +
        toName +
        "'"
    );
  }
  return true;
};

var handleRelationFields = function handleRelationFields(
  astNode,
  typeMap,
  resolvers,
  config
) {
  var mutationMap = (0, _utils.createOperationMap)(typeMap.Mutation);
  var typeName = astNode.name.value;
  var fields = astNode.fields;
  var fieldCount = fields ? fields.length : 0;
  var relationFieldDirective = {};
  var fieldValueName = '';
  var relatedAstNode = {};
  var relationTypeDirective = {};
  var capitalizedFieldName = '';
  var field = {};
  var fieldIndex = 0;
  if ((0, _utils.isNodeType)(astNode)) {
    for (; fieldIndex < fieldCount; ++fieldIndex) {
      field = fields[fieldIndex];
      if (fieldIsNotIgnored(astNode, field, resolvers)) {
        fieldValueName = (0, _utils._getNamedType)(field).name.value;
        capitalizedFieldName =
          field.name.value.charAt(0).toUpperCase() + field.name.value.substr(1);
        relatedAstNode = typeMap[fieldValueName];
        if (relatedAstNode) {
          relationTypeDirective = (0, _utils.getTypeDirective)(
            relatedAstNode,
            'relation'
          );
          relationFieldDirective = (0, _utils.getFieldDirective)(
            field,
            'relation'
          );
          // continue if typeName is allowed
          // in either Query or Mutation
          if ((0, _utils.isNodeType)(relatedAstNode)) {
            // the field has a node type
            if (relationFieldDirective) {
              // Relation Mutation API
              // relation directive exists on field
              typeMap = handleRelationFieldDirective({
                relatedAstNode: relatedAstNode,
                typeName: typeName,
                capitalizedFieldName: capitalizedFieldName,
                fieldValueName: fieldValueName,
                relationFieldDirective: relationFieldDirective,
                mutationMap: mutationMap,
                typeMap: typeMap,
                config: config
              });
            }
          } else if (relationTypeDirective) {
            // Query and Relation Mutation API
            // the field value is a non-node type using a relation type directive
            typeMap = handleRelationTypeDirective({
              relatedAstNode: relatedAstNode,
              typeName: typeName,
              fields: fields,
              field: field,
              fieldIndex: fieldIndex,
              capitalizedFieldName: capitalizedFieldName,
              relationTypeDirective: relationTypeDirective,
              config: config,
              typeMap: typeMap,
              mutationMap: mutationMap
            });
          }
        }
      }
    }
  }
  return typeMap;
};

var handleRelationTypeDirective = function handleRelationTypeDirective(_ref5) {
  var relatedAstNode = _ref5.relatedAstNode,
    typeName = _ref5.typeName,
    fields = _ref5.fields,
    field = _ref5.field,
    fieldIndex = _ref5.fieldIndex,
    capitalizedFieldName = _ref5.capitalizedFieldName,
    relationTypeDirective = _ref5.relationTypeDirective,
    config = _ref5.config,
    typeMap = _ref5.typeMap,
    mutationMap = _ref5.mutationMap;

  var typeDirectiveArgs = relationTypeDirective
    ? relationTypeDirective.arguments
    : [];
  var nameArgument = typeDirectiveArgs.find(function(e) {
    return e.name.value === 'name';
  });
  var fromArgument = typeDirectiveArgs.find(function(e) {
    return e.name.value === 'from';
  });
  var toArgument = typeDirectiveArgs.find(function(e) {
    return e.name.value === 'to';
  });
  var relationName = nameArgument.value.value;
  var fromName = fromArgument.value.value;
  var toName = toArgument.value.value;
  // Relation Mutation API, adds relation mutation to Mutation
  if (
    shouldAugmentRelationField(config, 'mutation', fromName, toName) &&
    validateRelationTypeDirectedFields(typeName, fromName, toName)
  ) {
    typeMap = possiblyAddRelationMutationField(
      typeName,
      capitalizedFieldName,
      fromName,
      toName,
      mutationMap,
      typeMap,
      relationName,
      relatedAstNode,
      true,
      config
    );
  }
  // Relation type field payload transformation for selection sets
  typeMap = possiblyAddRelationTypeFieldPayload(
    relatedAstNode,
    capitalizedFieldName,
    typeName,
    typeMap,
    field
  );
  // Replaces the field's value with the generated payload type
  fields[fieldIndex] = replaceRelationTypeValue(
    fromName,
    toName,
    field,
    capitalizedFieldName,
    typeName
  );
  return typeMap;
};

var handleRelationFieldDirective = function handleRelationFieldDirective(
  _ref6
) {
  var relatedAstNode = _ref6.relatedAstNode,
    typeName = _ref6.typeName,
    capitalizedFieldName = _ref6.capitalizedFieldName,
    fieldValueName = _ref6.fieldValueName,
    relationFieldDirective = _ref6.relationFieldDirective,
    mutationMap = _ref6.mutationMap,
    typeMap = _ref6.typeMap,
    config = _ref6.config;

  var fromName = typeName;
  var toName = fieldValueName;
  // Mutation API, relation mutations for field directives
  if (shouldAugmentRelationField(config, 'mutation', fromName, toName)) {
    var relationName = (0, _utils.getRelationName)(relationFieldDirective);
    var direction = (0, _utils.getRelationDirection)(relationFieldDirective);
    // possibly swap directions to fit assertion of fromName = typeName
    if (direction === 'IN' || direction === 'in') {
      var temp = fromName;
      fromName = toName;
      toName = temp;
    }
    // (Mutation API) add relation mutation to Mutation
    typeMap = possiblyAddRelationMutationField(
      typeName,
      capitalizedFieldName,
      fromName,
      toName,
      mutationMap,
      typeMap,
      relationName,
      relatedAstNode,
      false,
      config
    );
  }
  return typeMap;
};

var replaceRelationTypeValue = function replaceRelationTypeValue(
  fromName,
  toName,
  field,
  capitalizedFieldName,
  typeName
) {
  var isList = (0, _utils._isListType)(field);
  var type = {
    kind: 'NamedType',
    name: {
      kind: 'Name',
      value:
        '_' +
        typeName +
        capitalizedFieldName +
        (fromName === toName ? 'Directions' : '')
    }
  };
  if (isList && fromName !== toName) {
    type = {
      kind: 'ListType',
      type: type
    };
  }
  field.type = type;
  return field;
};

var addOrReplaceNodeIdField = function addOrReplaceNodeIdField(
  astNode,
  resolvers
) {
  var fields = astNode ? astNode.fields : [];
  var index = fields.findIndex(function(e) {
    return e.name.value === '_id';
  });
  var definition = {
    kind: 'FieldDefinition',
    name: {
      kind: 'Name',
      value: '_id'
    },
    arguments: [],
    type: {
      kind: 'NamedType',
      name: {
        kind: 'Name',
        value: 'String'
      }
    },
    directives: []
  };
  if (index >= 0) {
    if (fieldIsNotIgnored(astNode, fields[index], resolvers)) {
      fields.splice(index, 1, definition);
    }
  } else {
    fields.push(definition);
  }
  return fields;
};

var addRelationTypeDirectives = function addRelationTypeDirectives(typeMap) {
  var astNode = {};
  var fields = [];
  var name = '';
  var to = {};
  var from = {};
  var fromTypeName = '';
  var toTypeName = '';
  var typeDirective = {};
  var relationName = '';
  var typeDirectiveIndex = -1;
  (0, _keys2.default)(typeMap).forEach(function(typeName) {
    astNode = typeMap[typeName];
    if (astNode.kind === 'ObjectTypeDefinition') {
      name = astNode.name.value;
      fields = astNode.fields;
      to = fields
        ? fields.find(function(e) {
            return e.name.value === 'to';
          })
        : undefined;
      from = fields
        ? fields.find(function(e) {
            return e.name.value === 'from';
          })
        : undefined;
      if (to && !from) {
        throw new Error(
          'Relationship type ' +
            name +
            " has a 'to' field but no corresponding 'from' field"
        );
      }
      if (from && !to) {
        throw new Error(
          'Relationship type ' +
            name +
            " has a 'from' field but no corresponding 'to' field"
        );
      }
      if (from && to) {
        // get values of .to and .from fields
        fromTypeName = (0, _utils._getNamedType)(from).name.value;
        toTypeName = (0, _utils._getNamedType)(to).name.value;
        // assume the default relationship name
        relationName = transformRelationName(astNode);
        // get its relation type directive
        typeDirectiveIndex = astNode.directives.findIndex(function(e) {
          return e.name.value === 'relation';
        });
        if (typeDirectiveIndex >= 0) {
          typeDirective = astNode.directives[typeDirectiveIndex];
          // get the arguments of type directive
          var args = typeDirective ? typeDirective.arguments : [];
          if (args.length > 0) {
            // get its name argument
            var nameArg = args.find(function(e) {
              return e.name.value === 'name';
            });
            if (nameArg) {
              relationName = nameArg.value.value;
            }
          }
          // replace it if it exists in order to force correct configuration
          astNode.directives[typeDirectiveIndex] = (0,
          _utils.parseDirectiveSdl)(
            '\n            @relation(\n              name: "' +
              relationName +
              '", \n              from: "' +
              fromTypeName +
              '",\n              to: "' +
              toTypeName +
              '"\n            )\n          '
          );
        } else {
          astNode.directives.push(
            (0, _utils.parseDirectiveSdl)(
              '\n            @relation(\n              name: "' +
                relationName +
                '", \n              from: "' +
                fromTypeName +
                '",\n              to: "' +
                toTypeName +
                '"\n            )\n          '
            )
          );
        }
        typeMap[typeName] = astNode;
      }
    }
  });
  return typeMap;
};

var createOrderingFields = function createOrderingFields(
  astNode,
  typeMap,
  resolvers
) {
  var fields = astNode ? astNode.fields : [];
  var type = {};
  var valueType = {};
  var valueTypeName = '';
  var fieldName = '';
  return fields.reduce(function(acc, field) {
    type = (0, _utils._getNamedType)(field);
    valueTypeName = type.name.value;
    valueType = typeMap[valueTypeName];
    if (
      !(0, _utils._isListType)(field) &&
      fieldIsNotIgnored(astNode, field, resolvers) &&
      ((0, _utils.isBasicScalar)(type.name.value) ||
        (0, _utils.isKind)(valueType, 'EnumTypeDefinition') ||
        (0, _utils.isTemporalType)(valueTypeName))
    ) {
      fieldName = field.name.value;
      acc.push({
        kind: 'EnumValueDefinition',
        name: {
          kind: 'Name',
          value: fieldName + '_asc'
        }
      });
      acc.push({
        kind: 'EnumValueDefinition',
        name: {
          kind: 'Name',
          value: fieldName + '_desc'
        }
      });
    }
    return acc;
  }, []);
};

var createQueryArguments = function createQueryArguments(
  astNode,
  resolvers,
  typeMap
) {
  var type = {};
  var valueTypeName = '';
  var valueKind = '';
  var queryArg = {};
  return astNode.fields.reduce(function(acc, t) {
    if (fieldIsNotIgnored(astNode, t, resolvers)) {
      type = (0, _utils._getNamedType)(t);
      valueTypeName = type.name.value;
      valueKind = typeMap[valueTypeName]
        ? typeMap[valueTypeName].kind
        : undefined;
      queryArg = {
        kind: 'InputValueDefinition',
        name: {
          kind: 'Name',
          value: t.name.value
        },
        type: type
      };
      if (
        (0, _utils.isBasicScalar)(valueTypeName) ||
        valueKind === 'EnumTypeDefinition' ||
        valueKind === 'ScalarTypeDefinition'
      ) {
        acc.push(queryArg);
      } else if ((0, _utils.isTemporalType)(valueTypeName)) {
        queryArg.type = {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: valueTypeName + 'Input'
          }
        };
        acc.push(queryArg);
      }
    }
    return acc;
  }, []);
};

var hasNonExcludedNodeType = function hasNonExcludedNodeType(
  types,
  typeMap,
  rootType,
  config
) {
  var type = '';
  return types.find(function(e) {
    type = typeMap[e];
    return (
      (0, _utils.isNodeType)(type) &&
      type.name &&
      shouldAugmentType(config, rootType, type.name.value)
    );
  });
};

var initializeOperationTypes = function initializeOperationTypes(
  typeMap,
  rootTypes,
  config
) {
  var queryType = rootTypes.query;
  var mutationType = rootTypes.mutation;
  var types = (0, _keys2.default)(typeMap);
  if (hasNonExcludedNodeType(types, typeMap, 'query', config)) {
    typeMap = possiblyAddObjectType(typeMap, queryType);
  }
  if (hasNonExcludedNodeType(types, typeMap, 'mutation', config)) {
    typeMap = possiblyAddObjectType(typeMap, mutationType);
  }
  return typeMap;
};

var transformRelationName = function transformRelationName(relatedAstNode) {
  var name = relatedAstNode.name.value;
  var char = '';
  var uppercased = '';
  return (0, _keys2.default)(name)
    .reduce(function(acc, t) {
      char = name.charAt(t);
      uppercased = char.toUpperCase();
      if (char === uppercased && t > 0) {
        // already uppercased
        acc.push('_' + uppercased);
      } else {
        acc.push(uppercased);
      }
      return acc;
    }, [])
    .join('');
};

var temporalTypes = function temporalTypes(typeMap, types) {
  if (types.time === true) {
    typeMap['_Neo4jTime'] = (0, _graphql.parse)(
      '\n      type _Neo4jTime {\n        hour: Int\n        minute: Int\n        second: Int\n        millisecond: Int\n        microsecond: Int\n        nanosecond: Int\n        timezone: String\n        formatted: String\n      }\n    '
    ).definitions[0];
    typeMap['_Neo4jTimeInput'] = (0, _graphql.parse)(
      '\n      input _Neo4jTimeInput {\n        hour: Int\n        minute: Int\n        second: Int\n        nanosecond: Int\n        millisecond: Int\n        microsecond: Int\n        timezone: String\n        formatted: String\n      }\n    '
    ).definitions[0];
  }
  if (types.date === true) {
    typeMap['_Neo4jDate'] = (0, _graphql.parse)(
      '\n      type _Neo4jDate {\n        year: Int\n        month: Int\n        day: Int\n        formatted: String\n      }\n    '
    ).definitions[0];
    typeMap['_Neo4jDateInput'] = (0, _graphql.parse)(
      '\n      input _Neo4jDateInput {\n        year: Int\n        month: Int\n        day: Int\n        formatted: String\n      }\n    '
    ).definitions[0];
  }
  if (types.datetime === true) {
    typeMap['_Neo4jDateTime'] = (0, _graphql.parse)(
      '\n      type _Neo4jDateTime {\n        year: Int\n        month: Int\n        day: Int\n        hour: Int\n        minute: Int\n        second: Int\n        millisecond: Int\n        microsecond: Int\n        nanosecond: Int\n        timezone: String\n        formatted: String\n      }\n    '
    ).definitions[0];
    typeMap['_Neo4jDateTimeInput'] = (0, _graphql.parse)(
      '\n      input _Neo4jDateTimeInput {\n        year: Int\n        month: Int\n        day: Int\n        hour: Int\n        minute: Int\n        second: Int\n        millisecond: Int\n        microsecond: Int\n        nanosecond: Int\n        timezone: String \n        formatted: String\n      }\n    '
    ).definitions[0];
  }
  if (types.localtime === true) {
    typeMap['_Neo4jLocalTime'] = (0, _graphql.parse)(
      '\n      type _Neo4jLocalTime {\n        hour: Int\n        minute: Int\n        second: Int\n        millisecond: Int\n        microsecond: Int\n        nanosecond: Int\n        formatted: String\n      }\n    '
    ).definitions[0];
    typeMap['_Neo4jLocalTimeInput'] = (0, _graphql.parse)(
      '\n      input _Neo4jLocalTimeInput {\n        hour: Int\n        minute: Int\n        second: Int\n        millisecond: Int\n        microsecond: Int\n        nanosecond: Int\n        formatted: String\n      }\n    '
    ).definitions[0];
  }
  if (types.localdatetime === true) {
    typeMap['_Neo4jLocalDateTime'] = (0, _graphql.parse)(
      '\n      type _Neo4jLocalDateTime {\n        year: Int\n        month: Int\n        day: Int\n        hour: Int\n        minute: Int\n        second: Int\n        millisecond: Int\n        microsecond: Int\n        nanosecond: Int\n        formatted: String\n      }\n    '
    ).definitions[0];
    typeMap['_Neo4jLocalDateTimeInput'] = (0, _graphql.parse)(
      '\n      input _Neo4jLocalDateTimeInput {\n        year: Int\n        month: Int\n        day: Int\n        hour: Int\n        minute: Int\n        second: Int\n        millisecond: Int\n        microsecond: Int\n        nanosecond: Int\n        formatted: String\n      }\n    '
    ).definitions[0];
  }
  return typeMap;
};

var transformTemporalFieldArgs = function transformTemporalFieldArgs(
  field,
  config
) {
  field.arguments.forEach(function(arg) {
    arg.type = transformTemporalTypeName(arg.type, config, true);
  });
  return field;
};

var transformTemporalFields = function transformTemporalFields(
  typeMap,
  config
) {
  (0, _keys2.default)(typeMap).forEach(function(t) {
    if (typeMap[t].kind === 'ObjectTypeDefinition') {
      if (!(0, _utils.isTemporalType)(t)) {
        typeMap[t].fields.forEach(function(field) {
          // released: DateTime -> released: _Neo4jDateTime
          field.type = transformTemporalTypeName(field.type, config);
          field = transformTemporalFieldArgs(field, config);
        });
      }
    }
  });
  return typeMap;
};

var transformTemporalTypeName = function transformTemporalTypeName(
  type,
  config,
  isArgument
) {
  if (type.kind !== 'NamedType') {
    type.type = transformTemporalTypeName(type.type, config);
    return type;
  }
  if (type.kind === 'NamedType') {
    switch (type.name.value) {
      case 'Time': {
        if (config.time === true) {
          type.name.value = '_Neo4jTime' + (isArgument ? 'Input' : '');
        }
        break;
      }
      case 'Date': {
        if (config.date === true) {
          type.name.value = '_Neo4jDate' + (isArgument ? 'Input' : '');
        }
        break;
      }
      case 'DateTime': {
        if (config.datetime === true) {
          type.name.value = '_Neo4jDateTime' + (isArgument ? 'Input' : '');
        }
        break;
      }
      case 'LocalTime': {
        if (config.localtime === true) {
          type.name.value = '_Neo4jLocalTime' + (isArgument ? 'Input' : '');
        }
        break;
      }
      case 'LocalDateTime': {
        if (config.localdatetime === true) {
          type.name.value = '_Neo4jLocalDateTime' + (isArgument ? 'Input' : '');
        }
        break;
      }
      default:
        break;
    }
  }
  return type;
};

var decideTemporalConfig = function decideTemporalConfig(config) {
  var defaultConfig = {
    time: true,
    date: true,
    datetime: true,
    localtime: true,
    localdatetime: true
  };
  var providedConfig = config ? config.temporal : defaultConfig;
  if (typeof providedConfig === 'boolean') {
    if (providedConfig === false) {
      defaultConfig.time = false;
      defaultConfig.date = false;
      defaultConfig.datetime = false;
      defaultConfig.localtime = false;
      defaultConfig.localdatetime = false;
    }
  } else if (
    (typeof providedConfig === 'undefined'
      ? 'undefined'
      : (0, _typeof3.default)(providedConfig)) === 'object'
  ) {
    (0, _keys2.default)(defaultConfig).forEach(function(e) {
      if (providedConfig[e] === undefined) {
        providedConfig[e] = defaultConfig[e];
      }
    });
    defaultConfig = providedConfig;
  }
  return defaultConfig;
};

var shouldAugmentType = function shouldAugmentType(config, rootType, type) {
  return typeof config[rootType] === 'boolean'
    ? config[rootType] // here .exclude should be an object,
    : // set at the end of excludeIgnoredTypes
    type
    ? !(0, _utils.getExcludedTypes)(config, rootType)[type]
    : false;
};

var shouldAugmentRelationField = function shouldAugmentRelationField(
  config,
  rootType,
  fromName,
  toName
) {
  return (
    shouldAugmentType(config, rootType, fromName) &&
    shouldAugmentType(config, rootType, toName)
  );
};

var fieldIsNotIgnored = function fieldIsNotIgnored(astNode, field, resolvers) {
  return !(0, _utils.getFieldDirective)(field, 'neo4j_ignore');
  // FIXME: issue related to inferences on AST field .resolve
  // See: possiblyAddIgnoreDirective
  // !getCustomFieldResolver(astNode, field, resolvers)
};

var isNotSystemField = function isNotSystemField(name) {
  return name !== '_id' && name !== 'to' && name !== 'from';
};

var addTemporalTypes = (exports.addTemporalTypes = function addTemporalTypes(
  typeMap,
  config
) {
  config = decideTemporalConfig(config);
  typeMap = temporalTypes(typeMap, config);
  return transformTemporalFields(typeMap, config);
});

var getFieldArgumentsFromAst = function getFieldArgumentsFromAst(
  field,
  typeName,
  fieldIsList,
  fieldTypeName
) {
  var args = field.arguments ? field.arguments : [];
  if (fieldIsList) {
    // TODO https://github.com/neo4j-graphql/neo4j-graphql-js/issues/232
    // args = possiblyAddArgument(args, 'first', 'Int');
    // args = possiblyAddArgument(args, 'offset', 'Int');
    // args = possiblyAddArgument(
    //   args,
    //   'orderBy',
    //   `${fieldTypeName}Ordering`
    // );
  }
  args = possiblyAddArgument(args, 'filter', fieldTypeName + 'Filter');
  args = args
    .reduce(function(acc, t) {
      acc.push((0, _graphql.print)(t));
      return acc;
    }, [])
    .join('\n');
  return args.length > 0 ? '(' + args + ')' : '';
};

var buildMutationArguments = function buildMutationArguments(
  mutationType,
  astNode,
  resolvers,
  typeMap
) {
  var primaryKey = (0, _utils.getPrimaryKey)(astNode);
  switch (mutationType) {
    case 'Create': {
      return buildCreateMutationArguments(astNode, typeMap, resolvers);
    }
    case 'Update': {
      if (primaryKey) {
        return buildUpdateMutationArguments(
          primaryKey,
          astNode,
          typeMap,
          resolvers
        );
      }
    }
    case 'Delete': {
      if (primaryKey) {
        return buildDeleteMutationArguments(primaryKey);
      }
    }
  }
};

var buildUpdateMutationArguments = function buildUpdateMutationArguments(
  primaryKey,
  astNode,
  typeMap,
  resolvers
) {
  var primaryKeyName = primaryKey.name.value;
  var primaryKeyType = (0, _utils._getNamedType)(primaryKey);
  // Primary key field is first arg and required for node selection
  var parsedPrimaryKeyField =
    primaryKeyName + ': ' + primaryKeyType.name.value + '!';
  var type = {};
  var valueTypeName = '';
  var valueType = {};
  var fieldName = '';
  var mutationArgs = [];
  mutationArgs = astNode.fields.reduce(function(acc, t) {
    type = (0, _utils._getNamedType)(t);
    fieldName = t.name.value;
    valueTypeName = type.name.value;
    valueType = typeMap[valueTypeName];
    if (fieldIsNotIgnored(astNode, t, resolvers)) {
      if (
        fieldName !== primaryKeyName &&
        isNotSystemField(fieldName) &&
        !(0, _utils.getFieldDirective)(t, 'cypher') &&
        ((0, _utils.isBasicScalar)(valueTypeName) ||
          (0, _utils.isKind)(valueType, 'EnumTypeDefinition') ||
          (0, _utils.isKind)(valueType, 'ScalarTypeDefinition') ||
          (0, _utils.isTemporalType)(valueTypeName))
      ) {
        acc.push(
          (0, _graphql.print)({
            kind: 'InputValueDefinition',
            name: t.name,
            // Don't require update fields, that wouldn't be very flexible
            type: (0, _utils.isNonNullType)(t) ? t.type.type : t.type
          })
        );
      }
    }
    return acc;
  }, []);
  // Add pk as first arg is other update fields exist
  if (mutationArgs.length > 0) {
    mutationArgs.unshift(parsedPrimaryKeyField);
    mutationArgs = transformManagedFieldTypes(mutationArgs);
    mutationArgs = (0, _utils.buildInputValueDefinitions)(mutationArgs);
  }
  return mutationArgs;
};

var buildDeleteMutationArguments = function buildDeleteMutationArguments(
  primaryKey
) {
  var mutationArgs = [];
  mutationArgs.push(
    (0, _graphql.print)({
      kind: 'InputValueDefinition',
      name: {
        kind: 'Name',
        value: primaryKey.name.value
      },
      type: {
        kind: 'NonNullType',
        type: {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: (0, _utils._getNamedType)(primaryKey).name.value
          }
        }
      }
    })
  );
  mutationArgs = transformManagedFieldTypes(mutationArgs);
  return (0, _utils.buildInputValueDefinitions)(mutationArgs);
};

var buildCreateMutationArguments = function buildCreateMutationArguments(
  astNode,
  typeMap,
  resolvers
) {
  var type = {};
  var valueTypeName = '';
  var valueType = {};
  var fieldName = '';
  var firstIdField = undefined;
  var field = {};
  var mutationArgs = astNode.fields.reduce(function(acc, t) {
    type = (0, _utils._getNamedType)(t);
    fieldName = t.name.value;
    valueTypeName = type.name.value;
    valueType = typeMap[valueTypeName];
    if (fieldIsNotIgnored(astNode, t, resolvers)) {
      if (
        isNotSystemField(fieldName) &&
        !(0, _utils.getFieldDirective)(t, 'cypher') &&
        ((0, _utils.isBasicScalar)(valueTypeName) ||
          (0, _utils.isKind)(valueType, 'EnumTypeDefinition') ||
          (0, _utils.isKind)(valueType, 'ScalarTypeDefinition') ||
          (0, _utils.isTemporalType)(valueTypeName))
      ) {
        if (
          (0, _utils.isNonNullType)(t) &&
          !(0, _utils._isListType)(t) &&
          valueTypeName === 'ID' &&
          !firstIdField
        ) {
          firstIdField = t;
          field = {
            kind: 'InputValueDefinition',
            name: {
              kind: 'Name',
              value: fieldName
            },
            type: {
              kind: 'NamedType',
              name: {
                kind: 'Name',
                value: valueTypeName
              }
            }
          };
        } else {
          field = t;
        }
        acc.push((0, _graphql.print)(field));
      }
    }
    return acc;
  }, []);
  // Transform managed field types: _Neo4jTime -> _Neo4jTimeInput
  mutationArgs = transformManagedFieldTypes(mutationArgs);
  // Use a helper to get the AST for all fields
  mutationArgs = (0, _utils.buildInputValueDefinitions)(mutationArgs);
  return mutationArgs;
};

var buildRelationTypeInputFields = function buildRelationTypeInputFields(
  astNode,
  fields,
  typeMap,
  resolvers
) {
  var fieldName = '';
  var valueTypeName = '';
  var valueType = {};
  var relationInputFields = fields.reduce(function(acc, t) {
    fieldName = t.name.value;
    valueTypeName = (0, _utils._getNamedType)(t).name.value;
    valueType = typeMap[valueTypeName];
    if (
      fieldIsNotIgnored(astNode, t, resolvers) &&
      isNotSystemField(fieldName) &&
      !(0, _utils.getFieldDirective)(t, 'cypher') &&
      ((0, _utils.isBasicScalar)(valueTypeName) ||
        (0, _utils.isKind)(valueType, 'EnumTypeDefinition') ||
        (0, _utils.isKind)(valueType, 'ScalarTypeDefinition') ||
        (0, _utils.isTemporalType)(valueTypeName))
    ) {
      acc.push(
        (0, _graphql.print)({
          kind: 'InputValueDefinition',
          name: t.name,
          type: t.type
        })
      );
    }
    return acc;
  }, []);
  relationInputFields = transformManagedFieldTypes(relationInputFields);
  return relationInputFields.join('\n');
};

var transformManagedFieldTypes = function transformManagedFieldTypes(fields) {
  return fields.reduce(function(acc, field) {
    if (
      field !== '_Neo4jDateTimeInput' &&
      field !== '_Neo4jDateInput' &&
      field !== '_Neo4jTimeInput' &&
      field !== '_Neo4jLocalTimeInput' &&
      field !== '_Neo4jLocalDateTimeInput'
    ) {
      if (field.includes('_Neo4jDateTime')) {
        field = field.replace('_Neo4jDateTime', '_Neo4jDateTimeInput');
      } else if (field.includes('_Neo4jDate')) {
        field = field.replace('_Neo4jDate', '_Neo4jDateInput');
      } else if (field.includes('_Neo4jTime')) {
        field = field.replace('_Neo4jTime', '_Neo4jTimeInput');
      } else if (field.includes('_Neo4jLocalTime')) {
        field = field.replace('_Neo4jLocalTime', '_Neo4jLocalTimeInput');
      } else if (field.includes('_Neo4jLocalDateTime')) {
        field = field.replace(
          '_Neo4jLocalDateTime',
          '_Neo4jLocalDateTimeInput'
        );
      }
    }
    acc.push(field);
    return acc;
  }, []);
};
