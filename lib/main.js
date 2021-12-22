"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
const aws_sdk_1 = require("aws-sdk");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
const s3 = new aws_sdk_1.S3({ region: 'eu-west-1' });
const lambda = new aws_sdk_1.Lambda({ region: 'eu-west-1' });
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const path = core.getInput('path');
            const bucket = core.getInput('bucket');
            const parsedKey = (0, path_1.parse)(core.getInput('key'));
            const hash = (0, crypto_1.createHash)('md5');
            (0, fs_1.readFile)(path, (err, buffer) => {
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
                    }
                    else {
                        lambda.publishLayerVersion({
                            LayerName: core.getInput('layer'),
                            Description: core.getInput('description'),
                            Content: {
                                S3Bucket: bucket,
                                S3Key: key
                            },
                            CompatibleRuntimes: [core.getInput('runtime')],
                            CompatibleArchitectures: [core.getInput('architecture')]
                        }, (err, data) => {
                            if (err) {
                                throw err;
                            }
                            else {
                                core.debug(JSON.stringify(data));
                            }
                        });
                    }
                });
            });
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
