import { V1Pod } from '@kubernetes/client-node'
import { CheckStatusObject } from './types'
import express from 'express'

const port = Number(process.env.PORT || '3009')
const image = process.env.INTERVAL_IMAGE || 'kimaharfi/amiok-interval:0.0.2'

async function main() {
    try {
        const app = express();
        app.use(express.json({limit: '2mb'}));

        app.post('/check/', (req,res,next) => {
            console.log("received webhook");
            const checkStatusObject: CheckStatusObject = req.body.parent as CheckStatusObject
            if (!checkStatusObject) throw new Error('no parent')

            const pod = getPod(checkStatusObject)

            console.log(JSON.stringify(pod));
            res.send({
                status: checkStatusObject.status,
                children: [pod]
            })
        })

        app.listen(port, () => {
            console.log(`listening on port ${port}`);
        });

    } catch (err) {
        console.error('failed!')
        console.error(err)
    } finally {
        // await informer.stop()
    }
}

main().catch(async reason => {
    console.error(reason)
    // await informer.stop()
    process.exit(1)
})

function getPod(checkStatusObject: CheckStatusObject): V1Pod {
    return {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
            // @ts-ignore
            name: checkStatusObject.metadata.name,
            // @ts-ignore
            namespace: checkStatusObject.metadata.namespace,
        },
        spec: {
            containers: [
                {
                    name: 'interval',
                    image,
                    imagePullPolicy: 'Always',
                    env: [
                        {
                            name: 'PLATFORM_BASE_URL',
                            value: process.env.PLATFORM_BASE_URL
                        },
                        {
                            name: 'PLATFORM_POLLING_INTERVAL_SECS',
                            value: process.env.PLATFORM_POLLING_INTERVAL_SECS
                        },
                        {
                            name: 'CHECK_DEFINITION_REF',
                            value: checkStatusObject.spec.checkDefinitionRef
                        },
                        {
                            name: 'CHECK_STATUS_OBJECT_NAME',
                            value: checkStatusObject.metadata?.name
                        },
                        {
                            name: 'CHECK_STATUS_OBJECT_NAMESPACE',
                            value: checkStatusObject.metadata?.namespace
                        },
                    ]
                }
            ],
            restartPolicy: "OnFailure"
        }
    }
}
