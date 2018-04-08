import { IServer, IExitHandler } from './types'
import { servers } from '.'
import { print } from './util'
import { writeFileSync } from 'fs'
import { channelPath } from './constants'

const saveOpt = { save: true }
const exitOpt = { exit: true }

setExitHandler( 'exit', saveOpt )
setExitHandler( 'SIGINT', exitOpt )
setExitHandler( 'SIGTERM', exitOpt )
setExitHandler( 'uncaughtException', exitOpt )

function setExitHandler( event, opt ) {
	process.on( 'exit', e => exitHandler( servers, saveOpt, e ) )
}

export function exitHandler(
	servers: IServer[],
	opt: IExitHandler,
	err?: any
) {
	if ( err )
		print( err )

	if ( opt.save ) {
		print( `Saving channels to ${ channelPath } before exiting` )
		writeFileSync( channelPath, JSON.stringify( servers, null, 4 ) )
		print( 'Saved state' )
	}

	if ( opt.exit )
		process.exit()
}
