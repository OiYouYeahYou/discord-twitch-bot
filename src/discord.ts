import { SendableChannel } from './types'
import { RichEmbed } from 'discord.js'
import { print } from './util'
import { IStream } from './twitch';

export async function sendEmbed( channel: SendableChannel, embed: RichEmbed ) {
	await channel.send( embed )
	print( `Sent embed to channel '${ channel.name }'.` )
}

export function Embed( stream: IStream ) {
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
		.setThumbnail( logo )

	return embed
}
