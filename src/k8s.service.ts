import {
    CustomObjectsApi,
    KubeConfig,
    KubernetesObject,
    PatchUtils,
} from '@kubernetes/client-node'

import { IncomingMessage } from 'http'
import { NamespacedCustomObjectSelectionOptions } from './types'

export class KubernetesService {
    public readonly ns: string
    public readonly kc: KubeConfig
    private logger = console

    constructor() {
        this.ns = 'test'
        this.kc = new KubeConfig()
        this.kc.loadFromDefault()
    }

    customObjects(): CustomObjectsApi {
        return this.kc.makeApiClient(CustomObjectsApi)
    }


    async getNamespacedCustomObject(
        { group, version, namespace, plural, name }: NamespacedCustomObjectSelectionOptions
    ): Promise<{ response: IncomingMessage, body: KubernetesObject }> {
        return this.customObjects().getNamespacedCustomObject(group!, version!, namespace, plural!, name, undefined)
    }

    async setNamespacedCustomObjectStatus(
        { group, version, namespace, plural, name }: NamespacedCustomObjectSelectionOptions,
        status: object
    ): Promise<{ response: IncomingMessage, body: KubernetesObject }> {
        const options = { headers: { 'content-type': PatchUtils.PATCH_FORMAT_JSON_MERGE_PATCH } }
        const patch = { status }
        return this.customObjects().patchNamespacedCustomObjectStatus(
            group, version, namespace, plural, name, patch, undefined, undefined, undefined, options
        )
    }
}
