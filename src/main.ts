import * as core from "@actions/core";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  LambdaClient,
  PublishLayerVersionCommand,
} from "@aws-sdk/client-lambda";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { parse } from "node:path";

const s3Client = new S3Client({ region: "eu-west-1" });
const lambdaClient = new LambdaClient({ region: "eu-west-1" });

async function run() {
  try {
    const path = core.getInput("path");
    const bucket = core.getInput("bucket");
    const parsedKey = parse(core.getInput("key"));
    const hash = createHash("md5");
    const buffer = await readFile(path);
    hash.update(buffer);
    const key = `${parsedKey.dir}/${parsedKey.name}.${hash.digest("hex")}${
      parsedKey.ext
    }`;
    const putCmd = new PutObjectCommand({
      ACL: "authenticated-read",
      Body: buffer,
      Bucket: bucket,
      Key: key,
    });
    await s3Client.send(putCmd);

    const command = new PublishLayerVersionCommand({
      LayerName: core.getInput("layer"),
      Description: core.getInput("description"),
      Content: {
        S3Bucket: bucket,
        S3Key: key,
      },
      CompatibleRuntimes: [core.getInput("runtime")],
      CompatibleArchitectures: [core.getInput("architecture")],
    });
    await lambdaClient.send(command);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
