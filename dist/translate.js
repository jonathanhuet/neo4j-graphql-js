'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.translateMutation = exports.translateQuery = exports.temporalType = exports.temporalField = exports.nodeTypeFieldOnRelationType = exports.relationTypeFieldOnNodeType = exports.relationFieldOnNodeType = exports.customCypherField = undefined;

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _entries = require('babel-runtime/core-js/object/entries');

var _entries2 = _interopRequireDefault(_entries);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _extends3 = require('babel-runtime/helpers/extends');

var _extends4 = _interopRequireDefault(_extends3);

var _utils = require('./utils');

var _graphql = require('graphql');

var _selections = require('./selections');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _neo4jDriver = require('neo4j-driver');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var customCypherField = (exports.customCypherField = function customCypherField(
  _ref
) {
  var customCypher = _ref.customCypher,
    cypherParams = _ref.cypherParams,
    paramIndex = _ref.paramIndex,
    schemaTypeRelation = _ref.schemaTypeRelation,
    initial = _ref.initial,
    fieldName = _ref.fieldName,
    fieldType = _ref.fieldType,
    nestedVariable = _ref.nestedVariable,
    variableName = _ref.variableName,
    headSelection = _ref.headSelection,
    schemaType = _ref.schemaType,
    resolveInfo = _ref.resolveInfo,
    subSelection = _ref.subSelection,
    skipLimit = _ref.skipLimit,
    commaIfTail = _ref.commaIfTail,
    tailParams = _ref.tailParams;

  if (schemaTypeRelation) {
    variableName = variableName + '_relation';
  }
  var fieldIsList = !!fieldType.ofType;
  // similar: [ x IN apoc.cypher.runFirstColumn("WITH {this} AS this MATCH (this)--(:Genre)--(o:Movie) RETURN o", {this: movie}, true) |x {.title}][1..2])

  // For @cypher fields with object payload types, customCypherField is
  // called after the recursive call to compute a subSelection. But recurse()
  // increments paramIndex. So here we need to decrement it in order to map
  // appropriately to the indexed keys produced in getFilterParams()
  var cypherFieldParamsIndex = paramIndex - 1;
  return (0, _extends4.default)(
    {
      initial:
        '' +
        initial +
        fieldName +
        ': ' +
        (fieldIsList ? '' : 'head(') +
        '[ ' +
        nestedVariable +
        ' IN apoc.cypher.runFirstColumn("' +
        customCypher +
        '", {' +
        (0, _utils.cypherDirectiveArgs)(
          variableName,
          headSelection,
          cypherParams,
          schemaType,
          resolveInfo,
          cypherFieldParamsIndex
        ) +
        '}, true) | ' +
        nestedVariable +
        ' {' +
        subSelection[0] +
        '}]' +
        (fieldIsList ? '' : ')') +
        skipLimit +
        ' ' +
        commaIfTail
    },
    tailParams
  );
});

var relationFieldOnNodeType = (exports.relationFieldOnNodeType = function relationFieldOnNodeType(
  _ref2
) {
  var initial = _ref2.initial,
    fieldName = _ref2.fieldName,
    fieldType = _ref2.fieldType,
    variableName = _ref2.variableName,
    relDirection = _ref2.relDirection,
    relType = _ref2.relType,
    nestedVariable = _ref2.nestedVariable,
    isInlineFragment = _ref2.isInlineFragment,
    interfaceLabel = _ref2.interfaceLabel,
    innerSchemaType = _ref2.innerSchemaType,
    paramIndex = _ref2.paramIndex,
    fieldArgs = _ref2.fieldArgs,
    filterParams = _ref2.filterParams,
    selectionFilters = _ref2.selectionFilters,
    temporalArgs = _ref2.temporalArgs,
    selections = _ref2.selections,
    schemaType = _ref2.schemaType,
    subSelection = _ref2.subSelection,
    skipLimit = _ref2.skipLimit,
    commaIfTail = _ref2.commaIfTail,
    tailParams = _ref2.tailParams,
    temporalClauses = _ref2.temporalClauses,
    resolveInfo = _ref2.resolveInfo;

  var safeVariableName = (0, _utils.safeVar)(nestedVariable);
  var allParams = (0, _utils.innerFilterParams)(filterParams, temporalArgs);
  var queryParams = (0, _utils.paramsToString)(
    _lodash2.default.filter(allParams, function(param) {
      return !Array.isArray(param.value);
    })
  );

  var _processFilterArgumen = processFilterArgument({
      fieldArgs: fieldArgs,
      schemaType: innerSchemaType,
      variableName: nestedVariable,
      resolveInfo: resolveInfo,
      params: selectionFilters,
      paramIndex: paramIndex
    }),
    _processFilterArgumen2 = (0, _slicedToArray3.default)(
      _processFilterArgumen,
      2
    ),
    filterPredicates = _processFilterArgumen2[0],
    serializedFilterParam = _processFilterArgumen2[1];

  var filterParamKey = tailParams.paramIndex + '_filter';
  var fieldArgumentParams = subSelection[1];
  var filterParam = fieldArgumentParams[filterParamKey];
  if (filterParam) {
    subSelection[1][filterParamKey] = serializedFilterParam[filterParamKey];
  }

  var arrayFilterParams = _lodash2.default.pickBy(filterParams, function(
    param,
    keyName
  ) {
    return Array.isArray(param.value) && !('orderBy' === keyName);
  });
  var arrayPredicates = _lodash2.default.map(arrayFilterParams, function(
    value,
    key
  ) {
    var param = _lodash2.default.find(allParams, function(param) {
      return param.key === key;
    });
    return (
      safeVariableName +
      '.' +
      (0, _utils.safeVar)(key) +
      ' IN $' +
      param.value.index +
      '_' +
      key
    );
  });
  var whereClauses = [].concat(
    (0, _toConsumableArray3.default)(temporalClauses),
    (0, _toConsumableArray3.default)(arrayPredicates),
    (0, _toConsumableArray3.default)(filterPredicates)
  );
  var orderByParam = filterParams['orderBy'];
  var temporalOrdering = temporalOrderingFieldExists(schemaType, filterParams);
  return {
    selection: (0, _extends4.default)(
      {
        initial:
          '' +
          initial +
          fieldName +
          ': ' +
          (!(0, _utils.isArrayType)(fieldType) ? 'head(' : '') +
          (orderByParam
            ? temporalOrdering
              ? '[sortedElement IN apoc.coll.sortMulti('
              : 'apoc.coll.sortMulti('
            : '') +
          '[(' +
          (0, _utils.safeVar)(variableName) +
          ')' +
          (relDirection === 'in' || relDirection === 'IN' ? '<' : '') +
          '-[:' +
          (0, _utils.safeLabel)(relType) +
          ']-' +
          (relDirection === 'out' || relDirection === 'OUT' ? '>' : '') +
          '(' +
          safeVariableName +
          ':' +
          (0, _utils.safeLabel)(
            isInlineFragment ? interfaceLabel : innerSchemaType.name
          ) +
          queryParams +
          ')' +
          (whereClauses.length > 0
            ? ' WHERE ' + whereClauses.join(' AND ')
            : '') +
          ' | ' +
          nestedVariable +
          ' {' +
          (isInlineFragment
            ? 'FRAGMENT_TYPE: "' + interfaceLabel + '",' + subSelection[0]
            : subSelection[0]) +
          '}]' +
          (orderByParam
            ? ', [' +
              buildSortMultiArgs(orderByParam) +
              '])' +
              (temporalOrdering
                ? ' | sortedElement { .*,  ' +
                  temporalTypeSelections(selections, innerSchemaType) +
                  '}]'
                : '')
            : '') +
          (!(0, _utils.isArrayType)(fieldType) ? ')' : '') +
          skipLimit +
          ' ' +
          commaIfTail
      },
      tailParams
    ),
    subSelection: subSelection
  };
});

var relationTypeFieldOnNodeType = (exports.relationTypeFieldOnNodeType = function relationTypeFieldOnNodeType(
  _ref3
) {
  var innerSchemaTypeRelation = _ref3.innerSchemaTypeRelation,
    initial = _ref3.initial,
    fieldName = _ref3.fieldName,
    subSelection = _ref3.subSelection,
    skipLimit = _ref3.skipLimit,
    commaIfTail = _ref3.commaIfTail,
    tailParams = _ref3.tailParams,
    fieldType = _ref3.fieldType,
    variableName = _ref3.variableName,
    schemaType = _ref3.schemaType,
    innerSchemaType = _ref3.innerSchemaType,
    nestedVariable = _ref3.nestedVariable,
    queryParams = _ref3.queryParams,
    filterParams = _ref3.filterParams,
    temporalArgs = _ref3.temporalArgs,
    resolveInfo = _ref3.resolveInfo,
    selectionFilters = _ref3.selectionFilters,
    paramIndex = _ref3.paramIndex,
    fieldArgs = _ref3.fieldArgs;

  if (innerSchemaTypeRelation.from === innerSchemaTypeRelation.to) {
    return {
      selection: (0, _extends4.default)(
        {
          initial:
            '' +
            initial +
            fieldName +
            ': {' +
            subSelection[0] +
            '}' +
            skipLimit +
            ' ' +
            commaIfTail
        },
        tailParams
      ),
      subSelection: subSelection
    };
  }
  var relationshipVariableName = nestedVariable + '_relation';
  var temporalClauses = (0, _utils.temporalPredicateClauses)(
    filterParams,
    relationshipVariableName,
    temporalArgs
  );

  var _processFilterArgumen3 = processFilterArgument({
      fieldArgs: fieldArgs,
      schemaType: innerSchemaType,
      variableName: relationshipVariableName,
      resolveInfo: resolveInfo,
      params: selectionFilters,
      paramIndex: paramIndex,
      rootIsRelationType: true
    }),
    _processFilterArgumen4 = (0, _slicedToArray3.default)(
      _processFilterArgumen3,
      2
    ),
    filterPredicates = _processFilterArgumen4[0],
    serializedFilterParam = _processFilterArgumen4[1];

  var filterParamKey = tailParams.paramIndex + '_filter';
  var fieldArgumentParams = subSelection[1];
  var filterParam = fieldArgumentParams[filterParamKey];
  if (filterParam) {
    subSelection[1][filterParamKey] = serializedFilterParam[filterParamKey];
  }

  var whereClauses = [].concat(
    (0, _toConsumableArray3.default)(temporalClauses),
    (0, _toConsumableArray3.default)(filterPredicates)
  );
  return {
    selection: (0, _extends4.default)(
      {
        initial:
          '' +
          initial +
          fieldName +
          ': ' +
          (!(0, _utils.isArrayType)(fieldType) ? 'head(' : '') +
          '[(' +
          (0, _utils.safeVar)(variableName) +
          ')' +
          (schemaType.name === innerSchemaTypeRelation.to ? '<' : '') +
          '-[' +
          (0, _utils.safeVar)(relationshipVariableName) +
          ':' +
          (0, _utils.safeLabel)(innerSchemaTypeRelation.name) +
          queryParams +
          ']-' +
          (schemaType.name === innerSchemaTypeRelation.from ? '>' : '') +
          '(:' +
          (0, _utils.safeLabel)(
            schemaType.name === innerSchemaTypeRelation.from
              ? innerSchemaTypeRelation.to
              : innerSchemaTypeRelation.from
          ) +
          ') ' +
          (whereClauses.length > 0
            ? 'WHERE ' + whereClauses.join(' AND ') + ' '
            : '') +
          '| ' +
          relationshipVariableName +
          ' {' +
          subSelection[0] +
          '}]' +
          (!(0, _utils.isArrayType)(fieldType) ? ')' : '') +
          skipLimit +
          ' ' +
          commaIfTail
      },
      tailParams
    ),
    subSelection: subSelection
  };
});

var nodeTypeFieldOnRelationType = (exports.nodeTypeFieldOnRelationType = function nodeTypeFieldOnRelationType(
  _ref4
) {
  var fieldInfo = _ref4.fieldInfo,
    schemaTypeRelation = _ref4.schemaTypeRelation,
    innerSchemaType = _ref4.innerSchemaType,
    isInlineFragment = _ref4.isInlineFragment,
    interfaceLabel = _ref4.interfaceLabel,
    paramIndex = _ref4.paramIndex,
    schemaType = _ref4.schemaType,
    filterParams = _ref4.filterParams,
    temporalArgs = _ref4.temporalArgs,
    parentSelectionInfo = _ref4.parentSelectionInfo,
    resolveInfo = _ref4.resolveInfo,
    selectionFilters = _ref4.selectionFilters,
    fieldArgs = _ref4.fieldArgs;

  if (
    (0, _utils.isRootSelection)({
      selectionInfo: parentSelectionInfo,
      rootType: 'relationship'
    }) &&
    (0, _utils.isRelationTypeDirectedField)(fieldInfo.fieldName)
  ) {
    return {
      selection: relationTypeMutationPayloadField(
        (0, _extends4.default)({}, fieldInfo, {
          parentSelectionInfo: parentSelectionInfo
        })
      ),
      subSelection: fieldInfo.subSelection
    };
  }
  // Normal case of schemaType with a relationship directive
  return directedNodeTypeFieldOnRelationType(
    (0, _extends4.default)({}, fieldInfo, {
      schemaTypeRelation: schemaTypeRelation,
      innerSchemaType: innerSchemaType,
      isInlineFragment: isInlineFragment,
      interfaceLabel: interfaceLabel,
      paramIndex: paramIndex,
      schemaType: schemaType,
      filterParams: filterParams,
      temporalArgs: temporalArgs,
      resolveInfo: resolveInfo,
      selectionFilters: selectionFilters,
      fieldArgs: fieldArgs
    })
  );
});

var relationTypeMutationPayloadField = function relationTypeMutationPayloadField(
  _ref5
) {
  var initial = _ref5.initial,
    fieldName = _ref5.fieldName,
    variableName = _ref5.variableName,
    subSelection = _ref5.subSelection,
    skipLimit = _ref5.skipLimit,
    commaIfTail = _ref5.commaIfTail,
    tailParams = _ref5.tailParams,
    parentSelectionInfo = _ref5.parentSelectionInfo;

  var safeVariableName = (0, _utils.safeVar)(variableName);
  return (0, _extends4.default)(
    {
      initial:
        '' +
        initial +
        fieldName +
        ': ' +
        safeVariableName +
        ' {' +
        subSelection[0] +
        '}' +
        skipLimit +
        ' ' +
        commaIfTail
    },
    tailParams,
    {
      variableName:
        fieldName === 'from' ? parentSelectionInfo.to : parentSelectionInfo.from
    }
  );
};

var directedNodeTypeFieldOnRelationType = function directedNodeTypeFieldOnRelationType(
  _ref6
) {
  var initial = _ref6.initial,
    fieldName = _ref6.fieldName,
    fieldType = _ref6.fieldType,
    variableName = _ref6.variableName,
    queryParams = _ref6.queryParams,
    nestedVariable = _ref6.nestedVariable,
    subSelection = _ref6.subSelection,
    skipLimit = _ref6.skipLimit,
    commaIfTail = _ref6.commaIfTail,
    tailParams = _ref6.tailParams,
    schemaTypeRelation = _ref6.schemaTypeRelation,
    innerSchemaType = _ref6.innerSchemaType,
    isInlineFragment = _ref6.isInlineFragment,
    interfaceLabel = _ref6.interfaceLabel,
    filterParams = _ref6.filterParams,
    temporalArgs = _ref6.temporalArgs,
    paramIndex = _ref6.paramIndex,
    resolveInfo = _ref6.resolveInfo,
    selectionFilters = _ref6.selectionFilters,
    fieldArgs = _ref6.fieldArgs;

  var relType = schemaTypeRelation.name;
  var fromTypeName = schemaTypeRelation.from;
  var toTypeName = schemaTypeRelation.to;
  var isFromField = fieldName === fromTypeName || fieldName === 'from';
  var isToField = fieldName === toTypeName || fieldName === 'to';
  // Since the translations are significantly different,
  // we first check whether the relationship is reflexive
  if (fromTypeName === toTypeName) {
    var relationshipVariableName =
      variableName + '_' + (isFromField ? 'from' : 'to') + '_relation';
    if ((0, _utils.isRelationTypeDirectedField)(fieldName)) {
      var temporalFieldRelationshipVariableName = nestedVariable + '_relation';
      var temporalClauses = (0, _utils.temporalPredicateClauses)(
        filterParams,
        temporalFieldRelationshipVariableName,
        temporalArgs
      );

      var _processFilterArgumen5 = processFilterArgument({
          fieldArgs: fieldArgs,
          schemaType: innerSchemaType,
          variableName: relationshipVariableName,
          resolveInfo: resolveInfo,
          params: selectionFilters,
          paramIndex: paramIndex,
          rootIsRelationType: true
        }),
        _processFilterArgumen6 = (0, _slicedToArray3.default)(
          _processFilterArgumen5,
          2
        ),
        filterPredicates = _processFilterArgumen6[0],
        serializedFilterParam = _processFilterArgumen6[1];

      var filterParamKey = tailParams.paramIndex + '_filter';
      var fieldArgumentParams = subSelection[1];
      var filterParam = fieldArgumentParams[filterParamKey];
      if (filterParam) {
        subSelection[1][filterParamKey] = serializedFilterParam[filterParamKey];
      }
      var whereClauses = [].concat(
        (0, _toConsumableArray3.default)(temporalClauses),
        (0, _toConsumableArray3.default)(filterPredicates)
      );
      return {
        selection: (0, _extends4.default)(
          {
            initial:
              '' +
              initial +
              fieldName +
              ': ' +
              (!(0, _utils.isArrayType)(fieldType) ? 'head(' : '') +
              '[(' +
              (0, _utils.safeVar)(variableName) +
              ')' +
              (isFromField ? '<' : '') +
              '-[' +
              (0, _utils.safeVar)(relationshipVariableName) +
              ':' +
              (0, _utils.safeLabel)(relType) +
              queryParams +
              ']-' +
              (isToField ? '>' : '') +
              '(' +
              (0, _utils.safeVar)(nestedVariable) +
              ':' +
              (0, _utils.safeLabel)(
                isInlineFragment ? interfaceLabel : fromTypeName
              ) +
              ') ' +
              (whereClauses.length > 0
                ? 'WHERE ' + whereClauses.join(' AND ') + ' '
                : '') +
              '| ' +
              relationshipVariableName +
              ' {' +
              (isInlineFragment
                ? 'FRAGMENT_TYPE: "' + interfaceLabel + '",' + subSelection[0]
                : subSelection[0]) +
              '}]' +
              (!(0, _utils.isArrayType)(fieldType) ? ')' : '') +
              skipLimit +
              ' ' +
              commaIfTail
          },
          tailParams
        ),
        subSelection: subSelection
      };
    } else {
      // Case of a renamed directed field
      // e.g., 'from: Movie' -> 'Movie: Movie'
      return {
        selection: (0, _extends4.default)(
          {
            initial:
              '' +
              initial +
              fieldName +
              ': ' +
              variableName +
              ' {' +
              subSelection[0] +
              '}' +
              skipLimit +
              ' ' +
              commaIfTail
          },
          tailParams
        ),
        subSelection: subSelection
      };
    }
  } else {
    variableName = variableName + '_relation';
    return {
      selection: (0, _extends4.default)(
        {
          initial:
            '' +
            initial +
            fieldName +
            ': ' +
            (!(0, _utils.isArrayType)(fieldType) ? 'head(' : '') +
            '[(:' +
            (0, _utils.safeLabel)(isFromField ? toTypeName : fromTypeName) +
            ')' +
            (isFromField ? '<' : '') +
            '-[' +
            (0, _utils.safeVar)(variableName) +
            ']-' +
            (isToField ? '>' : '') +
            '(' +
            (0, _utils.safeVar)(nestedVariable) +
            ':' +
            (0, _utils.safeLabel)(
              isInlineFragment ? interfaceLabel : innerSchemaType.name
            ) +
            queryParams +
            ') | ' +
            nestedVariable +
            ' {' +
            (isInlineFragment
              ? 'FRAGMENT_TYPE: "' + interfaceLabel + '",' + subSelection[0]
              : subSelection[0]) +
            '}]' +
            (!(0, _utils.isArrayType)(fieldType) ? ')' : '') +
            skipLimit +
            ' ' +
            commaIfTail
        },
        tailParams
      ),
      subSelection: subSelection
    };
  }
};

var temporalField = (exports.temporalField = function temporalField(_ref7) {
  var initial = _ref7.initial,
    fieldName = _ref7.fieldName,
    commaIfTail = _ref7.commaIfTail,
    tailParams = _ref7.tailParams,
    parentSelectionInfo = _ref7.parentSelectionInfo,
    secondParentSelectionInfo = _ref7.secondParentSelectionInfo;

  var parentFieldName = parentSelectionInfo.fieldName;
  var parentFieldType = parentSelectionInfo.fieldType;
  var parentSchemaType = parentSelectionInfo.schemaType;
  var parentVariableName = parentSelectionInfo.variableName;
  var secondParentVariableName = secondParentSelectionInfo.variableName;
  // Initially assume that the parent type of the temporal type
  // containing this temporal field was a node
  var variableName = parentVariableName;
  var fieldIsArray = (0, _utils.isArrayType)(parentFieldType);
  if (parentSchemaType && !(0, _utils.isNodeType)(parentSchemaType.astNode)) {
    // initial assumption wrong, build appropriate relationship variable
    if (
      (0, _utils.isRootSelection)({
        selectionInfo: secondParentSelectionInfo,
        rootType: 'relationship'
      })
    ) {
      // If the second parent selection scope above is the root
      // then we need to use the root variableName
      variableName = secondParentVariableName + '_relation';
    } else if ((0, _utils.isRelationTypePayload)(parentSchemaType)) {
      var parentSchemaTypeRelation = (0, _utils.getRelationTypeDirective)(
        parentSchemaType.astNode
      );
      if (parentSchemaTypeRelation.from === parentSchemaTypeRelation.to) {
        variableName = variableName + '_relation';
      } else {
        variableName = variableName + '_relation';
      }
    }
  }
  return (0, _extends4.default)(
    {
      initial:
        initial +
        ' ' +
        fieldName +
        ': ' +
        (fieldIsArray
          ? (fieldName === 'formatted'
              ? 'toString(TEMPORAL_INSTANCE)'
              : 'TEMPORAL_INSTANCE.' + fieldName) +
            ' ' +
            commaIfTail
          : '' +
            (fieldName === 'formatted'
              ? 'toString(' +
                (0, _utils.safeVar)(variableName) +
                '.' +
                parentFieldName +
                ') ' +
                commaIfTail
              : (0, _utils.safeVar)(variableName) +
                '.' +
                parentFieldName +
                '.' +
                fieldName +
                ' ' +
                commaIfTail))
    },
    tailParams
  );
});

var temporalType = (exports.temporalType = function temporalType(_ref8) {
  var initial = _ref8.initial,
    fieldName = _ref8.fieldName,
    subSelection = _ref8.subSelection,
    commaIfTail = _ref8.commaIfTail,
    tailParams = _ref8.tailParams,
    variableName = _ref8.variableName,
    nestedVariable = _ref8.nestedVariable,
    fieldType = _ref8.fieldType,
    schemaType = _ref8.schemaType,
    schemaTypeRelation = _ref8.schemaTypeRelation,
    parentSelectionInfo = _ref8.parentSelectionInfo;

  var parentVariableName = parentSelectionInfo.variableName;
  var parentFilterParams = parentSelectionInfo.filterParams;
  var parentSchemaType = parentSelectionInfo.schemaType;
  var safeVariableName = (0, _utils.safeVar)(variableName);
  var fieldIsArray = (0, _utils.isArrayType)(fieldType);
  if (!(0, _utils.isNodeType)(schemaType.astNode)) {
    if (
      (0, _utils.isRelationTypePayload)(schemaType) &&
      schemaTypeRelation.from === schemaTypeRelation.to
    ) {
      variableName = nestedVariable + '_relation';
    } else {
      if (fieldIsArray) {
        if (
          (0, _utils.isRootSelection)({
            selectionInfo: parentSelectionInfo,
            rootType: 'relationship'
          })
        ) {
          if (schemaTypeRelation.from === schemaTypeRelation.to) {
            variableName = parentVariableName + '_relation';
          } else {
            variableName = parentVariableName + '_relation';
          }
        } else {
          variableName = variableName + '_relation';
        }
      } else {
        variableName = nestedVariable + '_relation';
      }
    }
  }
  return (0, _extends4.default)(
    {
      initial:
        '' +
        initial +
        fieldName +
        ': ' +
        (fieldIsArray
          ? 'reduce(a = [], TEMPORAL_INSTANCE IN ' +
            variableName +
            '.' +
            fieldName +
            ' | a + {' +
            subSelection[0] +
            '})' +
            commaIfTail
          : temporalOrderingFieldExists(parentSchemaType, parentFilterParams)
          ? safeVariableName + '.' + fieldName + commaIfTail
          : '{' + subSelection[0] + '}' + commaIfTail)
    },
    tailParams
  );
});

// Query API root operation branch
var translateQuery = (exports.translateQuery = function translateQuery(_ref9) {
  var resolveInfo = _ref9.resolveInfo,
    context = _ref9.context,
    selections = _ref9.selections,
    variableName = _ref9.variableName,
    typeName = _ref9.typeName,
    schemaType = _ref9.schemaType,
    first = _ref9.first,
    offset = _ref9.offset,
    _id = _ref9._id,
    orderBy = _ref9.orderBy,
    otherParams = _ref9.otherParams;

  var _filterNullParams = (0, _utils.filterNullParams)({
      offset: offset,
      first: first,
      otherParams: otherParams
    }),
    _filterNullParams2 = (0, _slicedToArray3.default)(_filterNullParams, 2),
    nullParams = _filterNullParams2[0],
    nonNullParams = _filterNullParams2[1];

  var filterParams = (0, _utils.getFilterParams)(nonNullParams);
  var queryArgs = (0, _utils.getQueryArguments)(resolveInfo);
  var temporalArgs = (0, _utils.getTemporalArguments)(queryArgs);
  var queryTypeCypherDirective = (0, _utils.getQueryCypherDirective)(
    resolveInfo
  );
  var cypherParams = getCypherParams(context);
  var queryParams = (0, _utils.paramsToString)(
    (0, _utils.innerFilterParams)(
      filterParams,
      temporalArgs,
      null,
      queryTypeCypherDirective ? true : false
    ),
    cypherParams
  );
  var safeVariableName = (0, _utils.safeVar)(variableName);
  var temporalClauses = (0, _utils.temporalPredicateClauses)(
    filterParams,
    safeVariableName,
    temporalArgs
  );
  var outerSkipLimit = (0, _utils.getOuterSkipLimit)(first, offset);
  var orderByValue = (0, _utils.computeOrderBy)(resolveInfo, schemaType);

  if (queryTypeCypherDirective) {
    return customQuery({
      resolveInfo: resolveInfo,
      cypherParams: cypherParams,
      schemaType: schemaType,
      argString: queryParams,
      selections: selections,
      variableName: variableName,
      typeName: typeName,
      orderByValue: orderByValue,
      outerSkipLimit: outerSkipLimit,
      queryTypeCypherDirective: queryTypeCypherDirective,
      nonNullParams: nonNullParams
    });
  } else {
    return nodeQuery({
      resolveInfo: resolveInfo,
      cypherParams: cypherParams,
      schemaType: schemaType,
      argString: queryParams,
      selections: selections,
      variableName: variableName,
      typeName: typeName,
      temporalClauses: temporalClauses,
      orderByValue: orderByValue,
      outerSkipLimit: outerSkipLimit,
      nullParams: nullParams,
      nonNullParams: nonNullParams,
      filterParams: filterParams,
      temporalArgs: temporalArgs,
      _id: _id
    });
  }
});

var getCypherParams = function getCypherParams(context) {
  return context &&
    context.cypherParams &&
    context.cypherParams instanceof Object &&
    (0, _keys2.default)(context.cypherParams).length > 0
    ? context.cypherParams
    : undefined;
};

// Custom read operation
var customQuery = function customQuery(_ref10) {
  var resolveInfo = _ref10.resolveInfo,
    cypherParams = _ref10.cypherParams,
    schemaType = _ref10.schemaType,
    argString = _ref10.argString,
    selections = _ref10.selections,
    variableName = _ref10.variableName,
    typeName = _ref10.typeName,
    orderByValue = _ref10.orderByValue,
    outerSkipLimit = _ref10.outerSkipLimit,
    queryTypeCypherDirective = _ref10.queryTypeCypherDirective,
    nonNullParams = _ref10.nonNullParams;

  var safeVariableName = (0, _utils.safeVar)(variableName);

  var _buildCypherSelection = (0, _selections.buildCypherSelection)({
      initial: '',
      cypherParams: cypherParams,
      selections: selections,
      variableName: variableName,
      schemaType: schemaType,
      resolveInfo: resolveInfo,
      paramIndex: 1
    }),
    _buildCypherSelection2 = (0, _slicedToArray3.default)(
      _buildCypherSelection,
      2
    ),
    subQuery = _buildCypherSelection2[0],
    subParams = _buildCypherSelection2[1];

  var params = (0, _extends4.default)({}, nonNullParams, subParams);
  if (cypherParams) {
    params['cypherParams'] = cypherParams;
  }
  // QueryType with a @cypher directive
  var cypherQueryArg = queryTypeCypherDirective.arguments.find(function(x) {
    return x.name.value === 'statement';
  });
  var isScalarType = (0, _utils.isGraphqlScalarType)(schemaType);
  var temporalType = (0, _utils.isTemporalType)(schemaType.name);
  var orderByClause = orderByValue.cypherPart;

  var query =
    'WITH apoc.cypher.runFirstColumn("' +
    cypherQueryArg.value.value +
    '", ' +
    (argString || 'null') +
    ', True) AS x UNWIND x AS ' +
    safeVariableName +
    ' RETURN ' +
    safeVariableName +
    ' ' +
    // Don't add subQuery for scalar type payloads
    // FIXME: fix subselection translation for temporal type payload
    (!temporalType && !isScalarType
      ? '{' + subQuery + '} AS ' + safeVariableName + orderByClause
      : '') +
    outerSkipLimit;
  return [query, params];
};

// Generated API
var nodeQuery = function nodeQuery(_ref11) {
  var resolveInfo = _ref11.resolveInfo,
    cypherParams = _ref11.cypherParams,
    schemaType = _ref11.schemaType,
    selections = _ref11.selections,
    variableName = _ref11.variableName,
    typeName = _ref11.typeName,
    temporalClauses = _ref11.temporalClauses,
    orderByValue = _ref11.orderByValue,
    outerSkipLimit = _ref11.outerSkipLimit,
    nullParams = _ref11.nullParams,
    nonNullParams = _ref11.nonNullParams,
    filterParams = _ref11.filterParams,
    temporalArgs = _ref11.temporalArgs,
    _id = _ref11._id;

  var safeVariableName = (0, _utils.safeVar)(variableName);
  var safeLabelName = (0, _utils.safeLabel)(typeName);
  var rootParamIndex = 1;

  var _buildCypherSelection3 = (0, _selections.buildCypherSelection)({
      initial: '',
      cypherParams: cypherParams,
      selections: selections,
      variableName: variableName,
      schemaType: schemaType,
      resolveInfo: resolveInfo,
      paramIndex: rootParamIndex
    }),
    _buildCypherSelection4 = (0, _slicedToArray3.default)(
      _buildCypherSelection3,
      2
    ),
    subQuery = _buildCypherSelection4[0],
    subParams = _buildCypherSelection4[1];

  var fieldArgs = (0, _utils.getQueryArguments)(resolveInfo);

  var _processFilterArgumen7 = processFilterArgument({
      fieldArgs: fieldArgs,
      schemaType: schemaType,
      variableName: variableName,
      resolveInfo: resolveInfo,
      params: nonNullParams,
      paramIndex: rootParamIndex
    }),
    _processFilterArgumen8 = (0, _slicedToArray3.default)(
      _processFilterArgumen7,
      2
    ),
    filterPredicates = _processFilterArgumen8[0],
    serializedFilter = _processFilterArgumen8[1];

  var params = (0, _extends4.default)({}, serializedFilter, subParams);

  if (cypherParams) {
    params['cypherParams'] = cypherParams;
  }

  var arrayParams = _lodash2.default.pickBy(filterParams, Array.isArray);
  var args = (0, _utils.innerFilterParams)(filterParams, temporalArgs);

  var argString = (0, _utils.paramsToString)(
    _lodash2.default.filter(args, function(arg) {
      return !Array.isArray(arg.value);
    })
  );

  var idWherePredicate =
    typeof _id !== 'undefined' ? 'ID(' + safeVariableName + ')=' + _id : '';

  var nullFieldPredicates = (0, _keys2.default)(nullParams).map(function(key) {
    return variableName + '.' + key + ' IS NULL';
  });

  var arrayPredicates = _lodash2.default.map(arrayParams, function(value, key) {
    return safeVariableName + '.' + (0, _utils.safeVar)(key) + ' IN $' + key;
  });

  var predicateClauses = [idWherePredicate]
    .concat(
      (0, _toConsumableArray3.default)(filterPredicates),
      (0, _toConsumableArray3.default)(nullFieldPredicates),
      (0, _toConsumableArray3.default)(temporalClauses),
      (0, _toConsumableArray3.default)(arrayPredicates)
    )
    .filter(function(predicate) {
      return !!predicate;
    })
    .join(' AND ');

  var predicate = predicateClauses ? 'WHERE ' + predicateClauses + ' ' : '';

  var optimization = orderByValue.optimization,
    orderByClause = orderByValue.cypherPart;

  var query =
    'MATCH (' +
    safeVariableName +
    ':' +
    safeLabelName +
    (argString ? ' ' + argString : '') +
    ') ' +
    predicate +
    (optimization.earlyOrderBy
      ? 'WITH ' + safeVariableName + orderByClause
      : '') +
    'RETURN ' +
    safeVariableName +
    ' {' +
    subQuery +
    '} AS ' +
    safeVariableName +
    (optimization.earlyOrderBy ? '' : orderByClause) +
    outerSkipLimit;

  return [query, params];
};

// Mutation API root operation branch
var translateMutation = (exports.translateMutation = function translateMutation(
  _ref12
) {
  var resolveInfo = _ref12.resolveInfo,
    context = _ref12.context,
    schemaType = _ref12.schemaType,
    selections = _ref12.selections,
    variableName = _ref12.variableName,
    typeName = _ref12.typeName,
    first = _ref12.first,
    offset = _ref12.offset,
    otherParams = _ref12.otherParams;

  var outerSkipLimit = (0, _utils.getOuterSkipLimit)(first, offset);
  var orderByValue = (0, _utils.computeOrderBy)(resolveInfo, schemaType);
  var mutationTypeCypherDirective = (0, _utils.getMutationCypherDirective)(
    resolveInfo
  );
  var params = (0, _utils.initializeMutationParams)({
    resolveInfo: resolveInfo,
    mutationTypeCypherDirective: mutationTypeCypherDirective,
    first: first,
    otherParams: otherParams,
    offset: offset
  });
  var mutationInfo = {
    params: params,
    selections: selections,
    schemaType: schemaType,
    resolveInfo: resolveInfo
  };
  if (mutationTypeCypherDirective) {
    return customMutation(
      (0, _extends4.default)({}, mutationInfo, {
        context: context,
        mutationTypeCypherDirective: mutationTypeCypherDirective,
        variableName: variableName,
        orderByValue: orderByValue,
        outerSkipLimit: outerSkipLimit
      })
    );
  } else if ((0, _utils.isCreateMutation)(resolveInfo)) {
    return nodeCreate(
      (0, _extends4.default)({}, mutationInfo, {
        variableName: variableName,
        typeName: typeName
      })
    );
  } else if ((0, _utils.isUpdateMutation)(resolveInfo)) {
    return nodeUpdate(
      (0, _extends4.default)({}, mutationInfo, {
        variableName: variableName,
        typeName: typeName
      })
    );
  } else if ((0, _utils.isDeleteMutation)(resolveInfo)) {
    return nodeDelete(
      (0, _extends4.default)({}, mutationInfo, {
        variableName: variableName,
        typeName: typeName
      })
    );
  } else if ((0, _utils.isAddMutation)(resolveInfo)) {
    return relationshipCreate((0, _extends4.default)({}, mutationInfo));
  } else if ((0, _utils.isRemoveMutation)(resolveInfo)) {
    return relationshipDelete(
      (0, _extends4.default)({}, mutationInfo, {
        variableName: variableName
      })
    );
  } else {
    // throw error - don't know how to handle this type of mutation
    throw new Error(
      'Do not know how to handle this type of mutation. Mutation does not follow naming convention.'
    );
  }
});

// Custom write operation
var customMutation = function customMutation(_ref13) {
  var params = _ref13.params,
    context = _ref13.context,
    mutationTypeCypherDirective = _ref13.mutationTypeCypherDirective,
    selections = _ref13.selections,
    variableName = _ref13.variableName,
    schemaType = _ref13.schemaType,
    resolveInfo = _ref13.resolveInfo,
    orderByValue = _ref13.orderByValue,
    outerSkipLimit = _ref13.outerSkipLimit;

  var cypherParams = getCypherParams(context);
  var safeVariableName = (0, _utils.safeVar)(variableName);
  // FIXME: support IN for multiple values -> WHERE
  var argString = (0, _utils.paramsToString)(
    (0, _utils.innerFilterParams)(
      (0, _utils.getFilterParams)(params.params || params),
      null,
      null,
      true
    ),
    cypherParams
  );
  var cypherQueryArg = mutationTypeCypherDirective.arguments.find(function(x) {
    return x.name.value === 'statement';
  });

  var _buildCypherSelection5 = (0, _selections.buildCypherSelection)({
      initial: '',
      selections: selections,
      variableName: variableName,
      schemaType: schemaType,
      resolveInfo: resolveInfo,
      paramIndex: 1,
      cypherParams: cypherParams
    }),
    _buildCypherSelection6 = (0, _slicedToArray3.default)(
      _buildCypherSelection5,
      2
    ),
    subQuery = _buildCypherSelection6[0],
    subParams = _buildCypherSelection6[1];

  var isScalarType = (0, _utils.isGraphqlScalarType)(schemaType);
  var temporalType = (0, _utils.isTemporalType)(schemaType.name);
  params = (0, _extends4.default)({}, params, subParams);
  if (cypherParams) {
    params['cypherParams'] = cypherParams;
  }
  var orderByClause = orderByValue.cypherPart;

  var query =
    'CALL apoc.cypher.doIt("' +
    cypherQueryArg.value.value +
    '", ' +
    argString +
    ') YIELD value\n    WITH apoc.map.values(value, [keys(value)[0]])[0] AS ' +
    safeVariableName +
    '\n    RETURN ' +
    safeVariableName +
    ' ' +
    (!temporalType && !isScalarType
      ? '{' +
        subQuery +
        '} AS ' +
        safeVariableName +
        orderByClause +
        outerSkipLimit
      : '');
  return [query, params];
};

// Generated API
// Node Create - Update - Delete
var nodeCreate = function nodeCreate(_ref14) {
  var variableName = _ref14.variableName,
    typeName = _ref14.typeName,
    selections = _ref14.selections,
    schemaType = _ref14.schemaType,
    resolveInfo = _ref14.resolveInfo,
    params = _ref14.params;

  var safeVariableName = (0, _utils.safeVar)(variableName);
  var safeLabelName = (0, _utils.safeLabel)(typeName);
  var statements = [];
  var args = (0, _utils.getMutationArguments)(resolveInfo);
  statements = (0, _utils.possiblySetFirstId)({
    args: args,
    statements: statements,
    params: params.params
  });

  var _buildCypherParameter = (0, _utils.buildCypherParameters)({
      args: args,
      statements: statements,
      params: params,
      paramKey: 'params'
    }),
    _buildCypherParameter2 = (0, _slicedToArray3.default)(
      _buildCypherParameter,
      2
    ),
    preparedParams = _buildCypherParameter2[0],
    paramStatements = _buildCypherParameter2[1];

  var _buildCypherSelection7 = (0, _selections.buildCypherSelection)({
      initial: '',
      selections: selections,
      variableName: variableName,
      schemaType: schemaType,
      resolveInfo: resolveInfo,
      paramIndex: 1
    }),
    _buildCypherSelection8 = (0, _slicedToArray3.default)(
      _buildCypherSelection7,
      2
    ),
    subQuery = _buildCypherSelection8[0],
    subParams = _buildCypherSelection8[1];

  params = (0, _extends4.default)({}, preparedParams, subParams);
  var query =
    '\n    CREATE (' +
    safeVariableName +
    ':' +
    safeLabelName +
    ' {' +
    paramStatements.join(',') +
    '})\n    RETURN ' +
    safeVariableName +
    ' {' +
    subQuery +
    '} AS ' +
    safeVariableName +
    '\n  ';
  return [query, params];
};

var nodeUpdate = function nodeUpdate(_ref15) {
  var resolveInfo = _ref15.resolveInfo,
    variableName = _ref15.variableName,
    typeName = _ref15.typeName,
    selections = _ref15.selections,
    schemaType = _ref15.schemaType,
    params = _ref15.params;

  var safeVariableName = (0, _utils.safeVar)(variableName);
  var safeLabelName = (0, _utils.safeLabel)(typeName);
  var args = (0, _utils.getMutationArguments)(resolveInfo);
  var primaryKeyArg = args[0];
  var primaryKeyArgName = primaryKeyArg.name.value;
  var temporalArgs = (0, _utils.getTemporalArguments)(args);

  var _splitSelectionParame = (0, _utils.splitSelectionParameters)(
      params,
      primaryKeyArgName,
      'params'
    ),
    _splitSelectionParame2 = (0, _slicedToArray3.default)(
      _splitSelectionParame,
      2
    ),
    primaryKeyParam = _splitSelectionParame2[0],
    updateParams = _splitSelectionParame2[1];

  var temporalClauses = (0, _utils.temporalPredicateClauses)(
    primaryKeyParam,
    safeVariableName,
    temporalArgs,
    'params'
  );
  var predicateClauses = []
    .concat((0, _toConsumableArray3.default)(temporalClauses))
    .filter(function(predicate) {
      return !!predicate;
    })
    .join(' AND ');
  var predicate = predicateClauses ? 'WHERE ' + predicateClauses + ' ' : '';

  var _buildCypherParameter3 = (0, _utils.buildCypherParameters)({
      args: args,
      params: updateParams,
      paramKey: 'params'
    }),
    _buildCypherParameter4 = (0, _slicedToArray3.default)(
      _buildCypherParameter3,
      2
    ),
    preparedParams = _buildCypherParameter4[0],
    paramUpdateStatements = _buildCypherParameter4[1];

  var query =
    'MATCH (' +
    safeVariableName +
    ':' +
    safeLabelName +
    (predicate !== ''
      ? ') ' + predicate + ' '
      : '{' + primaryKeyArgName + ': $params.' + primaryKeyArgName + '})') +
    '\n  ';
  if (paramUpdateStatements.length > 0) {
    query +=
      'SET ' +
      safeVariableName +
      ' += {' +
      paramUpdateStatements.join(',') +
      '} ';
  }

  var _buildCypherSelection9 = (0, _selections.buildCypherSelection)({
      initial: '',
      selections: selections,
      variableName: variableName,
      schemaType: schemaType,
      resolveInfo: resolveInfo,
      paramIndex: 1
    }),
    _buildCypherSelection10 = (0, _slicedToArray3.default)(
      _buildCypherSelection9,
      2
    ),
    subQuery = _buildCypherSelection10[0],
    subParams = _buildCypherSelection10[1];

  preparedParams.params[primaryKeyArgName] = primaryKeyParam[primaryKeyArgName];
  params = (0, _extends4.default)({}, preparedParams, subParams);
  query +=
    'RETURN ' + safeVariableName + ' {' + subQuery + '} AS ' + safeVariableName;
  return [query, params];
};

var nodeDelete = function nodeDelete(_ref16) {
  var resolveInfo = _ref16.resolveInfo,
    selections = _ref16.selections,
    variableName = _ref16.variableName,
    typeName = _ref16.typeName,
    schemaType = _ref16.schemaType,
    params = _ref16.params;

  var safeVariableName = (0, _utils.safeVar)(variableName);
  var safeLabelName = (0, _utils.safeLabel)(typeName);
  var args = (0, _utils.getMutationArguments)(resolveInfo);
  var primaryKeyArg = args[0];
  var primaryKeyArgName = primaryKeyArg.name.value;
  var temporalArgs = (0, _utils.getTemporalArguments)(args);

  var _splitSelectionParame3 = (0, _utils.splitSelectionParameters)(
      params,
      primaryKeyArgName
    ),
    _splitSelectionParame4 = (0, _slicedToArray3.default)(
      _splitSelectionParame3,
      1
    ),
    primaryKeyParam = _splitSelectionParame4[0];

  var temporalClauses = (0, _utils.temporalPredicateClauses)(
    primaryKeyParam,
    safeVariableName,
    temporalArgs
  );

  var _buildCypherParameter5 = (0, _utils.buildCypherParameters)({
      args: args,
      params: params
    }),
    _buildCypherParameter6 = (0, _slicedToArray3.default)(
      _buildCypherParameter5,
      1
    ),
    preparedParams = _buildCypherParameter6[0];

  var query =
    'MATCH (' +
    safeVariableName +
    ':' +
    safeLabelName +
    (temporalClauses.length > 0
      ? ') WHERE ' + temporalClauses.join(' AND ')
      : ' {' + primaryKeyArgName + ': $' + primaryKeyArgName + '})');

  var _buildCypherSelection11 = (0, _selections.buildCypherSelection)({
      initial: '',
      selections: selections,
      variableName: variableName,
      schemaType: schemaType,
      resolveInfo: resolveInfo,
      paramIndex: 1
    }),
    _buildCypherSelection12 = (0, _slicedToArray3.default)(
      _buildCypherSelection11,
      2
    ),
    subQuery = _buildCypherSelection12[0],
    subParams = _buildCypherSelection12[1];

  params = (0, _extends4.default)({}, preparedParams, subParams);
  var deletionVariableName = (0, _utils.safeVar)(variableName + '_toDelete');
  // Cannot execute a map projection on a deleted node in Neo4j
  // so the projection is executed and aliased before the delete
  query +=
    '\nWITH ' +
    safeVariableName +
    ' AS ' +
    deletionVariableName +
    ', ' +
    safeVariableName +
    ' {' +
    subQuery +
    '} AS ' +
    safeVariableName +
    '\nDETACH DELETE ' +
    deletionVariableName +
    '\nRETURN ' +
    safeVariableName;
  return [query, params];
};

// Relation Add / Remove
var relationshipCreate = function relationshipCreate(_ref17) {
  var resolveInfo = _ref17.resolveInfo,
    selections = _ref17.selections,
    schemaType = _ref17.schemaType,
    params = _ref17.params;

  var mutationMeta = void 0,
    relationshipNameArg = void 0,
    fromTypeArg = void 0,
    toTypeArg = void 0;
  try {
    mutationMeta = resolveInfo.schema
      .getMutationType()
      .getFields()
      [resolveInfo.fieldName].astNode.directives.find(function(x) {
        return x.name.value === 'MutationMeta';
      });
  } catch (e) {
    throw new Error(
      'Missing required MutationMeta directive on add relationship directive'
    );
  }

  try {
    relationshipNameArg = mutationMeta.arguments.find(function(x) {
      return x.name.value === 'relationship';
    });
    fromTypeArg = mutationMeta.arguments.find(function(x) {
      return x.name.value === 'from';
    });
    toTypeArg = mutationMeta.arguments.find(function(x) {
      return x.name.value === 'to';
    });
  } catch (e) {
    throw new Error(
      'Missing required argument in MutationMeta directive (relationship, from, or to)'
    );
  }

  //TODO: need to handle one-to-one and one-to-many
  var args = (0, _utils.getMutationArguments)(resolveInfo);
  var typeMap = resolveInfo.schema.getTypeMap();

  var fromType = fromTypeArg.value.value;
  var fromVar = (0, _utils.lowFirstLetter)(fromType) + '_from';
  var fromInputArg = args.find(function(e) {
    return e.name.value === 'from';
  }).type;
  var fromInputAst =
    typeMap[(0, _graphql.getNamedType)(fromInputArg).type.name.value].astNode;
  var fromFields = fromInputAst.fields;
  var fromParam = fromFields[0].name.value;
  var fromTemporalArgs = (0, _utils.getTemporalArguments)(fromFields);

  var toType = toTypeArg.value.value;
  var toVar = (0, _utils.lowFirstLetter)(toType) + '_to';
  var toInputArg = args.find(function(e) {
    return e.name.value === 'to';
  }).type;
  var toInputAst =
    typeMap[(0, _graphql.getNamedType)(toInputArg).type.name.value].astNode;
  var toFields = toInputAst.fields;
  var toParam = toFields[0].name.value;
  var toTemporalArgs = (0, _utils.getTemporalArguments)(toFields);

  var relationshipName = relationshipNameArg.value.value;
  var lowercased = relationshipName.toLowerCase();
  var dataInputArg = args.find(function(e) {
    return e.name.value === 'data';
  });
  var dataInputAst = dataInputArg
    ? typeMap[(0, _graphql.getNamedType)(dataInputArg.type).type.name.value]
        .astNode
    : undefined;
  var dataFields = dataInputAst ? dataInputAst.fields : [];

  var _buildCypherParameter7 = (0, _utils.buildCypherParameters)({
      args: dataFields,
      params: params,
      paramKey: 'data'
    }),
    _buildCypherParameter8 = (0, _slicedToArray3.default)(
      _buildCypherParameter7,
      2
    ),
    preparedParams = _buildCypherParameter8[0],
    paramStatements = _buildCypherParameter8[1];

  var schemaTypeName = (0, _utils.safeVar)(schemaType);
  var fromVariable = (0, _utils.safeVar)(fromVar);
  var fromLabel = (0, _utils.safeLabel)(fromType);
  var toVariable = (0, _utils.safeVar)(toVar);
  var toLabel = (0, _utils.safeLabel)(toType);
  var relationshipVariable = (0, _utils.safeVar)(lowercased + '_relation');
  var relationshipLabel = (0, _utils.safeLabel)(relationshipName);
  var fromTemporalClauses = (0, _utils.temporalPredicateClauses)(
    preparedParams.from,
    fromVariable,
    fromTemporalArgs,
    'from'
  );
  var toTemporalClauses = (0, _utils.temporalPredicateClauses)(
    preparedParams.to,
    toVariable,
    toTemporalArgs,
    'to'
  );

  var _buildCypherSelection13 = (0, _selections.buildCypherSelection)({
      initial: '',
      selections: selections,
      schemaType: schemaType,
      resolveInfo: resolveInfo,
      paramIndex: 1,
      parentSelectionInfo: {
        rootType: 'relationship',
        from: fromVar,
        to: toVar,
        variableName: lowercased
      },
      variableName: schemaType.name === fromType ? '' + toVar : '' + fromVar
    }),
    _buildCypherSelection14 = (0, _slicedToArray3.default)(
      _buildCypherSelection13,
      2
    ),
    subQuery = _buildCypherSelection14[0],
    subParams = _buildCypherSelection14[1];

  params = (0, _extends4.default)({}, preparedParams, subParams);
  var query =
    '\n      MATCH (' +
    fromVariable +
    ':' +
    fromLabel +
    (fromTemporalClauses && fromTemporalClauses.length > 0 // uses either a WHERE clause for managed type primary keys (temporal, etc.)
      ? ') WHERE ' + fromTemporalClauses.join(' AND ') + ' ' // or a an internal matching clause for normal, scalar property primary keys
      : // NOTE this will need to change if we at some point allow for multi field node selection
        ' {' + fromParam + ': $from.' + fromParam + '})') +
    '\n      MATCH (' +
    toVariable +
    ':' +
    toLabel +
    (toTemporalClauses && toTemporalClauses.length > 0
      ? ') WHERE ' + toTemporalClauses.join(' AND ') + ' '
      : ' {' + toParam + ': $to.' + toParam + '})') +
    '\n      CREATE (' +
    fromVariable +
    ')-[' +
    relationshipVariable +
    ':' +
    relationshipLabel +
    (paramStatements.length > 0 ? ' {' + paramStatements.join(',') + '}' : '') +
    ']->(' +
    toVariable +
    ')\n      RETURN ' +
    relationshipVariable +
    ' { ' +
    subQuery +
    ' } AS ' +
    schemaTypeName +
    ';\n    ';
  return [query, params];
};

var relationshipDelete = function relationshipDelete(_ref18) {
  var resolveInfo = _ref18.resolveInfo,
    selections = _ref18.selections,
    variableName = _ref18.variableName,
    schemaType = _ref18.schemaType,
    params = _ref18.params;

  var mutationMeta = void 0,
    relationshipNameArg = void 0,
    fromTypeArg = void 0,
    toTypeArg = void 0;
  try {
    mutationMeta = resolveInfo.schema
      .getMutationType()
      .getFields()
      [resolveInfo.fieldName].astNode.directives.find(function(x) {
        return x.name.value === 'MutationMeta';
      });
  } catch (e) {
    throw new Error(
      'Missing required MutationMeta directive on add relationship directive'
    );
  }

  try {
    relationshipNameArg = mutationMeta.arguments.find(function(x) {
      return x.name.value === 'relationship';
    });
    fromTypeArg = mutationMeta.arguments.find(function(x) {
      return x.name.value === 'from';
    });
    toTypeArg = mutationMeta.arguments.find(function(x) {
      return x.name.value === 'to';
    });
  } catch (e) {
    throw new Error(
      'Missing required argument in MutationMeta directive (relationship, from, or to)'
    );
  }

  //TODO: need to handle one-to-one and one-to-many
  var args = (0, _utils.getMutationArguments)(resolveInfo);
  var typeMap = resolveInfo.schema.getTypeMap();

  var fromType = fromTypeArg.value.value;
  var fromVar = (0, _utils.lowFirstLetter)(fromType) + '_from';
  var fromInputArg = args.find(function(e) {
    return e.name.value === 'from';
  }).type;
  var fromInputAst =
    typeMap[(0, _graphql.getNamedType)(fromInputArg).type.name.value].astNode;
  var fromFields = fromInputAst.fields;
  var fromParam = fromFields[0].name.value;
  var fromTemporalArgs = (0, _utils.getTemporalArguments)(fromFields);

  var toType = toTypeArg.value.value;
  var toVar = (0, _utils.lowFirstLetter)(toType) + '_to';
  var toInputArg = args.find(function(e) {
    return e.name.value === 'to';
  }).type;
  var toInputAst =
    typeMap[(0, _graphql.getNamedType)(toInputArg).type.name.value].astNode;
  var toFields = toInputAst.fields;
  var toParam = toFields[0].name.value;
  var toTemporalArgs = (0, _utils.getTemporalArguments)(toFields);

  var relationshipName = relationshipNameArg.value.value;

  var schemaTypeName = (0, _utils.safeVar)(schemaType);
  var fromVariable = (0, _utils.safeVar)(fromVar);
  var fromLabel = (0, _utils.safeLabel)(fromType);
  var toVariable = (0, _utils.safeVar)(toVar);
  var toLabel = (0, _utils.safeLabel)(toType);
  var relationshipVariable = (0, _utils.safeVar)(fromVar + toVar);
  var relationshipLabel = (0, _utils.safeLabel)(relationshipName);
  var fromRootVariable = (0, _utils.safeVar)('_' + fromVar);
  var toRootVariable = (0, _utils.safeVar)('_' + toVar);
  var fromTemporalClauses = (0, _utils.temporalPredicateClauses)(
    params.from,
    fromVariable,
    fromTemporalArgs,
    'from'
  );
  var toTemporalClauses = (0, _utils.temporalPredicateClauses)(
    params.to,
    toVariable,
    toTemporalArgs,
    'to'
  );
  // TODO cleaner semantics: remove use of _ prefixes in root variableNames and variableName

  var _buildCypherSelection15 = (0, _selections.buildCypherSelection)(
      (0, _defineProperty3.default)(
        {
          initial: '',
          selections: selections,
          variableName: variableName,
          schemaType: schemaType,
          resolveInfo: resolveInfo,
          paramIndex: 1,
          parentSelectionInfo: {
            rootType: 'relationship',
            from: '_' + fromVar,
            to: '_' + toVar
          }
        },
        'variableName',
        schemaType.name === fromType ? '_' + toVar : '_' + fromVar
      )
    ),
    _buildCypherSelection16 = (0, _slicedToArray3.default)(
      _buildCypherSelection15,
      2
    ),
    subQuery = _buildCypherSelection16[0],
    subParams = _buildCypherSelection16[1];

  params = (0, _extends4.default)({}, params, subParams);
  var query =
    '\n      MATCH (' +
    fromVariable +
    ':' +
    fromLabel +
    (fromTemporalClauses && fromTemporalClauses.length > 0 // uses either a WHERE clause for managed type primary keys (temporal, etc.)
      ? ') WHERE ' + fromTemporalClauses.join(' AND ') + ' ' // or a an internal matching clause for normal, scalar property primary keys
      : ' {' + fromParam + ': $from.' + fromParam + '})') +
    '\n      MATCH (' +
    toVariable +
    ':' +
    toLabel +
    (toTemporalClauses && toTemporalClauses.length > 0
      ? ') WHERE ' + toTemporalClauses.join(' AND ') + ' '
      : ' {' + toParam + ': $to.' + toParam + '})') +
    '\n      OPTIONAL MATCH (' +
    fromVariable +
    ')-[' +
    relationshipVariable +
    ':' +
    relationshipLabel +
    ']->(' +
    toVariable +
    ')\n      DELETE ' +
    relationshipVariable +
    '\n      WITH COUNT(*) AS scope, ' +
    fromVariable +
    ' AS ' +
    fromRootVariable +
    ', ' +
    toVariable +
    ' AS ' +
    toRootVariable +
    '\n      RETURN {' +
    subQuery +
    '} AS ' +
    schemaTypeName +
    ';\n    ';
  return [query, params];
};

var temporalTypeSelections = function temporalTypeSelections(
  selections,
  innerSchemaType
) {
  // TODO use extractSelections instead?
  var selectedTypes =
    selections && selections[0] && selections[0].selectionSet
      ? selections[0].selectionSet.selections
      : [];
  return selectedTypes
    .reduce(function(temporalTypeFields, innerSelection) {
      // name of temporal type field
      var fieldName = innerSelection.name.value;
      var fieldTypeName = getFieldTypeName(innerSchemaType, fieldName);
      if ((0, _utils.isTemporalType)(fieldTypeName)) {
        var innerSelectedTypes = innerSelection.selectionSet
          ? innerSelection.selectionSet.selections
          : [];
        temporalTypeFields.push(
          fieldName +
            ': {' +
            innerSelectedTypes
              .reduce(function(temporalSubFields, t) {
                // temporal type subfields, year, minute, etc.
                var subFieldName = t.name.value;
                if (subFieldName === 'formatted') {
                  temporalSubFields.push(
                    subFieldName + ': toString(sortedElement.' + fieldName + ')'
                  );
                } else {
                  temporalSubFields.push(
                    subFieldName +
                      ': sortedElement.' +
                      fieldName +
                      '.' +
                      subFieldName
                  );
                }
                return temporalSubFields;
              }, [])
              .join(',') +
            '}'
        );
      }
      return temporalTypeFields;
    }, [])
    .join(',');
};

var getFieldTypeName = function getFieldTypeName(schemaType, fieldName) {
  // TODO handle for fragments?
  var field =
    schemaType && fieldName ? schemaType.getFields()[fieldName] : undefined;
  return field ? field.type.name : '';
};

var temporalOrderingFieldExists = function temporalOrderingFieldExists(
  schemaType,
  filterParams
) {
  var orderByParam = filterParams ? filterParams['orderBy'] : undefined;
  if (orderByParam) {
    orderByParam = orderByParam.value;
    if (!Array.isArray(orderByParam)) orderByParam = [orderByParam];
    return orderByParam.find(function(e) {
      var fieldName = e.substring(0, e.indexOf('_'));
      var fieldTypeName = getFieldTypeName(schemaType, fieldName);
      return (0, _utils.isTemporalType)(fieldTypeName);
    });
  }
  return undefined;
};

var buildSortMultiArgs = function buildSortMultiArgs(param) {
  var values = param ? param.value : [];
  var fieldName = '';
  if (!Array.isArray(values)) values = [values];
  return values
    .map(function(e) {
      fieldName = e.substring(0, e.indexOf('_'));
      return e.includes('_asc')
        ? "'^" + fieldName + "'"
        : "'" + fieldName + "'";
    })
    .join(',');
};

var processFilterArgument = function processFilterArgument(_ref19) {
  var fieldArgs = _ref19.fieldArgs,
    schemaType = _ref19.schemaType,
    variableName = _ref19.variableName,
    resolveInfo = _ref19.resolveInfo,
    params = _ref19.params,
    paramIndex = _ref19.paramIndex,
    _ref19$rootIsRelation = _ref19.rootIsRelationType,
    rootIsRelationType =
      _ref19$rootIsRelation === undefined ? false : _ref19$rootIsRelation;

  var filterArg = fieldArgs.find(function(e) {
    return e.name.value === 'filter';
  });
  var filterValue = (0, _keys2.default)(params).length
    ? params['filter']
    : undefined;
  var filterParamKey = paramIndex > 1 ? paramIndex - 1 + '_filter' : 'filter';
  var filterCypherParam = '$' + filterParamKey;
  var translations = [];
  // if field has both a filter argument and argument data is provided
  if (filterArg && filterValue) {
    var schema = resolveInfo.schema;
    var typeName = (0, _graphql.getNamedType)(filterArg).type.name.value;
    var filterSchemaType = schema.getType(typeName);
    // get fields of filter type
    var typeFields = filterSchemaType.getFields();

    var _analyzeFilterArgumen = analyzeFilterArguments({
        filterValue: filterValue,
        typeFields: typeFields,
        variableName: variableName,
        filterCypherParam: filterCypherParam,
        schemaType: schemaType,
        schema: schema
      }),
      _analyzeFilterArgumen2 = (0, _slicedToArray3.default)(
        _analyzeFilterArgumen,
        2
      ),
      filterFieldMap = _analyzeFilterArgumen2[0],
      serializedFilterParam = _analyzeFilterArgumen2[1];

    translations = translateFilterArguments({
      filterFieldMap: filterFieldMap,
      typeFields: typeFields,
      filterCypherParam: filterCypherParam,
      rootIsRelationType: rootIsRelationType,
      variableName: variableName,
      schemaType: schemaType,
      schema: schema
    });
    params = (0, _extends4.default)(
      {},
      params,
      (0, _defineProperty3.default)({}, filterParamKey, serializedFilterParam)
    );
  }
  return [translations, params];
};

var analyzeFilterArguments = function analyzeFilterArguments(_ref20) {
  var filterValue = _ref20.filterValue,
    typeFields = _ref20.typeFields,
    variableName = _ref20.variableName,
    filterCypherParam = _ref20.filterCypherParam,
    schemaType = _ref20.schemaType,
    schema = _ref20.schema;

  return (0, _entries2.default)(filterValue).reduce(
    function(_ref21, _ref22) {
      var _ref24 = (0, _slicedToArray3.default)(_ref21, 2),
        filterFieldMap = _ref24[0],
        serializedParams = _ref24[1];

      var _ref23 = (0, _slicedToArray3.default)(_ref22, 2),
        name = _ref23[0],
        value = _ref23[1];

      var _analyzeFilterArgumen3 = analyzeFilterArgument({
          field: typeFields[name],
          filterValue: value,
          filterValues: filterValue,
          fieldName: name,
          filterParam: filterCypherParam,
          variableName: variableName,
          schemaType: schemaType,
          schema: schema
        }),
        _analyzeFilterArgumen4 = (0, _slicedToArray3.default)(
          _analyzeFilterArgumen3,
          2
        ),
        serializedValue = _analyzeFilterArgumen4[0],
        fieldMap = _analyzeFilterArgumen4[1];

      var filterParamName = serializeFilterFieldName(name, value);
      filterFieldMap[filterParamName] = fieldMap;
      serializedParams[filterParamName] = serializedValue;
      return [filterFieldMap, serializedParams];
    },
    [{}, {}]
  );
};

var analyzeFilterArgument = function analyzeFilterArgument(_ref25) {
  var parentFieldName = _ref25.parentFieldName,
    field = _ref25.field,
    filterValue = _ref25.filterValue,
    fieldName = _ref25.fieldName,
    variableName = _ref25.variableName,
    filterParam = _ref25.filterParam,
    parentSchemaType = _ref25.parentSchemaType,
    schemaType = _ref25.schemaType,
    schema = _ref25.schema;

  var fieldType = field.type;
  var innerFieldType = (0, _utils.innerType)(fieldType);
  var typeName = innerFieldType.name;
  var parsedFilterName = parseFilterArgumentName(fieldName);
  var filterOperationField = parsedFilterName.name;
  var filterOperationType = parsedFilterName.type;
  // defaults
  var filterMapValue = true;
  var serializedFilterParam = filterValue;
  if (
    (0, _graphql.isScalarType)(innerFieldType) ||
    (0, _graphql.isEnumType)(innerFieldType)
  ) {
    if (isExistentialFilter(filterOperationType, filterValue)) {
      serializedFilterParam = true;
      filterMapValue = null;
    }
  } else if ((0, _graphql.isInputType)(innerFieldType)) {
    // check when filterSchemaType the same as schemaTypeField
    var filterSchemaType = schema.getType(typeName);
    var typeFields = filterSchemaType.getFields();
    if (fieldName === 'AND' || fieldName === 'OR') {
      var _analyzeNestedFilterA = analyzeNestedFilterArgument({
        filterValue: filterValue,
        filterOperationType: filterOperationType,
        parentFieldName: fieldName,
        parentSchemaType: schemaType,
        schemaType: schemaType,
        variableName: variableName,
        filterParam: filterParam,
        typeFields: typeFields,
        schema: schema
      });
      // recursion

      var _analyzeNestedFilterA2 = (0, _slicedToArray3.default)(
        _analyzeNestedFilterA,
        2
      );

      serializedFilterParam = _analyzeNestedFilterA2[0];
      filterMapValue = _analyzeNestedFilterA2[1];
    } else {
      var schemaTypeField = schemaType.getFields()[filterOperationField];
      var innerSchemaType = (0, _utils.innerType)(schemaTypeField.type);
      if ((0, _graphql.isObjectType)(innerSchemaType)) {
        var _decideRelationFilter = decideRelationFilterMetadata({
            fieldName: fieldName,
            parentSchemaType: parentSchemaType,
            schemaType: schemaType,
            variableName: variableName,
            innerSchemaType: innerSchemaType,
            filterOperationField: filterOperationField
          }),
          _decideRelationFilter2 = (0, _slicedToArray3.default)(
            _decideRelationFilter,
            9
          ),
          thisType = _decideRelationFilter2[0],
          relatedType = _decideRelationFilter2[1],
          relationLabel = _decideRelationFilter2[2],
          relationDirection = _decideRelationFilter2[3],
          isRelation = _decideRelationFilter2[4],
          isRelationType = _decideRelationFilter2[5],
          isRelationTypeNode = _decideRelationFilter2[6],
          isReflexiveRelationType = _decideRelationFilter2[7],
          isReflexiveTypeDirectedField = _decideRelationFilter2[8];

        if (isReflexiveTypeDirectedField) {
          // for the 'from' and 'to' fields on the payload of a reflexive
          // relation type to use the parent field name, ex: 'knows_some'
          // is used for 'from' and 'to' in 'knows_some: { from: {}, to: {} }'
          var _parsedFilterName = parseFilterArgumentName(parentFieldName);
          filterOperationField = _parsedFilterName.name;
          filterOperationType = _parsedFilterName.type;
        }
        if (isExistentialFilter(filterOperationType, filterValue)) {
          serializedFilterParam = true;
          filterMapValue = null;
        } else if ((0, _utils.isTemporalInputType)(typeName)) {
          serializedFilterParam = serializeTemporalParam(filterValue);
        } else if (isRelation || isRelationType || isRelationTypeNode) {
          var _analyzeNestedFilterA3 = analyzeNestedFilterArgument({
            filterValue: filterValue,
            filterOperationType: filterOperationType,
            isRelationType: isRelationType,
            parentFieldName: fieldName,
            parentSchemaType: schemaType,
            schemaType: innerSchemaType,
            variableName: variableName,
            filterParam: filterParam,
            typeFields: typeFields,
            schema: schema
          });
          // recursion

          var _analyzeNestedFilterA4 = (0, _slicedToArray3.default)(
            _analyzeNestedFilterA3,
            2
          );

          serializedFilterParam = _analyzeNestedFilterA4[0];
          filterMapValue = _analyzeNestedFilterA4[1];
        }
      }
    }
  }
  return [serializedFilterParam, filterMapValue];
};

var analyzeNestedFilterArgument = function analyzeNestedFilterArgument(_ref26) {
  var parentSchemaType = _ref26.parentSchemaType,
    parentFieldName = _ref26.parentFieldName,
    schemaType = _ref26.schemaType,
    variableName = _ref26.variableName,
    filterValue = _ref26.filterValue,
    filterParam = _ref26.filterParam,
    typeFields = _ref26.typeFields,
    schema = _ref26.schema;

  var isList = Array.isArray(filterValue);
  // coersion to array for dynamic iteration of objects and arrays
  if (!isList) filterValue = [filterValue];
  var serializedFilterValue = [];
  var filterValueFieldMap = {};
  filterValue.forEach(function(filter) {
    var serializedValues = {};
    var serializedValue = {};
    var valueFieldMap = {};
    (0, _entries2.default)(filter).forEach(function(_ref27) {
      var _ref28 = (0, _slicedToArray3.default)(_ref27, 2),
        fieldName = _ref28[0],
        value = _ref28[1];

      fieldName = deserializeFilterFieldName(fieldName);

      var _analyzeFilterArgumen5 = analyzeFilterArgument({
        parentFieldName: parentFieldName,
        field: typeFields[fieldName],
        filterValue: value,
        filterValues: filter,
        fieldName: fieldName,
        variableName: variableName,
        filterParam: filterParam,
        parentSchemaType: parentSchemaType,
        schemaType: schemaType,
        schema: schema
      });

      var _analyzeFilterArgumen6 = (0, _slicedToArray3.default)(
        _analyzeFilterArgumen5,
        2
      );

      serializedValue = _analyzeFilterArgumen6[0];
      valueFieldMap = _analyzeFilterArgumen6[1];

      var filterParamName = serializeFilterFieldName(fieldName, value);
      var filterMapEntry = filterValueFieldMap[filterParamName];
      if (!filterMapEntry) filterValueFieldMap[filterParamName] = valueFieldMap;
      // deep merges in order to capture differences in objects within nested array filters
      else
        filterValueFieldMap[filterParamName] = _lodash2.default.merge(
          filterMapEntry,
          valueFieldMap
        );
      serializedValues[filterParamName] = serializedValue;
    });
    serializedFilterValue.push(serializedValues);
  });
  // undo array coersion
  if (!isList) serializedFilterValue = serializedFilterValue[0];
  return [serializedFilterValue, filterValueFieldMap];
};

var serializeFilterFieldName = function serializeFilterFieldName(name, value) {
  if (value === null) {
    var parsedFilterName = parseFilterArgumentName(name);
    var filterOperationType = parsedFilterName.type;
    if (!filterOperationType || filterOperationType === 'not') {
      return '_' + name + '_null';
    }
  }
  return name;
};

var serializeTemporalParam = function serializeTemporalParam(filterValue) {
  var isList = Array.isArray(filterValue);
  if (!isList) filterValue = [filterValue];
  var serializedValues = filterValue.reduce(function(serializedValues, filter) {
    var serializedValue = {};
    if (filter['formatted']) serializedValue = filter['formatted'];
    else {
      serializedValue = (0, _entries2.default)(filter).reduce(function(
        serialized,
        _ref29
      ) {
        var _ref30 = (0, _slicedToArray3.default)(_ref29, 2),
          key = _ref30[0],
          value = _ref30[1];

        if ((0, _isInteger2.default)(value)) value = _neo4jDriver.v1.int(value);
        serialized[key] = value;
        return serialized;
      },
      {});
    }
    serializedValues.push(serializedValue);
    return serializedValues;
  }, []);
  if (!isList) serializedValues = serializedValues[0];
  return serializedValues;
};

var deserializeFilterFieldName = function deserializeFilterFieldName(name) {
  if (name.startsWith('_') && name.endsWith('_null')) {
    name = name.substring(1, name.length - 5);
  }
  return name;
};

var translateFilterArguments = function translateFilterArguments(_ref31) {
  var filterFieldMap = _ref31.filterFieldMap,
    typeFields = _ref31.typeFields,
    filterCypherParam = _ref31.filterCypherParam,
    variableName = _ref31.variableName,
    rootIsRelationType = _ref31.rootIsRelationType,
    schemaType = _ref31.schemaType,
    schema = _ref31.schema;

  return (0, _entries2.default)(filterFieldMap).reduce(function(
    translations,
    _ref32
  ) {
    var _ref33 = (0, _slicedToArray3.default)(_ref32, 2),
      name = _ref33[0],
      value = _ref33[1];

    // the filter field map uses serialized field names to allow for both field: {} and field: null
    name = deserializeFilterFieldName(name);
    var translation = translateFilterArgument({
      field: typeFields[name],
      filterParam: filterCypherParam,
      fieldName: name,
      filterValue: value,
      rootIsRelationType: rootIsRelationType,
      variableName: variableName,
      schemaType: schemaType,
      schema: schema
    });
    if (translation) {
      translations.push('(' + translation + ')');
    }
    return translations;
  },
  []);
};

var translateFilterArgument = function translateFilterArgument(_ref34) {
  var parentParamPath = _ref34.parentParamPath,
    parentFieldName = _ref34.parentFieldName,
    isListFilterArgument = _ref34.isListFilterArgument,
    field = _ref34.field,
    filterValue = _ref34.filterValue,
    fieldName = _ref34.fieldName,
    rootIsRelationType = _ref34.rootIsRelationType,
    variableName = _ref34.variableName,
    filterParam = _ref34.filterParam,
    parentSchemaType = _ref34.parentSchemaType,
    schemaType = _ref34.schemaType,
    schema = _ref34.schema;

  var fieldType = field.type;
  var innerFieldType = (0, _utils.innerType)(fieldType);
  // get name of filter field type (ex: _PersonFilter)
  var typeName = innerFieldType.name;
  // build path for parameter data for current filter field
  var parameterPath =
    (parentParamPath ? parentParamPath : filterParam) + '.' + fieldName;
  // parse field name into prefix (ex: name, company) and
  // possible suffix identifying operation type (ex: _gt, _in)
  var parsedFilterName = parseFilterArgumentName(fieldName);
  var filterOperationField = parsedFilterName.name;
  var filterOperationType = parsedFilterName.type;
  // short-circuit evaluation: predicate used to skip a field
  // if processing a list of objects that possibly contain different arguments
  var nullFieldPredicate = decideNullSkippingPredicate({
    parameterPath: parameterPath,
    isListFilterArgument: isListFilterArgument,
    parentParamPath: parentParamPath
  });
  var translation = '';
  if (
    (0, _graphql.isScalarType)(innerFieldType) ||
    (0, _graphql.isEnumType)(innerFieldType)
  ) {
    translation = translateScalarFilter({
      isListFilterArgument: isListFilterArgument,
      filterOperationField: filterOperationField,
      filterOperationType: filterOperationType,
      filterValue: filterValue,
      fieldName: fieldName,
      variableName: variableName,
      parameterPath: parameterPath,
      parentParamPath: parentParamPath,
      filterParam: filterParam,
      nullFieldPredicate: nullFieldPredicate
    });
  } else if ((0, _graphql.isInputType)(innerFieldType)) {
    translation = translateInputFilter({
      rootIsRelationType: rootIsRelationType,
      isListFilterArgument: isListFilterArgument,
      filterOperationField: filterOperationField,
      filterOperationType: filterOperationType,
      filterValue: filterValue,
      variableName: variableName,
      fieldName: fieldName,
      filterParam: filterParam,
      typeName: typeName,
      fieldType: fieldType,
      schema: schema,
      parentSchemaType: parentSchemaType,
      schemaType: schemaType,
      parameterPath: parameterPath,
      parentParamPath: parentParamPath,
      parentFieldName: parentFieldName,
      nullFieldPredicate: nullFieldPredicate
    });
  }
  return translation;
};

var parseFilterArgumentName = function parseFilterArgumentName(fieldName) {
  var fieldNameParts = fieldName.split('_');

  var filterTypes = [
    '_not',
    '_in',
    '_not_in',
    '_contains',
    '_not_contains',
    '_starts_with',
    '_not_starts_with',
    '_ends_with',
    '_not_ends_with',
    '_lt',
    '_lte',
    '_gt',
    '_gte',
    '_some',
    '_none',
    '_single',
    '_every'
  ];

  var filterType = '';

  if (fieldNameParts.length > 1) {
    var regExp = [];

    _lodash2.default.each(filterTypes, function(f) {
      regExp.push(f + '$');
    });

    var regExpJoin = '(' + regExp.join('|') + ')';
    var preparedFieldAndFilterField = _lodash2.default.replace(
      fieldName,
      new RegExp(regExpJoin),
      '[::filterFieldSeperator::]$1'
    );

    var _preparedFieldAndFilt = preparedFieldAndFilterField.split(
        '[::filterFieldSeperator::]'
      ),
      _preparedFieldAndFilt2 = (0, _slicedToArray3.default)(
        _preparedFieldAndFilt,
        2
      ),
      parsedField = _preparedFieldAndFilt2[0],
      parsedFilterField = _preparedFieldAndFilt2[1];

    fieldName = !_lodash2.default.isUndefined(parsedField)
      ? parsedField
      : fieldName;
    filterType = !_lodash2.default.isUndefined(parsedFilterField)
      ? parsedFilterField.substr(1)
      : ''; // Strip off first underscore
  }

  return {
    name: fieldName,
    type: filterType
  };
};

var translateScalarFilter = function translateScalarFilter(_ref35) {
  var isListFilterArgument = _ref35.isListFilterArgument,
    filterOperationField = _ref35.filterOperationField,
    filterOperationType = _ref35.filterOperationType,
    filterValue = _ref35.filterValue,
    variableName = _ref35.variableName,
    parameterPath = _ref35.parameterPath,
    parentParamPath = _ref35.parentParamPath,
    filterParam = _ref35.filterParam,
    nullFieldPredicate = _ref35.nullFieldPredicate;

  // build path to node/relationship property
  var propertyPath =
    (0, _utils.safeVar)(variableName) + '.' + filterOperationField;
  if (isExistentialFilter(filterOperationType, filterValue)) {
    return translateNullFilter({
      filterOperationField: filterOperationField,
      filterOperationType: filterOperationType,
      propertyPath: propertyPath,
      filterParam: filterParam,
      parentParamPath: parentParamPath,
      isListFilterArgument: isListFilterArgument
    });
  }
  return (
    '' +
    nullFieldPredicate +
    buildOperatorExpression(filterOperationType, propertyPath) +
    ' ' +
    parameterPath
  );
};

var isExistentialFilter = function isExistentialFilter(type, value) {
  return (!type || type === 'not') && value === null;
};

var decideNullSkippingPredicate = function decideNullSkippingPredicate(_ref36) {
  var parameterPath = _ref36.parameterPath,
    isListFilterArgument = _ref36.isListFilterArgument,
    parentParamPath = _ref36.parentParamPath;
  return isListFilterArgument && parentParamPath
    ? parameterPath + ' IS NULL OR '
    : '';
};

var translateNullFilter = function translateNullFilter(_ref37) {
  var filterOperationField = _ref37.filterOperationField,
    filterOperationType = _ref37.filterOperationType,
    filterParam = _ref37.filterParam,
    propertyPath = _ref37.propertyPath,
    parentParamPath = _ref37.parentParamPath,
    isListFilterArgument = _ref37.isListFilterArgument;

  var isNegationFilter = filterOperationType === 'not';
  // allign with modified parameter names for null filters
  var paramPath =
    (parentParamPath ? parentParamPath : filterParam) +
    '._' +
    filterOperationField +
    '_' +
    (isNegationFilter ? 'not_' : '') +
    'null';
  // build a predicate for checking the existence of a
  // property or relationship
  var predicate =
    paramPath +
    ' = TRUE AND' +
    (isNegationFilter ? '' : ' NOT') +
    ' EXISTS(' +
    propertyPath +
    ')';
  // skip the field if it is null in the case of it
  // existing within one of many objects in a list filter
  var nullFieldPredicate = decideNullSkippingPredicate({
    parameterPath: paramPath,
    isListFilterArgument: isListFilterArgument,
    parentParamPath: parentParamPath
  });
  return '' + nullFieldPredicate + predicate;
};

var buildOperatorExpression = function buildOperatorExpression(
  filterOperationType,
  propertyPath,
  isListFilterArgument
) {
  if (isListFilterArgument) return propertyPath + ' =';
  switch (filterOperationType) {
    case 'not':
      return 'NOT ' + propertyPath + ' = ';
    case 'in':
      return propertyPath + ' IN';
    case 'not_in':
      return 'NOT ' + propertyPath + ' IN';
    case 'contains':
      return propertyPath + ' CONTAINS';
    case 'not_contains':
      return 'NOT ' + propertyPath + ' CONTAINS';
    case 'starts_with':
      return propertyPath + ' STARTS WITH';
    case 'not_starts_with':
      return 'NOT ' + propertyPath + ' STARTS WITH';
    case 'ends_with':
      return propertyPath + ' ENDS WITH';
    case 'not_ends_with':
      return 'NOT ' + propertyPath + ' ENDS WITH';
    case 'lt':
      return propertyPath + ' <';
    case 'lte':
      return propertyPath + ' <=';
    case 'gt':
      return propertyPath + ' >';
    case 'gte':
      return propertyPath + ' >=';
    default: {
      return propertyPath + ' =';
    }
  }
};

var translateInputFilter = function translateInputFilter(_ref38) {
  var rootIsRelationType = _ref38.rootIsRelationType,
    isListFilterArgument = _ref38.isListFilterArgument,
    filterOperationField = _ref38.filterOperationField,
    filterOperationType = _ref38.filterOperationType,
    filterValue = _ref38.filterValue,
    variableName = _ref38.variableName,
    fieldName = _ref38.fieldName,
    filterParam = _ref38.filterParam,
    typeName = _ref38.typeName,
    fieldType = _ref38.fieldType,
    schema = _ref38.schema,
    parentSchemaType = _ref38.parentSchemaType,
    schemaType = _ref38.schemaType,
    parameterPath = _ref38.parameterPath,
    parentParamPath = _ref38.parentParamPath,
    parentFieldName = _ref38.parentFieldName,
    nullFieldPredicate = _ref38.nullFieldPredicate;

  // check when filterSchemaType the same as schemaTypeField
  var filterSchemaType = schema.getType(typeName);
  var typeFields = filterSchemaType.getFields();
  if (fieldName === 'AND' || fieldName === 'OR') {
    return translateLogicalFilter({
      filterValue: filterValue,
      variableName: variableName,
      filterOperationType: filterOperationType,
      filterOperationField: filterOperationField,
      fieldName: fieldName,
      filterParam: filterParam,
      typeFields: typeFields,
      schema: schema,
      schemaType: schemaType,
      parameterPath: parameterPath,
      nullFieldPredicate: nullFieldPredicate
    });
  } else {
    var schemaTypeField = schemaType.getFields()[filterOperationField];
    var innerSchemaType = (0, _utils.innerType)(schemaTypeField.type);
    if ((0, _graphql.isObjectType)(innerSchemaType)) {
      var _decideRelationFilter3 = decideRelationFilterMetadata({
          fieldName: fieldName,
          parentSchemaType: parentSchemaType,
          schemaType: schemaType,
          variableName: variableName,
          innerSchemaType: innerSchemaType,
          filterOperationField: filterOperationField
        }),
        _decideRelationFilter4 = (0, _slicedToArray3.default)(
          _decideRelationFilter3,
          9
        ),
        thisType = _decideRelationFilter4[0],
        relatedType = _decideRelationFilter4[1],
        relationLabel = _decideRelationFilter4[2],
        relationDirection = _decideRelationFilter4[3],
        isRelation = _decideRelationFilter4[4],
        isRelationType = _decideRelationFilter4[5],
        isRelationTypeNode = _decideRelationFilter4[6],
        isReflexiveRelationType = _decideRelationFilter4[7],
        isReflexiveTypeDirectedField = _decideRelationFilter4[8];

      if ((0, _utils.isTemporalInputType)(typeName)) {
        var temporalFunction = (0, _utils.decideTemporalConstructor)(typeName);
        return translateTemporalFilter({
          isRelationTypeNode: isRelationTypeNode,
          filterValue: filterValue,
          variableName: variableName,
          filterOperationField: filterOperationField,
          filterOperationType: filterOperationType,
          fieldName: fieldName,
          filterParam: filterParam,
          fieldType: fieldType,
          parameterPath: parameterPath,
          parentParamPath: parentParamPath,
          isListFilterArgument: isListFilterArgument,
          nullFieldPredicate: nullFieldPredicate,
          temporalFunction: temporalFunction
        });
      } else if (isRelation || isRelationType || isRelationTypeNode) {
        return translateRelationFilter({
          rootIsRelationType: rootIsRelationType,
          thisType: thisType,
          relatedType: relatedType,
          relationLabel: relationLabel,
          relationDirection: relationDirection,
          isRelationType: isRelationType,
          isRelationTypeNode: isRelationTypeNode,
          isReflexiveRelationType: isReflexiveRelationType,
          isReflexiveTypeDirectedField: isReflexiveTypeDirectedField,
          filterValue: filterValue,
          variableName: variableName,
          filterOperationField: filterOperationField,
          filterOperationType: filterOperationType,
          fieldName: fieldName,
          filterParam: filterParam,
          typeFields: typeFields,
          fieldType: fieldType,
          schema: schema,
          schemaType: schemaType,
          innerSchemaType: innerSchemaType,
          parameterPath: parameterPath,
          parentParamPath: parentParamPath,
          isListFilterArgument: isListFilterArgument,
          nullFieldPredicate: nullFieldPredicate,
          parentSchemaType: parentSchemaType,
          parentFieldName: parentFieldName
        });
      }
    }
  }
};

var translateLogicalFilter = function translateLogicalFilter(_ref39) {
  var filterValue = _ref39.filterValue,
    variableName = _ref39.variableName,
    filterOperationType = _ref39.filterOperationType,
    filterOperationField = _ref39.filterOperationField,
    fieldName = _ref39.fieldName,
    filterParam = _ref39.filterParam,
    typeFields = _ref39.typeFields,
    schema = _ref39.schema,
    schemaType = _ref39.schemaType,
    parameterPath = _ref39.parameterPath,
    nullFieldPredicate = _ref39.nullFieldPredicate;

  var listElementVariable = '_' + fieldName;
  // build predicate expressions for all unique arguments within filterValue
  // isListFilterArgument is true here so that nullFieldPredicate is used
  var predicates = buildFilterPredicates({
    filterOperationType: filterOperationType,
    parentFieldName: fieldName,
    listVariable: listElementVariable,
    parentSchemaType: schemaType,
    isListFilterArgument: true,
    schemaType: schemaType,
    variableName: variableName,
    filterValue: filterValue,
    filterParam: filterParam,
    typeFields: typeFields,
    schema: schema
  });
  var predicateListVariable = parameterPath;
  // decide root predicate function
  var rootPredicateFunction = decidePredicateFunction({
    filterOperationField: filterOperationField
  });
  // build root predicate expression
  var translation = buildPredicateFunction({
    nullFieldPredicate: nullFieldPredicate,
    predicateListVariable: predicateListVariable,
    rootPredicateFunction: rootPredicateFunction,
    predicates: predicates,
    listElementVariable: listElementVariable
  });
  return translation;
};

var translateRelationFilter = function translateRelationFilter(_ref40) {
  var rootIsRelationType = _ref40.rootIsRelationType,
    thisType = _ref40.thisType,
    relatedType = _ref40.relatedType,
    relationLabel = _ref40.relationLabel,
    relationDirection = _ref40.relationDirection,
    isRelationType = _ref40.isRelationType,
    isRelationTypeNode = _ref40.isRelationTypeNode,
    isReflexiveRelationType = _ref40.isReflexiveRelationType,
    isReflexiveTypeDirectedField = _ref40.isReflexiveTypeDirectedField,
    filterValue = _ref40.filterValue,
    variableName = _ref40.variableName,
    filterOperationField = _ref40.filterOperationField,
    filterOperationType = _ref40.filterOperationType,
    fieldName = _ref40.fieldName,
    filterParam = _ref40.filterParam,
    typeFields = _ref40.typeFields,
    fieldType = _ref40.fieldType,
    schema = _ref40.schema,
    schemaType = _ref40.schemaType,
    innerSchemaType = _ref40.innerSchemaType,
    parameterPath = _ref40.parameterPath,
    parentParamPath = _ref40.parentParamPath,
    isListFilterArgument = _ref40.isListFilterArgument,
    nullFieldPredicate = _ref40.nullFieldPredicate,
    parentSchemaType = _ref40.parentSchemaType,
    parentFieldName = _ref40.parentFieldName;

  if (isReflexiveTypeDirectedField) {
    // when at the 'from' or 'to' fields of a reflexive relation type payload
    // we need to use the name of the parent schema type, ex: 'person' for
    // Person.knows gets used here for reflexive path patterns, rather than
    // the normally set 'person_filter_person' variableName
    variableName = parentSchemaType.name.toLowerCase();
  }
  var pathExistencePredicate = buildRelationExistencePath(
    variableName,
    relationLabel,
    relationDirection,
    relatedType,
    isRelationTypeNode
  );
  if (isExistentialFilter(filterOperationType, filterValue)) {
    return translateNullFilter({
      filterOperationField: filterOperationField,
      filterOperationType: filterOperationType,
      propertyPath: pathExistencePredicate,
      filterParam: filterParam,
      parentParamPath: parentParamPath,
      isListFilterArgument: isListFilterArgument
    });
  }
  if (isReflexiveTypeDirectedField) {
    // causes the 'from' and 'to' fields on the payload of a reflexive
    // relation type to use the parent field name, ex: 'knows_some'
    // is used for 'from' and 'to' in 'knows_some: { from: {}, to: {} }'
    var parsedFilterName = parseFilterArgumentName(parentFieldName);
    filterOperationField = parsedFilterName.name;
    filterOperationType = parsedFilterName.type;
  }
  // build a list comprehension containing path pattern for related type
  var predicateListVariable = buildRelatedTypeListComprehension({
    rootIsRelationType: rootIsRelationType,
    variableName: variableName,
    thisType: thisType,
    relatedType: relatedType,
    relationLabel: relationLabel,
    relationDirection: relationDirection,
    isRelationTypeNode: isRelationTypeNode,
    isRelationType: isRelationType
  });

  var rootPredicateFunction = decidePredicateFunction({
    isRelationTypeNode: isRelationTypeNode,
    filterOperationField: filterOperationField,
    filterOperationType: filterOperationType
  });
  return buildRelationPredicate({
    rootIsRelationType: rootIsRelationType,
    isRelationType: isRelationType,
    isListFilterArgument: isListFilterArgument,
    isReflexiveRelationType: isReflexiveRelationType,
    isReflexiveTypeDirectedField: isReflexiveTypeDirectedField,
    thisType: thisType,
    relatedType: relatedType,
    schemaType: schemaType,
    innerSchemaType: innerSchemaType,
    fieldName: fieldName,
    fieldType: fieldType,
    filterOperationType: filterOperationType,
    filterValue: filterValue,
    filterParam: filterParam,
    typeFields: typeFields,
    schema: schema,
    parameterPath: parameterPath,
    nullFieldPredicate: nullFieldPredicate,
    pathExistencePredicate: pathExistencePredicate,
    predicateListVariable: predicateListVariable,
    rootPredicateFunction: rootPredicateFunction
  });
};

var decideRelationFilterMetadata = function decideRelationFilterMetadata(
  _ref41
) {
  var fieldName = _ref41.fieldName,
    parentSchemaType = _ref41.parentSchemaType,
    schemaType = _ref41.schemaType,
    variableName = _ref41.variableName,
    innerSchemaType = _ref41.innerSchemaType,
    filterOperationField = _ref41.filterOperationField;

  var thisType = '';
  var relatedType = '';
  var isRelation = false;
  var isRelationType = false;
  var isRelationTypeNode = false;
  var isReflexiveRelationType = false;
  var isReflexiveTypeDirectedField = false;
  // @relation field directive

  var _relationDirective = (0, _utils.relationDirective)(
      schemaType,
      filterOperationField
    ),
    relLabel = _relationDirective.name,
    relDirection = _relationDirective.direction;
  // @relation type directive on node type field

  var innerRelationTypeDirective = (0, _utils.getRelationTypeDirective)(
    innerSchemaType.astNode
  );
  // @relation type directive on this type; node type field on relation type
  // If there is no @relation directive on the schemaType, check the parentSchemaType
  // for the same directive obtained above when the relation type is first seen
  var relationTypeDirective = (0, _utils.getRelationTypeDirective)(
    schemaType.astNode
  );
  if (relLabel && relDirection) {
    isRelation = true;
    var typeVariables = (0, _utils.typeIdentifiers)(innerSchemaType);
    thisType = schemaType.name;
    relatedType = typeVariables.typeName;
  } else if (innerRelationTypeDirective) {
    isRelationType = true;

    var _decideRelationTypeDi = decideRelationTypeDirection(
      schemaType,
      innerRelationTypeDirective
    );

    var _decideRelationTypeDi2 = (0, _slicedToArray3.default)(
      _decideRelationTypeDi,
      3
    );

    thisType = _decideRelationTypeDi2[0];
    relatedType = _decideRelationTypeDi2[1];
    relDirection = _decideRelationTypeDi2[2];

    if (thisType === relatedType) {
      isReflexiveRelationType = true;
      if (fieldName === 'from') {
        isReflexiveTypeDirectedField = true;
        relDirection = 'IN';
      } else if (fieldName === 'to') {
        isReflexiveTypeDirectedField = true;
        relDirection = 'OUT';
      }
    }
    relLabel = innerRelationTypeDirective.name;
  } else if (relationTypeDirective) {
    isRelationTypeNode = true;

    var _decideRelationTypeDi3 = decideRelationTypeDirection(
      parentSchemaType,
      relationTypeDirective
    );

    var _decideRelationTypeDi4 = (0, _slicedToArray3.default)(
      _decideRelationTypeDi3,
      3
    );

    thisType = _decideRelationTypeDi4[0];
    relatedType = _decideRelationTypeDi4[1];
    relDirection = _decideRelationTypeDi4[2];

    relLabel = variableName;
  }
  return [
    thisType,
    relatedType,
    relLabel,
    relDirection,
    isRelation,
    isRelationType,
    isRelationTypeNode,
    isReflexiveRelationType,
    isReflexiveTypeDirectedField
  ];
};

var decideRelationTypeDirection = function decideRelationTypeDirection(
  schemaType,
  relationTypeDirective
) {
  var fromType = relationTypeDirective.from;
  var toType = relationTypeDirective.to;
  var relDirection = 'OUT';
  if (fromType !== toType) {
    if (schemaType && schemaType.name === toType) {
      var temp = fromType;
      fromType = toType;
      toType = temp;
      relDirection = 'IN';
    }
  }
  return [fromType, toType, relDirection];
};

var buildRelationPredicate = function buildRelationPredicate(_ref42) {
  var rootIsRelationType = _ref42.rootIsRelationType,
    isRelationType = _ref42.isRelationType,
    isReflexiveRelationType = _ref42.isReflexiveRelationType,
    isReflexiveTypeDirectedField = _ref42.isReflexiveTypeDirectedField,
    thisType = _ref42.thisType,
    isListFilterArgument = _ref42.isListFilterArgument,
    relatedType = _ref42.relatedType,
    schemaType = _ref42.schemaType,
    innerSchemaType = _ref42.innerSchemaType,
    fieldName = _ref42.fieldName,
    fieldType = _ref42.fieldType,
    filterOperationType = _ref42.filterOperationType,
    filterValue = _ref42.filterValue,
    filterParam = _ref42.filterParam,
    typeFields = _ref42.typeFields,
    schema = _ref42.schema,
    parameterPath = _ref42.parameterPath,
    nullFieldPredicate = _ref42.nullFieldPredicate,
    pathExistencePredicate = _ref42.pathExistencePredicate,
    predicateListVariable = _ref42.predicateListVariable,
    rootPredicateFunction = _ref42.rootPredicateFunction;

  var relationVariable = buildRelationVariable(thisType, relatedType);
  var isRelationList = (0, _graphql.isListType)(fieldType);
  var variableName = relatedType.toLowerCase();
  var listVariable = parameterPath;
  if (rootIsRelationType || isRelationType) {
    // change the variable to be used in filtering
    // to the appropriate relationship variable
    // ex: project -> person_filter_project
    variableName = relationVariable;
  }
  if (isRelationList) {
    // set the base list comprehension variable
    // to point at each array element instead
    // ex: $filter.company_in -> _company_in
    listVariable = '_' + fieldName;
    // set to list to enable null field
    // skipping for all child filters
    isListFilterArgument = true;
  }
  var predicates = buildFilterPredicates({
    parentFieldName: fieldName,
    parentSchemaType: schemaType,
    schemaType: innerSchemaType,
    variableName: variableName,
    isListFilterArgument: isListFilterArgument,
    listVariable: listVariable,
    filterOperationType: filterOperationType,
    isRelationType: isRelationType,
    filterValue: filterValue,
    filterParam: filterParam,
    typeFields: typeFields,
    schema: schema
  });
  if (isRelationList) {
    predicates = buildPredicateFunction({
      predicateListVariable: parameterPath,
      listElementVariable: listVariable,
      rootPredicateFunction: rootPredicateFunction,
      predicates: predicates
    });
    rootPredicateFunction = decidePredicateFunction({
      isRelationList: isRelationList
    });
  }
  if (isReflexiveRelationType && !isReflexiveTypeDirectedField) {
    // At reflexive relation type fields, sufficient predicates and values are already
    // obtained from the above call to the recursive buildFilterPredicates
    // ex: Person.knows, Person.knows_in, etc.
    // Note: Since only the internal 'from' and 'to' fields are translated for reflexive
    // relation types, their translations will use the fieldName and schema type name
    // of this field. See: the top of translateRelationFilter
    return predicates;
  }
  var listElementVariable = (0, _utils.safeVar)(variableName);
  return buildPredicateFunction({
    nullFieldPredicate: nullFieldPredicate,
    pathExistencePredicate: pathExistencePredicate,
    predicateListVariable: predicateListVariable,
    rootPredicateFunction: rootPredicateFunction,
    predicates: predicates,
    listElementVariable: listElementVariable
  });
};

var buildPredicateFunction = function buildPredicateFunction(_ref43) {
  var nullFieldPredicate = _ref43.nullFieldPredicate,
    pathExistencePredicate = _ref43.pathExistencePredicate,
    predicateListVariable = _ref43.predicateListVariable,
    rootPredicateFunction = _ref43.rootPredicateFunction,
    predicates = _ref43.predicates,
    listElementVariable = _ref43.listElementVariable;

  // https://neo4j.com/docs/cypher-manual/current/functions/predicate/
  return (
    '' +
    (nullFieldPredicate || '') +
    (pathExistencePredicate
      ? 'EXISTS(' + pathExistencePredicate + ') AND '
      : '') +
    rootPredicateFunction +
    '(' +
    listElementVariable +
    ' IN ' +
    predicateListVariable +
    ' WHERE ' +
    predicates +
    ')'
  );
};

var buildRelationVariable = function buildRelationVariable(
  thisType,
  relatedType
) {
  return thisType.toLowerCase() + '_filter_' + relatedType.toLowerCase();
};

var decidePredicateFunction = function decidePredicateFunction(_ref44) {
  var filterOperationField = _ref44.filterOperationField,
    filterOperationType = _ref44.filterOperationType,
    isRelationTypeNode = _ref44.isRelationTypeNode,
    isRelationList = _ref44.isRelationList;

  if (filterOperationField === 'AND') return 'ALL';
  else if (filterOperationField === 'OR') return 'ANY';
  else if (isRelationTypeNode) return 'ALL';
  else if (isRelationList) return 'ALL';
  else {
    switch (filterOperationType) {
      case 'not':
        return 'NONE';
      case 'in':
        return 'ANY';
      case 'not_in':
        return 'NONE';
      case 'some':
        return 'ANY';
      case 'every':
        return 'ALL';
      case 'none':
        return 'NONE';
      case 'single':
        return 'SINGLE';
      default:
        return 'ALL';
    }
  }
};

var buildRelatedTypeListComprehension = function buildRelatedTypeListComprehension(
  _ref45
) {
  var rootIsRelationType = _ref45.rootIsRelationType,
    variableName = _ref45.variableName,
    thisType = _ref45.thisType,
    relatedType = _ref45.relatedType,
    relationLabel = _ref45.relationLabel,
    relationDirection = _ref45.relationDirection,
    isRelationTypeNode = _ref45.isRelationTypeNode,
    isRelationType = _ref45.isRelationType;

  var relationVariable = buildRelationVariable(thisType, relatedType);
  if (rootIsRelationType) {
    relationVariable = variableName;
  }
  var thisTypeVariable = (0, _utils.safeVar)(thisType.toLowerCase());
  // prevents related node variable from
  // conflicting with parent variables
  var relatedTypeVariable = (0, _utils.safeVar)(
    '_' + relatedType.toLowerCase()
  );
  // builds a path pattern within a list comprehension
  // that extracts related nodes
  return (
    '[(' +
    variableName +
    ')' +
    (relationDirection === 'IN' ? '<' : '') +
    '-[' +
    (isRelationType
      ? (0, _utils.safeVar)('_' + relationVariable)
      : isRelationTypeNode
      ? (0, _utils.safeVar)(relationVariable)
      : '') +
    (!isRelationTypeNode ? ':' + relationLabel : '') +
    ']-' +
    (relationDirection === 'OUT' ? '>' : '') +
    '(' +
    (isRelationType ? '' : relatedTypeVariable) +
    ':' +
    relatedType +
    ') | ' +
    (isRelationType
      ? (0, _utils.safeVar)('_' + relationVariable)
      : relatedTypeVariable) +
    ']'
  );
};

var buildRelationExistencePath = function buildRelationExistencePath(
  fromVar,
  relLabel,
  relDirection,
  toType,
  isRelationTypeNode
) {
  // because ALL(n IN [] WHERE n) currently returns true
  // an existence predicate is added to make sure a relationship exists
  // otherwise a node returns when it has 0 such relationships, since the
  // predicate function then evaluates an empty list
  var safeFromVar = (0, _utils.safeVar)(fromVar);
  return !isRelationTypeNode
    ? '(' +
        safeFromVar +
        ')' +
        (relDirection === 'IN' ? '<' : '') +
        '-[:' +
        relLabel +
        ']-' +
        (relDirection === 'OUT' ? '>' : '') +
        '(:' +
        toType +
        ')'
    : '';
};

var buildFilterPredicates = function buildFilterPredicates(_ref46) {
  var parentSchemaType = _ref46.parentSchemaType,
    parentFieldName = _ref46.parentFieldName,
    schemaType = _ref46.schemaType,
    variableName = _ref46.variableName,
    listVariable = _ref46.listVariable,
    filterValue = _ref46.filterValue,
    filterParam = _ref46.filterParam,
    typeFields = _ref46.typeFields,
    schema = _ref46.schema,
    isListFilterArgument = _ref46.isListFilterArgument;

  return (0, _entries2.default)(filterValue)
    .reduce(function(predicates, _ref47) {
      var _ref48 = (0, _slicedToArray3.default)(_ref47, 2),
        name = _ref48[0],
        value = _ref48[1];

      name = deserializeFilterFieldName(name);
      var predicate = translateFilterArgument({
        field: typeFields[name],
        parentParamPath: listVariable,
        fieldName: name,
        filterValue: value,
        parentFieldName: parentFieldName,
        parentSchemaType: parentSchemaType,
        isListFilterArgument: isListFilterArgument,
        variableName: variableName,
        filterParam: filterParam,
        schemaType: schemaType,
        schema: schema
      });
      if (predicate) {
        predicates.push('(' + predicate + ')');
      }
      return predicates;
    }, [])
    .join(' AND ');
};

var translateTemporalFilter = function translateTemporalFilter(_ref49) {
  var isRelationTypeNode = _ref49.isRelationTypeNode,
    filterValue = _ref49.filterValue,
    variableName = _ref49.variableName,
    filterOperationField = _ref49.filterOperationField,
    filterOperationType = _ref49.filterOperationType,
    fieldName = _ref49.fieldName,
    filterParam = _ref49.filterParam,
    fieldType = _ref49.fieldType,
    parameterPath = _ref49.parameterPath,
    parentParamPath = _ref49.parentParamPath,
    isListFilterArgument = _ref49.isListFilterArgument,
    nullFieldPredicate = _ref49.nullFieldPredicate,
    temporalFunction = _ref49.temporalFunction;

  var safeVariableName = (0, _utils.safeVar)(variableName);
  var propertyPath = safeVariableName + '.' + filterOperationField;
  if (isExistentialFilter(filterOperationType, filterValue)) {
    return translateNullFilter({
      filterOperationField: filterOperationField,
      filterOperationType: filterOperationType,
      propertyPath: propertyPath,
      filterParam: filterParam,
      parentParamPath: parentParamPath,
      isListFilterArgument: isListFilterArgument
    });
  }
  var rootPredicateFunction = decidePredicateFunction({
    isRelationTypeNode: isRelationTypeNode,
    filterOperationField: filterOperationField,
    filterOperationType: filterOperationType
  });
  return buildTemporalPredicate({
    fieldName: fieldName,
    fieldType: fieldType,
    filterValue: filterValue,
    filterOperationField: filterOperationField,
    filterOperationType: filterOperationType,
    parameterPath: parameterPath,
    variableName: variableName,
    nullFieldPredicate: nullFieldPredicate,
    rootPredicateFunction: rootPredicateFunction,
    temporalFunction: temporalFunction
  });
};

var buildTemporalPredicate = function buildTemporalPredicate(_ref50) {
  var fieldName = _ref50.fieldName,
    fieldType = _ref50.fieldType,
    filterOperationField = _ref50.filterOperationField,
    filterOperationType = _ref50.filterOperationType,
    parameterPath = _ref50.parameterPath,
    variableName = _ref50.variableName,
    nullFieldPredicate = _ref50.nullFieldPredicate,
    rootPredicateFunction = _ref50.rootPredicateFunction,
    temporalFunction = _ref50.temporalFunction;

  // ex: project -> person_filter_project
  var isListFilterArgument = (0, _graphql.isListType)(fieldType);
  var listVariable = parameterPath;
  // ex: $filter.datetime_in -> _datetime_in
  if (isListFilterArgument) listVariable = '_' + fieldName;
  var safeVariableName = (0, _utils.safeVar)(variableName);
  var propertyPath = safeVariableName + '.' + filterOperationField;
  var operatorExpression = buildOperatorExpression(
    filterOperationType,
    propertyPath,
    isListFilterArgument
  );
  var translation =
    '(' +
    nullFieldPredicate +
    operatorExpression +
    ' ' +
    temporalFunction +
    '(' +
    listVariable +
    '))';
  if (isListFilterArgument) {
    translation = buildPredicateFunction({
      predicateListVariable: parameterPath,
      listElementVariable: listVariable,
      rootPredicateFunction: rootPredicateFunction,
      predicates: translation
    });
  }
  return translation;
};
