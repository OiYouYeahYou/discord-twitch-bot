import { Client } from 'discord.js'

import { print, getPersistence } from './util'
import { token, interval } from './constants'
import { IServer, } from './types'
import { messageReceived } from './messageHandling'
import { tick } from './tick'

export const servers: IServer[] = getPersistence()

export const bot = new Client()
bot.on( 'message', messageReceived )
start().catch( err => {
	print( 'An error occured while loging in:', err )
	process.exit( 1 )
} )

async function start() {
	await bot.login( token )
	print( 'Logged in with token ' + token )

	tick()
	setInterval( tick, interval )

	const invite = await bot.generateInvite( [] )
	print( invite )
}
