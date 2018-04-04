import Request from './classes/Request';
import AListItem from './classes/AListItem'

export function hasAuthorityForCommand( req: Request, wrapper: AListItem ) {
	var { permission } = wrapper

	if ( permission === 'all' || permission === 'custom' )
		return true
	else if ( permission === 'master' )
		return isMaster( req )
	else if ( permission === 'owner' )
		return isOwner( req ) || isMaster( req )
	else if ( permission === 'admin' )
		return isAdmin( req )

	return false
}

function isOwner( req: Request ) {
	return req.member && req.member.id === req.guild.ownerID
}

function isMaster( req: Request ) {
	return req.author.id === process.env.master
}

function isAdmin( req: Request ) {
	return req.member && req.member.hasPermission( 'ADMINISTRATOR' )
}

export async function unauthorised( req: Request, wrap: AListItem ) {
	return req.reply(
		`You are not autorised to use that command, `
		+ `you must be a ${ wrap.permission }`
	)
}
