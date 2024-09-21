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

export async function reportError(e: unknown, chatId: number, title: string) {
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

        await bot.telegram.sendMessage(chatId, `я поел говна (${title}): 
\`\`\`
${traceList.join('\n')}
\`\`\``, {
            parse_mode: 'MarkdownV2'
        })
    } catch (e) {
        console.error('Error while sending error message', e)
    } finally {
        console.error('Error while handling command', e)
    }
}

function wrapErrors<T>(title: string, fn: (ctx: T) => Promise<void>): (ctx: T) => Promise<void> {
    return async function (ctx) {
        try {
            await fn(ctx)
        } catch (e: unknown) {
            // @ts-expect-error i'm too lazy to type config here
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
            await reportError(e, ctx.chat.id, title)
        }
    }
}

bot.command("remind", wrapErrors('/remind', async (ctx) => {
    await listWithTitle(
        ctx.chat.id,
        'Список дедлайнов',
        await getActiveDeadlines()
    )
}))

bot.hears(/^д+а+$/i, wrapErrors('да', async (ctx) => {
    await ctx.sendVoice({source: './assets/pizda.ogg'})
}))

bot.command("nextweek", wrapErrors('/nextweek', async (ctx) => {
    await listWithTitle(
        ctx.chat.id,
        'Совсем скоро',
        (await getActiveDeadlines()).filter((d) => d.datetime.isBefore(dayjs().add(7, 'day')))
    );
}))

bot.command("an",
    wrapErrors('/an', async (ctx) => {
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

export async function listWithTitle(chatId: number, title: string, deadlines: DeadlineDto[]) {
    await bot.telegram.sendMessage(chatId, `<b>${title}</b>` + '\n\n' + formatDeadlines(deadlines),
        {parse_mode: 'HTML', link_preview_options: {is_disabled: true}})
}

export async function listSchedule(chatId: number, schedule: string) {
    const message = await bot.telegram.sendMessage(
        chatId,
        schedule,
        {parse_mode: 'HTML'}
    )
    await bot.telegram.pinChatMessage(chatId, message.message_id, {
        disable_notification: true
    })
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
        try {
            const deadlineDto = mapMqDeadeline(mqMessage.entry)

            await bot.telegram.sendMessage(
                config.CHAT_ID,
                'Дедлайн ' + (mqMessage.type === 'CREATED' ? 'добавлен' : 'изменён') + ': \n' + formatDeadline(deadlineDto),
                {parse_mode: 'HTML', link_preview_options: {is_disabled: true}}
            )
        } catch (e: unknown) {
            await reportError(e, config.CHAT_ID, 'handleMqEvents')
        }
    })
    await bot.launch()
}