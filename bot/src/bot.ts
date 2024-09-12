import {Telegraf} from "telegraf";
import {formatDeadlines, getActiveDeadlines, mapMqDeadeline} from "./model";
import {config} from "./config";
import {handleMqEvents} from './mq'

export const bot = new Telegraf(config.BOT_TOKEN)

bot.catch((err) => {
    console.error(err)
})

const wrapErrors = (fn: (ctx: any) => Promise<void>) => async (ctx: any) => {
    try {
        return await fn(ctx)
    } catch (e) {
        try {
            let currentError: any = e
            let traceList = []
            while (currentError) {
                let stack = currentError['stack']
                if (stack) {
                    traceList.push(stack)
                } else {
                    traceList.push(currentError)
                }
                currentError = currentError['cause']
            }
            await ctx.reply('я поел говна: \n' + '```\n' + traceList.join('\n') + '\n```', {
                parse_mode: 'MarkdownV2'
            })
        } catch (e) {
            console.error('Error while sending error message', e)
        } finally {
            console.error('Error while handling command', e)
        }
    }
}

bot.command("remind", wrapErrors(async (ctx) => {
    const activeDeadlines = await getActiveDeadlines()
    await ctx.reply("<b>Список дедлайнов:\n\n</b>" + formatDeadlines(activeDeadlines), {parse_mode: 'HTML'})
}))

await handleMqEvents(async mqMessage => {
    const deadlineDto = mapMqDeadeline(mqMessage.entry)
    console.info({
        type: mqMessage.type,
        deadlineDto
    })
})