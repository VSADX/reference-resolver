import { create_reference_resolver } from "./ref-res.js"
import * as solid from "./solid.js"
import parser from "./html.js"

const U = Symbol("undefined")

export const css = String.raw,
    html = parser,

    /** @type {<A, B>(a: A, b: B) => [A, B]} */
    typeContext = (a, b) => [a, b],
    /** @type {<T>(t:T)=>T} */
    useSignal = (any) => readSignal.bind({hooks: solid.createSignal(any)}),

    placeCSS = (cssText = "", optionalCssSelector = "") => {
        if(optionalCssSelector)
            cssText = cssText.split("\\&").join(optionalCssSelector)
        const sty = document.createElement("style")
        sty.textContent = cssText
        document.head.append(sty)
    },
    useHtml = (expression, onexecute = solid.untrack) =>
        onexecute[U] ? onexecute(expression()) : onexecute(expression)
    


const ref_res = create_reference_resolver({
    onget: (prop, val) => is_signal(val) ? val() : val,
    onset: (prop, newval, curval) => 
        is_signal(curval) ? (curval(newval), curval) : newval
})

export function useResolver(scope) {
    const resolver = ref_res(scope)

    function useCallback(func, onexecute = solid.untrack) {
        return resolver(func, onexecute)
    }
    function useMemo(memo_func) {
        return resolver(memo_func, solid.createMemo)()
    }
    function useEffect(effect_func) {
        return resolver(effect_func, solid.createEffect)()
    }

    useCallback[U] = true

    return { useCallback, useMemo, useEffect }
}

function readSignal(val = U) {
    return val === U ? this.hooks[0]() : this.hooks[1](val)
}

function is_signal(any) {
    return any && typeof any == "function" && any.name == "bound readSignal"
}