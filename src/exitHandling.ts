import { servers } from '.'
import { print, saveState } from './util'

const saveOpt = { save: true }
const exitOpt = { exit: true }

setExitHandler( 'exit', saveOpt )
setExitHandler( 'SIGINT', exitOpt )
setExitHandler( 'SIGTERM', exitOpt )
setExitHandler( 'uncaughtException', exitOpt )

export interface IExitHandler {
	save?: boolean
	exit?: boolean
}

function setExitHandler( event, opt: IExitHandler ) {
	process.on( 'exit', e => exitHandler( opt, e ) )
}

function exitHandler( opt: IExitHandler, err?: any ) {
	if ( err ) print( err )
	if ( opt.save ) saveState( servers )
	if ( opt.exit ) process.exit()
}
