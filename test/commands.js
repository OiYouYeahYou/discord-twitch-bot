import { test } from 'ava'
import { stub, createSandbox } from 'sinon'
import { Collection } from 'discord.js'

import { main } from '../lib/messageHandling'
import Request from '../lib/classes/Request'
import { GuildConfig } from '../lib/classes/GuildConfig'
import { APIError } from '../lib/twitch'

class MockApp {
	constructor(sandbox) {
		const existingStreamer = 'theGreatestStreamer'
		const unAddedStreamer = 'anotherGreatStreamer'

		const existingChannels = ['C', 'D']

		this.tick = sandbox.spy(() => Promise.resolve())

		this.store = {
			save: sandbox.spy(),
			removeStreamer: sandbox.spy(),
			addStreamer: sandbox.spy(),
			streamerRecordExists: sandbox.spy(
				(_, name) => name === existingStreamer
			),
			addOutput: sandbox.spy(
				(_, channel) => !existingChannels.includes(channel.id)
			),
			removeOutput: sandbox.spy((_, channel) =>
				existingChannels.includes(channel.id)
			),
		}

		this.twitch = {
			getChannel(name) {
				if (name === existingStreamer || name === unAddedStreamer) {
					return {}
				} else {
					return new APIError({})
				}
			},
		}
	}
}

class MockChannel {
	constructor(sandbox, data = {}) {
		this.name = data.name || 'an-abvious-channel-name'
		this.id = data.id || '1337'
		this.send = sandbox.spy(() => Promise.resolve())
	}

	startTyping() {}
	stopTyping() {}
}

const defaultGuildConfig = {
	id: '123456789000000000',
	prefix: '!!',
	role: 'one-true-root-user',
	outputs: [],
	channels: {
		theGreatestStreamer: {
			name: 'theGreatestStreamer',
			online: false,
			current: 0,
		},
		anotherStreamer: {
			name: 'anotherStreamer',
			online: false,
			current: 0,
		},
		theCoolestStreamer: {
			name: 'theCoolestStreamer',
			online: true,
			current: 0,
		},
	},
}

class MockMessage {
	constructor(sandbox) {
		this.channel = new MockChannel(sandbox)
		this.reply = sandbox.spy(() => Promise.resolve())
		this.delete = sandbox.spy(() => Promise.resolve(this))
		this.deletable = true
		this.guild = { name: 'totally a guild' }
		this.mentions = { channels: new Collection() }
	}
}

function MockRequest({ guildConfigData = {} } = {}) {
	const sandbox = createSandbox()

	const app = new MockApp(sandbox)
	const guildConfig = new GuildConfig(
		Object.assign({}, defaultGuildConfig, guildConfigData)
	)
	const message = new MockMessage(sandbox)
	const req = new Request(app, guildConfig, message, null, null)

	req.fail = async (_, __, error) => {
		throw error
	}

	const { store, tick } = app
	const { guild } = message

	return {
		app,
		req,
		guildConfig,
		message,
		sandbox,
		store,
		tick,
		guild,

		sendTest(t, snapshotDescription, constains, notContains) {
			const response = message.channel.send.args[0][0]

			t.true(message.channel.send.calledOnce)

			if (notContains)
				for (const string of constains)
					t.true(stringContains(response, string))

			if (notContains)
				for (const string of notContains)
					t.false(stringContains(response, string))

			t.snapshot(response, snapshotDescription)
		},
	}
}

function stringContains(whole, part) {
	return Boolean(whole.indexOf(part) + 1)
}

/* =================================== § =================================== */

test('remove: removes streamer record', async t => {
	const { req, guild, store, sendTest } = MockRequest()
	const streamer = 'theGreatestStreamer'
	const command = 'remove ' + streamer

	await main.commandRunner(req, command)

	t.true(store.removeStreamer.calledOnce)
	t.true(store.removeStreamer.calledWith(guild, streamer))

	sendTest(t, 'confirmation the streamer has been removed', [streamer])
})
test('remove: handles non-existant streamer', async t => {
	const { req, store, sendTest } = MockRequest()
	const streamer = 'anobody'
	const command = 'remove ' + streamer

	await main.commandRunner(req, command)

	t.true(store.removeStreamer.notCalled)

	sendTest(t, "A statement that streamer isn't in the list", [streamer])
})

test('add: adds streamer to store', async t => {
	const { req, guild, store, sendTest } = MockRequest()
	const streamer = 'anotherGreatStreamer'
	const command = 'add ' + streamer

	await main.commandRunner(req, command)

	t.true(store.addStreamer.calledOnce)
	t.true(store.addStreamer.calledWith(guild, streamer))

	sendTest(t, 'confirmation the streamer has been added', [streamer])
})
test('add: prevents adding streamer that has no Twitch page', async t => {
	const { req, store, sendTest } = MockRequest()
	const streamer = 'nonexistantstreamer'
	const command = 'add ' + streamer

	await main.commandRunner(req, command)

	t.true(store.addStreamer.notCalled)

	sendTest(t, "A statement that the streamer doesn't exist on Twitch", [
		streamer,
	])
})
test('add: prevents adding duplicates', async t => {
	const { req, store, sendTest } = MockRequest()
	const streamer = 'theGreatestStreamer'
	const command = 'add ' + streamer

	await main.commandRunner(req, command)

	t.true(store.addStreamer.notCalled)

	sendTest(t, 'statement that the streamer is already tracked', [streamer])
})

test('list: lists all streamers and stheir online state', async t => {
	const { req, sendTest } = MockRequest()
	const command = 'list'

	await main.commandRunner(req, command)

	sendTest(
		t,
		'list of streamers grouped by their online status',
		['Online', 'Offline'],
		['The list is empty.']
	)
})
test('list: informs user if list is empty', async t => {
	const { req, sendTest } = MockRequest({ guildConfigData: { channels: {} } })
	const command = 'list'

	await main.commandRunner(req, command)

	sendTest(
		t,
		'statement that no streamer records exist and are not bieng tracked',
		['The list is empty.'],
		['Online', 'Offline']
	)
})

test('tick: calls tick function', async t => {
	const { req, tick, message } = MockRequest()
	const command = 'tick'

	await main.commandRunner(req, command)

	t.true(tick.calledOnce)
	t.true(message.delete.calledOnce)
})

/* =================================== § =================================== */

test('config list: lists all channels that are used to output', async t => {
	const { req, sendTest } = MockRequest()
	const command = 'config list'

	await main.commandRunner(req, command)

	sendTest(t, 'response showing the config for the guild', [
		'prefix    !!',
		'role      one-true-root-user',
		'streamers:',
	])
})

test('config prefix: changes prefix', async t => {
	const { req, guildConfig, sendTest } = MockRequest()
	const newPrefix = '§'
	const oldPrefix = guildConfig.prefix
	const command = 'config prefix ' + newPrefix

	await main.commandRunner(req, command)

	sendTest(t, 'statement that the prefix has been changed', [
		newPrefix,
		oldPrefix,
	])

	t.true(newPrefix === guildConfig.prefix)
})
test('config prefix: prevents changing prefix when they are identical', async t => {
	const { req, guildConfig, sendTest } = MockRequest()
	const command = 'config prefix !!'
	const prefix = guildConfig.prefix

	await main.commandRunner(req, command)

	sendTest(
		t,
		'statement that the proposed and existing prefix are the same',
		[prefix]
	)

	t.true(prefix === guildConfig.prefix)
})
test('config prefix: prevents changing to blank prefix', async t => {
	const { req, guildConfig } = MockRequest()
	const missngArgs = stub(req, 'missingArguments')
	const command = 'config prefix'
	const prefix = guildConfig.prefix

	await main.commandRunner(req, command)

	t.true(missngArgs.calledOnce)
	t.true(prefix === guildConfig.prefix)
})

test('config role: changes admin role', async t => {
	const { req, guildConfig, sendTest } = MockRequest()
	const futureRole = 'one-true-scotsman'
	const command = 'config role ' + futureRole
	const oldRole = guildConfig.role

	await main.commandRunner(req, command)

	t.true(futureRole === guildConfig.role)
	t.false(oldRole === guildConfig.role)

	sendTest(t, 'output of the config info for the guild', [
		futureRole,
		oldRole,
	])
})
test('config role: does nothing if no arguments are provided', async t => {
	const { req, guildConfig } = MockRequest()
	const missngArgs = stub(req, 'missingArguments')
	const command = 'config role'
	const role = guildConfig.role

	await main.commandRunner(req, command)

	t.true(missngArgs.calledOnce)
	t.true(role === guildConfig.role)
})

test('config save: tells store to save', async t => {
	const { req, store, sendTest, message } = MockRequest()
	const command = 'config save'

	await main.commandRunner(req, command)

	t.true(store.save.calledOnce)
	t.true(store.save.calledBefore(message.channel.send))

	sendTest(t, 'statement that the state has been saved')
})

/* =================================== § =================================== */

test('channel add: adds output channel based on channel mentions', async t => {
	const { req, message, guild, store, sandbox, sendTest } = MockRequest()

	const channelA = new MockChannel(sandbox, { id: 'A', name: 'an-out' })
	const channelB = new MockChannel(sandbox, { id: 'B', name: 'another-out' })
	const channelC = new MockChannel(sandbox, { id: 'C', name: 'existing-out' })

	const command = 'channel add #an-out #another-out #existing-out'
	message.mentions = {
		channels: new Collection([[0, channelA], [1, channelB], [2, channelC]]),
	}

	await main.commandRunner(req, command)

	t.is(store.addOutput.callCount, 3)
	t.true(store.addOutput.calledWith(guild, channelA))
	t.true(store.addOutput.calledWith(guild, channelB))
	t.true(store.addOutput.calledWith(guild, channelC))

	sendTest(
		t,
		'confirmation the channel has been added, or was already existed',
		[channelA.name, channelB.name, channelC.name]
	)
})
test('channel add: If there are no mentions, request the use channel mentions', async t => {
	const { req, store, sendTest } = MockRequest()
	const command = 'channel add meanigless junk'

	await main.commandRunner(req, command)

	t.true(store.addOutput.notCalled)

	sendTest(t, 'response asking the user to use the mention feature')
})

test('channel remove: adds output channel based on channel mentions', async t => {
	const { req, message, guild, store, sandbox, sendTest } = MockRequest()

	const channelA = new MockChannel(sandbox, { id: 'A', name: 'an-out' })
	const channelB = new MockChannel(sandbox, { id: 'B', name: 'another-out' })
	const channelC = new MockChannel(sandbox, { id: 'C', name: 'existing-out' })

	const command = 'channel remove #an-out #another-out #existing-out'
	message.mentions = {
		channels: new Collection([[0, channelA], [1, channelB], [2, channelC]]),
	}

	await main.commandRunner(req, command)

	t.is(store.removeOutput.callCount, 3)
	t.true(store.removeOutput.calledWith(guild, channelA.id))
	t.true(store.removeOutput.calledWith(guild, channelB.id))
	t.true(store.removeOutput.calledWith(guild, channelC.id))

	sendTest(
		t,
		'confirmation the channel has been removed, or was already untracked',
		[channelA.name, channelB.name, channelC.name]
	)
})
test('channel remove: If there are no mentions, request the use channel mentions', async t => {
	const { req, store, sendTest } = MockRequest()
	const command = 'channel remove meanigless junk'

	await main.commandRunner(req, command)

	t.true(store.addOutput.notCalled)

	sendTest(t, 'response asking the user to use the mention feature')
})
