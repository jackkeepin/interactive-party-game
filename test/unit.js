let chai = require("chai");

suite("Test test", function() {

    test("Quick test", function() {
      // Initialise a counter.
      let counter = 0;
  
      for (let i=0; i<100; i++) {
          counter++;
      }
  
      chai.assert.equal(counter, 100, "Answer should be 100");
    });
  
  });