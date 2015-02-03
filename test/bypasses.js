var test = require('tape'),
    evel = require("../");

[
    // https://github.com/natevw/evel/issues/10
    "1..constructor.constructor('pwn()')()",
    
    // https://github.com/natevw/evel/issues/11
    "Function('this.pwn()')()",
    
    // https://github.com/natevw/evel/issues/19
    "eval._global.pwn()",
].forEach(function (src) {
  test("Bypass: "+src, function (t) {
    window.pwn = function () {
      t.fail("Bypass succeeded");
    };
    try {
      evel.Function(src)();
    } catch (e) {
      t.pass("Bypass failed.");
    } finally {
      t.end();
    }
  });
});
