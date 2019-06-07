'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

// OKAPI formats it as ':`Foo`' and we want 'Foo'
var extractRelationshipType = function extractRelationshipType(relTypeName) {
  return relTypeName.substring(2, relTypeName.length - 1);
};

var generateGraphQLTypeForTreeEntry = function generateGraphQLTypeForTreeEntry(
  tree,
  key
) {
  var entry = tree.getNode(key);
  var propNames = (0, _keys2.default)(entry);
  var graphqlTypeName = key.replace(/:/g, '_');

  var typeDeclaration = 'type ' + graphqlTypeName + ' {\n';

  var propertyDeclarations = propNames.map(function(propName) {
    return '   ' + propName + ': ' + entry[propName].graphQLType + '\n';
  });

  var labels = key.split(/:/);

  // For these labels, figure out which rels are outbound from any member label.
  // That is, if your node is :Foo:Bar, any rel outbound from just Foo counts.
  var relDeclarations = _lodash2.default.flatten(
    labels.map(function(label) {
      var inbound = lookupInboundRels(tree, label);
      var outbound = lookupOutboundRels(tree, label);
      var relIds = _lodash2.default.uniq(inbound.concat(outbound));

      return relIds.map(function(relId) {
        // Create a copy of the links to/from this label.
        var links = _lodash2.default
          .cloneDeep(
            tree.rels[relId].links.filter(function(link) {
              return (
                link.from.indexOf(label) > -1 || link.to.indexOf(label) > -1
              );
            })
          )
          .map(function(link) {
            if (link.from.indexOf(label) > -1) {
              _lodash2.default.set(link, 'direction', 'OUT');
            } else {
              _lodash2.default.set(link, 'direction', 'IN');
            }
          });

        // OUT relationships first.  Get their 'to' labels and generate.
        var allTargetLabels = _lodash2.default.uniq(
          _lodash2.default.flatten(
            links
              .filter(function(l) {
                return l.direction === 'OUT';
              })
              .map(function(link) {
                return link.to;
              })
          )
        );
        if (allTargetLabels.length > 1) {
          // If a relationship (:A)-[:relType]->(x) where
          // x has multiple different labels, we can't express this as a type in
          // GraphQL.
          console.warn(
            'RelID ' +
              relId +
              ' for label ' +
              label +
              ' has more than one outbound type (' +
              allTargetLabels +
              '); skipping'
          );
          return null;
        }

        var tag =
          '@relation(name: "' +
          extractRelationshipType(relId) +
          '", direction: "OUT")';
        var targetTypeName = allTargetLabels[0];

        return (
          '   ' +
          targetTypeName.toLowerCase() +
          's: [' +
          targetTypeName +
          '] ' +
          tag +
          '\n'
        );
      });
    })
  );

  return (
    typeDeclaration +
    propertyDeclarations.join('') +
    relDeclarations.join('') +
    '}\n'
  );
};

/**
 * Determine which relationships are outbound from a label under a schema tree.
 * @param {*} tree a schema tree
 * @param {*} label a graph label
 * @returns {Array} of relationship IDs
 */
var lookupOutboundRels = function lookupOutboundRels(tree, label) {
  return (0, _keys2.default)(tree.rels).filter(function(relId) {
    return (
      tree.rels[relId].links &&
      tree.rels[relId].links.filter(function(link) {
        return link.from.indexOf(label) !== -1;
      }).length > 0
    );
  });
};

var lookupInboundRels = function lookupInboundRels(tree, label) {
  return (0, _keys2.default)(tree.rels).filter(function(relId) {
    return (
      tree.rels[relId].links &&
      tree.rels[relId].links.filter(function(link) {
        return link.to.indexOf(label) !== -1;
      }).length > 0
    );
  });
};

var schemaTreeToGraphQLSchema = function schemaTreeToGraphQLSchema(tree) {
  console.log('TREE ', (0, _stringify2.default)(tree.toJSON(), null, 2));
  var nodeTypes = (0, _keys2.default)(tree.nodes).map(function(key) {
    return generateGraphQLTypeForTreeEntry(tree, key);
  });

  var schema = nodeTypes.join('\n');
  return schema;
};
