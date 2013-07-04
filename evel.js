var evel = function (code) {
    return evel.Function("return ("+code+");")();
};

evel._supportsStrict = function () {
    "use strict";           // _should_ prevent global access via `this`
    function test() { return function () { return eval("this"); }.call(this); }
    return (test.call(null) === null);
};

evel._jsGlobals = function () {
    // via https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects#Standard_global_objects_(alphabetically)
    var names = "Array,ArrayBuffer,Boolean,Collator,DataView,Date,DateTimeFormat,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,Error,eval,EvalError,Float32Array,Float64Array,Function,Infinity,Intl,Int16Array,Int32Array,Int8Array,isFinite,isNaN,Iterator,JSON,Math,NaN,Number,NumberFormat,Object,parseFloat,parseInt,RangeError,ReferenceError,RegExp,StopIteration,String,SyntaxError,TypeError,Uint16Array,Uint32Array,Uint8Array,Uint8ClampedArray,undefined,uneval,URIError";
    var jsGlobals = Object.create(null);
    names.split(',').filter(function (k) { return k in this; }).forEach(function (k) { jsGlobals[k] = void 0; });
    return jsGlobals;
}();

if (0) {        // enable for debugging?
    evel._jsGlobals['console'] = void 0;
}

evel._global = function () { return this || window; }.call(null);         // NOTE: we fallback to `window` in case someone puts *us* into strict mode

evel._globalNames = function () {
    var globals = Object.create(null),
        proto = evel._global;
    while (proto) {
        Object.getOwnPropertyNames(proto).forEach(function (k) { globals[k] = void 0; });
        proto = Object.getPrototypeOf(proto);
    }
    return Object.keys(globals).filter(function (k) { return !(k in evel._jsGlobals); });
};

evel.Function = function () {
    if (!evel._supportsStrict()) throw Error("This browser does not support sandboxed code execution.");
    /* This works by:
    
        1. Sanitizing the provided source (immediately, which also serves to flag syntax errors at expected time)
        2. Wrapping source in a "use strict";` environment to eliminate global access via `this` tricks
        3. Shadowing all non-ES5 globals† (each time called!) to eliminate direct access via name
    
    Basically instead of returning the provided code directly, we wrap it like this:
    
        function ({{g1}}, {{g2}}, …, {{gN}}) {          // imagine {g1:'document', g2:'XMLHttpRequest', g3:'d3', … }
            "use strict";
            var fn = {{sanitizedSource}};
            return fn.apply(non_window_ctx, original_args);
        }
    
    Note that all bets are off if browser doesn't support strict mode, so we block that.
    
    † IMPORTANT: the untrusted code WILL have access to anything named the same as the normal built-in JavaScript globals!
    This is both for practical purposes (since said code prolly expects them!) and because blocking them doesn't do much good:
    we could attempt to provide safer globals e.g. http://dean.edwards.name/weblog/2006/11/hooray/ but there is no sane way to
    ever prevent access to shared prototypes of e.g. objects/arrays/regexes while still keeping the function calls synchronous. */
    
    var src = "\"use strict\"; var fn = "+Function.apply(null, arguments).toString()+"; return fn.apply(this.ctx, this.args);";
    return function () {
        "use strict";       // avoids boxing of this callee's own `this`
        var wrapper = evel._globalNames();
        wrapper.push(src);
        return Function.apply(null, wrapper).call({
            ctx: (this !== evel._global) ? this : null,
            args: arguments
        });
    };
};
