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

 //NodeInfo:
 // - parent (parent node)
 // - index/key
 // - path eg by index: [4, 2, 6, 7, 1] or key: ['cars', 'colours']

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
      var recurse = function(node, func, nodeInfo, collection) {

        if (!func) {
          return; //No func, nothing to do
        }

        nodeInfo = nodeInfo || {};
        nodeInfo.path = nodeInfo.path || [];
        nodeInfo.root = nodeInfo.root || node;

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
          funcResult = func(node, nodeInfo, newChildren);
        }

        if (childList) {

          //cater for children collection to have
          // - native or prototype extension forEach method
          // - arrays (without native forEach so we do a loop)
          // - object maps (for-in style behaviour), and
          // - iterator/generator looping

          //has forEach method (which must be same as Array.prototype.forEach,
          // - without this, our iteration over the exports map in monkey() function
          //   would not do as expected!)
          if (typeof childList.forEach === 'function' &&
              childList.forEach === Array.prototype.forEach) {
            childList.forEach(function(curObj, index) {
              recurse(curObj, func, {
                parent: node,
                index: index,
                path: nodeInfo.path.concat(index),
                root: nodeInfo.root
              }, newChildren);
            });
          }
          //array-like collection requiring loop
          else if (isArrayLike(childList)) {
            for (var i = 0, len = childList.length; i < len; i++) {
              recurse(childList[i], func, {
                parent: node,
                index: i,
                path: nodeInfo.path.concat(i),
                root: nodeInfo.root
              }, newChildren);
            }
          }
          //iterator/generator looping
          else if (typeof childList.next === 'function') {
            var data = {};
            var idx = 0;
            while (!data.done) {
              data = childList.next();
              recurse(data.value[0], func, {
                parent: node,
                index: idx++,
                path: nodeInfo.path.concat(idx),
                root: nodeInfo.root
              }, newChildren);
            }
          }
          //collection based on object with keys
          else {
            if (typeof Object.keys === 'function' && typeof Array.prototype.forEach === 'function') {
              Object.keys(childList).forEach(function(k) {
                recurse(childList[k], func, {
                  parent: node,
                  key: k,
                  path: nodeInfo.path.concat(k),
                  root: nodeInfo.root
                }, newChildren);
              });
            }
            else {
              for (var k in childList) {
                if (childList.hasOwnProperty(k)) {
                  recurse(childList[k], func, {
                    parent: node,
                    key: k,
                    path: nodeInfo.path.concat(k),
                    root: nodeInfo.root
                  }, newChildren);
                }
              }
            }
          }

        }

        //strict equals false (so `undefined` is default of true)
        if (depthFirstOption !== false) {
          funcResult = func(node, nodeInfo, newChildren);
        }

        if (collection && funcResult && method === map) {
          //collection will be true for all except rootNode
          collection.push(funcResult);
        }

      };

      return recurse;

    }

  };

  /**
   * @param {Object} dest
   * @param {Object} source
   */
  function extendOnce(dest, source) {
		if (!source.children) source = { children: source };
    forEach(source, function(val, info) {
      if (info.key) {
        dest[info.key] = val;
      }
    });
    return obj1;
  }

  /**
   * @param {Object} obj1
   * @param {Object} objN
   */
	function extend(obj1, obj2, objN) {
		for (var i = 1, len = arguments.length; i < len; i++) {
			extendOnce(obj1, arguments[i]);
		}
		return obj1;
	}


 /**
  * @description
  *   Applies a function to each node in a tree. Always iterates every node.
  * @param {Object}          rootNode.       The base/root node of the tree
  * @param {Function(Object,Object)} func.   The function to apply to each node.
  *   The function is invoked on each node with the arguments "node" (the current)
  *   node, and "nodeInfo" object (containing parent: the immediate ancestor of
  *   the current node, index, key, etc).
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
    var options = opts;
    if (this && this instanceof Monkey) {
      options = extend({}, this._options, opts);
    }

    var getChildren = methodMaker.getChildren(options && options.children);
    var recurse = methodMaker.recurse(getChildren, options);
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
  *   node, and "nodeInfo" object (containing parent: the immediate ancestor of
  *   the current node, index, key, etc). If the
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
  * @return {Object}
  */
  function first(rootNode, compareFunc, opts) {
    opts = opts || {};
    opts._method = opts._method || first;
    var foundNode;
    forEach(rootNode, function(current, nodeInfo) {
      if (compareFunc(current, nodeInfo)) {
        foundNode = current;
        throw StopTraversal;
      }
    }, opts);
    return foundNode;
  }

  /**
   * @description
   *   Tree-equivalent to indexOf.
   *   A path to a tree node is a set of indexes, rather than a single index,
   *   so the returned value is an array of indexes (or keys)
  * @param {Object}          rootNode.       The base/root node of the tree
  * @param {Function(Object,Object)} compareFn.   The comparison function.
  *   The function is invoked on each node with the arguments "node" (the current)
  *   node, and "nodeInfo" object (containing parent: the immediate ancestor of
  *   the current node, index, key, etc). If the
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
  * @return {Array}
  */
  function pathTo(rootNode, compareFunc, opts) {
    opts = opts || {};
    opts._method = opts._method || pathTo;
    var foundPath;
    forEach(rootNode, function(current, nodeInfo) {
      if (compareFunc(current, nodeInfo)) {
        foundPath = nodeInfo.path;
        throw StopTraversal;
      }
    }, opts);
    return foundPath;
  }

 /**
  * @description
  *   Applies a function to each node in a tree, returning the last
  *   node where the function returns `true`. Always iterates every node.
  * @param {Object}          rootNode.       The base/root node of the tree
  * @param {Function(Object,Object)} compareFn.   The comparison function.
  *   The function is invoked on each node with the arguments "node" (the current)
  *   node, and "nodeInfo" object (containing parent: the immediate ancestor of
  *   the current node, index, key, etc). The
  *   last node for which the compareFn function returns `true` is returned.
  * @param {Object}          [opts].         Options object
  * @param {String|Function} [opts.children] Default 'children'. The name of
  *   the "children" property in the tree, or a function to retrieve the
  *   children for a node.
  * @param {Boolean}         [opts.depthFirst] Default true. True/undefined for
  *   depth-first traversal, or false for breadth-first traversal.
  * @return {Object}
  */
  function last(rootNode, compareFunc, opts) {
    opts = opts || {};
    opts._method = opts._method || last;
    var foundNode;
    forEach(rootNode, function(current, nodeInfo) {
      if (compareFunc(current, nodeInfo)) {
        foundNode = current;
      }
    }, opts);
    return foundNode;
  }

  /**
   * @description
   *   Tree-equivalent to lastIndexOf.
   *   A path to a tree node is a set of indexes, rather than a single index,
   *   so the returned value is an array of indexes (or keys)
  * @param {Object}          rootNode.       The base/root node of the tree
  * @param {Function(Object,Object)} compareFn.   The comparison function.
  *   The function is invoked on each node with the arguments "node" (the current)
  *   node, and "nodeInfo" object (containing parent: the immediate ancestor of
  *   the current node, index, key, etc). If the
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
  * @return {Array}
  */
  function lastPathTo(rootNode, compareFunc, opts) {
    opts = opts || {};
    opts._method = opts._method || lastPathTo;
    var foundPath;
    forEach(rootNode, function(current, nodeInfo) {
      if (compareFunc(current, nodeInfo)) {
        foundPath = nodeInfo.path;
      }
    }, opts);
    return foundPath;
  }

 /**
  * @description
  *   Applies a function to each node in a tree, stopping and returning `true`
  *   if the comparison function returns `true` for any of the nodes, otherwise
  *   returning `false`. Due to this, it does not always iterate every node.
  * @param {Object}          rootNode.       The base/root node of the tree
  * @param {Function(Object,Object)} compareFn.   The comparison function.
  *   The function is invoked on each node with the arguments "node" (the current)
  *   node, and "nodeInfo" object (containing parent: the immediate ancestor of
  *   the current node, index, key, etc). If the
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
  * @return {Boolean}
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
  *   node, and "nodeInfo" object (containing parent: the immediate ancestor of
  *   the current node, index, key, etc). If the
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
  * @return {Boolean}
  */
  function every(rootNode, compareFunc, opts) {
    opts = opts || {};
    opts._method = opts._method || every;
    return !first(rootNode, function (current, nodeInfo) {
      return !(compareFunc(current, nodeInfo));
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
  *   node, and "nodeInfo" object (containing parent: the immediate ancestor of
  *   the current node, index, key, etc), and
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
  * @return {Object}
  */
  function map(rootNode, func, opts) {
    opts = opts || {};
    opts._method = opts._method || map;
    var resultRoot;
    forEach(rootNode, function(currentNode, nodeInfo, childrenArray) {
      var result = func(currentNode, nodeInfo, childrenArray);
      if (!nodeInfo || !nodeInfo.parent) {
        resultRoot = result;
      }
      return result;
    }, opts);
    return resultRoot;
  }

 /**
  * @description
  *   Reduces the value of the tree down to a single value, by applying a
  *   function to each node in a tree, keeping the result as the `accumulator`
  *   value to pass into the next call of the function.
  * @param {Object}          rootNode.       The base/root node of the tree
  * @param {Function(Object,Object)} func.   The reduction function.
  *   The function is invoked on each node with the arguments "acc" (the
  *   accumulator/accumulated value) node, "currentNode", and "nodeInfo" object
  *   (containing parent: the immediate ancestor of the current node, index,
  *   key, etc).
  * @param {any}             acc             The initial value of the accumulator
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
  * @return {any}
  */
  function reduce(rootNode, func, acc, opts) {
    opts = opts || {};
    opts._method = opts._method || reduce;

    var noAcc = typeof acc === 'undefined';

    var mainReductionFunction = function(currentNode, nodeInfo) {
      acc = func(acc, currentNode, nodeInfo);
    };

    //skip first value IIF noAcc (so we start with func(val1, val2) instead
    //of func(null, val1) )
    var skipper = function(currentNode, nodeInfo) {
      //set acc to first value, and replace skipper with the
      //actual function on first run
      acc = currentNode;
      reductionFunction = mainReductionFunction;
    };

    var reductionFunction = noAcc ? skipper : mainReductionFunction;

    forEach(rootNode, function(currentNode, nodeInfo) {
      reductionFunction(currentNode, nodeInfo);
    }, opts);

    return acc;
  }

  /**
   * @description
   *   Creates a tree-walking object - a wrapper around the tree with
   *   the monkey functions as instance methods. Also houses options
   */
  function Monkey(rootNode, opts) {
		if (rootNode instanceof Monkey) return rootNode; //don't double-wrap
		if (!(this instanceof Monkey)) return new Monkey(rootNode, opts); //standard way to do it monkey()
    this._wrapped = rootNode;
		this._options = opts;
  }
	var monkey = Monkey;

	function mixin(obj) {
		if (!obj.children) obj = { children: obj }; //allow for object without a single top-node to be passed in
		//TODO: use MAP() here instead (use as a test case for object/key-mapping rather than array mapping)
		forEach(obj, function(fn, info) {
			//TODO: the skip below only allows FLAT object to be passed in. Reconsider this...
			if (fn.children || typeof fn !== 'function') return; //skip root
			Monkey[info.key] = fn;
			Monkey.prototype[info.key] = function() {
				var args = [this._wrapped].concat(Array.prototype.slice.call(arguments, 0));
				return fn.apply(this, args);
			};
		});
	}

	mixin({
    forEach: forEach,
    find: first,
    findLast: last,
    pathTo: pathTo,
    lastPathTo: lastPathTo,
    some: some,
    every: every,
    map: map,
    reduce: reduce,
    //TODO:
    //filter (does this make sense? what about non-leaf nodes?)
    //takeWhile
    //dropWhile
    //invoke??
    //pluck??
    //sum??
    //
    //
    //Also - leaf-only methods? These can probably be done using the
    //       methods already there. BUT perhaps some convenience methods
    //       could be useful?
    //NOT DOING:
    //indexOf, findIndex, lastIndexOf, findLastIndex
    //toArray - **could do this? flatten tree? have leaf-only option?
    //zip
		mixin: mixin
	});


  if (this.module) {
    this.module.exports = monkey;
  }
  else if (typeof this.define === 'function' && this.define.amd) {
    this.define('monkey', [], function(require, exports, module) {
      module.exports = monkey;
    });
  }
  else {
    this.Prim8 = this.prim8 = this.monkey = monkey;
  }

}).call(this);
