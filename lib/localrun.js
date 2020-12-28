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
const releaseNotesModule = __importStar(require("./generate-releasenotes"));
const github = __importStar(require("@actions/github"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        var promise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (process.argv.length !== 14 && process.argv.length !== 16) {
                    console.error('USAGE: node LocalTester.js --pat <GitHub-PAT> --owner <Repo owner> --repo <Repo> --runid <Number> --templatefile <File path> --outputfile <File path> --extensionsFile <Optional File path>');
                }
                else {
                    console.log('Starting Local Tester');
                    const argv = require('minimist')(process.argv.slice(2));
                    const pat = argv['pat'];
                    const owner = argv['owner'];
                    const repo = argv['repo'];
                    const runid = argv['runid'];
                    const templatefile = argv['templatefile'];
                    const outputfile = argv['outputfile'];
                    const extensionsFile = argv['extensionsFile'];
                    console.log(`Command Line Arguments:`);
                    console.log(`  --pat: ${pat}`);
                    console.log(`  --owner: ${owner}`);
                    console.log(`  --repo: ${repo}`);
                    console.log(`  --runid: ${runid}`);
                    console.log(`  --templatefile: ${templatefile}`);
                    console.log(`  --outputfile: ${outputfile}`);
                    console.log(`  --extensionsFile: ${extensionsFile}`);
                    const octokit = github.getOctokit(pat);
                    yield releaseNotesModule.generate(octokit, owner, repo, runid, templatefile, outputfile, extensionsFile);
                }
            }
            catch (err) {
                console.error(err);
                reject(err);
            }
            resolve(0);
        }));
        return promise;
    });
}
run()
    .then(result => {
    console.log('Tool exited');
})
    .catch(err => {
    console.error(err);
});
