import {Telegraf, Markup} from "telegraf";
import {
    DeadlineDto,
    formatDeadline,
    formatDeadlines,
    getActiveDeadlines,
    mapMqDeadeline
} from "./model";
import {config, phrases} from "./config";
import {handleMqEvents} from './mq'
import dayjs from "dayjs";
import {callbackQuery} from "telegraf/filters";
import _ from "lodash";

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

        await bot.telegram.sendMessage(chatId, `я поел говна \\(${title}\\): 
\`\`\`
${traceList.join('\n')}
\`\`\``, {
            parse_mode: 'MarkdownV2'
        })
    } catch (e) {
        try {
            await bot.telegram.sendMessage(chatId, 'я поел говна и пока пытался сказать как я опять поел говна. втф?')
        } catch (e) {
            console.error('Error while sending stripped error message', e)
        }
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
    if (ctx.chat.type !== 'private') {
        await ctx.sendMessage(remindMessage());
        return;
    }
    console.log("Remind command")
    const deadlines = await getActiveDeadlines();

    await listPageWithTitle(
        ctx.chat.id,
        'Список будущих встреч',
        deadlines.slice(0, config.COUNT_PER_PAGE), 0, config.COUNT_PER_PAGE, deadlines.length
    )
}))

bot.hears(/^д+а+$/i, wrapErrors('да', async (ctx) => {
    await ctx.sendVoice({source: './assets/pizda.ogg'})
}))

bot.command("an",
    wrapErrors('/an', async (ctx) => {
        if (ctx.message.reply_to_message === undefined) {
            return
        }
        if (!([1820143237, 568977897, 847343359].includes(ctx.message.from.id))) {
            console.info('User tried to use /an but has no rights: ' + String(ctx.message.from.id))
            return
        }
        await bot.telegram.copyMessage(config.CHAT_ID, ctx.chat.id, ctx.message.reply_to_message.message_id)
    })
)

bot.action(/^page_.*/, wrapErrors('кнопка', async (ctx) => {
    if (!ctx.has(callbackQuery("data"))) {
        return
    }

    const args = ctx.callbackQuery.data.split('_');

    if (args[1] === undefined || args[2] === undefined || args[3] === undefined)
        return;

    const buttonTs = Number.parseInt(args[3])
    let offset = Number.parseInt(args[1])
    const count = Number.parseInt(args[2])

    if (dayjs().diff(dayjs(buttonTs), 'minute') > 10) {
        offset = 0;
    }

    console.log(`Offset ${offset} count ${count}`)

    const deadlines = await getActiveDeadlines();

    if (offset > deadlines.length) {
        offset = Math.floor(deadlines.length / count) * count;
    }

    const page = Math.floor(offset / count) + 1
    const maxPage = Math.ceil(deadlines.length / count)

    const deadlinePage = deadlines.slice(offset, offset+count);

    const timestamp = dayjs().valueOf();

    await ctx.editMessageText(`<b>Список дедлайнов</b>` + '\n\n' + formatDeadlines(deadlinePage, offset),
        {
            parse_mode: 'HTML', link_preview_options: {is_disabled: true},
            reply_markup: Markup.inlineKeyboard(
                [[
                    Markup.button.callback("← пред.", `page_${Math.max(offset - count, 0)}_${count}_${timestamp}`),
                    Markup.button.callback(`${page}/${maxPage}`, "counter"),
                    Markup.button.callback("след. →", `page_${offset + count}_${count}_${timestamp}`),
                ]]
            ).reply_markup
        }
    )

    await ctx.answerCbQuery();

}))

bot.action("counter", wrapErrors('counter', async (ctx) => {
    await ctx.answerCbQuery("Ну вот такая страница ща")
}))


export async function listWithTitle(chatId: number, title: string, deadlines: DeadlineDto[]) {
    await bot.telegram.sendMessage(chatId, `<b>${title}</b>` + '\n\n' + formatDeadlines(deadlines),
        {parse_mode: 'HTML', link_preview_options: {is_disabled: true}})
}

export async function listPageWithTitle(chatId: number, title: string, deadlines: DeadlineDto[],
                                        offset: number, count: number, length: number) {
    const timestamp = dayjs().valueOf();
    const page = Math.floor(offset / count) + 1
    const maxPage = Math.ceil(length / count)

    await bot.telegram.sendMessage(chatId, `<b>${title}</b>` + '\n\n' + formatDeadlines(deadlines, offset),
        {
            parse_mode: 'HTML', link_preview_options: {is_disabled: true},
            reply_markup: Markup.inlineKeyboard(
                [[
                    Markup.button.callback("← пред.", `page_${Math.max(offset - count, 0)}_${count}_${timestamp}`),
                    Markup.button.callback(`${page}/${maxPage}`, "counter"),
                    Markup.button.callback("след. →", `page_${offset + count}_${count}_${timestamp}`),
                ]]
            ).reply_markup
        })
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

function remindMessage(): string {
    const begin = _.sample(phrases.remindBegin) ?? { sentence: 'Говна поел я', punct: 'Путник' }
    return `${begin.sentence}, ${_.sample(phrases.remindMiddle)}${begin.punct} ${_.sample(phrases.remindEnd)}`
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
                'Встреча ' + (mqMessage.type === 'CREATED' ? 'добавлена' : 'изменена') + ': \n' + formatDeadline(deadlineDto, mqMessage.type === 'CREATED'),
                {parse_mode: 'HTML', link_preview_options: {is_disabled: true}}
            )
        } catch (e: unknown) {
            await reportError(e, config.CHAT_ID, 'handleMqEvents')
        }
    })
    await bot.launch()
}