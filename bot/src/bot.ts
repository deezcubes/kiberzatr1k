import {Telegraf} from "telegraf";
import {formatDeadlines, getActiveDeadlines, mapMqDeadeline} from "./model";
import {config} from "./config";
import {handleMqEvents} from './mq'
import dayjs from "dayjs";

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
    await ctx.reply("<b>Список дедлайнов:\n\n</b>" + formatDeadlines(activeDeadlines), {parse_mode: 'HTML', disable_web_page_preview: true})
}))

bot.hears(/^[дД]+[аА]+$/, async (ctx) => {
    await ctx.sendVoice({source: './assets/pizda.ogg'})
})

bot.command("nextweek", wrapErrors( async (ctx) =>
    nextWeek(ctx.chat.id)
))

bot.command("id", async (ctx) => ctx.sendMessage(`${ctx.chat.id}`))

export async function nextWeek(chatId: number) {
    const weekDeadlines = getActiveDeadlines().filter((d) => d.datetime.isBefore(dayjs().add(7, 'day')))
    await bot.telegram.sendMessage(chatId,"<b>Совсем скоро:\n\n</b>" + formatDeadlines(weekDeadlines),
        {parse_mode: 'HTML', link_preview_options: {is_disabled: true}})
}

await handleMqEvents(async mqMessage => {
    const deadlineDto = mapMqDeadeline(mqMessage.entry)
    console.info({
        type: mqMessage.type,
        deadlineDto
    })
})