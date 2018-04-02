import https = require( 'https' );
import { Message, Client, RichEmbed } from 'discord.js';

import {
	print, exitHandler, getPersistence, getByName, getServerConfig
} from './util';
import {
	token, interval, timeout, host, headers, saveOpt, exitOpt,
} from './constants';
import { IServer, SendableChannel } from './types';

const servers: IServer[] = getPersistence();;

process.on( 'exit', e => exitHandler( servers, saveOpt, e ) );
process.on( 'SIGINT', e => exitHandler( servers, exitOpt, e ) );
process.on( 'SIGTERM', e => exitHandler( servers, exitOpt, e ) );
process.on( 'uncaughtException', e => exitHandler( servers, exitOpt, e ) );

const bot = new Client();
bot.on( 'message', messageReceived );
bot.login( token )
	.then( () => {
		print( 'Logged in with token ' + token );

		// tick once on startup
		tick();
		setInterval( tick, interval );

		return bot.generateInvite( [] )
	} )
	.then( invite => print( invite ) )
	.catch( err => {
		print( 'An error occured while loging in:', err );
		process.exit( 1 );
	} );


function callApi(
	server: IServer,
	twitchChannel,
	cb: ( server: IServer, twitchChannel, response ) => any,
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

function getHandler( res, callback, server: IServer, twitchChannel ) {
	var body = '';
	res.on( 'data', chunk => body += chunk );
	res.on( 'end', () => {
		try {
			const response = JSON.parse( body );

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

function x( res, twitchChannel, stream ) {
	return (
		res && !twitchChannel.online && stream
		&& ( twitchChannel.timestamp + timeout <= Date.now() )
	)
}

function apiCallback( server: IServer, twitchChannel, res ) {
	if ( !res )
		return;

	const { stream } = res

	if ( !x( res, twitchChannel, stream ) ) {
		twitchChannel.online = false;
		return
	}

	try {
		const guild = bot.guilds.find( 'name', server.name );
		const { discordChannels } = server
		const { channels } = guild
		const embed = Embed( res )

		twitchChannel.online = true;
		twitchChannel.timestamp = Date.now();

		if ( !discordChannels.length ) {
			const channel = channels.find( 'type', 'text' );
			if ( channel )
				// @ts-ignore
				sendEmbed( channel, embed );
		}
		else
			for ( const discordChannel of discordChannels ) {
				const channel = channels.find( 'name', discordChannel );
				if ( channel )
					// @ts-ignore
					sendEmbed( channel, embed );
			}
	} catch ( err ) {
		print( err );
	}
}

function sendEmbed( channel: SendableChannel, embed: RichEmbed ) {
	return channel.send( embed )
		.then( () => print( `Sent embed to channel '${ channel.name }'.` ) );
}

function Embed( res ) {
	const { stream } = res
	const { channel } = stream
	const { display_name, url, game, status } = channel
	const { logo, viewers, followers, preview } = channel

	const embed = new RichEmbed()
		.setTitle( display_name.replace( /_/g, '\\_' ) )
		.setDescription( `**${ status }**\n${ game }` )
		.addField( 'Viewers', viewers, true )
		.addField( 'Followers', followers, true )
		.setColor( '#9689b9' )
		.setURL( url )
		.setImage( preview.large )
		.setThumbnail( logo );

	return embed
}

function tick() {
	for ( const server of servers )
		for ( const twitchChannel of server.twitchChannels )
			if ( twitchChannel )
				callApi( server, twitchChannel, apiCallback, true );
}

function messageReceived( message: Message ) {
	const { guild, content } = message

	if ( !guild )
		return;

	const server = getServerConfig( servers, guild );

	if ( content[ 0 ] == server.prefix ) {
		if ( content.substring( 1, 7 ) == 'remove' )
			return remove( message, server, content );
		else if ( content.substring( 1, 4 ) == 'add' )
			return add( message, server, content )
		else if ( content.substring( 1, 5 ) == 'list' )
			return list( message, server );
		else if ( content.substring( 1, 10 ) == 'configure' )
			return configure( message, server, content )
		else
			return usage( message, server );
	}
	else if ( content[ 0 ] == server.lastPrefix )
		return oldPrefix( message, server );
}

function remove( message: Message, server: IServer, content: string ) {
	if ( !hasPermissionRole( message, server ) )
		return message.reply(
			`you're lacking the role _${ server.role }_.`
		);

	const streamer = content.slice( 7 ).trim();
	const channel = getByName( server.twitchChannels, streamer );

	if ( !channel )
		return message.reply( `${ streamer } isn't in the list.` );

	server.twitchChannels = server.twitchChannels.filter(
		channel => channel.name != streamer
	);

	return message.reply( `Removed ${ streamer }.` );
}

function add( message: Message, server: IServer, content: string ) {
	if ( !hasPermissionRole( message, server ) )
		return message.reply(
			`you're lacking the role _${ server.role }_.`
		);

	const name = content.slice( 4 ).trim();
	const channelObject = { name };

	const channel = getByName( server.twitchChannels, name );
	if ( !channel )
		return message.reply( name + ' is already in the list.' );

	callApi( server, channelObject, ( _, __, res ) => {
		if ( !res )
			return message.reply( name + ' doesn\'t seem to exist.' );

		server.twitchChannels.push( {
			name, timestamp: 0,
			online: false
		} );

		tick();

		return message.reply( `Added ${ name }.` );
	}, false );
}

function list( message: Message, { twitchChannels }: IServer ) {
	if ( !twitchChannels.length )
		return message.reply( 'The list is empty.' );

	const channels = twitchChannels.map( i => i ).sort(
		( a, b ) => a.toLowerCase() - b.toLowerCase()
	)
	const offline = [];
	const live = []

	for ( const { online, name } of channels )
		( online ? live : offline ).push( name )

	const msg = `\nOnline:\n\`\`\`${ live.join( ', ' ) }\`\`\`\nOffline:\n\`\`\`${ offline.join( ', ' ) }\`\`\``

	return message.reply( msg.replace( /_/g, '\\_' ) );
}

function configure( message: Message, server: IServer, content: string ) {
	const { guild } = message
	if ( guild.owner != message.member )
		return message.reply( 'You are not the server owner.' );

	if ( content.substring( 11, 15 ) == 'list' )
		return configureList( message, server );
	else if ( content.substring( 11, 17 ) == 'prefix' )
		return configurePrefix( message, server, content );
	else if ( content.substring( 11, 15 ) == 'role' )
		return configureRole( message, server, content )
	else if ( content.substring( 11, 18 ) == 'channel' ) {
		if ( content.substring( 19, 22 ) == 'add' )
			return configureAdd( message, server, content );
		else if ( content.substring( 19, 25 ) == 'remove' )
			return configureRemove( message, server, content );
		else
			return missingArguments( message );
	}
	else
		return configureUsage( message, server );
}

function configureList( message: Message, server: IServer ) {
	const { role, discordChannels, prefix } = server
	const msg = []

	msg.push( '```\n' )
	msg.push( 'prefix    ' + prefix )
	msg.push( 'role      ' + role )

	const space = '          '
	msg.push(
		discordChannels.map( c => space + c ).join( ',\n' )
	)
	msg.push( '```' );

	return message.reply( msg.join( '\n' ) )
}

function configurePrefix( message: Message, server: IServer, content: string ) {
	const { prefix } = server
	let newPrefix = content.substring( 18, 19 );

	if ( newPrefix.replace( /\s/g, '' ).length === 0 )
		return missingArguments( message );

	else if ( newPrefix == prefix )
		return message.reply( 'Prefix already is ' + prefix );

	else {
		server.prefix = newPrefix;
		server.lastPrefix = prefix;
		return message.reply( 'Changed prefix to ' + prefix );
	}
}

function configureRole( message: Message, server: IServer, content: string ) {
	const newRole = content.substring( 16 )

	if ( newRole.replace( /\s/g, '' ).length === 0 )
		return missingArguments( message );

	else {
		server.role = newRole;
		return message.reply(
			'Changed role to ' + server.role
		);
	}
}

function configureAdd( message: Message, server: IServer, content: string ) {
	const channel = content.substring( 23 );

	if ( channel.replace( /\s/g, '' ).length === 0 )
		return missingArguments( message );

	else if ( message.guild.channels.exists( 'name', channel ) ) {
		server.discordChannels.push( channel );
		return message.reply( `Added ${ channel } to list of channels to post in.` );
	}

	else {
		return message.reply( channel + ' does not exist on this server.' );
	}
}

function configureRemove( message: Message, server: IServer, content: string ) {
	const { discordChannels } = server
	let channel = content.substring( 26 );
	if ( channel.replace( /\s/g, '' ).length === 0 )
		return missingArguments( message );

	for ( let i = discordChannels.length; i >= 0; i-- ) {
		if ( discordChannels[ i ] == channel ) {
			discordChannels.splice( i, 1 );
			return message.reply(
				`Removed ${ channel } from list of channels to post in.`
			);
		}
	}
	return message.reply(
		channel + ' does not exist in list.'
	);
}

function missingArguments( message: Message ) {
	return message.reply( 'Please specify an argument for channel' );
}

function configureUsage( message: Message, { prefix }: IServer ) {
	return message.reply( [
		'```',
		`Usage: ${ prefix }configure OPTION [SUBOPTION] VALUE`,
		`Example: ${ prefix }configure channel add example`,
		'',
		'Options:',
		'  list    - List current config',
		'  prefix  - Character to use in front of commands',
		'  role    - Role permitting usage of add and remove',
		'  channel - Channel(s) to post in, empty list will use the first channel',
		'  add     - Add a discord channel to the list',
		'  remove  - Remove a discord channel from the list',
		'```'
	].join( '\n' ) );
}

function usage( message: Message, { prefix }: IServer ) {
	return message.reply(
		`Usage:\n ${ prefix }[configure args|list|add channel_name|remove channel_name]`
	);
}

function oldPrefix( message: Message, server: IServer ) {
	return message.reply(
		`The prefix was changed from \`${ server.lastPrefix }\` to \`${ server.prefix }\`. Please use the new prefix.`
	);
}

function hasPermissionRole( message: Message, server: IServer ) {
	try {
		return message.member.roles.exists( 'name', server.role );
	}
	catch ( err ) {
		return false
	}
}
