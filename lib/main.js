"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const client_s3_1 = require("@aws-sdk/client-s3");
const client_lambda_1 = require("@aws-sdk/client-lambda");
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const s3Client = new client_s3_1.S3Client({ region: "eu-west-1" });
const lambdaClient = new client_lambda_1.LambdaClient({ region: "eu-west-1" });
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const path = core.getInput("path");
            const bucket = core.getInput("bucket");
            const parsedKey = (0, node_path_1.parse)(core.getInput("key"));
            const hash = (0, node_crypto_1.createHash)("md5");
            const buffer = yield (0, promises_1.readFile)(path);
            hash.update(buffer);
            const key = `${parsedKey.dir}/${parsedKey.name}.${hash.digest("hex")}${parsedKey.ext}`;
            const putCmd = new client_s3_1.PutObjectCommand({
                ACL: "authenticated-read",
                Body: buffer,
                Bucket: bucket,
                Key: key,
            });
            yield s3Client.send(putCmd);
            const command = new client_lambda_1.PublishLayerVersionCommand({
                LayerName: core.getInput("layer"),
                Description: core.getInput("description"),
                Content: {
                    S3Bucket: bucket,
                    S3Key: key,
                },
                CompatibleRuntimes: [core.getInput("runtime")],
                CompatibleArchitectures: [core.getInput("architecture")],
            });
            yield lambdaClient.send(command);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
