import { ConversationsHistoryResponse, WebClient } from '@slack/web-api'
import { Message as ResponseMessage } from "@slack/web-api/dist/response/ConversationsHistoryResponse"

interface User {
	userId: string
	name: string
	realName: string
}

interface Message {
	timestamp: string
	userId: string
	userName: string
	userRealName: string
	text: string
}

export interface SlarchSettings {
	/** [Features] -> [OAuth & Permissions] -> [OAuth Tokens for Your Workspace] -> [Bot User OAuth Token] */
	BOT_USER_OAUTH_TOKEN: string
}

export class Slarch {
	webClient: WebClient
	userList: User[]

	constructor(settings: SlarchSettings) {
		this.webClient = new WebClient(settings.BOT_USER_OAUTH_TOKEN)
		this.userList = []
	}

	private resolveUserInfo = async (userId: string): Promise<User | undefined> => {
		const user = await this.webClient.users.info({
			user: userId
		}).then(result => result.user)
		if (user === undefined) {
			return
		}
		const result: User = {
			userId: userId,
			name: user.name || "",
			realName: user.real_name || ""
		}
		this.userList.push(result)
		return result
	}

	private getUserInfo = (userId: string): User | undefined => {
		return this.userList.find(elem => elem.userId === userId)
	}

	/**
	 * Botから見えるチャンネルの一覧を取得します
	 * @returns チャンネル一覧
	 */
	getChannels = async () => {
		const channels = await this.webClient.conversations.list().then(result => result.channels)
		return channels
	}

	/**
	 * 指定したチャンネルのメッセージ一覧を取得します
	 * @param channelId 
	 * @returns メッセージ一覧
	 */
	archiveMessages = async (channelId: string) => {
		let messages: Message[] = []
		let hasMore: Boolean | undefined = true
		let nextCursor: string | undefined = undefined
		while (hasMore) {
			const response: ConversationsHistoryResponse = await this.webClient.conversations.history({
				channel: channelId,
				cursor: nextCursor,
				limit: 2
			})
			hasMore = response.has_more
			nextCursor = response.response_metadata?.next_cursor
			if (response.messages !== undefined) {
				for (let message of response.messages) {
					// メッセージを保存:
					await this.convertMessage(message).then(result => {
						messages.push(result)
					})
					// スレッドになっている場合はそれも保存
					if (message.thread_ts !== undefined) {
						const threads = await this.webClient.conversations.replies({
							ts: message.thread_ts,
							channel: channelId
						}).then(result => result.messages)
						if (threads !== undefined) {
							for (let thread of threads) {
								await this.convertMessage(thread).then(result => {
									messages.push(result)
								})
							}
						}
					}
				}
			}
		}
		return messages
	}

	private convertMessage = async (message: ResponseMessage): Promise<Message> => {
		// Unix Time -> 日本標準時
		const dateTime = new Date(parseFloat(message.ts as string) * 1000)
		// userId -> ユーザ情報
		let userInfo = this.getUserInfo(message.user as string)
		if (userInfo === undefined) {
			userInfo = await this.resolveUserInfo(message.user as string)
		}
		return {
			timestamp: dateTime.toLocaleString("ja-JP"),
			userId: message.user || "",
			userName: userInfo?.name || "",
			userRealName: userInfo?.realName || "",
			text: message.text || ""
		}
	}
}
