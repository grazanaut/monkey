describe('Tree Iterator', function() {

  var __;

  beforeEach(function() {
    __ = monkey;
    __.restoreDefaults();
  });

  describe('globalOpts (testing private extendOpts)', function() {

    it('should merge values', function() {
      var result = __.globalOpts({ a: 1 });
      expect(result).toEqual({ a: 1 });
      result = __.globalOpts({ b: 2 });
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should handle *property* `children` (where it is not the child list)', function() {

      var result = __.globalOpts({ a: 1 });
      result = __.globalOpts({ children: 'cprop' });
      expect(result).toEqual({ a: 1, children: 'cprop' });
      var fn = function() { var z = 26; };
      result = __.globalOpts({ children: fn });
      expect(result).toEqual({ a: 1, children: fn });

    });

    it('should NOT deep nest', function() {
      var result = __.globalOpts({ a: { b: 2 }, z: 26 });
      result = __.globalOpts({ a: { c: 3 } });
      expect(result).toEqual({ a: { c: 3 }, z: 26 });
    });

  });

  describe('restoreDefaults', function() {
    it('should restore defaults', function() {
      var result = __.globalOpts({ a: 1 });
      result = __.globalOpts({ b: 2 });
      expect(result).toEqual({ a: 1, b: 2 });
      __.restoreDefaults();
      result = __.globalOpts({ b: 2 });
      expect(result).toEqual({ b: 2 });
    });
  });

  describe('extend', function() {

    it('should merge values', function() {
      var result = __.extend({ a: 1 }, { b: 2 });
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should handle multiple inputs', function() {
      var result = __.extend({ a: 1 }, { b: 2 }, { c: 3 }, { d: 4 });
      expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    });

    it('should modify the first argument', function() {
      var o = { a: 1 };
      __.extend(o, { b: 2 }, { c: 3 }, { d: 4 });
      expect(o).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    });

    it('should not modify the subsequent arguments', function() {
      var o = { b: 2 };
      __.extend({ a: 1}, o, { c: 3 }, { d: 4 });
      expect(o).toEqual({ b: 2 });
    });

    it('should be private (for now!)', function() {
      expect(__.extend).toBeFalsy();
    });

  });

  describe('forEach', function() {

    it('should call method for each node (depth-first)', function() {
      var result = '';
      monkey.forEach(testTree, function(obj) {
        result += obj.name + ';';
      });
      expect(result).toBe('A1;A2;A3ai;A3a;A3b;A3;A;');
    });

    it('should call method for each node (breadth-first)', function() {
      var result = '';
      monkey.forEach(testTree, function(obj) {
        result += obj.name + ';';
      }, { depthFirst: false });
      expect(result).toBe('A;A1;A2;A3;A3a;A3ai;A3b;');
    });

    xit('should allow setting alternate children property', function() {
    });

  });

	describe('map', function() {

		it('should not simply return the original tree', function() {
			var result = monkey.map(testTree, function(node, info, children) {
				return node;
			});
			expect(result).toEqual(testTree); //prove the same structure
			expect(result).not.toBe(testTree); //prove its not the same object
		});
	});

});
