const defaultRecord = {
	online: false,
	current: 0,
}

export class StreamerRecord {
	constructor(input: IRawStreamerRecord) {
		this.name = input.name
		this.online = input.online
		this.current = input.current
	}

	/** Name of channel */
	readonly name: string

	/** Is channel live */
	private online: boolean

	/** ID of the current stream */
	private current: number

	get isOnline() {
		return this.online
	}

	get isOffline() {
		return !this.online
	}

	setOffline() {
		this.setter(false, 0)
	}

	setOnline(stream: { _id: number }) {
		this.setter(true, stream._id)
	}

	private setter(state: boolean, current: number) {
		this.online = state
		this.current = current
	}

	isSameStream(stream: { _id: number }) {
		return this.current == stream._id
	}

	static create(name) {
		const config = Object.assign({ name }, defaultRecord)
		return new this(config)
	}

	toRaw(): IRawStreamerRecord {
		const { name, online, current } = this
		return { name, online, current }
	}

	toString() {
		return this.name
	}
}

export interface IRawStreamerRecord {
	readonly name: string
	online: boolean
	current: number
}
