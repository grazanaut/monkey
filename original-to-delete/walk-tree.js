		/* base class - can be extracted out if useful */
		function baseTree(rootNode, opts) {

			/** Options */
			opts = opts || {};
			/** --> Children property name, or a function to extract them from a node */
			opts.children = opts.children || 'children';
			var getChildren;
			if (typeof opts.children === 'string') {
				getChildren = function(node) {
					return node[opts.children];
				};
			}
			else {
				getChildren = opts.children;
			}

			function recurseNode(node, func, parentNode) {

				var result = func(node, parentNode);
				if (result) {
					return result;
				}

				var childList = node && getChildren(node);
				if (childList && func) {
					for (var i = 0, len = childList.length; i < len; i++) {
						var result = recurseNode(childList[i], func, node);
						if (result) {
							return result;
						}
					}
				}

			}

			return {

				forEach: function(func) {
					var fn = function() {
						func.apply(null, Array.prototype.slice.call(arguments));
						return false; //forEach ignores result and just keeps recursing
					};
					recurseNode(rootNode, fn, null);
				},

				every: function(func) {
					var fn = function() {
						return !func.apply(null, Array.prototype.slice.call(arguments));
					};
					return !recurseNode(rootNode, func, null);
				},

				some: function(func) {
					return !!recurseNode(rootNode, func, null);
				},

				find: function(func) {
					var fn = function(node) {
						if (func.apply(null, Array.prototype.slice.call(arguments))) {
							return node;
						}
					};
					return recurseNode(rootNode, fn, null);
				}

			};

		}

		function walkTree(rootNode) {
			return baseTree(rootNode, { children: function(node) { return node.children || node.schema; } });
		}

		//$get() method which is invoked during injection to provide the service
		this.$get = function() {
			return walkTree;
		};


