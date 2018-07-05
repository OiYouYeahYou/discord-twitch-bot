import { splitByFirstSpace, stringSort } from './util/util'
import List from './classes/List'
import Request from './classes/Request'
import { APIError } from './twitch'

export const main = new List()
main.addCommand('remove', { func: remove, help: '' })
main.addCommand('add', { func: add, help: '' })
main.addCommand('list', { func: list, help: '' })
main.addCommand('tick', { func: callTick, help: '' })

const config = main.addModule('config', { help: '' })
config.addCommand('list', { func: configList, help: '' })
config.addCommand('prefix', { func: configPfx, help: '' })
config.addCommand('role', { func: configRole, help: '' })
config.addCommand('save', { func: configSave, help: '' })

const configChannel = main.addModule('channel', { help: '' })
configChannel.addCommand('add', { func: addChannel, help: '' })
configChannel.addCommand('remove', { func: rmChannel, help: '' })

function remove(req: Request, args: string) {
	const { guild, store } = req
	const [name] = splitByFirstSpace(args)

	if (!store.streamerRecordExists(guild, name))
		return req.send(`${name} isn't in the list.`)

	store.removeStreamer(guild, name)

	return req.send(`Removed ${name}.`)
}

async function add(req: Request, content: string) {
	const { store, guild } = req
	const [name] = splitByFirstSpace(content)

	if (store.streamerRecordExists(guild, name))
		return req.send(name + ' is already in the list.')

	const res = await req.twitch.getChannel(name)
	if (res instanceof APIError)
		return req.send(name + " doesn't seem to exist.")

	store.addStreamer(guild, name)

	await req.tick()

	return req.send(`Added ${name}.`)
}

async function list(req: Request) {
	const records = Object.values(req.guildConfig.channels)

	if (!records.length) {
		return req.send('The list is empty.')
	}

	records.sort(stringSort)

	const offline = []
	const live = []

	for (const { online, name } of records) {
		;(online ? live : offline).push(name)
	}

	const liveString = live.join(', ')
	const offlineString = offline.join(', ')

	return await req.send(
		`\n\nOnline:\n` + liveString + `\n\nOffline:\n` + offlineString
	)
}

async function callTick(req: Request) {
	await req.tick()
	return req.delete()
}

function configList(req: Request) {
	const { role, channels, prefix } = req.guildConfig
	const msg = []

	msg.push('```\n')
	msg.push('prefix    ' + prefix)
	msg.push('role      ' + role)
	msg.push('streamers:')

	const space = '          '
	msg.push(
		Object.values(channels)
			.map(c => space + c)
			.sort()
			.join(',\n')
	)
	msg.push('```')

	return req.send(msg.join('\n'))
}

function configPfx(req: Request, args: string) {
	const { guildConfig } = req
	const { prefix } = guildConfig
	let [newPrefix] = splitByFirstSpace(args)

	if (newPrefix.replace(/\s/g, '').length === 0) {
		return req.missingArguments()
	} else if (newPrefix == prefix) {
		return req.send('Prefix already is ' + prefix)
	} else {
		guildConfig.prefix = newPrefix
		return req.send('Changed prefix to ' + prefix)
	}
}

function configRole(req: Request, args: string) {
	const newRole = args

	if (newRole.replace(/\s/g, '').length === 0) {
		return req.missingArguments()
	} else {
		const { guildConfig } = req
		const oldRole = guildConfig.role

		guildConfig.role = newRole
		return req.send(
			`Changed role to  ${guildConfig.role} (from: ${oldRole})`
		)
	}
}

async function configSave(req: Request, args: string) {
	req.store.save()
	await req.send('Done')
}

function addChannel(req: Request, args: string) {
	const { store, guild, message } = req
	const { mentions } = message

	if (mentions.channels.size) {
		const channelsAdded = []
		const channelsNotAdded = []

		for (const [, channel] of mentions.channels) {
			const success = store.addOutput(guild, channel)
			;(success ? channelsAdded : channelsNotAdded).push(channel.name)
		}

		let response = []

		if (channelsAdded.length) {
			const added = channelsAdded.sort().join(', ')
			response.push(`Posting to ${added} channels`)
		}

		if (channelsNotAdded.length) {
			const notAdded = channelsNotAdded.sort().join(', ')
			response.push(`Already posting to ${notAdded} channels`)
		}

		return req.send(response.join('. '))
	} else {
		return req.send(
			'You need to mention the channel, for example `#general`'
		)
	}
}

function rmChannel(req: Request, args: string) {
	const { store, guild, message } = req
	const { mentions } = message

	if (mentions.channels.size) {
		const channelsRemoved = []
		const channelsNotRemoved = []

		for (const [, channel] of mentions.channels) {
			const success = store.removeOutput(guild, channel.id)
			;(success ? channelsRemoved : channelsNotRemoved).push(channel.name)
		}

		let response = []

		if (channelsRemoved.length) {
			const added = channelsRemoved.sort().join(', ')
			response.push(`No longer posting to ${added} channels`)
		}

		if (channelsNotRemoved.length) {
			const notAdded = channelsNotRemoved.sort().join(', ')
			response.push(`Was not posting to ${notAdded} channels`)
		}

		return req.send(response.join('. '))
	} else {
		return req.send(
			'You need to mention the channel, for example `#general`'
		)
	}
}
