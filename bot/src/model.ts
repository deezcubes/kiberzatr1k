import {marked, Tokens} from "marked";
import dayjs from "dayjs";
import {Deadline, fetchDeadlines} from "./api";
import sanitizeHtml from "sanitize-html";
import {DeadlineMqDto} from "./mq";

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
    return allDeadlines.filter(it => it.datetime.isAfter(now)).sort((a, b) => a.datetime.diff(b.datetime))
}

export function formatDeadline(deadline: DeadlineDto): string {
    return `<b>» ${deadline.subject ?? 'хуйня'}</b> - ${deadline.name}
${deadline.datetime.format('DD.MM.YY HH:mm')}
` + (deadline.link ? `<a href="${deadline.link}">cсылка</a>` + '\n' : ``) + (deadline.comment ?? ``)
}

export function formatDeadlines(deadlines: DeadlineDto[]): string {
    return deadlines.map(it => formatDeadline(it)).join('\n\n')
}