# evel.js

evel comes between eval and evil (code)

## Usage

```
<script src="evel.js">
<script>
    var result = evel("42");
    console.log("Result: ", result);
</script>
<script>
    var fn = evel.Function('test', "console.log("Hello ", test)");
    fn("world");    // would work, but `fn` can't access `console` :-)
</script>
```

Basically, `evel` provides an `evel` function that works like a `eval` and a `evel.Function` that works like `Function` — except access to the global environment is somewhat prevented.

Load evel.js in a page a try out each of these lines in the JS console for funsies:

```
eval("({}).__proto__") === Object.prototype;
evel("({}).__proto__") === Object.prototype;

evel("eval('alert')");
evel("eval")('alert');
```


## Caveats

`evel` only works where ES5 strict mode does, and while it masks out all other globals, untrusted code will still have access to JavaScript builtins of a "clean" iframe. 

Also, while I can't think of any other ways to subvert it … maybe someone else will?

## MIT license

Copyright (c) 2013 Nathan Vander Wilt

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.