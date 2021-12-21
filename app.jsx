import { render } from "./lib/web.js"
import { For } from "./lib/solid.js"
import { html, useHtml, useResolver, useSignal } from "./lib/lib.js"

function App() {
    const { useCallback } = useResolver(f => eval(f))

	const all = useSignal(["Ellie", "Milo", "Bella", "Michael"])
	const add = useCallback(name => all = [...ppl, name])

	return <>
		<p>Social App</p>
		<br /><br />
		<p>Follow List:</p>

		<ol>
			<For each={all}>
				{n => (<User name={n} />)}
			</For>
		</ol>

		<AddUser onadd={add} />
	</>
}
function AddUser({onadd}) {
	const change = e => {
		onadd(e.target.value)
		e.target.value = ""
	}
	return <>
		<label>
			New Follow: <br /><br />
			<input onChange={change} />
		</label>
	</>
}
function User({name}) {
	return <>
		<li> {name} <br /><br /> </li>
	</>
}
render(App, document.body)