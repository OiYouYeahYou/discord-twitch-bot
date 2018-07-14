import test from 'ava'
import { Collection, TextChannel } from 'discord.js'
import { spy, createSandbox } from 'sinon'

import { Tick, checkStreamer } from '../lib/tick'
import { APIError } from '../lib/twitch'
import { StreamerRecord } from '../lib/classes/StreamerRecord'
import { GuildConfig } from '../lib/classes/GuildConfig'
import { Embed } from '../lib/discord'

const STREAMER_A = 'a-streamer'
const STREAMER_B = 'a-streamer'
const STREAMER_C = 'a-streamer'
const STREAMER_D = 'a-streamer'

const MockTwitchData = {
	// TODO add data
}

const twitchPresentsMockData = {
	_id: 29394596816,
	game: 'Always On',
	viewers: 9593,
	video_height: 720,
	average_fps: 30,
	delay: 0,
	created_at: '2018-07-08T17:00:04Z',
	is_playlist: false,
	stream_type: 'live',
	preview: {
		small: '/live_user_twitchpresents-80x45.jpg',
		medium: '/live_user_twitchpresents-320x180.jpg',
		large: '/live_user_twitchpresents-640x360.jpg',
		template: '/live_user_twitchpresents-{width}x{height}.jpg',
	},
	channel: {
		mature: false,
		partner: true,
		status:
			'Start of the 5th Doctor! Yogscast Pre-Show (10:40a) // Castrovalva // Four to Doomsday // Kinda. Begins 11a PDT, repeats @ 4:30p and 10p PDT',
		broadcaster_language: 'en',
		display_name: 'TwitchPresents',
		game: 'Always On',
		language: 'en',
		_id: 149747285,
		name: 'twitchpresents',
		created_at: '2017-03-07T23:03:18Z',
		updated_at: '2018-07-09T14:36:20Z',
		delay: null,
		logo: '/dd542e0da09855b6-profile_image-300x300.jpeg',
		banner: null,
		video_banner:
			'/da2e99ea-3935-416f-ac44-01887e2fb704-channel_offline_image-1920x1080.png',
		background: null,
		profile_banner: '/e7b68e6ce7cd4220-profile_banner-480.jpeg',
		profile_banner_background_color: '',
		url: 'https://www.twitch.tv/twitchpresents',
		views: 78855250,
		followers: 495850,
		_links: {
			self: 'channels/twitchpresents',
			follows: 'channels/twitchpresents/follows',
			commercial: 'channels/twitchpresents/commercial',
			stream_key: 'channels/twitchpresents/stream_key',
			chat: 'kraken/chat/twitchpresents',
			features: 'channels/twitchpresents/features',
			subscriptions: 'channels/twitchpresents/subscriptions',
			editors: 'channels/twitchpresents/editors',
			teams: 'channels/twitchpresents/teams',
			videos: 'channels/twitchpresents/videos',
		},
	},
	_links: {
		self: 'kraken/streams/twitchpresents',
	},
}

class MockStore {
	constructor(app) {
		this.app = app
	}

	configArray() {
		return [
			// TODO add guild configs
			new GuildConfig(
				{
					id: '',
					prefix: '',
					role: '',
					outputs: [STREAMER_A, STREAMER_B, STREAMER_C, STREAMER_D],
					channels: {
						xxx: { name: '', online: true, current: 0 },
					},
				},
				this.app
			),
		]
	}
}

class MockTwitchAPI {
	constructor() {
		const twitch = this

		this.getStream = spy(name => {
			if (twitch.__data[name]) {
				return twitch.__data[name]
			} else {
				return new APIError()
			}
		})

		this.__data = createAssign(MockTwitchData)
		this.__streamIDpool = 0
	}

	__setStreamerOnline(name) {
		return (this.__data[name] = {
			stream: {
				_id: this.__streamIDpool++,
				channel: {
					display_name: name,
					url: 'some url',
					game: 'some random game',
					status: 'Some name of the stream',
					logo: 'some url',
					followers: '',
				},
				preview: { large: 'some image url' },
				viewers: 0,
				created_at: 'some ISO date',
			},
		})
	}

	__setStreamerOffline() {}
}

class MockApp {
	constructor() {
		const app = this
		this.client = new MockClient()
		this.twitch = new MockTwitchAPI()
		this.store = new MockStore(app)

		this.tick = () => Promise.resolve()
		this._print = () => {}
		this.save = () => {}
		this.load = () => {}
		this.list = null
	}

	print() {}
}

class MockClient {
	constructor() {
		const guild_A = new MockGuild({ name: 'guildA', id: 'A', client: this })
		const guild_B = new MockGuild({ name: 'guildB', id: 'B', client: this })
		const guild_C = new MockGuild({ name: 'guildC', id: 'C', client: this })
		const guild_D = new MockGuild({ name: 'guildD', id: 'D', client: this })
		const guild_E = new MockGuild({ name: 'guildE', id: 'E', client: this })

		this.guilds = new Collection([
			['A', guild_A],
			['B', guild_B],
			['C', guild_C],
			['D', guild_D],
			['E', guild_E],
		])

		this.__guilds = { guild_A, guild_B, guild_C, guild_D, guild_E }

		const channel_A = new MockChannel(guild_A)
		const channel_B = new MockChannel(guild_A)
		const channel_C = new MockChannel(guild_A)
		const channel_D = new MockChannel(guild_A)
		const channel_E = new MockChannel(guild_A)
		const channel_F = new MockChannel(guild_A)
		const channel_G = new MockChannel(guild_A)
		const channel_H = new MockChannel(guild_A)

		this.channels = new Collection([
			['0', channel_A],
			['1', channel_B],
			['2', channel_C],
			['3', channel_D],
			['4', channel_E],
			['5', channel_F],
			['6', channel_G],
			['7', channel_H],
		])

		this.__channels = {
			channel_A,
			channel_B,
			channel_C,
			channel_D,
			channel_E,
			channel_F,
			channel_G,
			channel_H,
		}
	}
}

class MockChannel extends TextChannel {
	constructor(guild, { name = '', id = '' } = {}) {
		super(guild, createAssign(surplessChannelData, { name, id }))
	}
}

class MockGuild {
	constructor({ name, id, client }) {
		this.name = name || ''
		this.id = id || ''
		this.client = client
	}

	toString() {
		return this.name
	}
}

const createAssign = (...objects) => Object.assign({}, ...objects)

const surplessChannelData = {
	topic: '',
	nsfw: false,
	last_message_id: null,
	position: 0,
	parent_id: null,
}

function context() {
	const app = new MockApp()
	const { client, store, twitch } = app
	const tick = Tick(app)

	return { app, tick, client, store, twitch }
}

/* =================================== § =================================== */

test('embed output', t => {
	const embed = Embed(twitchPresentsMockData)

	t.snapshot(embed)
})

test.failing('only makes one request per streamer per tick', async t => {
	const { tick, twitch } = context()

	tick()

	t.true(twitch.getStream.calledOnceWith(STREAMER_A))
})

/* =================================== § =================================== */

test.todo('delete notifcation when streamer goes offline')
test.todo('modifies notification when stream changes')
test.todo('posts message in output channel when stream goes live')
test.todo('only makes one request per streamer per tick')

/* =================================== § =================================== */

async function MockCheckStreamer({
	streamData = undefined,
	streamerData = {},
} = {}) {
	const sandbox = createSandbox()
	const app = { print: sandbox.spy() }
	const channel_A = { send: sandbox.spy(() => Promise.resolve()) }
	const channel_B = { send: sandbox.spy(() => Promise.resolve()) }
	const channel_C = { send: sandbox.spy(() => Promise.resolve()) }
	const streamer = new StreamerRecord(
		createAssign(
			{
				name: 'BigStreamer',
				online: false,
				current: 0,
			},
			streamerData
		)
	)
	const setOffline = sandbox.stub(streamer, 'setOffline')
	const setOnline = sandbox.stub(streamer, 'setOnline')
	const guild = {}

	const getStreamCallback = () => Promise.resolve({ stream: streamData })
	sandbox.stub(streamer, 'getStream').callsFake(getStreamCallback)

	await checkStreamer(app, [channel_A, channel_B, channel_C], streamer, guild)

	return { channel_A, channel_B, channel_C, setOffline, setOnline, app }
}

test('checkStreamer: notifies when stream goes online', async t => {
	const streamData = {
		id: 52,
		channel: {
			display_name: 'aaa',
			url: 'aaa',
			game: 'aaa',
			status: 'aaa',
			logo: 'aaa',
			followers: 'aaa',
		},
		preview: 'aaa',
		viewers: 'aaa',
		created_at: 'aaa',
	}

	const streamerData = {
		name: 'BigStreamer',
		online: false,
		current: 0,
	}

	const {
		setOffline,
		setOnline,
		app,
		channel_A,
		channel_B,
		channel_C,
	} = await MockCheckStreamer({ streamData, streamerData })

	t.true(setOffline.notCalled)
	t.true(setOnline.calledOnce)
	t.true(channel_A.send.calledOnce)
	t.true(channel_B.send.calledOnce)
	t.true(channel_C.send.calledOnce)
	t.true(channel_A.send.args[0][0] === channel_B.send.args[0][0])
	t.true(channel_B.send.args[0][0] === channel_C.send.args[0][0])
	t.snapshot(app.print.args)
	t.snapshot(channel_A.send.args[0][0])
})
test('checkStreamer: notifies when stream goes offline', async t => {
	const streamerData = {
		name: 'BigStreamer',
		online: true,
		current: 52,
	}

	const {
		setOffline,
		setOnline,
		app,
		channel_A,
		channel_B,
		channel_C,
	} = await MockCheckStreamer({ streamerData })

	t.true(setOffline.calledOnce)
	t.true(setOnline.notCalled)
	t.true(channel_A.send.calledOnce)
	t.true(channel_B.send.calledOnce)
	t.true(channel_C.send.calledOnce)
	t.true(channel_A.send.args[0][0] === channel_B.send.args[0][0])
	t.true(channel_B.send.args[0][0] === channel_C.send.args[0][0])
	t.snapshot(app.print.args)
	t.snapshot(channel_A.send.args[0][0])
})
test('checkStreamer: does nothing when stream is still offline', async t => {
	const streamerData = {
		name: 'BigStreamer',
		online: false,
		current: 0,
	}
	const {
		setOffline,
		setOnline,
		app,
		channel_A,
		channel_B,
		channel_C,
	} = await MockCheckStreamer({ streamerData })

	t.true(setOffline.notCalled)
	t.true(setOnline.notCalled)
	t.true(channel_A.send.notCalled)
	t.true(channel_B.send.notCalled)
	t.true(channel_C.send.notCalled)
	t.true(app.print.notCalled)
})
test("checkStreamer: does nothing when stream id's are identical", async t => {
	const streamerData = {
		name: 'BigStreamer',
		online: true,
		current: 52,
	}
	const streamData = { _id: 52 }

	const {
		setOffline,
		setOnline,
		app,
		channel_A,
		channel_B,
		channel_C,
	} = await MockCheckStreamer({ streamerData, streamData })

	t.true(setOffline.notCalled)
	t.true(setOnline.notCalled)
	t.true(channel_A.send.notCalled)
	t.true(channel_B.send.notCalled)
	t.true(channel_C.send.notCalled)
	t.true(app.print.notCalled)
})
