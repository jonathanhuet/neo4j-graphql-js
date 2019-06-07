'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _entities = require('./entities');

var _entities2 = _interopRequireDefault(_entities);

var _types = require('./types');

var _types2 = _interopRequireDefault(_types);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var relationDirective = function relationDirective(relType, direction) {
  return '@relation(name: "' + relType + '", direction: "' + direction + '")';
};

var mapOutboundRels = function mapOutboundRels(tree, node, config) {
  var labels = node.getLabels();

  // Figure out which relationships are outbound from any label incident to
  // this node.
  var rels = tree.getRels().filter(function(rel) {
    return rel.isOutboundFrom(labels);
  });

  return rels
    .map(function(rel) {
      var targetLabels = _lodash2.default.uniq(
        _lodash2.default
          .flatten(
            rel.links.map(function(l) {
              return l.to;
            })
          )
          .sort()
      );

      if (targetLabels.length > 1) {
        // This situation isn't handled yet, and arises when you have a setup like this:
        // (:Customer)-[:BUYS]->(:Product)
        // (:Customer)-[:BUYS]->(:Service)
        // In this case, without type unions the destination type for :BUYS is ambiguous.
        console.warn(
          'RelID ' +
            rel.id +
            ' for label set ' +
            labels +
            ' has > 1 target type (' +
            targetLabels +
            '); skipping'
        );
        return null;
      }

      var tag = relationDirective(rel.getRelationshipType(), 'OUT');
      var targetType = _types2.default.label2GraphQLType(targetLabels[0]);

      var propName = rel.getGraphQLTypeName().toLowerCase();
      var propNavigateToNode =
        '   ' + propName + ': [' + targetType + '] ' + tag + '\n';

      // If a relationship has props, we should always generate a type and field for
      // it to provide access to those props.  If it doesn't have props, then only
      // generate if user has told us to with the config.  Finally -- only univalents
      // are supported ATM.
      var shouldIncludeRelLink =
        rel.isUnivalent() &&
        (rel.hasProperties() || config.alwaysIncludeRelationships);
      var propNavigateToRel =
        '   ' +
        rel.getRelationshipType() +
        '_rel: [' +
        rel.getGraphQLTypeName() +
        ']\n';

      return (
        propNavigateToNode + (shouldIncludeRelLink ? propNavigateToRel : '')
      );
    })
    .filter(function(x) {
      return x;
    }); // Remove nulls
};

var mapInboundRels = function mapInboundRels(tree, node, config) {
  var labels = node.getLabels();

  // Extra criteria: only treat rels this way that are not also outbound from this label.
  // This prevents us from treating reflexive relationships (User)-[:FRIENDS]->(User) twice.
  // Such a relationship is considered outbound, **not** inbound (even though it's both)
  var rels = tree.getRels().filter(function(rel) {
    return rel.isInboundTo(labels) && !rel.isOutboundFrom(labels);
  });

  // In this scenario:
  // (:Product)<-[:ORDERED]-(:Customer)
  // (:Product)<-[:LOOKED_AT]-(:Customer)
  // We have *2 inbound rels* with the *same origin type* (Customer).
  // We therefore can't make both types:
  // customers: [Customer] @rel(...)
  var namingConflictsExist =
    _lodash2.default.uniq(
      rels.map(function(rel) {
        return rel.getFromLabels().join('_');
      })
    ).length < rels.length;

  return rels
    .map(function(rel) {
      var originLabels = rel.getFromLabels();

      if (originLabels.length > 1) {
        console.warn(
          'RelID ' +
            rel.id +
            ' for label set ' +
            labels +
            ' has > 1 origin type (' +
            originLabels +
            '); skipping'
        );
        return null;
      }

      var tag = relationDirective(rel.getRelationshipType(), 'IN');

      var lc = function lc(s) {
        return s.toLowerCase();
      };
      var plural = function plural(s) {
        return s + 's';
      };

      // Suppose it's (:Product)<-[:ORDERED]-(:Customer).  If there's a naming
      // conflict to be avoided we'll call the rel customers_ORDERED.
      // If no conflict, it's just 'customers'.
      var originType = _types2.default.label2GraphQLType(originLabels[0]);

      var propName = namingConflictsExist
        ? lc(plural(originType)) + '_' + lc(rel.getGraphQLTypeName())
        : lc(plural(originType));

      return '   ' + propName + ': [' + originType + '] ' + tag + '\n';
    })
    .filter(function(x) {
      return x;
    });
};

var mapNode = function mapNode(tree, node, config) {
  if (!node instanceof _entities2.default.Neo4jNode) {
    throw new Error('Mapped node must be instanceof Neo4jNode');
  }

  var propNames = node.getPropertyNames();
  var graphqlTypeName = node.getGraphQLTypeName();

  var typeDeclaration = 'type ' + graphqlTypeName + ' {\n';

  if (propNames.length === 0) {
    throw new Error(
      'GraphQL types must have properties!  The neo4j node ' +
        node.id +
        ' lacks any properties in the database, meaning it cannot be mapped ' +
        'to a GraphQL type. Please ensure all of your nodes have at least 1 property'
    );
  }

  // Normally schema augmentation does this for the user automatically, but we do it
  // again here for another reason: GraphQL types must have properties, so if in the
  // schema we end up with a node label that has no normal properties, by adding this
  // one, we can still generate a type for an otherwise "empty" node label.
  var idProp = '   _id: Long!\n';

  var propertyDeclarations = propNames.map(function(propName) {
    return (
      '   ' + propName + ': ' + node.getProperty(propName).graphQLType + '\n'
    );
  });

  var relDeclarations = mapOutboundRels(tree, node, config).concat(
    mapInboundRels(tree, node, config)
  );

  return (
    typeDeclaration +
    [idProp].concat(propertyDeclarations).join('') +
    relDeclarations.join('') +
    '}\n'
  );
};

var mapRel = function mapRel(tree, rel, config) {
  if (!rel instanceof _entities2.default.Neo4jRelationship) {
    throw new Error('Mapped relationship must be instanceof Neo4jRelationship');
  }

  // Our target is to generate something of this sort:
  // https://grandstack.io/docs/neo4j-graphql-js.html#relationships-with-properties
  // type Rated @relation(name: "RATED") {
  //   from: User
  //   to: Movie
  //   rating: Float
  //   timestamp: Int
  // }
  //
  // The trouble with this formulation is that Neo4j rels don't have to connect
  // only one from -> to.  This is what the 'links' structure is for in the
  // schema tree.  Such a relationship is univalent and easy, but we have to
  // name types differently if we end up in the case where a rel can connect
  // many different types of node labels.
  var mapUnivalentRel = function mapUnivalentRel(rel) {
    var propNames = rel.getPropertyNames();
    var graphqlTypeName = rel.getGraphQLTypeName();
    var typeDeclaration =
      'type ' +
      graphqlTypeName +
      ' @relation(name: "' +
      rel.getRelationshipType() +
      '") {\n';

    // It's univalent so this assumption holds:
    var fromNodeLabels = rel.links[0].from;
    var toNodeLabels = rel.links[0].to;
    var fromNode = tree.getNodeByLabels(fromNodeLabels);
    var toNode = tree.getNodeByLabels(toNodeLabels);

    if (!fromNode) {
      throw new Error(
        'No node found in schema tree for univalent rel ' +
          rel.id +
          ' given from labels ' +
          (0, _stringify2.default)(rel.links[0])
      );
    } else if (!toNode) {
      throw new Error(
        'No node found in schema tree for univalent rel ' +
          rel.id +
          ' given to labels ' +
          (0, _stringify2.default)(rel.links[0])
      );
    }

    // Relationships must be connected, so from/to is always !mandatory.
    var fromDecl = '  from: ' + fromNode.getGraphQLTypeName() + '!\n';
    var toDecl = '  to: ' + toNode.getGraphQLTypeName() + '!\n';

    var propertyDeclarations = propNames.map(function(propName) {
      return (
        '  ' + propName + ': ' + rel.getProperty(propName).graphQLType + '\n'
      );
    });

    return (
      typeDeclaration +
      fromDecl +
      toDecl +
      propertyDeclarations.join('') +
      '}\n'
    );
  };

  if (rel.isUnivalent()) {
    if (!rel.hasProperties() && !config.alwaysIncludeRelationships) {
      var rt = rel.getRelationshipType();
      console.info(
        'Relationship :' +
          rt +
          ' has no properties and does not need to be generated'
      );
      return '';
    }

    return mapUnivalentRel(rel);
  }

  console.warn(
    'Relationship',
    rel,
    'is not univalent and is not yet supported'
  );
  return '';
};

var mapQuery = function mapQuery(tree) {
  var decl = 'type Query {\n';

  //   Not really needed.
  //   const queries = tree.getNodes().map(node => {
  //     const typeName = node.getGraphQLTypeName();
  //     return `   All${typeName}s: [${typeName}]\n`;
  //   });

  var queries = [];

  // return decl + queries.join('') + '}\n';
  return '';
};

var generateResolvers = function generateResolvers(tree) {
  var Query = {};

  // Not really needed
  // tree.getNodes().forEach(node => {
  //     const typeName = node.getGraphQLTypeName();
  //     const resolverName = `All${typeName}s`;

  //     Query[resolverName] = (object, params, ctx, resolveInfo) =>
  //         neo4jgraphql(object, params, ctx, resolveInfo, true);
  // });

  // return { Query };
  return {};
};

/**
 * Maps a Neo4jSchemaTree -> GraphQL Typedef Declaration
 * @param {Neo4jSchemaTree} tree
 * @returns {Object} containing typeDefs and resolvers
 */
var map = function map(tree) {
  var config =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var nodeTypes = tree.getNodes().map(function(node) {
    return mapNode(tree, node, config);
  });
  var relTypes = tree.getRels().map(function(rel) {
    return mapRel(tree, rel, config);
  });
  var query = mapQuery(tree);

  var typeDefs = nodeTypes.concat(relTypes).join('\n') + '\n\n' + query;

  return {
    typeDefs: typeDefs,
    resolvers: generateResolvers(tree)
  };
};

exports.default = map;
