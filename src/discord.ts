import { RichEmbed } from 'discord.js'
import { IStream } from './twitch'

export function Embed(stream: IStream) {
	const { channel, preview, viewers, created_at } = stream
	const { display_name, url, game, status, logo, followers } = channel
	const start = new Date(created_at)

	const embed = new RichEmbed()
		.setTitle(display_name.replace(/_/g, '\\_'))
		.setDescription(`**${status}**\n${game}`)
		.addField('Viewers', viewers, true)
		.addField('Followers', followers, true)
		.addField('Start', start, true)
		.setColor('#9689b9')
		.setURL(url)
		.setImage(preview.large)
		.setThumbnail(logo)

	return embed
}
