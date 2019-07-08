//const assert = require('assert');
describe('Calculator Tests 2', function() {
	var Calculator = {
		sum: function(p1, p2)
		{
			return p1 + p2;
		}
	}
	// And then we describe our testcases.
	it('should return sum of two numbers', function() {
		var p1=3, p2=2, result;
		result = Calculator.sum(p1, p2);
		//expect(result).toEqual(5);
		assert.equal(result, 5);
	});
});