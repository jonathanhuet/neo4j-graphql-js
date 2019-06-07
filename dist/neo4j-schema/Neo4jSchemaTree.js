'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _values = require('babel-runtime/core-js/object/values');

var _values2 = _interopRequireDefault(_values);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _entities = require('./entities');

var _entities2 = _interopRequireDefault(_entities);

var _types = require('./types');

var _types2 = _interopRequireDefault(_types);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var extractRelationshipType = function extractRelationshipType(relTypeName) {
  return relTypeName.substring(2, relTypeName.length - 1);
};

var withSession = function withSession(driver, f) {
  var s = driver.session();

  return f(s).finally(function() {
    return s.close();
  });
};

/**
 * This object harvests Neo4j schema information out of a running instance and organizes
 * it into a tree structure.
 *
 * Currently, it does this by using built-in Neo4j procedures (db.schema.nodeTypeProperties())
 * This approach has the drawback that it scans the entire database to make sure that the
 * resulting schema is complete and accurate, which can increase startup times and churn the
 * page cache, but guarantees 100% accurate results.
 *
 * TODO - in a future version, we will make the schema harvesting swappable for an APOC
 * approach that is based on sampling.
 */

var Neo4jSchemaTree = (function() {
  // TODO: config is where method of generating metadata can be passed
  function Neo4jSchemaTree(driver) {
    var config =
      arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck3.default)(this, Neo4jSchemaTree);

    this.driver = driver;
    this.nodes = {};
    this.rels = {};
  }

  (0, _createClass3.default)(Neo4jSchemaTree, [
    {
      key: 'toJSON',
      value: function toJSON() {
        return {
          nodes: this.nodes,
          rels: this.rels
        };
      }
    },
    {
      key: 'initialize',
      value: function initialize() {
        var _this = this;

        var nodeTypeProperties = function nodeTypeProperties(session) {
          return session
            .run('CALL db.schema.nodeTypeProperties()')
            .then(function(results) {
              return results.records.map(function(rec) {
                return rec.toObject();
              });
            });
        };

        var relTypeProperties = function relTypeProperties(session) {
          return session
            .run('CALL db.schema.relTypeProperties()')
            .then(function(results) {
              return results.records.map(function(rec) {
                return rec.toObject();
              });
            });
        };

        console.log('Initializing your Neo4j Schema');
        console.log(
          'This may take a few moments depending on the size of your DB'
        );
        return _promise2.default
          .all([
            withSession(this.driver, nodeTypeProperties),
            withSession(this.driver, relTypeProperties)
          ])
          .then(function(_ref) {
            var _ref2 = (0, _slicedToArray3.default)(_ref, 2),
              nodeTypes = _ref2[0],
              relTypes = _ref2[1];

            return _this._populate(nodeTypes, relTypes);
          })
          .then(function() {
            return _this._populateRelationshipLinkTypes();
          })
          .then(function() {
            return _this;
          });
      }
    },
    {
      key: '_populateRelationshipLinkTypes',
      value: function _populateRelationshipLinkTypes() {
        var _this2 = this;

        // console.log('Getting from/to relationship metadata');

        var okapiIds = (0, _keys2.default)(this.rels);

        var promises = okapiIds.map(function(okapiId) {
          var q =
            '\n                MATCH (n)-[r' +
            okapiId +
            ']->(m)\n                WITH n, r, m LIMIT 10\n                RETURN distinct(labels(n)) as from, labels(m) as to\n            ';

          return withSession(_this2.driver, function(s) {
            return s.run(q).then(function(results) {
              return results.records.map(function(r) {
                return r.toObject();
              });
            });
          }).then(function(rows) {
            _this2.getRel(okapiId).relType = extractRelationshipType(okapiId);
            _this2.getRel(okapiId).links = rows;
          });
        });

        return _promise2.default.all(promises).then(function() {
          return _this2;
        });
      }
    },
    {
      key: 'getNode',
      value: function getNode(id) {
        return this.nodes[id];
      }
    },
    {
      key: 'getNodes',
      value: function getNodes() {
        return (0, _values2.default)(this.nodes);
      }

      /**
       * @param {Array[String]} labels a set of labels
       * @returns {Neo4jNode} if it exists, null otherwise.
       */
    },
    {
      key: 'getNodeByLabels',
      value: function getNodeByLabels(labels) {
        var lookingFor = _lodash2.default.uniq(labels);
        var total = lookingFor.length;

        return this.getNodes().filter(function(n) {
          var here = n.getLabels();

          var matches = here.filter(function(label) {
            return lookingFor.indexOf(label) > -1;
          }).length;
          return matches === total;
        })[0];
      }
    },
    {
      key: 'getRel',
      value: function getRel(id) {
        return this.rels[id];
      }
    },
    {
      key: 'getRels',
      value: function getRels() {
        return (0, _values2.default)(this.rels);
      }
    },
    {
      key: '_populate',
      value: function _populate(nodeTypes, relTypes) {
        var _this3 = this;

        // Process node types first
        _lodash2.default
          .uniq(
            nodeTypes.map(function(n) {
              return n.nodeType;
            })
          )
          .forEach(function(nodeType) {
            // A node type is an OKAPI node type label, looks like ":`Event`"
            // Not terribly meaningful, but a grouping ID
            var labelCombos = _lodash2.default.uniq(
              nodeTypes.filter(function(i) {
                return i.nodeType === nodeType;
              })
            );

            labelCombos.forEach(function(item) {
              var combo = item.nodeLabels;
              // A label combination is an array of strings ["X", "Y"] which indicates
              // that some nodes ":X:Y" exist in the graph.
              var id = combo.join(':');
              var entity =
                _this3.nodes[id] || new _entities2.default.Neo4jNode(id);
              _this3.nodes[id] = entity;

              // Pick out only the property data for this label combination.
              nodeTypes
                .filter(function(i) {
                  return i.nodeLabels === combo;
                })
                .map(function(i) {
                  return _lodash2.default.pick(i, [
                    'propertyName',
                    'propertyTypes',
                    'mandatory'
                  ]);
                })
                .forEach(function(propDetail) {
                  // console.log(schema);
                  if (_lodash2.default.isNil(propDetail.propertyName)) {
                    return;
                  }

                  propDetail.graphQLType = _types2.default.chooseGraphQLType(
                    propDetail
                  );
                  entity.addProperty(propDetail.propertyName, propDetail);
                });
            });
          });

        // Rel types
        _lodash2.default
          .uniq(
            relTypes.map(function(r) {
              return r.relType;
            })
          )
          .forEach(function(relType) {
            var id = relType;
            var entity =
              _this3.rels[id] || new _entities2.default.Neo4jRelationship(id);
            _this3.rels[id] = entity;

            relTypes
              .filter(function(r) {
                return r.relType === relType;
              })
              .map(function(r) {
                return _lodash2.default.pick(r, [
                  'propertyName',
                  'propertyTypes',
                  'mandatory'
                ]);
              })
              .forEach(function(propDetail) {
                if (_lodash2.default.isNil(propDetail.propertyName)) {
                  return;
                }

                propDetail.graphQLType = _types2.default.chooseGraphQLType(
                  propDetail
                );
                entity.addProperty(propDetail.propertyName, propDetail);
              });
          });
      }
    }
  ]);
  return Neo4jSchemaTree;
})();

exports.default = Neo4jSchemaTree;
