import * as core from '@actions/core';
import {Lambda, S3} from 'aws-sdk';
import {createHash} from 'crypto';
import {readFile} from 'fs';
import {parse} from 'path';

const s3 = new S3({region: 'eu-west-1'});
const lambda = new Lambda({region: 'eu-west-1'});

async function run() {
  try {
    const path = core.getInput('path');
    const bucket = core.getInput('bucket');
    const parsedKey = parse(core.getInput('key'));
    const hash = createHash('md5');
    readFile(path, (err, buffer) => {
      hash.update(buffer);
      const key = `${parsedKey.dir}/${parsedKey.name}.${hash.digest('hex')}${parsedKey.ext}`;
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
            CompatibleRuntimes: [core.getInput('runtime')],
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
