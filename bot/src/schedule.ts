import _ from "lodash";
import {EtuApiScheduleResponseDataObject, fetchEtuParams, fetchEtuSchedule} from "./api";
import dayjs from "dayjs";

export interface ScheduleLesson {
    subject: string,
    type: string,
    teacher: string | null,
    form: string,
    auditorium: string | null,
    startTime: string,
    endTime: string,
}

interface RichLesson extends ScheduleLesson {
    block: string | null
}

function getDvsNumber(block: string | null): string {
    let DVSNumber = ''
    let indexDVSInfo = -1
    if (block) {
        const blockParts = block.split('.')
        indexDVSInfo = blockParts.indexOf('ДВ')
        if (indexDVSInfo === -1) indexDVSInfo = blockParts.indexOf('ДЭ')
        DVSNumber = String(indexDVSInfo > -1 ? Number(blockParts[indexDVSInfo + 1]) : Number(blockParts[blockParts.length - 1]))
    }
    return DVSNumber
}

function filterDvsLessons(lessons: RichLesson[]): RichLesson[] {
    const dvsLessonsByTime = _(lessons)
        .groupBy(({startTime, endTime}) => JSON.stringify({startTime, endTime}))
        .entries()
        .filter(([, it]) => it.length > 1)
        .value()

    const replacedDvsLessons = dvsLessonsByTime.map(([, it]) => (<RichLesson>{
        ...it[0],
        subject: 'ДВС' + getDvsNumber(it[0]?.block ?? null),
        teacher: null,
    }))

    const dvsLessonTimes = new Set(dvsLessonsByTime.map(([it,]) => it))

    const filteredLessons = lessons
        .filter(({startTime, endTime}) => !dvsLessonTimes.has(JSON.stringify({startTime, endTime})))
        .map(lesson => {
            if (lesson.block !== null) {
                lesson.subject += ' (ДВС' + getDvsNumber(lesson.block) + ')'
            }
            return lesson
        })

    filteredLessons.push(...replacedDvsLessons)

    return filteredLessons
}

function prettifyLesson(lesson: RichLesson): ScheduleLesson {
    const timeDictionary: Record<string, string> = {
        '100': '08:00',
        '1100': '09:30',
        '101': '09:50',
        '1101': '11:20',
        '102': '11:40',
        '1102': '13:10',
        '103': '13:40',
        '1103': '15:10',
        '104': '15:30',
        '1104': '17:00',
        '105': '17:20',
        '1105': '18:50',
        '106': '19:05',
        '1106': '20:35',
        '107': '20:50',
        '1107': '22:20',
    }
    const formDictionary: Record<string, string> = {
        'online': 'дистант',
        'standard': 'очно'
    }
    const typeDictionary: Record<string, string> = {
        'Пр': 'практика',
        'Лек': 'лекция',
        'Лаб': 'лаба'
    }

    return {
        subject: lesson.subject,
        teacher: lesson.teacher,
        type: typeDictionary[lesson.type] ?? 'я чота не понял че ето: ' + lesson.type,
        form: formDictionary[lesson.form] ?? 'я чота не понял че ето: ' + lesson.form,
        auditorium: lesson.auditorium,
        startTime: timeDictionary[lesson.startTime] ?? 'хз скок это: ' + lesson.startTime,
        endTime: timeDictionary[lesson.endTime] ?? 'хз скок это: ' + lesson.endTime,
    }
}

function mapServerSchedule(
    serverSchedule: EtuApiScheduleResponseDataObject,
    week: string,
    weekDay: string
): ScheduleLesson[] {
    const lessons: RichLesson[] =
        serverSchedule[0].scheduleObjects
            .filter(({lesson}) => lesson.auditoriumReservation.reservationTime.week === week
                && lesson.auditoriumReservation.reservationTime.weekDay === weekDay)
            .map(({form, lesson, block}) => {
                return {
                    subject: lesson.subject.shortTitle,
                    teacher: lesson.teacher?.initials ?? null,
                    type: lesson.subject.subjectType,
                    form,
                    auditorium: lesson.auditoriumReservation.auditoriumNumber,
                    startTime: String(lesson.auditoriumReservation.reservationTime.startTime),
                    endTime: String(lesson.auditoriumReservation.reservationTime.endTime),
                    block
                }
            })

    return _(filterDvsLessons(lessons))
        .map(it => prettifyLesson(it))
        .sortBy(it => it.startTime)
        .value()
}


function formatScheduleItem(item: ScheduleLesson) {
    return '<b>' + item.startTime + ' — ' + item.endTime + ': ' + '</b>\n'
        + item.subject + ', ' + item.type + ', ' + item.form
        + (item.teacher === null ? '' : (', ' + item.teacher))
        + (item.auditorium === null ? '' : (', ауд. ' + item.auditorium))
        + '\n'
}

export async function getCurrentScheduleFormatted(): Promise<string | null> {
    const currentWeek = String((await fetchEtuParams()).week)
    const currentDay = dayjs()
    const currentWeekDay = currentDay.locale('en').format('ddd').toUpperCase()
    const serverApiResponse = await fetchEtuSchedule()

    const schedule = mapServerSchedule(serverApiResponse, currentWeek, currentWeekDay)

    if (schedule.length === 0) {
        return null
    }

    return [
        `😸 Принёс расписание своим котятам\n`,
        `${_.capitalize(currentDay.format('dddd'))}, ${currentWeek === '2' ? 'чётная' : 'нечётная'}\n\n`,
        ...schedule.map(item => formatScheduleItem(item) + '\n')
    ].join('').trim()
}