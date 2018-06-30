import { print } from './util/print'

const saveOpt = { save: true }
const exitOpt = { exit: true }

export interface IExitHandler {
	save?: boolean
	exit?: boolean
}

export function setupExitHandling(store) {
	setExitHandler('exit', saveOpt)
	setExitHandler('SIGINT', exitOpt)
	setExitHandler('SIGTERM', exitOpt)
	setExitHandler('uncaughtException', exitOpt)

	function setExitHandler(event, opt: IExitHandler) {
		process.on('exit', e => exitHandler(opt, e))
	}

	function exitHandler(opt: IExitHandler, err?: any) {
		if (err) print(err)
		if (opt.save) store.save()
		if (opt.exit) process.exit()
	}
}
