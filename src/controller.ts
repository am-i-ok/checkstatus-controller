import { V1Deployment } from '@kubernetes/client-node'
import { CheckStatusObject } from './types'
import express from 'express'
import { Server } from 'http'

const logger = console
const port = Number(process.env.PORT || '3009')
const image = process.env.INTERVAL_IMAGE || 'kimaharfi/amiok-interval:0.0.4'
let server: Server | undefined

function getDeployment(checkStatusObject: CheckStatusObject): V1Deployment {
    return {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
            // @ts-ignore
            name: `interval-${checkStatusObject.metadata!.name}`,
            // @ts-ignore
            namespace: checkStatusObject.metadata.namespace,
        },
        spec: {
            replicas: 1,
            selector:{
                matchLabels: {
                    app: `interval-${checkStatusObject.metadata!.name}`
                }
            },
            template: {
                metadata: {
                    labels: {
                        app: `interval-${checkStatusObject.metadata!.name}`
                    }
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
                    ]
                }
            },
        }
    }
}

async function main() {
    try {
        const app = express();
        app.use(express.json({limit: '2mb'}));

        app.post('/check/', (req,res,next) => {
            const checkStatusObject: CheckStatusObject = req.body.parent as CheckStatusObject
            if (!checkStatusObject) throw new Error('no parent')

            logger.info(`received webhook for CheckStatus '${checkStatusObject.metadata?.name}'`);

            const deployment = getDeployment(checkStatusObject)

            logger.info(JSON.stringify(deployment));
            res.send({
                status: checkStatusObject.status,
                children: [deployment]
            })
        })

        server = app.listen(port, () => {
            logger.info(`listening on port ${port}`);
        });
    } catch (err) {
        logger.error('failed!')
        logger.error(err)
    } finally {
        // server?.close()
        // await informer.stop()
    }
}

main()
    .catch((err) => {
        logger.error(err);
        process.exit(1);
    });

process.on('SIGTERM', () => {
    server?.close()
    process.exit(1);
});

process.on('SIGINT', () => {
    server?.close()
    process.exit(1);
});
