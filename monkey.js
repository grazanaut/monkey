(function(global, define, module) {
  "use strict";

 /**
  * @private
  */
  var StopTraversal = new Error();

 /**
  * @private
  */
 function isArrayLike(o) {
   return typeof o.length === 'number';
 }

 /**
  * @private
  */
  var methodMaker = {

    getChildren: function(childrenOption) {
      childrenOption = childrenOption || 'children';
      if (typeof childrenOption === 'string') {
        return function(node) {
          return node[childrenOption];
        };
      }
      else if (typeof childrenOption === 'function') {
        return childrenOption;
      }
      else {
        throw new TypeError('opts.children must be a string or function');
      }
    },

    recurse: function(getChildren, opts) {

      var depthFirstOption = opts && opts.depthFirst;

      var recurse = function(node, func, parentNode) {

        if (!func) {
          return; //No func, nothing to do
        }

        //strict equals false (so `undefined` is default of true)
        if (depthFirstOption === false) {
          func(node, parentNode);
        }

        var childList = node && getChildren(node);
        if (childList) {

          //cater for children collection to have
          // - native or prototype extension forEach method
          // - arrays (without native forEach so we do a loop)
          // - object maps (for-in style behaviour), and
          // - iterator/generator looping

          //has forEach method
          if (typeof childList.forEach === 'function') {
            childList.forEach(function(curObj) {
              recurse(curObj, func, node);
            });
          }
          //array-like collection requiring loop
          else if (isArrayLike(childList)) {
            for (var i = 0, len = childList.length; i < len; i++) {
              recurse(childList[i], func, node);
            }
          }
          //iterator/generator looping
          else if (typeof childList.next === 'function') {
            var data = {};
            while (!data.done) {
              data = childList.next();
              recurse(data.value[0], func, node);
            }
          }
          //collection based on object with keys
          else {
            if (typeof Object.keys === 'function' && typeof Array.protoytpe.forEach === 'function') {
              Object.keys(childList).forEach(function(k) {
                recurse(childList[k], func, node);
              });
            }
            else {
              for (var k in childList) {
                if (childList.hasOwnProperty(k)) {
                  recurse(childList[k], func, node);
                }
              }
            }
          }

        }

        //strict equals false (so `undefined` is default of true)
        if (depthFirstOption !== false) {
          func(node, parentNode);
        }

      };

      return recurse;

    }

  };

 /**
  * @description
  *   Applies a function to each node in a tree
  * @param {Object}          rootNode.       The base/root node of the tree
  * @param {Function(Object,Object)} func.   The function to apply to each node.
  *   The function is invoked on each node with the arguments "node" (the current)
  *   node, and "parentNode" (the immediate ancestor of the current node).
  * @param {Object}          [opts].         Options object
  * @param {String|Function} [opts.children] Default 'children'. The name of
  *   the "children" property in the tree, or a function to retrieve the
  *   children for a node.
  * @param {Boolean}         [opts.depthFirst] Default true. True/undefined for
  *   depth-first traversal, or false for breadth-first traversal
  */
  function forEach(rootNode, func, opts) {
    var getChildren = methodMaker.getChildren(opts && opts.children);
    var recurse = methodMaker.recurse(getChildren, opts);
    try {
      recurse(rootNode, func, null);
    }
    catch (e) {
      if (e !== StopTraversal) {
        throw e;
      }
    }
  }

 /**
  * @description
  *   Applies a function to each node in a tree, stopping and returning the first
  *   node where the function returns `true`
  * @param {Object}          rootNode.       The base/root node of the tree
  * @param {Function(Object,Object)} compareFn.   The comparison function.
  *   The function is invoked on each node with the arguments "node" (the current)
  *   node, and "parentNode" (the immediate ancestor of the current node). If the
  *   compareFn function returns `true`, iteration is stopped and the matching
  *   node is returned
  * @param {Object}          [opts].         Options object
  * @param {String|Function} [opts.children] Default 'children'. The name of
  *   the "children" property in the tree, or a function to retrieve the
  *   children for a node.
  * @param {Boolean}         [opts.depthFirst] Default true. True/undefined for
  *   depth-first traversal, or false for breadth-first traversal.
  *   Note: where it is more likely that a leaf node will match than other nodes,
  *   depth-first is probably more efficient. However where the chance of a match
  *   is similar regardless of whether the node is a leaf or not, breadth-first
  *   (i.e. not depth-first) is likely to be more efficient as the comparison will
  *   be done on each node before traversing its children
  */
  function first(rootNode, compareFunc, opts) {
    var foundNode;
    forEach(rootNode, function(current, parent) {
      if (compareFunc(current, parent)) {
        foundNode = current;
        throw StopTraversal;
      }
    }, opts);
    return foundNode;
  }

 /**
  * @description
  *   Applies a function to each node in a tree, stopping and returning `true`
  *   if the comparison function returns `true` for any of the nodes, otherwise
  *   returning `false`
  * @param {Object}          rootNode.       The base/root node of the tree
  * @param {Function(Object,Object)} compareFn.   The comparison function.
  *   The function is invoked on each node with the arguments "node" (the current)
  *   node, and "parentNode" (the immediate ancestor of the current node). If the
  *   compareFn function returns `true`, iteration is stopped the `some` method
  *   returns `true`
  * @param {Object}          [opts].         Options object
  * @param {String|Function} [opts.children] Default 'children'. The name of
  *   the "children" property in the tree, or a function to retrieve the
  *   children for a node.
  * @param {Boolean}         [opts.depthFirst] Default true. True/undefined for
  *   depth-first traversal, or false for breadth-first traversal.
  *   Note: where it is more likely that a leaf node will match than other nodes,
  *   depth-first is probably more efficient. However where the chance of a match
  *   is similar regardless of whether the node is a leaf or not, breadth-first
  *   (i.e. not depth-first) is likely to be more efficient as the comparison will
  *   be done on each node before traversing its children
  */
  function some(rootNode, compareFunc, opts) {
    return !!first(rootNode, compareFunc, opts);
  }


  var exports = {
    forEach: forEach,
    first: first
  };

  if (module) {
    module.exports = exports;
  }
  else if (typeof define === 'function' && define.amd) {
    define('monkey', [], function(require, exports, module) {
      module.exports = exports;
    });
  }
  else {
    global.Prime8 = exports;
  }

}(window || global || self || this, define, module));
