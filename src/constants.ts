import { IConfig } from "./types";

const {
	discordToken = '',
	twitchClientID = '',
	intervalString = 180
}: IConfig = require( '../config.json' )

export const token = discordToken
export const interval = Number( intervalString ) * 1000;

export const timeout = 2 * 60 * 1000;
export const host = 'api.twitch.tv'
export const headers = {
	'Client-ID': twitchClientID,
	Accept: "application/vnd.twitchtv.v3+json"
}

export const saveOpt = { save: true }
export const exitOpt = { exit: true }

module.exports = {
	timeout, host, headers, token, interval, saveOpt, exitOpt,
};
