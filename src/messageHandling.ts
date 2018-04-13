import { splitByFirstSpace, stringSort } from './util'
import List from './classes/List'
import Request from './classes/Request'
import { getChannel } from './twitch'
import { tick } from './tick'
import { APIError } from './twitch'

export const main = new List()
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
	const { guild, store } = req
	const [ name ] = splitByFirstSpace( args )

	if ( !store.streamerRecordExists( guild, name ) )
		return req.send( `${ name } isn't in the list.` )

	store.addStreamer( guild, name )

	return req.send( `Removed ${ name }.` )
}

async function add( req: Request, content: string ) {
	const { store, guild } = req
	const [ name ] = splitByFirstSpace( content )

	if ( store.streamerRecordExists( guild, name ) )
		return req.send( name + ' is already in the list.' )

	const res = await getChannel( name )
	if ( res instanceof APIError )
		return req.send( name + ' doesn\'t seem to exist.' )

	store.addStreamer( guild, name )

	await tick()

	return req.send( `Added ${ name }.` )
}

function list( req: Request ) {
	const records = Object.values( req.guildConfig.channels )

	if ( !records.length )
		return req.send( 'The list is empty.' )

	records.sort( stringSort )

	const offline = []
	const live = []

	for ( const { online, name } of records )
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
	const { role, channels, prefix } = req.guildConfig
	const msg = []

	msg.push( '```\n' )
	msg.push( 'prefix    ' + prefix )
	msg.push( 'role      ' + role )

	const space = '          '
	msg.push( Object.values( channels ).map( c => space + c ).join( ',\n' ) )
	msg.push( '```' )

	return req.send( msg.join( '\n' ) )
}

function configPfx( req: Request, args: string ) {
	const { guildConfig } = req
	const { prefix } = guildConfig
	let [ newPrefix ] = splitByFirstSpace( args )

	if ( newPrefix.replace( /\s/g, '' ).length === 0 )
		return this.missingArguments()

	else if ( newPrefix == prefix )
		return req.send( 'Prefix already is ' + prefix )

	else {
		guildConfig.prefix = newPrefix
		return req.send( 'Changed prefix to ' + prefix )
	}
}

function configRole( req: Request, args: string ) {
	const newRole = args

	if ( newRole.replace( /\s/g, '' ).length === 0 )
		return this.missingArguments()

	else {
		const { guildConfig } = req

		guildConfig.role = newRole
		return req.send( 'Changed role to ' + guildConfig.role )
	}
}

async function configSave( req: Request, args: string ) {
	req.store.save()
	await req.send( 'Done' )
}

function addChannel( req: Request, args: string ) {
	const { store, guild, message } = req
	const { channels } = message.mentions

	if ( channels.size ) {
		for ( const [ , channel ] of channels )
			store.addOutput( guild, channel )

		return req.send( 'Done' )
	}

	const channelName = args.replace( /\s/g, '-' )

	if ( channels.exists( 'name', channelName ) ) {
		const channel = channels.find( 'name', channelName )

		store.addOutput( guild, channel )

		return req.send( `Added ${ channelName } to list of channels to post in.` )
	}

	return req.send( channelName + ' does not exist on this server.' )
}

function rmChannel( req: Request, args: string ) {
	const { guild, message, store } = req
	const { channels } = message.mentions

	if ( channels.size ) {
		for ( const [ , channel ] of channels )
			store.removeOutput( guild, channel.id )

		return req.send( 'Done' )
	}

	if ( !args )
		return this.missingArguments()

	const name = args.replace( /\s/g, '-' )
	const channel = guild.channels.find( 'name', name )

	if ( !channel )
		return req.send( 'No Channel found by the name' + name )

	store.removeOutput( guild, channel.id )

	return req.send(
		`Removed ${ name } from list of channels to post in.`
	)
}
