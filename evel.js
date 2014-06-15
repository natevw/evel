if (typeof exports === 'object') module.exports = evel; // node.js module support

function evel(name, code) {
    if(typeof code === 'undefined') {
        code = name;
        name = 'evel';
    }
    return typeof code === 'string' ? evel.Function(name, code)() : code;
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

Object.defineProperty(evel, "_global", {
    get: function () {
        if (this._evel) {
            var o = {};
            Object.getOwnPropertyNames(this).forEach(function (k) { o[k] = this[k]; });
            if (o._eval) delete o.eval._global;
            return o;
        }
        delete this._evel;
        return function() {
            if(this) {
                if(!this.evel._evel) Object.defineProperty(this.evel, "_evel", { value: true });
                var o = {};
                Object.getOwnPropertyNames(this).forEach(function (k) { o[k] = this[k]; });
                return o;
            } else {
                // NOTE: we fallback to `window` in case someone puts *us* into strict mode
                return this || window;
            }
        }.call(null);
    }
});

evel._globalNames = function (gObj) {
    var globals = Object.create(null),
        proto = gObj || evel._global;
    while (proto) {
        // NOTE: there are some issues with getOwnPropertyNames, e.g. https://code.google.com/p/v8/issues/detail?id=2764
        Object.getOwnPropertyNames(proto).forEach(function (k) { globals[k] = void 0; });
        proto = Object.getPrototypeOf(proto);
    }
    // NOTE: every name on global may not be a valid identifier! http://mathiasbynens.be/notes/javascript-identifiers
    var cache = evel._globalNames.memoizedFilterResults;
    return Object.keys(globals).filter(function (k) {
        if (k in cache) return cache[k];
        if (window.dbg) console.log('k', k);
        var valid = (k in evel._jsGlobals) ? false : true;
        if (valid) try { Function(k, ""); } catch (e) { valid = false; }
        return (cache[k] = valid);
    });
};
evel._globalNames.memoizedFilterResults = Object.create(null);
evel._globalNames();        // warm the cache

evel.Function = function () {
    if (!evel._supportsStrict()) throw Error("This browser does not support sandboxed code execution.");
    /* This works by:

        1. Sanitizing the provided source (immediately, which also serves to flag syntax errors at expected time)
        2. Wrapping source in a "use strict";` environment to eliminate global access via `this` tricks
        3. Shadowing all non-ES5 globals† (each time called!) to eliminate direct access via name
        4. Replacing direct/indirect access to ES5's function stuff, as they allow global access
        5. …doing the last three steps from a new iframe's JS environment

    Basically instead of returning the provided code directly, we wrap it like this:

        function ({{g1}}, {{g2}}, …, {{gN}}) {          // imagine {g1:'document', g2:'XMLHttpRequest', g3:'d3', … }
            "use strict";
            var fn = {{sanitizedSource}};
            return fn.apply(non_window_ctx, original_args);
        }

    Note that all bets are off if browser doesn't support strict mode, so we block that.

    † IMPORTANT: the untrusted code WILL have access to anything named the same as the normal built-in JavaScript globals!
    This is both for practical purposes (since said code prolly expects them!) and because blocking them doesn't do much good;
    can't prevent access to shared prototypes of e.g. objects/arrays/regexes while still keeping the function calls synchronous.
    Since we run in a separate frame, this is less likely a problem, but browser add-ons could potentially expose "useful" stuff. */

    var regex_space = new RegExp(' ', 'g');
    var name = arguments[0] + '';
    var args1 = [].slice.call(arguments, 1);
    var fn = Function.apply(null, args1).toString();
    var i = fn.indexOf('(');
    var ii = fn.indexOf(')');
    var j = fn.indexOf('{');
    var jj = fn.lastIndexOf('}');
    var args = fn.substring(++i, ii).replace(regex_space, '');
    var body = '"use strict"\n ' + fn.substring(++j, jj).trim();
    var src = "\"use strict\";\nvar fn = function("+args+") {\n\t"+fn.substring(++j, jj).trim()+"\n};\nreturn fn.apply(this.ctx, this.args);";
    return function () {
        "use strict";       // avoids boxing of this callee's own `this`

        // c.f. http://dean.edwards.name/weblog/2006/11/sandbox/ via https://github.com/substack/vm-browserify/
        var sbx = document.createElement('iframe');
        sbx.setAttribute('sandbox', "allow-same-origin");       // need same-origin so *we* can access it!
        sbx.style.display = 'none';
        document.documentElement.appendChild(sbx);
        var _gObj = sbx.contentWindow,
            _Function = _gObj.Function,
            wrapper = evel._globalNames(_gObj);
        wrapper.push(src);
        _gObj.eval = evel;
        _gObj.Function = evel.Function;                         // avoid direct accesses (must be done while sbx in DOM!)
        document.documentElement.removeChild(sbx);
        _Function.prototype.constructor = evel.Function;        // avoid prototypical Function accesss

        return _Function.apply(null, wrapper).call({
            ctx: (this !== evel._global) ? this : null,
            args: args1
        });
    };
};

Object.getPrototypeOf(evel).constructor = evel.Function;
Object.getPrototypeOf(evel.Function).constructor = evel.Function;
