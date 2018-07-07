import App from './classes/App'

const saveOpt = { save: true }
const exitOpt = { exit: true }

export interface IExitHandler {
	save?: boolean
	exit?: boolean
}

export function setupExitHandling(app: App) {
	setExitHandler('exit', saveOpt)
	setExitHandler('SIGINT', exitOpt)
	setExitHandler('SIGTERM', exitOpt)
	setExitHandler('uncaughtException', exitOpt)

	function setExitHandler(event, opt: IExitHandler) {
		process.on(event, e => exitHandler(opt, e))
	}

	function exitHandler(opt: IExitHandler, err?: any) {
		if (err) app.print(err)
		if (opt.save) app.save()
		if (opt.exit) process.exit()
	}
}
