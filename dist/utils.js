'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.removeIgnoredFields = exports.getCustomFieldResolver = exports.possiblyAddIgnoreDirective = exports.getExcludedTypes = exports.excludeIgnoredTypes = exports.temporalPredicateClauses = exports.isTemporalInputType = exports.getTemporalArguments = exports.decideTemporalConstructor = exports.getTemporalCypherConstructor = exports.isTemporalType = exports.isTemporalField = exports.splitSelectionParameters = exports.filterNullParams = exports.getPayloadSelections = exports.getOuterSkipLimit = exports.initializeMutationParams = exports.decideNestedVariableName = exports.safeLabel = exports.safeVar = exports.createOperationMap = exports.getPrimaryKey = exports._getNamedType = exports.getRelationMutationPayloadFieldsFromAst = exports.getRelationTypeDirective = exports.getMutationCypherDirective = exports.getQueryCypherDirective = exports.addDirectiveDeclarations = exports.getRelationName = exports.getRelationDirection = exports.getFieldDirective = exports.getTypeDirective = exports.relationDirective = exports.cypherDirective = exports.buildCypherParameters = exports.getMutationArguments = exports.getQueryArguments = exports.possiblySetFirstId = exports.computeOrderBy = exports.isRootSelection = exports.isRelationTypePayload = exports.isNodeType = exports.isBasicScalar = exports.isNonNullType = exports._isListType = exports.isKind = exports.isRelationTypeDirectedField = exports.isRemoveMutation = exports.isDeleteMutation = exports.isUpdateMutation = exports.isAddMutation = exports.isCreateMutation = exports.extractTypeMapFromTypeDefs = exports.printTypeMap = exports.parseDirectiveSdl = exports.buildInputValueDefinitions = exports.parseInputFieldSdl = exports.parseFieldSdl = undefined;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _entries = require('babel-runtime/core-js/object/entries');

var _entries2 = _interopRequireDefault(_entries);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _values = require('babel-runtime/core-js/object/values');

var _values2 = _interopRequireDefault(_values);

exports.parseArgs = parseArgs;
exports.extractSelections = extractSelections;
exports.extractQueryResult = extractQueryResult;
exports.typeIdentifiers = typeIdentifiers;
exports.cypherDirectiveArgs = cypherDirectiveArgs;
exports._isNamedMutation = _isNamedMutation;
exports.isMutation = isMutation;
exports.isGraphqlScalarType = isGraphqlScalarType;
exports.isArrayType = isArrayType;
exports.lowFirstLetter = lowFirstLetter;
exports.innerType = innerType;
exports.filtersFromSelections = filtersFromSelections;
exports.getFilterParams = getFilterParams;
exports.innerFilterParams = innerFilterParams;
exports.paramsToString = paramsToString;
exports.computeSkipLimit = computeSkipLimit;

var _graphql = require('graphql');

var _auth = require('./auth');

var _neo4jDriver = require('neo4j-driver');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _filter = require('lodash/filter');

var _filter2 = _interopRequireDefault(_filter);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function parseArg(arg, variableValues) {
  switch (arg.value.kind) {
    case 'IntValue': {
      return parseInt(arg.value.value);
    }
    case 'FloatValue': {
      return parseFloat(arg.value.value);
    }
    case 'Variable': {
      return variableValues[arg.value.name.value];
    }
    case 'ObjectValue': {
      return parseArgs(arg.value.fields, variableValues);
    }
    case 'ListValue': {
      return _lodash2.default.map(arg.value.values, function(value) {
        return parseArg({ value: value }, variableValues);
      });
    }
    case 'NullValue': {
      return null;
    }
    default: {
      return arg.value.value;
    }
  }
}

function parseArgs(args, variableValues) {
  if (!args || args.length === 0) {
    return {};
  }
  return args.reduce(function(acc, arg) {
    acc[arg.name.value] = parseArg(arg, variableValues);
    return acc;
  }, {});
}

var parseFieldSdl = (exports.parseFieldSdl = function parseFieldSdl(sdl) {
  return sdl
    ? (0, _graphql.parse)('type Type { ' + sdl + ' }').definitions[0].fields[0]
    : {};
});

var parseInputFieldSdl = (exports.parseInputFieldSdl = function parseInputFieldSdl(
  sdl
) {
  return sdl
    ? (0, _graphql.parse)('input Type { ' + sdl + ' }').definitions[0].fields
    : {};
});

var buildInputValueDefinitions = (exports.buildInputValueDefinitions = function buildInputValueDefinitions(
  fields
) {
  var arr = [];
  if (Array.isArray(fields)) {
    fields = fields.join('\n');
    arr = fields
      ? (0, _graphql.parse)('type Type { ' + fields + ' }').definitions[0]
          .fields
      : [];
    arr = arr.map(function(e) {
      return {
        kind: 'InputValueDefinition',
        name: e.name,
        type: e.type
      };
    });
  }
  return arr;
});

var parseDirectiveSdl = (exports.parseDirectiveSdl = function parseDirectiveSdl(
  sdl
) {
  return sdl
    ? (0, _graphql.parse)('type Type { field: String ' + sdl + ' }')
        .definitions[0].fields[0].directives[0]
    : {};
});

var printTypeMap = (exports.printTypeMap = function printTypeMap(typeMap) {
  return (0, _graphql.print)({
    kind: 'Document',
    definitions: (0, _values2.default)(typeMap)
  });
});

var extractTypeMapFromTypeDefs = (exports.extractTypeMapFromTypeDefs = function extractTypeMapFromTypeDefs(
  typeDefs
) {
  // TODO accept alternative typeDefs formats (arr of strings, ast, etc.)
  // into a single string for parse, add validatation
  var astNodes = (0, _graphql.parse)(typeDefs).definitions;
  return astNodes.reduce(function(acc, t) {
    if (t.name) acc[t.name.value] = t;
    return acc;
  }, {});
});

function extractSelections(selections, fragments) {
  // extract any fragment selection sets into a single array of selections
  return selections.reduce(function(acc, cur) {
    if (cur.kind === 'FragmentSpread') {
      var recursivelyExtractedSelections = extractSelections(
        fragments[cur.name.value].selectionSet.selections,
        fragments
      );
      return [].concat(
        (0, _toConsumableArray3.default)(acc),
        (0, _toConsumableArray3.default)(recursivelyExtractedSelections)
      );
    } else {
      return [].concat((0, _toConsumableArray3.default)(acc), [cur]);
    }
  }, []);
}

function extractQueryResult(_ref, returnType) {
  var records = _ref.records;

  var _typeIdentifiers = typeIdentifiers(returnType),
    variableName = _typeIdentifiers.variableName;

  var result = null;
  if (isArrayType(returnType)) {
    result = records.map(function(record) {
      return record.get(variableName);
    });
  } else if (records.length) {
    // could be object or scalar
    result = records[0].get(variableName);
    result = Array.isArray(result) ? result[0] : result;
  }
  // handle Integer fields
  result = _lodash2.default.cloneDeepWith(result, function(field) {
    if (_neo4jDriver.v1.isInt(field)) {
      // See: https://neo4j.com/docs/api/javascript-driver/current/class/src/v1/integer.js~Integer.html
      return field.inSafeRange() ? field.toNumber() : field.toString();
    }
  });
  return result;
}

function typeIdentifiers(returnType) {
  var typeName = innerType(returnType).toString();
  return {
    variableName: lowFirstLetter(typeName),
    typeName: typeName
  };
}

function getDefaultArguments(fieldName, schemaType) {
  // get default arguments for this field from schema
  try {
    return schemaType._fields[fieldName].args.reduce(function(acc, arg) {
      acc[arg.name] = arg.defaultValue;
      return acc;
    }, {});
  } catch (err) {
    return {};
  }
}

function cypherDirectiveArgs(
  variable,
  headSelection,
  cypherParams,
  schemaType,
  resolveInfo,
  paramIndex
) {
  // Get any default arguments or an empty object
  var defaultArgs = getDefaultArguments(headSelection.name.value, schemaType);
  // Set the $this parameter by default
  var args = ['this: ' + variable];
  // If cypherParams are provided, add the parameter
  if (cypherParams) args.push('cypherParams: $cypherParams');
  // Parse field argument values
  var queryArgs = parseArgs(
    headSelection.arguments,
    resolveInfo.variableValues
  );
  // Add arguments that have default values, if no value is provided
  (0, _keys2.default)(defaultArgs).forEach(function(e) {
    // Use only if default value exists and no value has been provided
    if (defaultArgs[e] !== undefined && queryArgs[e] === undefined) {
      // Values are inlined
      var inlineDefaultValue = (0, _stringify2.default)(defaultArgs[e]);
      args.push(e + ': ' + inlineDefaultValue);
    }
  });
  // Add arguments that have provided values
  (0, _keys2.default)(queryArgs).forEach(function(e) {
    if (queryArgs[e] !== undefined) {
      // Use only if value exists
      args.push(e + ': $' + paramIndex + '_' + e);
    }
  });
  // Return the comma separated join of all param
  // strings, adding a comma to match current test formats
  return args.join(', ');
}

function _isNamedMutation(name) {
  return function(resolveInfo) {
    return (
      isMutation(resolveInfo) &&
      resolveInfo.fieldName.split(/(?=[A-Z])/)[0].toLowerCase() ===
        name.toLowerCase()
    );
  };
}

var isCreateMutation = (exports.isCreateMutation = _isNamedMutation('create'));

var isAddMutation = (exports.isAddMutation = _isNamedMutation('add'));

var isUpdateMutation = (exports.isUpdateMutation = _isNamedMutation('update'));

var isDeleteMutation = (exports.isDeleteMutation = _isNamedMutation('delete'));

var isRemoveMutation = (exports.isRemoveMutation = _isNamedMutation('remove'));

function isMutation(resolveInfo) {
  return resolveInfo.operation.operation === 'mutation';
}

function isGraphqlScalarType(type) {
  return (
    type.constructor.name === 'GraphQLScalarType' ||
    type.constructor.name === 'GraphQLEnumType'
  );
}

function isArrayType(type) {
  return type ? type.toString().startsWith('[') : false;
}

var isRelationTypeDirectedField = (exports.isRelationTypeDirectedField = function isRelationTypeDirectedField(
  fieldName
) {
  return fieldName === 'from' || fieldName === 'to';
});

var isKind = (exports.isKind = function isKind(type, kind) {
  return type && type.kind && type.kind === kind;
});

var _isListType = (exports._isListType = function _isListType(type) {
  var isList =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (!isKind(type, 'NamedType')) {
    if (isKind(type, 'ListType')) isList = true;
    return _isListType(type.type, isList);
  }
  return isList;
});

var isNonNullType = (exports.isNonNullType = function isNonNullType(type) {
  var isRequired =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var parent =
    arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (!isKind(type, 'NamedType')) {
    return isNonNullType(type.type, isRequired, type);
  }
  if (isKind(parent, 'NonNullType')) {
    isRequired = true;
  }
  return isRequired;
});

var isBasicScalar = (exports.isBasicScalar = function isBasicScalar(name) {
  return (
    name === 'ID' ||
    name === 'String' ||
    name === 'Float' ||
    name === 'Int' ||
    name === 'Boolean'
  );
});

var isNodeType = (exports.isNodeType = function isNodeType(astNode) {
  return (
    astNode &&
    // must be graphql object type
    astNode.kind === 'ObjectTypeDefinition' &&
    // is not Query or Mutation type
    astNode.name.value !== 'Query' &&
    astNode.name.value !== 'Mutation' &&
    // does not have relation type directive
    getTypeDirective(astNode, 'relation') === undefined &&
    // does not have from and to fields; not relation type
    astNode.fields &&
    astNode.fields.find(function(e) {
      return e.name.value === 'from';
    }) === undefined &&
    astNode.fields.find(function(e) {
      return e.name.value === 'to';
    }) === undefined
  );
});

var isRelationTypePayload = (exports.isRelationTypePayload = function isRelationTypePayload(
  schemaType
) {
  var astNode = schemaType ? schemaType.astNode : undefined;
  var directive = astNode ? getRelationTypeDirective(astNode) : undefined;
  return astNode && astNode.fields && directive
    ? astNode.fields.find(function(e) {
        return e.name.value === directive.from || e.name.value === directive.to;
      })
    : undefined;
});

var isRootSelection = (exports.isRootSelection = function isRootSelection(
  _ref2
) {
  var selectionInfo = _ref2.selectionInfo,
    rootType = _ref2.rootType;
  return selectionInfo && selectionInfo.rootType === rootType;
});

function lowFirstLetter(word) {
  return word.charAt(0).toLowerCase() + word.slice(1);
}

function innerType(type) {
  return type.ofType ? innerType(type.ofType) : type;
}

function filtersFromSelections(selections, variableValues) {
  if (
    selections &&
    selections.length &&
    selections[0].arguments &&
    selections[0].arguments.length
  ) {
    return selections[0].arguments.reduce(function(result, x) {
      (result[x.name.value] = argumentValue(
        selections[0],
        x.name.value,
        variableValues
      )) || x.value.value;
      return result;
    }, {});
  }
  return {};
}

function getFilterParams(filters, index) {
  return (0, _entries2.default)(filters).reduce(function(result, _ref3) {
    var _ref4 = (0, _slicedToArray3.default)(_ref3, 2),
      key = _ref4[0],
      value = _ref4[1];

    result[key] = index
      ? {
          value: value,
          index: index
        }
      : value;
    return result;
  }, {});
}

function innerFilterParams(filters, temporalArgs, paramKey, cypherDirective) {
  var temporalArgNames = temporalArgs
    ? temporalArgs.reduce(function(acc, t) {
        acc.push(t.name.value);
        return acc;
      }, [])
    : [];
  // don't exclude first, offset, orderBy args for cypher directives
  var excludedKeys = cypherDirective
    ? []
    : ['first', 'offset', 'orderBy', 'filter'];
  return (0, _keys2.default)(filters).length > 0
    ? (0, _entries2.default)(filters)
        // exclude temporal arguments
        .filter(function(_ref5) {
          var _ref6 = (0, _slicedToArray3.default)(_ref5, 1),
            key = _ref6[0];

          return ![]
            .concat(
              excludedKeys,
              (0, _toConsumableArray3.default)(temporalArgNames)
            )
            .includes(key);
        })
        .map(function(_ref7) {
          var _ref8 = (0, _slicedToArray3.default)(_ref7, 2),
            key = _ref8[0],
            value = _ref8[1];

          return { key: key, paramKey: paramKey, value: value };
        })
    : [];
}

function paramsToString(params, cypherParams) {
  if (params.length > 0) {
    var strings = _lodash2.default.map(params, function(param) {
      return (
        param.key +
        ':' +
        (param.paramKey ? '$' + param.paramKey + '.' : '$') +
        (typeof param.value.index === 'undefined'
          ? param.key
          : param.value.index + '_' + param.key)
      );
    });
    return (
      '{' +
      strings.join(', ') +
      (cypherParams ? ', cypherParams: $cypherParams}' : '}')
    );
  }
  return '';
}

function computeSkipLimit(selection, variableValues) {
  var first = argumentValue(selection, 'first', variableValues);
  var offset = argumentValue(selection, 'offset', variableValues);

  if (first === null && offset === null) return '';
  if (offset === null) return '[..' + first + ']';
  if (first === null) return '[' + offset + '..]';
  return '[' + offset + '..' + (parseInt(offset) + parseInt(first)) + ']';
}

function splitOrderByArg(orderByVar) {
  var splitIndex = orderByVar.lastIndexOf('_');
  var order = orderByVar.substring(splitIndex + 1);
  var orderBy = orderByVar.substring(0, splitIndex);
  return { orderBy: orderBy, order: order };
}

function orderByStatement(resolveInfo, _ref9) {
  var orderBy = _ref9.orderBy,
    order = _ref9.order;

  var _typeIdentifiers2 = typeIdentifiers(resolveInfo.returnType),
    variableName = _typeIdentifiers2.variableName;

  return (
    ' ' +
    variableName +
    '.' +
    orderBy +
    ' ' +
    (order === 'asc' ? 'ASC' : 'DESC') +
    ' '
  );
}

var computeOrderBy = (exports.computeOrderBy = function computeOrderBy(
  resolveInfo,
  schemaType
) {
  var selection = resolveInfo.operation.selectionSet.selections[0];
  var orderByArgs = argumentValue(
    selection,
    'orderBy',
    resolveInfo.variableValues
  );

  if (orderByArgs == undefined) {
    return { cypherPart: '', optimization: { earlyOrderBy: false } };
  }

  var orderByArray = Array.isArray(orderByArgs) ? orderByArgs : [orderByArgs];

  var optimization = { earlyOrderBy: true };
  var orderByStatements = [];

  var orderByStatments = orderByArray.map(function(orderByVar) {
    var _splitOrderByArg = splitOrderByArg(orderByVar),
      orderBy = _splitOrderByArg.orderBy,
      order = _splitOrderByArg.order;

    var hasNoCypherDirective = _lodash2.default.isEmpty(
      cypherDirective(schemaType, orderBy)
    );
    optimization.earlyOrderBy =
      optimization.earlyOrderBy && hasNoCypherDirective;
    orderByStatements.push(
      orderByStatement(resolveInfo, { orderBy: orderBy, order: order })
    );
  });

  return {
    cypherPart: ' ORDER BY' + orderByStatements.join(','),
    optimization: optimization
  };
});

var possiblySetFirstId = (exports.possiblySetFirstId = function possiblySetFirstId(
  _ref10
) {
  var args = _ref10.args,
    statements = _ref10.statements,
    params = _ref10.params;

  var arg = args.find(function(e) {
    return _getNamedType(e).name.value === 'ID';
  });
  // arg is the first ID field if it exists, and we set the value
  // if no value is provided for the field name (arg.name.value) in params
  if (arg && arg.name.value && params[arg.name.value] === undefined) {
    statements.push(arg.name.value + ': apoc.create.uuid()');
  }
  return statements;
});

var getQueryArguments = (exports.getQueryArguments = function getQueryArguments(
  resolveInfo
) {
  return resolveInfo.schema.getQueryType().getFields()[resolveInfo.fieldName]
    .astNode.arguments;
});

var getMutationArguments = (exports.getMutationArguments = function getMutationArguments(
  resolveInfo
) {
  return resolveInfo.schema.getMutationType().getFields()[resolveInfo.fieldName]
    .astNode.arguments;
});

// TODO refactor
var buildCypherParameters = (exports.buildCypherParameters = function buildCypherParameters(
  _ref11
) {
  var args = _ref11.args,
    _ref11$statements = _ref11.statements,
    statements = _ref11$statements === undefined ? [] : _ref11$statements,
    params = _ref11.params,
    paramKey = _ref11.paramKey;

  var dataParams = paramKey ? params[paramKey] : params;
  var paramKeys = dataParams ? (0, _keys2.default)(dataParams) : [];
  if (args) {
    statements = paramKeys.reduce(function(acc, paramName) {
      var param = paramKey ? params[paramKey][paramName] : params[paramName];
      // Get the AST definition for the argument matching this param name
      var fieldAst = args.find(function(arg) {
        return arg.name.value === paramName;
      });
      if (fieldAst) {
        var fieldType = _getNamedType(fieldAst.type);
        if (isTemporalInputType(fieldType.name.value)) {
          var formatted = param.formatted;
          var temporalFunction = getTemporalCypherConstructor(fieldAst);
          if (temporalFunction) {
            // Prefer only using formatted, if provided
            if (formatted) {
              if (paramKey) params[paramKey][paramName] = formatted;
              else params[paramName] = formatted;
              acc.push(
                paramName +
                  ': ' +
                  temporalFunction +
                  '($' +
                  (paramKey ? paramKey + '.' : '') +
                  paramName +
                  ')'
              );
            } else {
              (function() {
                var temporalParam = {};
                if (Array.isArray(param)) {
                  (function() {
                    var count = param.length;
                    var i = 0;
                    for (; i < count; ++i) {
                      temporalParam = param[i];
                      var _formatted = temporalParam.formatted;
                      if (temporalParam.formatted) {
                        paramKey
                          ? (params[paramKey][paramName] = _formatted)
                          : (params[paramName] = _formatted);
                      } else {
                        (0, _keys2.default)(temporalParam).forEach(function(e) {
                          if ((0, _isInteger2.default)(temporalParam[e])) {
                            paramKey
                              ? (params[paramKey][paramName][i][
                                  e
                                ] = _neo4jDriver.v1.int(temporalParam[e]))
                              : (params[paramName][i][e] = _neo4jDriver.v1.int(
                                  temporalParam[e]
                                ));
                          }
                        });
                      }
                    }
                    acc.push(
                      paramName +
                        ': [value IN $' +
                        (paramKey ? paramKey + '.' : '') +
                        paramName +
                        ' | ' +
                        temporalFunction +
                        '(value)]'
                    );
                  })();
                } else {
                  temporalParam = paramKey
                    ? params[paramKey][paramName]
                    : params[paramName];
                  var _formatted2 = temporalParam.formatted;
                  if (temporalParam.formatted) {
                    paramKey
                      ? (params[paramKey][paramName] = _formatted2)
                      : (params[paramName] = _formatted2);
                  } else {
                    (0, _keys2.default)(temporalParam).forEach(function(e) {
                      if ((0, _isInteger2.default)(temporalParam[e])) {
                        paramKey
                          ? (params[paramKey][paramName][
                              e
                            ] = _neo4jDriver.v1.int(temporalParam[e]))
                          : (params[paramName][e] = _neo4jDriver.v1.int(
                              temporalParam[e]
                            ));
                      }
                    });
                  }
                  acc.push(
                    paramName +
                      ': ' +
                      temporalFunction +
                      '($' +
                      (paramKey ? paramKey + '.' : '') +
                      paramName +
                      ')'
                  );
                }
              })();
            }
          }
        } else {
          // normal case
          acc.push(
            paramName + ':$' + (paramKey ? paramKey + '.' : '') + paramName
          );
        }
      }
      return acc;
    }, statements);
  }
  if (paramKey) {
    params[paramKey] = dataParams;
  }
  return [params, statements];
});

// TODO refactor to handle Query/Mutation type schema directives
var directiveWithArgs = function directiveWithArgs(directiveName, args) {
  return function(schemaType, fieldName) {
    function fieldDirective(schemaType, fieldName, directiveName) {
      return !isGraphqlScalarType(schemaType)
        ? schemaType.getFields() &&
            schemaType.getFields()[fieldName] &&
            schemaType
              .getFields()
              [fieldName].astNode.directives.find(function(e) {
                return e.name.value === directiveName;
              })
        : {};
    }

    function directiveArgument(directive, name) {
      return directive && directive.arguments
        ? directive.arguments.find(function(e) {
            return e.name.value === name;
          }).value.value
        : [];
    }

    var directive = fieldDirective(schemaType, fieldName, directiveName);
    var ret = {};
    if (directive) {
      _assign2.default.apply(
        Object,
        [ret].concat(
          (0, _toConsumableArray3.default)(
            args.map(function(key) {
              return (0,
              _defineProperty3.default)({}, key, directiveArgument(directive, key));
            })
          )
        )
      );
    }
    return ret;
  };
};

var cypherDirective = (exports.cypherDirective = directiveWithArgs('cypher', [
  'statement'
]));

var relationDirective = (exports.relationDirective = directiveWithArgs(
  'relation',
  ['name', 'direction']
));

var getTypeDirective = (exports.getTypeDirective = function getTypeDirective(
  relatedAstNode,
  name
) {
  return relatedAstNode && relatedAstNode.directives
    ? relatedAstNode.directives.find(function(e) {
        return e.name.value === name;
      })
    : undefined;
});

var getFieldDirective = (exports.getFieldDirective = function getFieldDirective(
  field,
  directive
) {
  return (
    field &&
    field.directives &&
    field.directives.find(function(e) {
      return e && e.name && e.name.value === directive;
    })
  );
});

var getRelationDirection = (exports.getRelationDirection = function getRelationDirection(
  relationDirective
) {
  var direction = {};
  try {
    direction = relationDirective.arguments.filter(function(a) {
      return a.name.value === 'direction';
    })[0];
    return direction.value.value;
  } catch (e) {
    // FIXME: should we ignore this error to define default behavior?
    throw new Error('No direction argument specified on @relation directive');
  }
});

var getRelationName = (exports.getRelationName = function getRelationName(
  relationDirective
) {
  var name = {};
  try {
    name = relationDirective.arguments.filter(function(a) {
      return a.name.value === 'name';
    })[0];
    return name.value.value;
  } catch (e) {
    // FIXME: should we ignore this error to define default behavior?
    throw new Error('No name argument specified on @relation directive');
  }
});

var addDirectiveDeclarations = (exports.addDirectiveDeclarations = function addDirectiveDeclarations(
  typeMap,
  config
) {
  // overwrites any provided directive declarations for system directive names
  typeMap['cypher'] = (0, _graphql.parse)(
    'directive @cypher(statement: String) on FIELD_DEFINITION'
  ).definitions[0];
  typeMap['relation'] = (0, _graphql.parse)(
    'directive @relation(name: String, direction: _RelationDirections, from: String, to: String) on FIELD_DEFINITION | OBJECT'
  ).definitions[0];
  // TODO should we change these system directives to having a '_Neo4j' prefix
  typeMap['MutationMeta'] = (0, _graphql.parse)(
    'directive @MutationMeta(relationship: String, from: String, to: String) on FIELD_DEFINITION'
  ).definitions[0];
  typeMap['neo4j_ignore'] = (0, _graphql.parse)(
    'directive @neo4j_ignore on FIELD_DEFINITION'
  ).definitions[0];
  typeMap['_RelationDirections'] = (0, _graphql.parse)(
    'enum _RelationDirections { IN OUT }'
  ).definitions[0];
  typeMap = (0, _auth.possiblyAddDirectiveDeclarations)(typeMap, config);
  return typeMap;
});

var getQueryCypherDirective = (exports.getQueryCypherDirective = function getQueryCypherDirective(
  resolveInfo
) {
  return resolveInfo.schema
    .getQueryType()
    .getFields()
    [resolveInfo.fieldName].astNode.directives.find(function(x) {
      return x.name.value === 'cypher';
    });
});

var getMutationCypherDirective = (exports.getMutationCypherDirective = function getMutationCypherDirective(
  resolveInfo
) {
  return resolveInfo.schema
    .getMutationType()
    .getFields()
    [resolveInfo.fieldName].astNode.directives.find(function(x) {
      return x.name.value === 'cypher';
    });
});

function argumentValue(selection, name, variableValues) {
  var arg = selection.arguments.find(function(a) {
    return a.name.value === name;
  });
  if (!arg) {
    return null;
  } else {
    return parseArg(arg, variableValues);
  }
}

var getRelationTypeDirective = (exports.getRelationTypeDirective = function getRelationTypeDirective(
  relationshipType
) {
  var directive =
    relationshipType && relationshipType.directives
      ? relationshipType.directives.find(function(e) {
          return e.name.value === 'relation';
        })
      : undefined;
  return directive
    ? {
        name: directive.arguments.find(function(e) {
          return e.name.value === 'name';
        }).value.value,
        from: directive.arguments.find(function(e) {
          return e.name.value === 'from';
        }).value.value,
        to: directive.arguments.find(function(e) {
          return e.name.value === 'to';
        }).value.value
      }
    : undefined;
});

var getRelationMutationPayloadFieldsFromAst = (exports.getRelationMutationPayloadFieldsFromAst = function getRelationMutationPayloadFieldsFromAst(
  relatedAstNode
) {
  var isList = false;
  var fieldName = '';
  return relatedAstNode.fields
    .reduce(function(acc, t) {
      fieldName = t.name.value;
      if (fieldName !== 'to' && fieldName !== 'from') {
        isList = _isListType(t);
        // Use name directly in order to prevent requiring required fields on the payload type
        acc.push(
          fieldName +
            ': ' +
            (isList ? '[' : '') +
            _getNamedType(t).name.value +
            (isList ? ']' : '') +
            (0, _graphql.print)(t.directives)
        );
      }
      return acc;
    }, [])
    .join('\n');
});

var _getNamedType = (exports._getNamedType = function _getNamedType(type) {
  if (type.kind !== 'NamedType') {
    return _getNamedType(type.type);
  }
  return type;
});

var firstNonNullAndIdField = function firstNonNullAndIdField(fields) {
  var valueTypeName = '';
  return fields.find(function(e) {
    valueTypeName = _getNamedType(e).name.value;
    return (
      e.name.value !== '_id' &&
      e.type.kind === 'NonNullType' &&
      valueTypeName === 'ID'
    );
  });
};

var firstIdField = function firstIdField(fields) {
  var valueTypeName = '';
  return fields.find(function(e) {
    valueTypeName = _getNamedType(e).name.value;
    return e.name.value !== '_id' && valueTypeName === 'ID';
  });
};

var firstNonNullField = function firstNonNullField(fields) {
  var valueTypeName = '';
  return fields.find(function(e) {
    valueTypeName = _getNamedType(e).name.value;
    return valueTypeName === 'NonNullType';
  });
};

var firstField = function firstField(fields) {
  return fields.find(function(e) {
    return e.name.value !== '_id';
  });
};

var getPrimaryKey = (exports.getPrimaryKey = function getPrimaryKey(astNode) {
  var fields = astNode.fields;
  var pk = undefined;
  // remove all ignored fields
  fields = fields.filter(function(field) {
    return !getFieldDirective(field, 'neo4j_ignore');
  });
  if (!fields.length) return pk;
  pk = firstNonNullAndIdField(fields);
  if (!pk) {
    pk = firstIdField(fields);
  }
  if (!pk) {
    pk = firstNonNullField(fields);
  }
  if (!pk) {
    pk = firstField(fields);
  }
  return pk;
});

var createOperationMap = (exports.createOperationMap = function createOperationMap(
  type
) {
  var fields = type ? type.fields : [];
  return fields.reduce(function(acc, t) {
    acc[t.name.value] = t;
    return acc;
  }, {});
});

/**
 * Render safe a variable name according to cypher rules
 * @param {String} i input variable name
 * @returns {String} escaped text suitable for interpolation in cypher
 */
var safeVar = (exports.safeVar = function safeVar(i) {
  // There are rare cases where the var input is an object and has to be stringified
  // to produce the right output.
  var asStr = '' + i;

  // Rules: https://neo4j.com/docs/developer-manual/current/cypher/syntax/naming/
  return '`' + asStr.replace(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/g, '_') + '`';
});

/**
 * Render safe a label name by enclosing it in backticks and escaping any
 * existing backtick if present.
 * @param {String} l a label name
 * @returns {String} an escaped label name suitable for cypher concat
 */
var safeLabel = (exports.safeLabel = function safeLabel(l) {
  var asStr = '' + l;
  var escapeInner = asStr.replace(/\`/g, '\\`');
  return '`' + escapeInner + '`';
});

var decideNestedVariableName = (exports.decideNestedVariableName = function decideNestedVariableName(
  _ref13
) {
  var schemaTypeRelation = _ref13.schemaTypeRelation,
    innerSchemaTypeRelation = _ref13.innerSchemaTypeRelation,
    variableName = _ref13.variableName,
    fieldName = _ref13.fieldName,
    parentSelectionInfo = _ref13.parentSelectionInfo;

  if (
    isRootSelection({
      selectionInfo: parentSelectionInfo,
      rootType: 'relationship'
    }) &&
    isRelationTypeDirectedField(fieldName)
  ) {
    return parentSelectionInfo[fieldName];
  } else if (schemaTypeRelation) {
    var fromTypeName = schemaTypeRelation.from;
    var toTypeName = schemaTypeRelation.to;
    if (fromTypeName === toTypeName) {
      if (fieldName === 'from' || fieldName === 'to') {
        return variableName + '_' + fieldName;
      } else {
        // Case of a reflexive relationship type's directed field
        // being renamed to its node type value
        // ex: from: User -> User: User
        return variableName;
      }
    }
  } else {
    // Types without @relation directives are assumed to be node types
    // and only node types can have fields whose values are relation types
    if (innerSchemaTypeRelation) {
      // innerSchemaType is a field payload type using a @relation directive
      if (innerSchemaTypeRelation.from === innerSchemaTypeRelation.to) {
        return variableName;
      }
    } else {
      // related types are different
      return variableName + '_' + fieldName;
    }
  }
  return variableName + '_' + fieldName;
});

var initializeMutationParams = (exports.initializeMutationParams = function initializeMutationParams(
  _ref14
) {
  var resolveInfo = _ref14.resolveInfo,
    mutationTypeCypherDirective = _ref14.mutationTypeCypherDirective,
    otherParams = _ref14.otherParams,
    first = _ref14.first,
    offset = _ref14.offset;

  return (isCreateMutation(resolveInfo) || isUpdateMutation(resolveInfo)) &&
    !mutationTypeCypherDirective
    ? (0, _extends3.default)(
        { params: otherParams },
        { first: first, offset: offset }
      )
    : (0, _extends3.default)({}, otherParams, { first: first, offset: offset });
});

var getOuterSkipLimit = (exports.getOuterSkipLimit = function getOuterSkipLimit(
  first,
  offset
) {
  return (
    '' +
    (offset > 0 ? ' SKIP $offset' : '') +
    (first > -1 ? ' LIMIT $first' : '')
  );
});

var getPayloadSelections = (exports.getPayloadSelections = function getPayloadSelections(
  resolveInfo
) {
  var filteredFieldNodes = (0, _filter2.default)(
    resolveInfo.fieldNodes,
    function(n) {
      return n.name.value === resolveInfo.fieldName;
    }
  );
  if (filteredFieldNodes[0] && filteredFieldNodes[0].selectionSet) {
    // FIXME: how to handle multiple fieldNode matches
    var x = extractSelections(
      filteredFieldNodes[0].selectionSet.selections,
      resolveInfo.fragments
    );
    return x;
  }
  return [];
});

var filterNullParams = (exports.filterNullParams = function filterNullParams(
  _ref15
) {
  var offset = _ref15.offset,
    first = _ref15.first,
    otherParams = _ref15.otherParams;

  return (0, _entries2.default)(
    (0, _extends3.default)({ offset: offset, first: first }, otherParams)
  ).reduce(
    function(_ref16, _ref17) {
      var _ref19 = (0, _slicedToArray3.default)(_ref16, 2),
        nulls = _ref19[0],
        nonNulls = _ref19[1];

      var _ref18 = (0, _slicedToArray3.default)(_ref17, 2),
        key = _ref18[0],
        value = _ref18[1];

      if (value === null) {
        nulls[key] = value;
      } else {
        nonNulls[key] = value;
      }
      return [nulls, nonNulls];
    },
    [{}, {}]
  );
});

var splitSelectionParameters = (exports.splitSelectionParameters = function splitSelectionParameters(
  params,
  primaryKeyArgName,
  paramKey
) {
  var paramKeys = paramKey
    ? (0, _keys2.default)(params[paramKey])
    : (0, _keys2.default)(params);

  var _paramKeys$reduce = paramKeys.reduce(
      function(acc, t) {
        if (t === primaryKeyArgName) {
          if (paramKey) {
            acc[0][t] = params[paramKey][t];
          } else {
            acc[0][t] = params[t];
          }
        } else {
          if (paramKey) {
            if (acc[1][paramKey] === undefined) acc[1][paramKey] = {};
            acc[1][paramKey][t] = params[paramKey][t];
          } else {
            acc[1][t] = params[t];
          }
        }
        return acc;
      },
      [{}, {}]
    ),
    _paramKeys$reduce2 = (0, _slicedToArray3.default)(_paramKeys$reduce, 2),
    primaryKeyParam = _paramKeys$reduce2[0],
    updateParams = _paramKeys$reduce2[1];

  var first = params.first;
  var offset = params.offset;
  if (first !== undefined) updateParams['first'] = first;
  if (offset !== undefined) updateParams['offset'] = offset;
  return [primaryKeyParam, updateParams];
});

var isTemporalField = (exports.isTemporalField = function isTemporalField(
  schemaType,
  name
) {
  var type = schemaType ? schemaType.name : '';
  return (
    isTemporalType(type) &&
    (name === 'year' ||
      name === 'month' ||
      name === 'day' ||
      name === 'hour' ||
      name === 'minute' ||
      name === 'second' ||
      name === 'microsecond' ||
      name === 'millisecond' ||
      name === 'nanosecond' ||
      name === 'timezone' ||
      name === 'formatted')
  );
});

var isTemporalType = (exports.isTemporalType = function isTemporalType(name) {
  return (
    name === '_Neo4jTime' ||
    name === '_Neo4jDate' ||
    name === '_Neo4jDateTime' ||
    name === '_Neo4jLocalTime' ||
    name === '_Neo4jLocalDateTime'
  );
});

var getTemporalCypherConstructor = (exports.getTemporalCypherConstructor = function getTemporalCypherConstructor(
  fieldAst
) {
  var type = fieldAst ? _getNamedType(fieldAst.type).name.value : '';
  return decideTemporalConstructor(type);
});

var decideTemporalConstructor = (exports.decideTemporalConstructor = function decideTemporalConstructor(
  typeName
) {
  switch (typeName) {
    case '_Neo4jTimeInput':
      return 'time';
    case '_Neo4jDateInput':
      return 'date';
    case '_Neo4jDateTimeInput':
      return 'datetime';
    case '_Neo4jLocalTimeInput':
      return 'localtime';
    case '_Neo4jLocalDateTimeInput':
      return 'localdatetime';
    default:
      return '';
  }
});

var getTemporalArguments = (exports.getTemporalArguments = function getTemporalArguments(
  args
) {
  return args
    ? args.reduce(function(acc, t) {
        if (!t) {
          return acc;
        }
        var fieldType = _getNamedType(t.type).name.value;
        if (isTemporalInputType(fieldType)) acc.push(t);
        return acc;
      }, [])
    : [];
});

var isTemporalInputType = (exports.isTemporalInputType = function isTemporalInputType(
  name
) {
  return (
    name === '_Neo4jTimeInput' ||
    name === '_Neo4jDateInput' ||
    name === '_Neo4jDateTimeInput' ||
    name === '_Neo4jLocalTimeInput' ||
    name === '_Neo4jLocalDateTimeInput'
  );
});

var temporalPredicateClauses = (exports.temporalPredicateClauses = function temporalPredicateClauses(
  filters,
  variableName,
  temporalArgs,
  parentParam
) {
  return temporalArgs.reduce(function(acc, t) {
    // For every temporal argument
    var argName = t.name.value;
    var temporalParam = filters[argName];
    if (temporalParam) {
      // If a parameter value has been provided for it check whether
      // the provided param value is in an indexed object for a nested argument
      var paramIndex = temporalParam.index;
      var paramValue = temporalParam.value;
      // If it is, set and use its .value
      if (paramValue) temporalParam = paramValue;
      if (temporalParam['formatted']) {
        // Only the dedicated 'formatted' arg is used if it is provided
        acc.push(
          variableName +
            '.' +
            argName +
            ' = ' +
            getTemporalCypherConstructor(t) +
            '($' +
            // use index if provided, for nested arguments
            (typeof paramIndex === 'undefined'
              ? '' +
                (parentParam ? parentParam + '.' : '') +
                argName +
                '.formatted'
              : '' +
                (parentParam ? parentParam + '.' : '') +
                paramIndex +
                '_' +
                argName +
                '.formatted') +
            ')'
        );
      } else {
        (0, _keys2.default)(temporalParam).forEach(function(e) {
          acc.push(
            variableName +
              '.' +
              argName +
              '.' +
              e +
              ' = $' +
              (typeof paramIndex === 'undefined'
                ? '' + (parentParam ? parentParam + '.' : '') + argName
                : '' +
                  (parentParam ? parentParam + '.' : '') +
                  paramIndex +
                  '_' +
                  argName) +
              '.' +
              e
          );
        });
      }
    }
    return acc;
  }, []);
});

// An ignored type is a type without at least 1 non-ignored field
var excludeIgnoredTypes = (exports.excludeIgnoredTypes = function excludeIgnoredTypes(
  typeMap
) {
  var config =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var queryExclusionMap = {};
  var mutationExclusionMap = {};
  // If .query is an object and .exclude is provided, use it, else use new arr
  var excludedQueries = getExcludedTypes(config, 'query');
  var excludedMutations = getExcludedTypes(config, 'mutation');
  // Add any ignored types to exclusion arrays
  (0, _keys2.default)(typeMap).forEach(function(name) {
    if (
      typeMap[name].fields &&
      !typeMap[name].fields.find(function(field) {
        return !getFieldDirective(field, 'neo4j_ignore');
      })
    ) {
      // All fields are ignored, so exclude the type
      excludedQueries.push(name);
      excludedMutations.push(name);
    }
  });
  // As long as the API is still allowed, convert the exclusion arrays
  // to a boolean map for quicker reference later
  if (config.query !== false) {
    excludedQueries.forEach(function(e) {
      queryExclusionMap[e] = true;
    });
    config.query = { exclude: queryExclusionMap };
  }
  if (config.mutation !== false) {
    excludedMutations.forEach(function(e) {
      mutationExclusionMap[e] = true;
    });
    config.mutation = { exclude: mutationExclusionMap };
  }
  return config;
});

var getExcludedTypes = (exports.getExcludedTypes = function getExcludedTypes(
  config,
  rootType
) {
  return config &&
    rootType &&
    config[rootType] &&
    (0, _typeof3.default)(config[rootType]) === 'object' &&
    config[rootType].exclude
    ? config[rootType].exclude
    : [];
});

var possiblyAddIgnoreDirective = (exports.possiblyAddIgnoreDirective = function possiblyAddIgnoreDirective(
  astNode,
  typeMap,
  resolvers,
  config
) {
  var fields = astNode && astNode.fields ? astNode.fields : [];
  var valueTypeName = '';
  return fields.map(function(field) {
    // for any field of any type, if a custom resolver is provided
    // but there is no @ignore directive
    valueTypeName = _getNamedType(field).name.value;
    if (
      // has a custom resolver but not a directive
      getCustomFieldResolver(astNode, field, resolvers) &&
      !getFieldDirective(field, 'neo4j_ignore') &&
      // fields that behave in ways specific to the neo4j mapping do not recieve ignore
      // directives and can instead have their data post-processed by a custom field resolver
      !getFieldDirective(field, 'relation') &&
      !getFieldDirective(field, 'cypher') &&
      !getTypeDirective(typeMap[valueTypeName], 'relation') &&
      !isTemporalType(valueTypeName)
    ) {
      // possibly initialize directives
      if (!field.directives) field.directives = [];
      // add the ignore directive for use in runtime translation
      field.directives.push(parseDirectiveSdl('@neo4j_ignore'));
    }
    return field;
  });
});

var getCustomFieldResolver = (exports.getCustomFieldResolver = function getCustomFieldResolver(
  astNode,
  field,
  resolvers
) {
  var typeResolver =
    astNode && astNode.name && astNode.name.value
      ? resolvers[astNode.name.value]
      : undefined;
  return typeResolver ? typeResolver[field.name.value] : undefined;
});

var removeIgnoredFields = (exports.removeIgnoredFields = function removeIgnoredFields(
  schemaType,
  selections
) {
  if (!isGraphqlScalarType(schemaType) && selections && selections.length) {
    var schemaTypeField = '';
    selections = selections.filter(function(e) {
      if (e.kind === 'Field') {
        // so check if this field is ignored
        schemaTypeField = schemaType.getFields()[e.name.value];
        return (
          schemaTypeField &&
          schemaTypeField.astNode &&
          !getFieldDirective(schemaTypeField.astNode, 'neo4j_ignore')
        );
      }
      // keep element by default
      return true;
    });
  }
  return selections;
});
