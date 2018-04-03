import { IServer, IExitHandler } from "./types";
import { servers } from ".";
import { print } from "./util";
import { writeFileSync } from "fs";
import { channelPath } from "./constants";

const saveOpt = { save: true }
const exitOpt = { exit: true }

process.on( 'exit', e => exitHandler( servers, saveOpt, e ) );
process.on( 'SIGINT', e => exitHandler( servers, exitOpt, e ) );
process.on( 'SIGTERM', e => exitHandler( servers, exitOpt, e ) );
process.on( 'uncaughtException', e => exitHandler( servers, exitOpt, e ) );

export function exitHandler( servers: IServer[], opt: IExitHandler, err: any ) {
	if ( err )
		print( err );

	if ( opt.save ) {
		print( `Saving channels to ${ channelPath } before exiting` );
		print( JSON.stringify( servers ) );
		writeFileSync( channelPath, JSON.stringify( servers, null, 4 ) );
		print( "Done" );
	}

	if ( opt.exit )
		process.exit();
}
