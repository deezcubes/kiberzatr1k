import createClient from 'openapi-fetch';
import type {paths} from './schema.js';
import type {components} from './schema.js';
import pTimeout from 'p-timeout';
import {config} from "./config";

export type DeadlineResponseDataObject = components['schemas']['DeadlineResponseDataObject']
export type Deadline = components['schemas']['Deadline']

export interface EtuApiParamsResponseDataObject {
    week: number
}

export type EtuApiScheduleResponseDataObject = [{
    scheduleObjects: Array<{
        form: string,
        block: string | null,
        lesson: {
            subject: {
                title: string,
                shortTitle: string,
                subjectType: string,
            },
            teacher: {
                initials: string | null
            } | null,
            auditoriumReservation: {
                auditoriumNumber: string | null,
                reservationTime: {
                    startTime: number,
                    endTime: number,
                    weekDay: string,
                    week: string
                }
            }
        }
    }>
}]

const client = createClient<paths>({
    baseUrl: config.API_URL,
    headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.API_TOKEN}`
    },
});

export async function fetchDeadlines(): Promise<DeadlineResponseDataObject[]> {
    return pTimeout(client.GET('/deadlines', {
        params: {
            query: {
                populate: 'subject'
            }
        }
    })
        .then(async result => {
            if (!result.response.ok) {
                throw Error('Response not successful: ' + JSON.stringify({
                    status: result.response.status,
                    statusText: result.response.statusText,
                    response: await result.response.text().catch((err: unknown) => 'Failed to load body: ' + String(err))
                }))
            }
            if ((result.data?.data ?? null) === null) {
                throw Error('Response did not return valid data: ' + JSON.stringify({
                    response: await result.response.text().catch((err: unknown) => 'Failed to load body: ' + String(err)),
                    data: result.data
                }))
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return result.data!.data as DeadlineResponseDataObject[]
        }), {
        milliseconds: 5 * 1000
    })
}

async function etuApiRequest<T>(input: string, init?: RequestInit): Promise<T> {
    const promise = fetch(input, init)
        .then(async result => {
            if (!result.ok) {
                throw Error('Response not successful: ' + JSON.stringify({
                    status: result.status,
                    statusText: result.statusText,
                    response: await result.text().catch((err: unknown) => 'Failed to load body: ' + String(err))
                }))
            }
            return (await result.json()) as T
        })

    return pTimeout(promise, {milliseconds: 5000})
}

export async function fetchEtuParams() {
    return await etuApiRequest<EtuApiParamsResponseDataObject>('https://digital.etu.ru/api/general/current')
}

export async function fetchEtuSchedule() {
    return await etuApiRequest<EtuApiScheduleResponseDataObject>('https://digital.etu.ru/api/schedule/objects/publicated?' + new URLSearchParams([
        ['subjectType', 'Лек'],
        ['subjectType', 'Пр'],
        ['subjectType', 'Лаб'],
        ['subjectType', 'КП'],
        ['subjectType', 'КР'],
        ['subjectType', 'Доб'],
        ['subjectType', 'МЭк'],
        ['subjectType', 'Прак'],
        ['subjectType', 'Тест'],
        ['groups', '5115'],
        ['withSubjectCode', 'true'],
        ['withURL', 'true'],
    ]).toString())
}