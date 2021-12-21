import { effect, style, insert, spread, createComponent, delegateEvents, classList, mergeProps, dynamicProperty, setAttribute, setAttributeNS, addEventListener, Aliases, PropAliases, Properties, ChildProperties, DelegatedEvents, SVGElements, SVGNamespace } from './web.js';

// function parse()
{
    const tagRE = /(?:<!--[\S\s]*?-->|<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>)/g;
    const attrRE = /\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g;
    const lookup = {
        area: true,
        base: true,
        br: true,
        col: true,
        embed: true,
        hr: true,
        img: true,
        input: true,
        keygen: true,
        link: true,
        menuitem: true,
        meta: true,
        param: true,
        source: true,
        track: true,
        wbr: true
    };
    const parseTag = function (tag) {
        var res;
        res = {
            type: 'tag',
            name: '',
            voidElement: false,
            attrs: {},
            children: []
        };
        const tagMatch = tag.match(/<\/?([^\s]+?)[/\s>]/);
        if (tagMatch) {
            res.name = tagMatch[1];
            if (lookup[tagMatch[1].toLowerCase()] || tag.charAt(tag.length - 2) === '/') {
                res.voidElement = true;
            }
            if (res.name.startsWith('!--')) {
                const endIndex = tag.indexOf('-->');
                return {
                    type: 'comment',
                    comment: endIndex !== -1 ? tag.slice(4, endIndex) : ''
                };
            }
        }
        const reg = new RegExp(attrRE);
        let result = null;
        for (; ;) {
            result = reg.exec(tag);
            if (result === null) {
                break;
            }
            if (!result[0].trim()) {
                continue;
            }
            if (result[1]) {
                const attr = result[1].trim();
                let arr = [attr, ''];
                if (attr.indexOf('=') > -1) {
                    arr = attr.split('=');
                }
                res.attrs[arr[0]] = arr[1];
                reg.lastIndex--;
            } else if (result[2]) {
                res.attrs[result[2]] = result[3].trim().substring(1, result[3].length - 1);
            }
        }
        return res;
    };
    const pushTextNode = function (list, html, start) {
        var content, end;
        end = html.indexOf('<', start);
        content = html.slice(start, end === -1 ? void 0 : end);
        if (!/^\s*$/.test(content)) {
            list.push({
                type: 'text',
                content: content
            });
        }
    };
    const pushCommentNode = function (list, tag) {
        var content;
        content = tag.replace('<!--', '').replace('-->', '');
        if (!/^\s*$/.test(content)) {
            list.push({
                type: 'comment',
                content: content
            });
        }
    };
    var parse = (html) => {
        var arr, byTag, current, level, result;
        result = [];
        current = void 0;
        level = -1;
        arr = [];
        byTag = {};
        html.replace(tagRE, function (tag, index) {
            var isComment, isOpen, nextChar, parent, start;
            isOpen = tag.charAt(1) !== '/';
            isComment = tag.slice(0, 4) === '<!--';
            start = index + tag.length;
            nextChar = html.charAt(start);
            parent = void 0;
            if (isOpen && !isComment) {
                level++;
                current = parseTag(tag);
                if (!current.voidElement && nextChar && nextChar !== '<') {
                    pushTextNode(current.children, html, start);
                }
                byTag[current.tagName] = current;
                if (level === 0) {
                    result.push(current);
                }
                parent = arr[level - 1];
                if (parent) {
                    parent.children.push(current);
                }
                arr[level] = current;
            }
            if (isComment) {
                if (level < 0) {
                    pushCommentNode(result, tag);
                } else {
                    pushCommentNode(arr[level].children, tag);
                }
            }
            if (isComment || !isOpen || current.voidElement) {
                if (!isComment) {
                    level--;
                }
                if (nextChar !== '<' && nextChar) {
                    parent = level === -1 ? result : arr[level].children;
                    pushTextNode(parent, html, start);
                }
            }
        });
        return result;
    }
}

// function stringify()
{
    let attrString, stringifier;
    attrString = function (attrs) {
        var buff, key;
        buff = [];
        for (key in attrs) {
            buff.push(key + '="' + attrs[key] + '"');
        }
        if (!buff.length) {
            return '';
        }
        return ' ' + buff.join(' ');
    };
    stringifier = function (buff, doc) {
        switch (doc.type) {
            case 'text':
                return buff + doc.content;
            case 'tag':
                buff += '<' + doc.name + (doc.attrs ? attrString(doc.attrs) : '') + (doc.voidElement ? '/>' : '>');
                if (doc.voidElement) {
                    return buff;
                }
                return buff + doc.children.reduce(stringifier, '') + '</' + doc.name + '>';
            case 'comment':
                return buff += '<!--' + doc.content + '-->';
        }
    };
    var stringify = (doc) => {
        return doc.reduce(function (token, rootEl) {
            return token + stringifier('', rootEl);
        }, '');
    }
}


// var VOID_ELEMENTS, attrSeeker, findAttributes, selfClosing, marker
{
    const tagName = "<([A-Za-z$#]+[A-Za-z0-9:_-]*)((?:",
        spaces = " \\f\\n\\r\\t",
        almostEverything = "[^ " + spaces + "\\/>\"'=]+",
        attrName = "[ " + spaces + "]+" + almostEverything,
        attrPartials = "(?:\\s*=\\s*(?:'[^']*?'|\"[^\"]*?\"|\\([^)]*?\\)|<[^>]*?>|" + almostEverything + "))?)"

    var marker = "<!--#-->";
    var VOID_ELEMENTS = /^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$/i;
    var attrSeeker = new RegExp(tagName + attrName + attrPartials + "+)([ " + spaces + "]*/?>)", "g");
    var findAttributes = new RegExp("(" + attrName + "\\s*=\\s*)(['\"(]?)" + marker + "(['\")]?)", "gi");
    var selfClosing = new RegExp(tagName + attrName + attrPartials + "*)([ " + spaces + "]*/>)", "g");
    var mask = "SSS"
}

// var domEligibility
{
    const xmlDocument = new DOMParser().parseFromString(
        `<xml xmlns="http://www.w3.org/1999/xhtml" />`,
        "application/xhtml+xml",
    )
    const xmlRange = xmlDocument.createRange()
    const xmlRoot = xmlDocument.querySelector("xml")
    xmlRange.setStart(xmlRoot, 0);
    xmlRange.setEnd(xmlRoot, 0);
    var domEligibility = function domEligibility(str, html_or_xml = false) {
        const tmp = document.createElement("template")
        if(html_or_xml) {
            tmp.innerHTML = str;
        }
        else {
            try {
                const frag = xmlRange.createContextualFragment(str)
                tmp.content.append(frag)
            } catch (error) {
                throw error
            }
        }
        return tmp
    }
}
const reservedNameSpaces = new Set(["class", "on", "oncapture", "style", "use", "prop", "attr"]);
const cache = new Map();

function attrReplacer($0, $1, $2, $3) {
    return "<" + $1 + $2.replace(findAttributes, replaceAttributes) + $3;
}
function replaceAttributes($0, $1, $2, $3) {
    return $1 + ($2 || '"') + mask + ($3 || '"');
}
function fullClosing($0, $1, $2) {
    return VOID_ELEMENTS.test($1) ? $0 : "<" + $1 + $2 + "></" + $1 + ">";
}
function toPropertyName(name) {
    return name.toLowerCase().replace(/-([a-z])/g, (_, w) => w.toUpperCase());
}

function createHTML(r = createHtmlBuilder, { delegateEvents = true } = {}) {
    let uuid = 1;
    r.wrapProps = props => {
        const d = Object.getOwnPropertyDescriptors(props);
        for (const k in d) {
            if (typeof d[k].value === "function" && (!d[k].value.length || !(d[k].value instanceof Function))) r.dynamicProperty(props, k);
        }
        return props;
    };
    function createTemplate(statics) {
        let i = 0,
            markup = "";
        for (; i < statics.length - 1; i++) {
            markup = markup + statics[i] + marker;
        }
        markup = markup + statics[i];
        markup = markup.replace(selfClosing, fullClosing)
            .replace(/<(<!--#-->)/g, `<${mask}`)
            .replace(/\.\.\.(<!--#-->)/g, mask)
            .replace(attrSeeker, attrReplacer)
            .replace(/>\n+\s*/g, ">")
            .replace(/\n+\s*</g, "<")
            .replace(/\s+</g, " <")
            .replace(/>\s+/g, "> ");
        
        const [html, code] = parseTemplate(parse(markup)),
            templates = [];
        for (let i = 0; i < html.length; i++) {
            templates.push(domEligibility(html[i]))
            const nomarkers = templates[i].content.querySelectorAll("script,style");
            for (let j = 0; j < nomarkers.length; j++) {
                const d = nomarkers[j].firstChild.data || "";
                if (d.indexOf(marker) > -1) {
                    const parts = d.split(marker).reduce((memo, p, i) => {
                        i && memo.push("");
                        memo.push(p);
                        return memo;
                    }, []);
                    nomarkers[i].firstChild.replaceWith(...parts);
                }
            }
        }
        templates[0].create = code;
        cache.set(statics, templates);
        return templates;
    }
    function parseKeyValue(tag, name, isSVG, isCE, options) {
        let count = options.counter++,
            expr = `!doNotWrap ? exprs[${count}]() : exprs[${count}]`,
            parts,
            namespace;
        if ((parts = name.split(":")) && parts[1] && reservedNameSpaces.has(parts[0])) {
            name = parts[1];
            namespace = parts[0];
        }
        const isChildProp = r.ChildProperties.has(name);
        const isProp = r.Properties.has(name);
        if (name === "style") {
            const prev = `_$v${uuid++}`;
            options.decl.push(`${prev}={}`);
            options.exprs.push(`r.style(${tag},${expr},${prev})`);
        } else if (name === "classList") {
            const prev = `_$v${uuid++}`;
            options.decl.push(`${prev}={}`);
            options.exprs.push(`r.classList(${tag},${expr},${prev})`);
        } else if (namespace !== "attr" && (isChildProp || !isSVG && (r.PropAliases[name] || isProp) || isCE || namespace === "prop")) {
            if (isCE && !isChildProp && !isProp && namespace !== "prop") name = toPropertyName(name);
            options.exprs.push(`${tag}.${r.PropAliases[name] || name} = ${expr}`);
        } else {
            const ns = isSVG && name.indexOf(":") > -1 && r.SVGNamespace[name.split(":")[0]];
            if (ns) options.exprs.push(`r.setAttributeNS(${tag},"${ns}","${name}",${expr})`); else options.exprs.push(`r.setAttribute(${tag},"${r.Aliases[name] || name}",${expr})`);
        }
    }
    function parseAttribute(tag, name, isSVG, isCE, options) {
        if (name.slice(0, 2) === "on") {
            if (!name.includes(":")) {
                const lc = name.slice(2).toLowerCase();
                const delegate = delegateEvents && r.DelegatedEvents.has(lc);
                options.exprs.push(`r.addEventListener(${tag},"${lc}",exprs[${options.counter++}],${delegate})`);
                delegate && options.delegatedEvents.add(lc);
            } else {
                let capture = name.startsWith("oncapture:");
                options.exprs.push(`${tag}.addEventListener("${name.slice(capture ? 10 : 3)}",exprs[${options.counter++}]${capture ? ",true" : ""})`);
            }
        } else if (name === "ref") {
            options.exprs.push(`exprs[${options.counter++}](${tag})`);
        } else {
            const childOptions = Object.assign({}, options, {
                exprs: []
            }),
                count = options.counter;
            parseKeyValue(tag, name, isSVG, isCE, childOptions);
            options.decl.push(`_fn${count} = doNotWrap => {\n${childOptions.exprs.join(";\n")};\n}`);
            options.exprs.push(`typeof exprs[${count}] === "function" ? r.effect(_fn${count}) : _fn${count}(true)`);
            options.counter = childOptions.counter;
            options.wrap = false;
        }
    }
    function processChildren(node, options) {
        const childOptions = Object.assign({}, options, {
            first: true,
            multi: false,
            parent: options.path
        });
        if (node.children.length > 1) {
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                if (child.type === "comment" && child.content === "#" || child.type === "tag" && child.name === mask) {
                    childOptions.multi = true;
                    break;
                }
            }
        }
        let i = 0;
        while (i < node.children.length) {
            const child = node.children[i];
            if (child.name === mask) {
                if (childOptions.multi) {
                    node.children[i] = {
                        type: "comment",
                        content: "#"
                    };
                    i++;
                } else node.children.splice(i, 1);
                processComponent(child, childOptions);
                continue;
            }
            parseNode(child, childOptions);
            i++;
        }
        options.counter = childOptions.counter;
        options.templateId = childOptions.templateId;
    }
    function processComponentProps(propGroups) {
        let result = [];
        for (const props of propGroups) {
            if (Array.isArray(props)) {
                if (!props.length) continue;
                result.push(`r.wrapProps({${props.join(",") || ""}})`);
            } else result.push(props);
        }
        return result.length > 1 ? `r.mergeProps(${result.join(",")})` : result[0];
    }
    function processComponent(node, options) {
        let props = [];
        const keys = Object.keys(node.attrs),
            propGroups = [props],
            componentIdentifier = options.counter++;
        
        for (let i = 0; i < keys.length; i++) {
            const name = keys[i],
                value = node.attrs[name];
            if (name === mask) {
                propGroups.push(`exprs[${options.counter++}]`);
                propGroups.push(props = []);
            } else if (value === mask) {
                const arg = options.counter++
                props.push(`${
                    `\n\t${name}: (() => { \n\t\tconst fnstr = exprs[${componentIdentifier}].toString();\n`}${
                    `\t\t\treturn fnstr.slice(0, fnstr.indexOf(")")).indexOf("}") < 0 })()`}${
                    `\n\t\t\t\t? exprs[${arg}] : () => exprs[${arg}]\n\t`
                }`); 
            } else props.push(`${name}: "${value}"`);
        }

        if (node.children.length === 1 && node.children[0].type === "comment" && node.children[0].content === "#") {
            props.push(`children: () => exprs[${options.counter++}]`);
        } else if (node.children.length) {
            const children = {
                type: "fragment",
                children: node.children
            },
                childOptions = Object.assign({}, options, {
                    first: true,
                    decl: [],
                    exprs: [],
                    parent: false 
                });
            parseNode(children, childOptions);
            props.push(`children: () => { ${childOptions.exprs.join(";\n")}}`);
            options.templateId = childOptions.templateId;
            options.counter = childOptions.counter;
        }
        let tag;
        if (options.multi) {
            tag = `_$el${uuid++}`;
            options.decl.push(`${tag} = ${options.path}.${options.first ? "firstChild" : "nextSibling"}`);
        }
        if (options.parent) options.exprs.push(`\tr.insert(${options.parent}, r.createComponent(exprs[${componentIdentifier}],${processComponentProps(propGroups)})${tag ? `, ${tag}` : ""})`); 
        else options.exprs.push(`${options.fragment ? "" : "return "}r.createComponent(exprs[${componentIdentifier}],${processComponentProps(propGroups)})`);
        options.path = tag;
        options.first = false;
    }
    function parseNode(node, options) {
        if (node.type === "fragment") {
            const parts = [];
            node.children.forEach(child => {
                if (child.type === "tag") {
                    if (child.name === mask) {
                        const childOptions = Object.assign({}, options, {
                            first: true,
                            fragment: true,
                            decl: [],
                            exprs: []
                        });
                        processComponent(child, childOptions);
                        parts.push(childOptions.exprs[0]);
                        options.counter = childOptions.counter;
                        options.templateId = childOptions.templateId;
                    }
                    else {
                        options.templateId++;
                        const childOptions = Object.assign({}, options, {
                            first: true,
                            decl: [],
                            exprs: []
                        });
                        const id = uuid;

                        options.templateNodes.push([child]); 
                        parseNode(child, childOptions);                        

                        parts.push(`function() { ${childOptions.decl.join(",\n\t\t") + ";\n\n" + childOptions.exprs.join(";\n") + `\n\treturn _$el${id};\n\n`}}()`);
                        options.counter = childOptions.counter;
                        options.templateId = childOptions.templateId;
                    }
                } else if (child.type === "text") {
                    parts.push(`"${child.content}"`);
                } else if (child.type === "comment" && child.content === "#") {
                    parts.push(`exprs[${options.counter++}]`);
                }
            });
            options.exprs.push(`return [/* from "parts" */${parts.join(", \n")}]`);
        } else if (node.type === "tag") {
            const tag = `_$el${uuid++}`;
            options.decl.push(!options.decl.length ? `\n\n\tconst ${tag} = tmpls[${options.templateId}].content.firstChild.cloneNode(true)` : `${tag} = ${options.path}.${options.first ? "firstChild" : "nextSibling"}`);
            const keys = Object.keys(node.attrs);
            const isSVG = r.SVGElements.has(node.name);
            const isCE = node.name.includes("-");
            for (let i = 0; i < keys.length; i++) {
                const name = keys[i],
                    value = node.attrs[name];
                if (value === mask) {
                    delete node.attrs[name];
                    parseAttribute(tag, name, isSVG, isCE, options);
                } else if (name === mask) {
                    delete node.attrs[name];
                    options.exprs.push(`r.spread(${tag},exprs[${options.counter++}],${isSVG},${!!node.children.length})`);
                }
            }
            options.path = tag;
            options.first = false;
            processChildren(node, options);
        } else if (node.type === "text") {
            const tag = `_$el${uuid++}`;
            options.decl.push(`${tag} = ${options.path}.${options.first ? "firstChild" : "nextSibling"}`);
            options.path = tag;
            options.first = false;
        } else if (node.type === "comment" && node.content === "#") {
            const tag = `_$el${uuid++}`;
            options.decl.push(`${tag} = ${options.path}.${options.first ? "firstChild" : "nextSibling"}`);
            if (options.multi) {
                options.exprs.push(`r.insert(${options.parent}, exprs[${options.counter++}], ${tag})`);
            } else options.exprs.push(`r.insert(${options.parent}, exprs[${options.counter++}])`);
            options.path = tag;
            options.first = false;
        }
    }
    function parseTemplate(nodes) {
        const options = {
            path: "",
            decl: [],
            exprs: [],
            delegatedEvents: new Set(),
            counter: 0,
            first: true,
            multi: false,
            templateId: 0,
            templateNodes: []
        },
            id = uuid,
            origNodes = nodes;
        let toplevel;
        if (nodes.length > 1) {
            nodes = [{
                type: "fragment",
                children: nodes
            }];
        }
        if (nodes[0].name === mask) {
            toplevel = true;
            processComponent(nodes[0], options);
        } else parseNode(nodes[0], options);
        r.delegateEvents(Array.from(options.delegatedEvents));
        const templateNodes = [origNodes].concat(options.templateNodes);

        return [templateNodes.map(t => stringify(t)), new Function("tmpls", "exprs", "r", options.decl.join(",\n") + ";\n" + options.exprs.join(";\n") + (toplevel ? "" : `;\nreturn _$el${id};\n`))];
    }
    function html(statics, ...args) {
        const templates = cache.get(statics) || createTemplate(statics);
        return templates[0].create(templates, args, r);
    }
    return html;
}

const createHtmlBuilder = {
    effect,
    style,
    insert,
    spread,
    createComponent,
    delegateEvents,
    classList,
    mergeProps,
    dynamicProperty,
    setAttribute,
    setAttributeNS,
    addEventListener,
    Aliases,
    PropAliases,
    Properties,
    ChildProperties,
    DelegatedEvents,
    SVGElements,
    SVGNamespace
}
var index = createHTML(createHtmlBuilder);

export { index as default };