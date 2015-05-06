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
