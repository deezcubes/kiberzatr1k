import {marked, Tokens} from "marked";
import dayjs from "dayjs";
import {Deadline, fetchDeadlines} from "./api";
import sanitizeHtml from "sanitize-html";
import {DeadlineMqDto} from "./mq";
import _ from 'lodash'

marked.use({
    tokenizer: {
        list(): Tokens.List | undefined {
            return undefined
        }
    }
})

export interface DeadlineDto {
    id: number,
    name: string,
    subject: string | null,
    datetime: dayjs.Dayjs,
    comment: string | null,
    link: string | null
}

const formatComment = (comment: string | null) => comment ? sanitizeHtml(marked.parse(comment) as string, {
    allowedTags: ['b', 'strong', 'i', 'em', 'u', 'ins', 's', 'strike', 'del', 'span', 'tg-spoiler', 'a', 'tg-emoji', 'code', 'pre', 'blockquote']
}) : null

const mapDeadline = (id: number, deadline: Deadline) => {
    return (<DeadlineDto>{
        id,
        name: deadline.name,
        subject: deadline.subject?.data?.attributes?.name ?? null,
        datetime: dayjs(deadline.datetime),
        comment: formatComment(deadline.comment ?? null),
        link: deadline.link
    });
}

export const mapMqDeadeline = (deadline: DeadlineMqDto) => {
    return (<DeadlineDto>{
        id: deadline.id,
        name: deadline.name,
        subject: deadline.subject,
        datetime: dayjs(deadline.datetime),
        comment: formatComment(deadline.comment),
        link: deadline.link
    })
}

const getAllDeadlines = async () => {
    const apiDeadlines = await fetchDeadlines()
    return apiDeadlines.map(deadline => mapDeadline(deadline.id!, deadline.attributes!))
}

export const getActiveDeadlines = async () => {
    const allDeadlines = await getAllDeadlines()
    const now = dayjs()
    return _(allDeadlines).filter(it => it.datetime.isAfter(now)).sortBy(it => it.datetime.unix())
}
// export const getActiveDeadlines = async () => {
//     const allDeadlines = await getAllDeadlines()
//     const now = dayjs()
//     return allDeadlines.filter(it => it.datetime.isAfter(now)).sort((a, b) => a.datetime.diff(b.datetime))
// }

/**
 * This is a mock
 */
// export function getActiveDeadlines() : DeadlineDto[] {
//     return [
//         <DeadlineDto>{
//             name: 'Отчислиться',
//             subject: 'Надо',
//             datetime: dayjs().add(1, 'day').set('h', 15).set('m', 0),
//             comment: 'бляя..',
//             link: 'https://etu.ru'
//         },
//         <DeadlineDto>{
//             name: 'я хз',
//             subject: 'чзх',
//             datetime: dayjs().add(2, 'day').set('h', 15).set('m', 0),
//             comment: null,
//             link: null
//         },
//     ]
// }

export function formatDeadline(deadline: DeadlineDto): string {
    return `` + `<b>${deadline.subject ?? 'неизвестная хуйня'}</b> - ${deadline.name}
⏰ ${deadline.datetime.format('DD.MM.YY HH:mm')} <i>(${deadline.datetime.fromNow()})</i>
` + (deadline.link ? `🔗 <a href="${deadline.link}">Ссылка</a>` + '\n' : ``) + (deadline.comment ? `<i>${deadline.comment}</i>` : ``)
}

export function formatDeadlines(deadlines: DeadlineDto[]): string {
    return deadlines.reduce(
        (prev, curr, idx) => {
            return prev + (idx + 1) + '. ' + formatDeadline(curr) + '\n\n'
        },
        ''
    ).trim()
}