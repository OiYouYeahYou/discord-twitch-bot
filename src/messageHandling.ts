import { Message } from "discord.js";
import { getServerConfig, getByName } from "./util";
import { IServer } from "./types";
import { callApi, tick, servers } from ".";


export function messageReceived( message: Message ) {
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
	const channelObject = {
		name, timestamp: 0,
		online: false
	};

	const channel = getByName( server.twitchChannels, name );
	if ( !channel )
		return message.reply( name + ' is already in the list.' );

	callApi( server, channelObject, ( _, __, res ) => {
		if ( !res )
			return message.reply( name + ' doesn\'t seem to exist.' );

		server.twitchChannels.push( channelObject );

		tick();

		return message.reply( `Added ${ name }.` );
	}, false );
}

function list( message: Message, { twitchChannels }: IServer ) {
	if ( !twitchChannels.length )
		return message.reply( 'The list is empty.' );

	const channels = twitchChannels.map( i => i ).sort(
		( a, b ) => a.name.toLowerCase().localeCompare( b.name.toLowerCase() )
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
		return (
			message.guild.owner != message.member
			|| message.member.roles.exists( 'name', server.role )
		);
	}
	catch ( err ) {
		return false
	}
}
