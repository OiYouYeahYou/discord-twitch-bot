import { IServer, WithNameProp } from "./types";
import { Guild } from "discord.js";

import { format } from 'util';
import { readFileSync } from 'fs';
import { channelPath } from "./constants";

const leadingZero = ( n: number ) => n < 10 ? '0' + n : n;
const tidyString = ( str: string ) => str.toLowerCase().trim()

// adds a timestamp before msg/err
export function print( ...args ) {
	var date = new Date();
	var h = leadingZero( date.getHours() );
	var m = leadingZero( date.getMinutes() );
	var s = leadingZero( date.getSeconds() );

	// @ts-ignore
	console.log( `[${ h }:${ m }:${ s }] ${ format( ...args ) }` );
}

export function getByName<T extends WithNameProp>(
	array: T[], value: string
): T {
	const v = tidyString( value )
	for ( const item of array ) {
		const { name } = item
		if ( name && tidyString( name ) === v )
			return item;
	}
}

export function getPersistence(): IServer[] {
	print( "Reading file " + channelPath );
	try {
		const file = readFileSync( channelPath, { encoding: "utf-8" } );
		const servers = JSON.parse( file );
		return servers
	} catch ( error ) {
		return []
	}
}

export function getServerConfig( servers: IServer[], guild: Guild ): IServer {
	const { name, id } = guild
	let server = getByName( servers, name );
	if ( server )
		return server

	server = {
		name, id,
		prefix: "!",
		role: "botadmin",
		discordChannels: [],
		twitchChannels: []
	}
	servers.push( server );
	return server
}
