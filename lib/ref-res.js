const U = Symbol("undefined")

function Resolve(onscope = f => x, onget = x => y, onset = x => y) {
    this.scope = onscope
    this.namespace = new Map
    this.workspace = {}
    this.onget = onget
    this.onset = onset
}
Resolve.prototype.get = function(target, prop, rec) {
    if(typeof prop === "symbol") return
    if(!rec) return this.namespace.get(prop)
    return this.onget(prop, this.namespace.get(prop))
}
Resolve.prototype.set = function(target, prop, value, rec) {
    const old = this.get(null, prop, null)

    this.namespace.set(prop, this.onset(prop, value, old))
    return true
}
Resolve.prototype.has = function(target, prop) {
    if(prop === "arguments")
        return false
    if(this.namespace.has(prop))
        var value = this.namespace.get(prop)
    else
        var value = this.scope(prop)
    if(prop in globalThis && value === globalThis[prop])
        return false
    this.namespace.set(prop, value)
    return value !== U
}

export function create_reference_resolver({onreturn = (val, memo, creator) => memo, onget = (prop, val) => val, onset = (prop, val, prev) => val} = {}) {
    return function create_scope(onscope) {
        const resolver = new Resolve(scoper(onscope), onget, onset)
        const proxy = new Proxy({}, resolver)
        return function create_callback(callback, onexecute = f => f(), onreturntarget = onreturn) {
            return Execution.bind({ 
                callback: compiler(callback), 
                onexecute, onreturntarget,
                proxy, resolver, activate: Activation
            })
        }
    }
}

function Execution(...args) {
    const memo = this.onexecute(this.activate.bind({ reactor: this, args }))
    return this.onreturntarget(this.result, memo, this.onexecute)

    this._ = {}
}

function Activation() {
    const inactive = Activation.current
    Activation.current = this.reactor
    const result = this.reactor.callback.call(this.reactor, this.reactor.proxy, this.args)
    this.reactor.result = result
    Activation.current = inactive
    return result
    
    this._ = {}
}
Activation.current = null

function compiler(callback = f => x) {
    /// @TODO `with` trap the callback arguments `arguments[1]`
    /** @type {(proxy, args: []) => unknown} */
    return Function(/*javascript*/`\t with(arguments[0])\n\t return(\n\n\n${callback}\n\n\n\t).apply(null,arguments[1])
    `)
}
function scoper(scope = f => x) {
    return function(prop) { 
        try { return scope(prop) } 
        catch(e) { return U }
    }
}
