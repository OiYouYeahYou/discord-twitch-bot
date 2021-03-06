/** String indexOf that returns undefined instead of -1 */
export function indexOf(str: string, search: string, position?: number) {
	var index: number = str.indexOf(search, position)
	return index > 0 ? index : undefined
}

/**
 * Splits string into an array containg first word and remaining string
 * @param text
 */
export function splitByFirstSpace(text: string): [string, string] {
	text = text.trim()

	if (!text) return ['', '']

	var indexOfFirstSpace = indexOf(text, ' ')

	var a = text.slice(0, indexOfFirstSpace).trim()
	var b = indexOfFirstSpace ? text.slice(indexOfFirstSpace).trim() : ''

	return [a, b]
}

export async function timer(time: number) {
	return new Promise((resolve, reject) => setTimeout(() => resolve(), time))
}

/**
 * Splits command string form rest  of text and lowercases the command
 * @param text
 */
export function processCommandString(text: string): [string, string] {
	let [command, args] = splitByFirstSpace(text)

	command = command.toLowerCase()

	return [command, args]
}

export function padRight(text: string | number, len: number) {
	let res = text ? text.toString() : ''
	while (res.length < len) res += ' '

	return res
}

export function padLeft(text: string | number, len: number) {
	let res = text ? text.toString() : ''
	while (res.length < len) res = ' ' + res

	return res
}

export function maxStringLength(arr: string[]) {
	return arr.reduce((acc, str) => Math.max(acc, str.length), 0)
}

export function isPrefixed(pfx: string, str: string) {
	return str.length !== pfx.length && pfx.length > 0 && str.startsWith(pfx)
}

export function removePrefix(pfx: string, text: string) {
	return text.slice(pfx.length).trim()
}

export const stringSort = (a, b) =>
	a.name.toLowerCase().localeCompare(b.name.toLowerCase())
