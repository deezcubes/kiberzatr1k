import {marked, Tokens} from "marked";
import dayjs from "dayjs";
import {Deadline, fetchDeadlines} from "./api";
import sanitizeHtml from "sanitize-html";
import {DeadlineMqDto} from "./mq";
import _ from 'lodash'
import {config} from "./config";

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
    return _(allDeadlines).filter(it => it.datetime.isAfter(now)).sortBy(it => it.datetime.unix()).value()
}


export function formatDeadline(deadline: DeadlineDto): string {
    return `` + `<b>${deadline.subject ?? 'неизвестная хуйня'}</b> - ${deadline.name}
⏰ ${deadline.datetime.format('DD.MM.YY HH:mm')} <i>(${deadline.datetime.fromNow()})</i>
` + (deadline.link ? `🔗 <a href="${deadline.link}">Ссылка</a>` + '\n' : ``) + (deadline.comment ?? ``)
}

export function formatDeadlines(deadlines: DeadlineDto[]): string {
    if (deadlines.length === 0) {
        return 'ничево нет...'
    }
    return deadlines.map((curr, idx) => (idx + 1) + '. ' + formatDeadline(curr)).join('\n\n')
}