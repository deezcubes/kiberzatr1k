import createClient from 'openapi-fetch';
import type { paths } from './schema.js';
import type {components} from './schema.js';
import pTimeout from 'p-timeout';
import {config} from "./config";

export type Deadline = components['schemas']['Deadline']

const client = createClient<paths>({
  baseUrl: config.API_URL,
  headers: {
    Accept: "application/json",
    Authorization: `Bearer ${config.API_TOKEN}`
  },
});

export const fetchDeadlines = async () =>
  pTimeout(client.GET('/deadlines', {
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
            response: await result.response.text().catch(err => 'Failed to load body: ' + err)
          }))
        }
        return result
      })
      .then(it => it.data!.data!), {
    milliseconds: 5 * 1000
  })
