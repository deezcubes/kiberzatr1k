import createClient from 'openapi-fetch';
import type { paths } from './schema.js';
import type {components} from './schema.js';
import pTimeout from 'p-timeout';
import {config} from "./config";

export type Deadline = components['schemas']['Deadline']

const client = createClient<paths>({
  baseUrl: "http://100.66.85.62:1337/api/",
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
  }).then(it => it.data!.data!), {
    milliseconds: 5 * 1000
  })
