import {Telegraf} from "telegraf";
import {DeadlineDto, formatDeadline, formatDeadlines, getActiveDeadlines, mapMqDeadeline} from "./model";
import {config} from "./config";
import {handleMqEvents} from './mq'
import dayjs from "dayjs";

const bot = new Telegraf(config.BOT_TOKEN)

interface MaybeError {
    stack?: string
    cause?: MaybeError
}

function wrapErrors<T>(fn: (ctx: T) => Promise<void>): (ctx: T) => Promise<void> {
    return async function (ctx) {
        try {
            await fn(ctx)
        } catch (e) {
            try {
                let currentError = e as MaybeError | undefined
                const traceList = []
                while (currentError) {
                    const stack = currentError['stack']
                    if (stack) {
                        traceList.push(stack)
                    } else {
                        traceList.push(currentError)
                    }
                    currentError = currentError['cause']
                }
                // @ts-expect-error yeah so we know here that ctx has the reply method, but i'm lazy to type check it
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
}

bot.command("remind", wrapErrors(async (ctx) => {
    const activeDeadlines = await getActiveDeadlines()
    await ctx.reply("<b>Список дедлайнов:\n\n</b>" + formatDeadlines(activeDeadlines), {
        parse_mode: 'HTML',
        link_preview_options: {is_disabled: true}
    })
}))

bot.hears(/^д+а+$/i, async (ctx) => {
    await ctx.sendVoice({source: './assets/pizda.ogg'})
})

bot.command("nextweek", wrapErrors(async (ctx) =>
    nextWeek(ctx.chat.id)
))

bot.command("an",
    wrapErrors(async (ctx) => {
        if (ctx.message.reply_to_message === undefined) {
            return
        }
        if (!([1820143237, 568977897].includes(ctx.message.from.id))) {
            console.info('User tried to use /an but has no rights: ' + String(ctx.message.from.id))
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
    await bot.telegram.sendMessage(chatId, `<b>${title}</b>` + '\n\n' + formatDeadlines(deadlines),
        {parse_mode: 'HTML', link_preview_options: {is_disabled: true}})
}

export async function launch() {
    process.once('SIGINT', () => {
        bot.stop('SIGINT');
    })
    process.once('SIGTERM', () => {
        bot.stop('SIGTERM');
    })
    bot.catch((err) => {
        console.error(err)
    })
    await handleMqEvents(async mqMessage => {
        const deadlineDto = mapMqDeadeline(mqMessage.entry)
        await bot.telegram.sendMessage(
            config.CHAT_ID,
            'Дедлайн ' + (mqMessage.type === 'CREATED' ? 'добавлен' : 'изменён') + ': \n' + formatDeadline(deadlineDto),
            {parse_mode: 'HTML', link_preview_options: {is_disabled: true}}
        )
    })
    await bot.launch()
}