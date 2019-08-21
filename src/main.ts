import * as core from '@actions/core';
import {Lambda, S3} from 'aws-sdk';
import {readFile} from 'fs';

const s3 = new S3({region: 'eu-west-1'});
const lambda = new Lambda({region: 'eu-west-1'});

async function run() {
  try {
    const path = core.getInput('path');
    const bucket = core.getInput('bucket');
    const key = core.getInput('key');
    readFile(path, (err, buffer) => {
      s3.putObject({
        ACL: 'authenticated-read',
        Body: buffer,
        Bucket: bucket,
        Key: key
      }, (err, data) => {
        if (err) {
          throw err;
        } else {
          lambda.publishLayerVersion({
            LayerName: core.getInput('layer'),
            Description: core.getInput('description'),
            Content: {
              S3Bucket: bucket,
              S3Key: key
            },
            CompatibleRuntimes: ['python3.7'],
          }, (err, data) => {
            if (err) {
              throw err;
            } else {
              core.debug(JSON.stringify(data));
            }
          });
        }
      });
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
