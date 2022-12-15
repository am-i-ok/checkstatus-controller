import util from 'util'
import axios from 'axios'
import { KubernetesService } from './k8s.service'
import { CHECK_STATUS_GVR } from './constants'
import { CheckStatusObject } from './types'
import { omit, set } from 'lodash'
import { V1ObjectMeta } from '@kubernetes/client-node'

const sleep = util.promisify(setTimeout);
const platformBaseUrl = process.env.PLATFORM_BASE_URL || 'http://81e1f5de694c.ngrok.io'
const platformPollingIntervalSecs = Number(process.env.PLATFORM_POLLING_INTERVAL_SECS || '10')
const checkDefinitionRef = process.env.CHECK_DEFINITION_REF || ''
const name = process.env.CHECK_STATUS_OBJECT_NAME || ''
const namespace = process.env.CHECK_STATUS_OBJECT_NAMESPACE || ''

interface GetCheckStatusPlatformResponse {
    status: string
}

function getDesiredCheckStatus(actual: CheckStatusObject, healthy: boolean): CheckStatusObject {
    const metadata: V1ObjectMeta = omit(actual.metadata, [ 'uid', 'resourceVersion', 'managedFields', 'annotations', 'creationTimestamp', 'generation' ])
    const desired: CheckStatusObject = {
        apiVersion: actual.apiVersion,
        kind: actual.kind,
        metadata,
        // spec: actual.spec,
        spec: {
            checkDefinitionRef: 'test'
        },
        status: {
            ...actual.status,
            ok: healthy
        }
    }

    // const resourceSpecHash = this.calcHashForSealingKeySecret(secret, configmap.data!['tls.key'])
    // set(secret, `metadata.annotations["${RESOURCE_SPEC_HASH_ANNOTATION}"]`, resourceSpecHash)

    return desired
}

async function main() {
    const k8sService = new KubernetesService()

    while (true) {
        try {
            console.log(`getting status from the platform for check ${name} in namespace ${namespace}`)
            const res = await axios.get<GetCheckStatusPlatformResponse>(`${platformBaseUrl}/api/check/${checkDefinitionRef}`)
            // const { body: actual } = await k8sService.getNamespacedCustomObject({ ...CHECK_STATUS_GVR, namespace, name })
            // const desired: CheckStatusObject = getDesiredCheckStatus(actual as CheckStatusObject, res.data.healthy)
            // omit(actual.metadata, [ 'uid', 'resourceVersion', 'managedFields', 'annotations', 'creationTimestamp', 'generation' ])
            // set(actual, 'status.healthy', res.data.healthy)
            console.log(`applying status for check ${name} in namespace ${namespace}`)
            // const newObject = await k8sService.apply(desired)
            const newObject = await k8sService.setNamespacedCustomObjectStatus({ ...CHECK_STATUS_GVR, name, namespace }, { healthy: res.data.status })
            console.log(JSON.stringify(newObject))
            console.log(`successfully applied status for check ${name} in namespace ${namespace}`)
        } catch (err) {
            console.error('failed!')
            console.error(err)
        }

        await sleep(platformPollingIntervalSecs * 1000)
    }
}

main()
