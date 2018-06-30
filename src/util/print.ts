import { format } from 'util'

const leadingZero = (n: number) => (n < 10 ? '0' + n : n)

// adds a timestamp before msg/err
export function print(...args) {
	var date = new Date()
	var h = leadingZero(date.getHours())
	var m = leadingZero(date.getMinutes())
	var s = leadingZero(date.getSeconds())

	// @ts-ignore
	console.log(`[${h}:${m}:${s}] ${format(...args)}`)
}
