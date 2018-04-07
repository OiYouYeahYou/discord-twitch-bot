import { Message } from 'discord.js'
import {
	getServerConfig, getByName, isPrefixed, splitByFirstSpace, stringSort
} from './util'
import { servers } from '.'
import List from './classes/List'
import Request from './classes/Request'
import { exitHandler } from './exitHandling'
import { getChannel } from './twitch'
import { tick } from './tick'

export function messageReceived( message: Message ) {
	console.log( message )
	const { guild } = message

	if ( !guild )
		return

	const server = getServerConfig( servers, guild )
	const { prefix } = server
	const content = message.content.trim()

	if ( isPrefixed( prefix, content ) )
		return main.run( message, server, content, prefix )
}

const main = new List()
main.addCommand( 'remove', { func: remove, help: '' } )
main.addCommand( 'add', { func: add, help: '' } )
main.addCommand( 'list', { func: list, help: '' } )
main.addCommand( 'tick', { func: callTick, help: '' } )

const config = main.addModule( 'config', { help: '' } )
config.addCommand( 'list', { func: configList, help: '' } )
config.addCommand( 'prefix', { func: configPfx, help: '' } )
config.addCommand( 'role', { func: configRole, help: '' } )
config.addCommand( 'save', { func: configSave, help: '' } )

const configChannel = main.addModule( 'channel', { help: '' } )
configChannel.addCommand( 'add', { func: addChannel, help: '' } )
configChannel.addCommand( 'remove', { func: rmChannel, help: '' } )

function remove( req: Request, args: string ) {
	const { server } = req
	const [ streamer ] = splitByFirstSpace( args )
	const channel = getByName( server.twitchChannels, streamer )

	if ( !channel )
		return req.send( `${ streamer } isn't in the list.` )

	server.twitchChannels = server.twitchChannels.filter(
		channel => channel.name != streamer
	)

	return req.send( `Removed ${ streamer }.` )
}

async function add( req: Request, content: string ) {
	const { server } = req
	const [ name ] = splitByFirstSpace( content )
	const channelObject = { name, timestamp: 0, online: false }

	const channel = getByName( server.twitchChannels, name )
	if ( channel )
		return req.send( name + ' is already in the list.' )

	const res = await getChannel( name )
	if ( !res )
		return req.send( name + ' doesn\'t seem to exist.' )

	server.twitchChannels.push( channelObject )

	await tick()

	return req.send( `Added ${ name }.` )
}

function list( req: Request ) {
	const { twitchChannels } = req.server

	if ( !twitchChannels.length )
		return req.send( 'The list is empty.' )

	const channels = Array.from( twitchChannels ).sort( stringSort )
	const offline = []
	const live = []

	for ( const { online, name } of channels )
		( online ? live : offline ).push( name )

	const liveString = live.join( ', ' )
	const offlineString = offline.join( ', ' )

	return req.send(
		`\n\nOnline:\n`
		+ liveString
		+ `\n\nOffline:\n`
		+ offlineString
	)
}

async function callTick( req: Request ) {
	tick()
	return req.delete()
}

function configList( req: Request ) {
	const { role, discordChannels, prefix } = req.server
	const msg = []

	msg.push( '```\n' )
	msg.push( 'prefix    ' + prefix )
	msg.push( 'role      ' + role )

	const space = '          '
	msg.push( discordChannels.map( c => space + c ).join( ',\n' ) )
	msg.push( '```' )

	return req.send( msg.join( '\n' ) )
}

function configPfx( req: Request, args: string ) {
	const { server } = req
	const { prefix } = server
	let [ newPrefix ] = splitByFirstSpace( args )

	if ( newPrefix.replace( /\s/g, '' ).length === 0 )
		return missingArguments( req )

	else if ( newPrefix == prefix )
		return req.send( 'Prefix already is ' + prefix )

	else {
		server.prefix = newPrefix
		return req.send( 'Changed prefix to ' + prefix )
	}
}

function configRole( req: Request, args: string ) {
	const newRole = args

	if ( newRole.replace( /\s/g, '' ).length === 0 )
		return missingArguments( req )

	else {
		const { server } = req

		server.role = newRole
		return req.send( 'Changed role to ' + server.role )
	}
}

async function configSave( req: Request, args: string ) {
	exitHandler( servers, { save: true } )
	await req.send( 'Done' )
}

function addChannel( req: Request, args: string ) {
	const { channels } = req.message.mentions
	const { size } = channels

	if ( size ) {
		for ( const [ , channel ] of channels )
			req.server.discordChannels.push( channel.id )

		return req.send( 'Done' )
	}

	const channel = args.replace( /\s/g, '' ).replace( /\s/g, '-' )

	if ( req.guild.channels.exists( 'name', channel ) ) {
		req.server.discordChannels.push( channel )
		return req.send( `Added ${ channel } to list of channels to post in.` )
	}

	return req.send( channel + ' does not exist on this server.' )
}

function rmChannel( req: Request, args: string ) {
	const { discordChannels } = req.server
	const { channels } = req.message.mentions
	const { size } = channels

	if ( size ) {
		for ( const [ , channel ] of channels )
			req.server.discordChannels = discordChannels.filter(
				ch => ch != channel.id
			)

		return req.send( 'Done' )
	}

	if ( !args )
		return missingArguments( req )

	const channelName = args.replace( /\s/g, '' ).replace( /\s/g, '-' )
	const channel = req.guild.channels.find( 'name', channelName )

	if ( !channel )
		return req.send( 'No Channel found by the name' + channelName )

	req.server.discordChannels = discordChannels.filter( ch => ch != channel.id )

	return req.send(
		`Removed ${ channelName } from list of channels to post in.`
	)
}

function missingArguments( req: Request ) {
	return req.send( 'Please specify an argument for channel' )
}
