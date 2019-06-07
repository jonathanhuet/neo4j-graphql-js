'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.possiblyAddScopeDirective = exports.possiblyAddDirectiveImplementations = exports.possiblyAddDirectiveDeclarations = exports.shouldAddAuthDirective = exports.checkRequestError = undefined;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _graphql = require('graphql');

var _graphqlAuthDirectives = require('graphql-auth-directives');

var _utils = require('./utils');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

/*
 *  Check is context.req.error or context.error
 *  have been defined.
 */
var checkRequestError = (exports.checkRequestError = function checkRequestError(
  context
) {
  if (context && context.req && context.req.error) {
    return context.req.error;
  } else if (context && context.error) {
    return context.error;
  } else {
    return false;
  }
}); // Initial support for checking auth
var shouldAddAuthDirective = (exports.shouldAddAuthDirective = function shouldAddAuthDirective(
  config,
  authDirective
) {
  if (
    config &&
    (typeof config === 'undefined'
      ? 'undefined'
      : (0, _typeof3.default)(config)) === 'object'
  ) {
    return (
      config.auth === true ||
      (config &&
        (0, _typeof3.default)(config.auth) === 'object' &&
        config.auth[authDirective] === true)
    );
  }
  return false;
});

var possiblyAddDirectiveDeclarations = (exports.possiblyAddDirectiveDeclarations = function possiblyAddDirectiveDeclarations(
  typeMap,
  config
) {
  if (shouldAddAuthDirective(config, 'isAuthenticated')) {
    typeMap['isAuthenticated'] = (0, _graphql.parse)(
      'directive @isAuthenticated on OBJECT | FIELD_DEFINITION'
    ).definitions[0];
  }
  if (shouldAddAuthDirective(config, 'hasRole')) {
    getRoleType(typeMap); // ensure Role enum is specified in typedefs
    typeMap['hasRole'] = (0, _graphql.parse)(
      'directive @hasRole(roles: [Role]) on OBJECT | FIELD_DEFINITION'
    ).definitions[0];
  }
  if (shouldAddAuthDirective(config, 'hasScope')) {
    typeMap['hasScope'] = (0, _graphql.parse)(
      'directive @hasScope(scopes: [String]) on OBJECT | FIELD_DEFINITION'
    ).definitions[0];
  }
  return typeMap;
});

var possiblyAddDirectiveImplementations = (exports.possiblyAddDirectiveImplementations = function possiblyAddDirectiveImplementations(
  schemaDirectives,
  typeMap,
  config
) {
  if (shouldAddAuthDirective(config, 'isAuthenticated')) {
    schemaDirectives['isAuthenticated'] =
      _graphqlAuthDirectives.IsAuthenticatedDirective;
  }
  if (shouldAddAuthDirective(config, 'hasRole')) {
    getRoleType(typeMap); // ensure Role enum specified in typedefs
    schemaDirectives['hasRole'] = _graphqlAuthDirectives.HasRoleDirective;
  }
  if (shouldAddAuthDirective(config, 'hasScope')) {
    schemaDirectives['hasScope'] = _graphqlAuthDirectives.HasScopeDirective;
  }
  return schemaDirectives;
});

var getRoleType = function getRoleType(typeMap) {
  var roleType = typeMap['Role'];
  if (!roleType) {
    throw new Error(
      'A Role enum type is required for the @hasRole auth directive.'
    );
  }
  return roleType;
};

var possiblyAddScopeDirective = (exports.possiblyAddScopeDirective = function possiblyAddScopeDirective(
  _ref
) {
  var typeName = _ref.typeName,
    relatedTypeName = _ref.relatedTypeName,
    operationType = _ref.operationType,
    entityType = _ref.entityType,
    config = _ref.config;

  if (shouldAddAuthDirective(config, 'hasScope')) {
    if (entityType === 'node') {
      if (
        operationType === 'Create' ||
        operationType === 'Read' ||
        operationType === 'Update' ||
        operationType === 'Delete'
      ) {
        return (0, _utils.parseDirectiveSdl)(
          '@hasScope(scopes: ["' + typeName + ': ' + operationType + '"])'
        );
      }
    }
    if (entityType === 'relation') {
      if (operationType === 'Add') operationType = 'Create';
      else if (operationType === 'Remove') operationType = 'Delete';
      return (
        '@hasScope(scopes: ["' +
        typeName +
        ': ' +
        operationType +
        '", "' +
        relatedTypeName +
        ': ' +
        operationType +
        '"])'
      );
    }
  }
  return undefined;
});
