import {Telegraf} from "telegraf";
import {DeadlineDto, formatDeadline, formatDeadlines, getActiveDeadlines, mapMqDeadeline} from "./model";
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
    await ctx.reply("<b>Список дедлайнов:\n\n</b>" + formatDeadlines(activeDeadlines), {
        parse_mode: 'HTML',
        disable_web_page_preview: true
    })
}))

bot.hears(/^[дД]+[аА]+$/, async (ctx) => {
    await ctx.sendVoice({source: './assets/pizda.ogg'})
})

bot.command("nextweek", wrapErrors(async (ctx) =>
    nextWeek(ctx.chat.id)
))

bot.command("id", async (ctx) => ctx.sendMessage(`${ctx.chat.id}`))

bot.command("an",
    wrapErrors(async (ctx) => {
        if (ctx.message.reply_to_message === undefined) {
            return
        }
        if (!(ctx.message.from.id == 1820143237)) {
            return
        }
        await bot.telegram.copyMessage(config.CHAT_ID, ctx.chat.id, ctx.message.reply_to_message.message_id)
    })
)

export async function nextWeek(chatId: number) {
    const weekDeadlines = (await getActiveDeadlines()).filter((d) => d.datetime.isBefore(dayjs().add(7, 'day')))
    await bot.telegram.sendMessage(chatId, "<b>Совсем скоро:\n\n</b>" + formatDeadlines(weekDeadlines),
        {parse_mode: 'HTML', link_preview_options: {is_disabled: true}})
}

export async function listWithTitle(chatId: number, title: string, deadlines: DeadlineDto[]) {
    await bot.telegram.sendMessage(chatId, `<b>${title}</b>

` + formatDeadlines(deadlines),
        {parse_mode: 'HTML', link_preview_options: {is_disabled: true}})
}

// await handleMqEvents(async mqMessage => {
//     const deadlineDto = mapMqDeadeline(mqMessage.entry)
//     await bot.telegram.sendMessage(
//         config.CHAT_ID,
//         'Дедлайн ' + (mqMessage.type === 'CREATED' ? 'добавлен' : 'изменён') + ': \n' + formatDeadline(deadlineDto),
//         {parse_mode: 'HTML', link_preview_options: {is_disabled: true}}
//     )
// })