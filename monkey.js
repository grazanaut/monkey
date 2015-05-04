(function() {
  "use strict";

  var context = this;

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
      var method = opts && opts._method;

      //Note: 'collection' is only relevant for the 'map' function, and
      //      is the collection this node belongs to in the new mapped tree
      //      structure
      var recurse = function(node, func, parentNode, collection) {

        if (!func) {
          return; //No func, nothing to do
        }

        var childList = node && getChildren(node);

        //Note: newChildren is only relevant for the 'map' function, and
        //      is the collection within this node that the node's newly mapped
        //      children will be placed in. It is passed as an argument to func()
        //      and should be assigned to a property in the new tree within
        //      that map function.
        //      funcResult is also only relevant for the 'map' function (other
        //      functions which return results such as some/first/etc do so
        //      by using exception throwing), and will contain the newly created
        //      map object to be added to the `collection` (parent node's children)
        var newChildren;
        var funcResult;
        if (childList && method === map) {
          newChildren = [];
        }

        //strict equals false (so `undefined` is default of true)
        if (depthFirstOption === false) {
          funcResult = func(node, parentNode, newChildren);
        }

        if (childList) {

          //cater for children collection to have
          // - native or prototype extension forEach method
          // - arrays (without native forEach so we do a loop)
          // - object maps (for-in style behaviour), and
          // - iterator/generator looping

          //has forEach method
          if (typeof childList.forEach === 'function') {
            childList.forEach(function(curObj) {
              recurse(curObj, func, node, newChildren);
            });
          }
          //array-like collection requiring loop
          else if (isArrayLike(childList)) {
            for (var i = 0, len = childList.length; i < len; i++) {
              recurse(childList[i], func, node, newChildren);
            }
          }
          //iterator/generator looping
          else if (typeof childList.next === 'function') {
            var data = {};
            while (!data.done) {
              data = childList.next();
              recurse(data.value[0], func, node, newChildren);
            }
          }
          //collection based on object with keys
          else {
            if (typeof Object.keys === 'function' && typeof Array.protoytpe.forEach === 'function') {
              Object.keys(childList).forEach(function(k) {
                recurse(childList[k], func, node, newChildren);
              });
            }
            else {
              for (var k in childList) {
                if (childList.hasOwnProperty(k)) {
                  recurse(childList[k], func, node, newChildren);
                }
              }
            }
          }

        }

        //strict equals false (so `undefined` is default of true)
        if (depthFirstOption !== false) {
          funcResult = func(node, parentNode, newChildren);
        }

        if (collection && funcResult) {
          //collection will be true for all except rootNode
          collection.push(funcResult);
        }

      };

      return recurse;

    }

  };

 /**
  * @description
  *   Applies a function to each node in a tree. Always iterates every node.
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
    opts = opts || {};
    opts._method = opts._method || forEach;
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
  *   node where the function returns `true`. Due to this, it does not always
  *   iterate every node.
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
    opts = opts || {};
    opts._method = opts._method || first;
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
  *   Applies a function to each node in a tree, returning the last
  *   node where the function returns `true`. Always iterates every node.
  * @param {Object}          rootNode.       The base/root node of the tree
  * @param {Function(Object,Object)} compareFn.   The comparison function.
  *   The function is invoked on each node with the arguments "node" (the current)
  *   node, and "parentNode" (the immediate ancestor of the current node). The
  *   last node for which the compareFn function returns `true` is returned.
  * @param {Object}          [opts].         Options object
  * @param {String|Function} [opts.children] Default 'children'. The name of
  *   the "children" property in the tree, or a function to retrieve the
  *   children for a node.
  * @param {Boolean}         [opts.depthFirst] Default true. True/undefined for
  *   depth-first traversal, or false for breadth-first traversal.
  */
  function last(rootNode, compareFunc, opts) {
    opts = opts || {};
    opts._method = opts._method || last;
    var foundNode;
    forEach(rootNode, function(current, parent) {
      if (compareFunc(current, parent)) {
        foundNode = current;
      }
    }, opts);
    return foundNode;
  }

 /**
  * @description
  *   Applies a function to each node in a tree, stopping and returning `true`
  *   if the comparison function returns `true` for any of the nodes, otherwise
  *   returning `false`. Due to this, it does not always iterate every node.
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
    opts = opts || {};
    opts._method = opts._method || some;
    return !!first(rootNode, compareFunc, opts);
  }

 /**
  * @description
  *   Applies a function to each node in a tree, returning `true`
  *   if the comparison function returns `true` for every single nodes. Stops
  *   iterating and returns false if any node returns false. As a result it does
  *   not always iterate every node.
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
  function every(rootNode, compareFunc, opts) {
    opts = opts || {};
    opts._method = opts._method || every;
    return !first(rootNode, function (current, parent) {
      return !(compareFunc(current, parent));
    }, opts);
  }


 /**
  * @description
  *   Creates a new tree with the same layout, but whose nodes are the result
  *   of applying a provided function which is called for each node. Always
  *   iterates every node.
  * @param {Object}          rootNode.       The base/root node of the tree
  * @param {Function(Object,Object)} func.   The mapping function which should
  *   return an object to be placed in the equivalent location in a new tree structure.
  *   The function is invoked on each node with the arguments "node" (the current)
  *   node, "parentNode" (the immediate ancestor of the current node), and
  *   "childrenArray" - the new array of children for this node (which would
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
  function map(rootNode, func, opts) {
    opts = opts || {};
    opts._method = opts._method || map;
    //TODO: only works for Array children at the moment
    //      - need to determine a way for it to work
    //        for object map and iterator
    //        (iterator may be easy, object map will probably
    //        require that index/key be passed in to func, and also
    //        need to decide if we will be "intelligent" with creating
    //        children collection container as either Array or Object
    //        automatically or by some other means)
    var resultRoot;
    forEach(rootNode, function(currentNode, parentNode, childrenArray) {
      var result = func(currentNode, parentNode, childrenArray);
      if (!parentNode) {
        resultRoot = result;
      }
      return result;
    }, opts);
    return resultRoot;
    /*
     * func returns object
     * each *parent* needs to be passed a children array
     * children array needs to be populated with children
     * func responsible for placing children array onto parent
     * **** start by putting this in `recurse` then see if it can be moved out
     */
  }

  var exports = {
    forEach: forEach,
    first: first,
    last: last,
    some: some,
    every: every,
    map: map
  };

  if (this.module) {
    this.module.exports = exports;
  }
  else if (typeof this.define === 'function' && this.define.amd) {
    this.define('monkey', [], function(require, exports, module) {
      module.exports = exports;
    });
  }
  else {
    this.Prime8 = exports;
  }

}).call(this);
