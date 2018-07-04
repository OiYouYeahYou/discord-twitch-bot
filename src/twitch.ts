import { get } from 'https'

export class Twitch {
	private host = 'api.twitch.tv'

	constructor(private twitchClientID: string) {}

	getStream(name: string) {
		return this._get<IStreamRespone>(`streams/${name.trim()}`)
	}

	getChannel(name: string) {
		return this._get<IChannelResponse>(`channels/${name.trim()}`)
	}

	_get<T>(endpoint: string): Promise<T | APIError> {
		const path = `/kraken/${endpoint}`
		const headers = {
			'Client-ID': this.twitchClientID,
			Accept: 'application/vnd.twitchtv.v3+json',
		}
		const opt = { host: this.host, path, headers }

		return new Promise((resolve, reject) => {
			const getter = get(opt, res => {
				var body = ''
				res.on('data', chunk => (body += chunk))
				res.on('end', () => {
					try {
						const response = JSON.parse(body)
						if (response.error) return resolve(response)

						resolve(response)
					} catch (err) {
						reject(err)
					}
				})
			})

			getter.on('error', reject)
		})
	}
}

export class APIError extends Error {
	constructor(err) {
		super(err.message)
		this.status = err.status
		this.error = err.error
	}

	readonly error: string
	readonly status: number
	readonly message: string
}

export interface IChannelResponse {
	readonly _id: number
	readonly broadcaster_language: language
	readonly created_at: isoDate
	readonly display_name: string
	readonly followers: number
	readonly game: string
	readonly language: language
	readonly logo: url
	readonly mature: boolean
	readonly name: string
	readonly partner: boolean
	readonly profile_banner: WHAT
	readonly profile_banner_background_color: WHAT
	readonly status: string
	readonly updated_at: isoDate
	readonly url: url
	readonly video_banner: WHAT
	readonly views: number
}

type language = 'en'
type isoDate = string
type url = string
type urlTemplate = string
type WHAT = any

export interface IStreamRespone {
	readonly stream: IStream
}

export interface IStream {
	readonly _id: number
	readonly game: string
	readonly viewers: number
	readonly video_height: number
	readonly average_fps: number
	readonly delay: number
	readonly created_at: isoDate
	readonly is_playlist: boolean
	readonly preview: IPreviewResponse
	readonly channel: IChannelResponse
}

interface IPreviewResponse {
	readonly small: url
	readonly medium: url
	readonly large: url
	readonly template: urlTemplate
}
