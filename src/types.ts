import { KubernetesObject } from '@kubernetes/client-node'

export interface NamespacedCustomObjectSelectionOptions {
    group: string
    version: string
    plural: string
    namespace: string
    name: string
}

export interface GroupVersionResource {
    group: string
    version: string
    plural: string
}

export interface CheckStatusObject extends KubernetesObject {
    spec: {
        checkDefinitionRef: string
    },
    status: {
        ok?: boolean
        healthy?: boolean
    }
}
