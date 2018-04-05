import https = require( 'https' );
import { Client, RichEmbed } from 'discord.js';

import { print, getPersistence } from './util';
import { token, interval, timeout, host, headers } from './constants';
import { IServer, SendableChannel, APIcallback, ITwitchChannel, ITwtichResponse } from './types';
import { messageReceived } from './messageHandling';

export const servers: IServer[] = getPersistence();

const bot = new Client();
bot.on( 'message', messageReceived );
start().catch( err => {
	print( 'An error occured while loging in:', err );
	process.exit( 1 );
} );

async function start() {
	await bot.login( token )
	print( 'Logged in with token ' + token );

	tick();
	setInterval( tick, interval );

	const invite = await bot.generateInvite( [] )
	print( invite )
}

export function callApi(
	server: IServer,
	twitchChannel: ITwitchChannel,
	cb: APIcallback,
	getStreamInfo: boolean
) {
	try {
		const endpoint = getStreamInfo ? 'streams' : 'channels'
		const path = `/kraken/${ endpoint }/${ twitchChannel.name.trim() }`;
		const opt = { host, path, headers };
		const getter = https.get( opt,
			( res ) => getHandler( res, cb, server, twitchChannel )
		);

		getter.on( 'error', ( err ) => print( err ) );
	} catch ( err ) {
		print( err );
	}
}

function getHandler(
	res,
	callback: APIcallback,
	server: IServer,
	twitchChannel: ITwitchChannel
) {
	var body = '';
	res.on( 'data', chunk => body += chunk );
	res.on( 'end', () => {
		try {
			const response = JSON.parse( body );
			console.log( response );

			if ( response.status == 404 )
				callback( server );
			else
				callback( server, twitchChannel, response );
		}
		catch ( err ) {
			print( err );
			return;
		}
	} );
}

function x( res, twitchChannel: ITwitchChannel, stream: string ) {
	return (
		res
		&& stream
		&& !twitchChannel.online
		&& ( twitchChannel.timestamp + timeout <= Date.now() )
	)
}

async function apiCallback(
	server: IServer,
	twitchChannel: ITwitchChannel,
	res
) {
	if ( !res )
		return;

	const { stream } = res

	if ( !x( res, twitchChannel, stream ) ) {
		twitchChannel.online = false;
		return
	}

	try {
		const guild = bot.guilds.find( 'id', server.id );
		const { discordChannels } = server
		const { channels } = guild
		const embed = Embed( res )

		twitchChannel.online = true;
		twitchChannel.timestamp = Date.now();

		if ( !discordChannels.length ) {
			const channel = channels.find( 'type', 'text' );
			if ( channel )
				// @ts-ignore
				await sendEmbed( channel, embed );
		}
		else
			for ( const discordChannel of discordChannels ) {
				const channel = channels.find( 'id', discordChannel );
				if ( channel )
					// @ts-ignore
					await sendEmbed( channel, embed );
			}
	} catch ( err ) {
		print( err );
	}
}

async function sendEmbed( channel: SendableChannel, embed: RichEmbed ) {
	await channel.send( embed )
	print( `Sent embed to channel '${ channel.name }'.` )
}

function Embed( res: ITwtichResponse ) {
	const { stream } = res
	const { channel, preview, viewers, created_at } = stream
	const { display_name, url, game, status, logo, followers } = channel
	const start = new Date( created_at )

	const embed = new RichEmbed()
		.setTitle( display_name.replace( /_/g, '\\_' ) )
		.setDescription( `**${ status }**\n${ game }` )
		.addField( 'Viewers', viewers, true )
		.addField( 'Followers', followers, true )
		.addField( 'Start', start, true )
		.setColor( '#9689b9' )
		.setURL( url )
		.setImage( preview.large )
		.setThumbnail( logo );

	return embed
}

export function tick() {
	for ( const server of servers )
		for ( const twitchChannel of server.twitchChannels )
			if ( twitchChannel )
				callApi( server, twitchChannel, apiCallback, true );
}

