import createClient from 'openapi-fetch';
import type {paths} from './schema.js';
import type {components} from './schema.js';
import pTimeout from 'p-timeout';
import {config} from "./config";

export type DeadlineResponseDataObject = components['schemas']['DeadlineResponseDataObject']
export type Deadline = components['schemas']['Deadline']

const client = createClient<paths>({
    baseUrl: config.API_URL,
    headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.API_TOKEN}`
    },
});

export async function fetchDeadlines (): Promise<DeadlineResponseDataObject[]> {
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