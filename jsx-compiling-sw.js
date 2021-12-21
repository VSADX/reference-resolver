/// from jsx-brackets-to-js

const waiter = Promise.all[
    new Promise(r => oninstall = r),
    new Promise(r => onactivate = r)
]

onmessage = async e => {
    await waiter
    skipWaiting()
    clients.claim()
    e.source.postMessage(e.data)

    if(e.data) return

    // uninstall
    await registration.unregister()
    const all = await clients.matchAll()
    all.forEach(c => c.navigate(c.url))
}

onfetch = e =>
    !e.request.url.endsWith("jsx") ? 0 : 
    e.respondWith(respondable(e.request))


async function respondable(request = new Request) {
    const script = await fetch(request).then(r => r.text())
    const response = new Response(new Blob([jsx(script, false)]))
    const { headers: h, body, status, statusText } = response
    const headers = new Headers(h)
    headers.set('content-type', 'application/javascript; charset=UTF-8')
    return new Response(body, { headers, status, statusText })  
}

const matcher = {
    "=>({": false,
    "=>{": false,
    "({": false,
    "var{": false,
    "let{": false,
    "const{": false,
    "${": false,
    "{{": "${{",
    "{": "${useHtml(() => ",
    "}": ")}",
    "(<": "( /* from jsx */ html`<",
    ">)": ">` /* from jsx */ )",
}

function jsx(string_component = "", should_compile = true, compiler = eval) {

    const compiled = string_component.split("<>")

    for (let i = 0; i < compiled.length; i++) {
        const opening = compiled[i]
        if(i === 0) continue
        
        const ending = opening.split("</>")
        const html = ending[0]
        
        ending[0] = html
            .replace(/(\((\s*?)<|{{|var(\s*?){|const(\s*?){|let(\s*?){|${|{|}|>(\s*?)\)|=>(\s*?){|=>(\s*?)\((\s*?){)/gm, 
                match => matcher[match.replace(/\s/gm, "")] || match)
            // replace <SomeElement> to <${SomeElement}>
            .replace(/\<([A-Z][a-zA-Z.]+)/g,"<${$1}")
            // replace </SomeElement> to <//>
            .replace(/\<\/([A-Z][a-zA-Z.]+)/g,"<//")
        
            compiled[i] = `/* from jsx */ html\`${ending[0]}\`${ending[1]}`
        }

    if(!should_compile) return compiled.join("")
    else return compiler.call(null, compiler.call(null, compiled.join("")))
}