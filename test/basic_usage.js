var test = require('tape'),
    evel = require("../");

test("Basic API", function (t) {
  t.equal(typeof evel, 'function', "`evel` is callable");
  t.equal(evel("42"), 42, "yields expected result");
  
  t.equal(typeof evel.Function, 'function', "`evel.Function` is callable");
  var fn = evel.Function('test', "return \"Hello \"+test;");
  t.equal(typeof fn, 'function', "Can construct a function");
  t.equal(fn("world"), "Hello world", "Function works as expected");
  t.end();
});
