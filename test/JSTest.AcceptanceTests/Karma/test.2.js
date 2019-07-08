// Tests are hierarchical. Here we define a test suite for our calculator.
describe('Calculator Tests', function() {

	var calc = {
		add: function(i, j) {
			return i + j;
		},

		mul: function(i, j) {
			return i * j
		}
	}
	// And then we describe our testcases.
	it('returns 1+1=2', function(done) {
		assert.equal(calc.add(1, 1), 2);
		// Invoke done when the test is complete.
		done();
	});

	it('returns 2*2=4', function(done) {
		assert.equal(calc.mul(2, 2), 4);
		// Invoke done when the test is complete.
		done();
	});
});