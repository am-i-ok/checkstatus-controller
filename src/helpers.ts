import { isNil, pick } from 'lodash'

export function errorToString(error: unknown): string {
    if (isNil(error)) return ''
    if (typeof error === 'string') return error
    if (!(error instanceof Error)) return JSON.stringify(error)

    return JSON.stringify(
        pick(error, [ 'name', 'message', 'status', 'statusCode', 'response.body', 'stack' ])
    )
}
