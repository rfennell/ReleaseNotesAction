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
exports.generate = void 0;
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
function generate(octokit, owner, repo, run_id, templateFile, outputFile, extensionsFile) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            core.info(`Getting the details of the workflow run ${run_id} from repo ${owner}/${repo}`);
            core.info(`Template File: ${templateFile}`);
            core.info(`Output File: ${outputFile}`);
            core.info(`Owner: ${owner}`);
            core.info(`Repo: ${repo}`);
            if (fs.existsSync(templateFile)) {
                core.info(`Loaded template file: ${templateFile}`);
                const runDetails = yield GetRunDetails(octokit, owner, repo, run_id);
                core.debug(`---THE API OBJECT START---`);
                core.debug(JSON.stringify(runDetails));
                core.debug(`---THE API OBJECT END---`);
                const template = fs.readFileSync(templateFile, 'utf8').toString();
                const output = ProcessTemplate(template, extensionsFile, runDetails);
                core.debug(`---THE OUTPUT OBJECT START---`);
                core.debug(JSON.stringify(output));
                core.debug(`---THE OUTPUT OBJECT END---`);
                fs.writeFileSync(outputFile, output);
            }
            else {
                core.setFailed(`Cannot find template file ${templateFile}`);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
exports.generate = generate;
function ProcessTemplate(template, extensionsFile, runDetails) {
    let output = '';
    if (template.length > 0) {
        core.info('Processing template');
        const handlebars = require('handlebars');
        const helpers = require('handlebars-helpers')({
            handlebars: handlebars
        });
        // add a custom helper to expand json
        handlebars.registerHelper('json', function (context) {
            return JSON.stringify(context);
        });
        if (extensionsFile) {
            if (fs.existsSync(extensionsFile)) {
                core.info(`Registering extensions in ${extensionsFile}`);
                var customFunctions = require(extensionsFile);
                handlebars.registerHelper(customFunctions);
            }
            else {
                core.setFailed(`Cannot find the expected extensions file ${extensionsFile}`);
            }
        }
        const handlebarsTemplate = handlebars.compile(template);
        output = handlebarsTemplate({
            runDetails: runDetails
        });
        core.info('Completed processing template');
    }
    else {
        core.setFailed(`Template file is empty`);
    }
    return output;
}
function GetRunDetails(octokit, owner, repo, run_id) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield octokit.rest.actions.getWorkflowRun({
                    owner: owner,
                    repo: repo,
                    run_id: run_id
                });
                // we only need the data not the full response
                const runDetails = response.data;
                // Loop to get the PR details
                if (runDetails.pull_requests) {
                    core.info(`There are ${runDetails.pull_requests.length} associated PRs with run`);
                    // replace the url PR links with the details
                    runDetails.pull_requests = yield GetPullRequests(octokit, owner, repo, runDetails.pull_requests);
                }
                else {
                    core.info(`No associated PRs with run`);
                }
                resolve(runDetails);
            }
            catch (error) {
                core.setFailed(error.message);
            }
        }));
    });
}
function GetPullRequests(octokit, owner, repo, prList) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const pullRequests = [];
                for (let index = 0; index < prList.length; index++) {
                    const pr = prList[index];
                    core.info(`Getting the details of associated PR ${pr.number}`);
                    const response = yield octokit.rest.pulls.get({
                        owner: owner,
                        repo: repo,
                        pull_number: pr.number
                    });
                    // add the details of the commits
                    response.data.commits = yield GetPullRequestCommits(octokit, owner, repo, pr);
                    response.data.comments = yield GetPullRequestComments(octokit, owner, repo, pr);
                    response.data.linkedIssues = yield GetLinkedIssues(octokit, owner, repo, pr);
                    pullRequests.push(response.data);
                }
                resolve(pullRequests);
            }
            catch (err) {
                reject(err);
            }
        }));
    });
}
function GetPullRequestCommits(octokit, owner, repo, pr) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                core.info(`Getting the commits associated with PR ${pr.number}`);
                const response = yield octokit.rest.pulls.listCommits({
                    owner: owner,
                    repo: repo,
                    pull_number: pr.number
                });
                resolve(response.data);
            }
            catch (err) {
                reject(err);
            }
        }));
    });
}
function GetPullRequestComments(octokit, owner, repo, pr) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                core.info(`Getting the comments associated with PR ${pr.number}`);
                const response = yield octokit.rest.issues.listComments({
                    owner: owner,
                    repo: repo,
                    issue_number: pr.number
                });
                resolve(response.data);
            }
            catch (err) {
                reject(err);
            }
        }));
    });
}
function GetLinkedIssues(octokit, owner, repo, pr) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                core.info(`Getting issues linked to PR ${pr.number}`);
                // based on https://github.community/t/get-all-issues-linked-to-a-pull-request/14653/6
                // as there is no API direct call
                const response = yield octokit.graphql(`{resource(url: "https://github.com/${owner}/${repo}/pull/${pr.number}") {
        ... on PullRequest {
          timelineItems(itemTypes: [CONNECTED_EVENT, DISCONNECTED_EVENT], first: 250) {
            nodes {
              ... on ConnectedEvent {
                id
                subject {
                  ... on Issue {
                    number
                  }
                }
              }
              ... on DisconnectedEvent {
                id
                subject {
                  ... on Issue {
                    number
                  }
                }
              }
            }
          }
        }
      }}`);
                const linkedIssues = [];
                const issues = {};
                if (response.resource && response.resource.timelineItems) {
                    response.resource.timelineItems.nodes.map((node) => {
                        if (issues.hasOwnProperty(node.subject.number)) {
                            issues[node.subject.number]++;
                        }
                        else {
                            issues[node.subject.number] = 1;
                        }
                    });
                    for (const [issue, count] of Object.entries(issues)) {
                        if (count % 2 !== 0) {
                            core.debug(`Getting the linked issue ${issue}`);
                            const issueDetails = yield octokit.rest.issues.get({
                                owner: owner,
                                repo: repo,
                                issue_number: issue
                            });
                            linkedIssues.push(issueDetails.data);
                        }
                    }
                }
                resolve(linkedIssues);
            }
            catch (err) {
                reject(err);
            }
        }));
    });
}
