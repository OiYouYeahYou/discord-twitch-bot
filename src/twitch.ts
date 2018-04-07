import { IServer, ITwitchChannel, APIcallback } from './types'
import { headers, host } from './constants'
import { print } from './util'
import { get } from 'https'


export function callApi(
	server: IServer,
	twitchChannel: ITwitchChannel,
	cb: APIcallback,
	getStreamInfo: boolean
) {
	try {
		const endpoint = getStreamInfo ? 'streams' : 'channels'
		const path = `/kraken/${ endpoint }/${ twitchChannel.name.trim() }`
		const opt = { host, path, headers }
		const getter = get( opt,
			( res ) => getHandler( res, cb, server, twitchChannel )
		)

		getter.on( 'error', ( err ) => print( err ) )
	} catch ( err ) {
		print( err )
	}
}

function getHandler(
	res,
	callback: APIcallback,
	server: IServer,
	twitchChannel: ITwitchChannel
) {
	var body = ''
	res.on( 'data', chunk => body += chunk )
	res.on( 'end', () => {
		try {
			const response = JSON.parse( body )
			console.log( response )

			if ( response.status == 404 )
				callback( server )
			else
				callback( server, twitchChannel, response )
		}
		catch ( err ) {
			print( err )
			return
		}
	} )
}
