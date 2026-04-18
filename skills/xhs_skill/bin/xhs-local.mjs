#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkAuth,
  getArticle,
  getAuthorProfile,
  getComments,
  getNoteBundle,
  rankTripOptions,
  scoreNoteQuality,
  searchNotes,
  searchTopicBundle,
} from "../lib/xhs-client.mjs";

function parseArgs(argv) {
  const out = { _: [] };
  for (const token of argv) {
    if (!token.startsWith("--")) {
      out._.push(token);
      continue;
    }
    const [rawKey, ...rest] = token.slice(2).split("=");
    const value = rest.length ? rest.join("=") : true;
    out[rawKey] = value;
  }
  return out;
}

function asBoolean(value, defaultValue = false) {
  if (value === undefined) {
    return defaultValue;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return String(value).toLowerCase() === "true";
}

function asInteger(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function buildConfig(args) {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "..", "..");
  return {
    authStatePath: args["auth-path"] || process.env.XHS_AUTH_STATE_PATH || path.join(repoRoot, "xhs-auth.json"),
    browserChannel: args.browser || process.env.XHS_BROWSER_CHANNEL || "chrome",
    browserExecutablePath: args["executable-path"] || process.env.XHS_BROWSER_EXECUTABLE_PATH,
    headless: asBoolean(args.headless, false),
    locale: process.env.XHS_LOCALE || "zh-CN",
    timezoneId: process.env.XHS_TIMEZONE || "Asia/Shanghai",
    navigationTimeoutMs: asInteger(process.env.XHS_NAVIGATION_TIMEOUT_MS, 45000),
    actionTimeoutMs: asInteger(process.env.XHS_ACTION_TIMEOUT_MS, 10000),
    evidenceDir: args["evidence-dir"] || process.env.XHS_EVIDENCE_DIR,
    userAgent: process.env.XHS_USER_AGENT,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  const config = buildConfig(args);

  if (!command || command === "help") {
    console.log([
      "Usage:",
      "  node openclaw-plugin/bin/xhs-local.mjs check-auth",
      "  node openclaw-plugin/bin/xhs-local.mjs search --query=瑞士旅游攻略",
      "  node openclaw-plugin/bin/xhs-local.mjs article --url=https://www.xiaohongshu.com/explore/NOTE_ID",
      "  node openclaw-plugin/bin/xhs-local.mjs comments --url=https://www.xiaohongshu.com/explore/NOTE_ID",
      "  node openclaw-plugin/bin/xhs-local.mjs bundle --url=https://www.xiaohongshu.com/explore/NOTE_ID",
      "  node openclaw-plugin/bin/xhs-local.mjs profile --note-url=https://www.xiaohongshu.com/explore/NOTE_ID",
      "  node openclaw-plugin/bin/xhs-local.mjs topic --query=瑞士旅游攻略 --max-notes=3",
      "  node openclaw-plugin/bin/xhs-local.mjs rank --query=瑞士旅游攻略 --max-notes=3",
    ].join("\n"));
    process.exit(0);
  }

  let result;
  if (command === "check-auth") {
    result = await checkAuth(config);
  } else if (command === "search") {
    result = await searchNotes(config, {
      query: args.query,
      maxResults: asInteger(args["max-results"], 10),
      scrollPasses: asInteger(args["scroll-passes"], 8),
      waitAfterScrollMs: asInteger(args["wait-ms"], 1200),
    });
  } else if (command === "article") {
    result = await getArticle(config, {
      url: args.url,
      saveEvidence: asBoolean(args["save-evidence"], false),
    });
  } else if (command === "comments") {
    result = await getComments(config, {
      url: args.url,
      maxComments: asInteger(args["max-comments"], 100),
      maxRepliesPerComment: asInteger(args["max-replies"], 20),
      scrollPasses: asInteger(args["scroll-passes"], 12),
      waitAfterScrollMs: asInteger(args["wait-ms"], 1200),
      saveEvidence: asBoolean(args["save-evidence"], false),
    });
  } else if (command === "bundle") {
    result = await getNoteBundle(config, {
      url: args.url,
      maxComments: asInteger(args["max-comments"], 100),
      maxRepliesPerComment: asInteger(args["max-replies"], 20),
      scrollPasses: asInteger(args["scroll-passes"], 12),
      waitAfterScrollMs: asInteger(args["wait-ms"], 1200),
      saveEvidence: asBoolean(args["save-evidence"], false),
    });
  } else if (command === "profile") {
    result = await getAuthorProfile(config, {
      url: args.url,
      noteUrl: args["note-url"],
    });
  } else if (command === "score") {
    const bundle = await getNoteBundle(config, {
      url: args.url,
      maxComments: asInteger(args["max-comments"], 80),
      maxRepliesPerComment: asInteger(args["max-replies"], 15),
      scrollPasses: asInteger(args["scroll-passes"], 8),
      waitAfterScrollMs: asInteger(args["wait-ms"], 1200),
      saveEvidence: asBoolean(args["save-evidence"], false),
    });
    let authorProfile = null;
    if (bundle.article?.author?.profileUrl) {
      try {
        authorProfile = await getAuthorProfile(config, { url: bundle.article.author.profileUrl });
      } catch {
        authorProfile = null;
      }
    }
    result = scoreNoteQuality({
      query: args.query || "",
      bundle,
      authorProfile,
    });
  } else if (command === "topic") {
    result = await searchTopicBundle(config, {
      query: args.query,
      maxNotes: asInteger(args["max-notes"], 3),
      maxResults: asInteger(args["max-results"], 8),
      maxComments: asInteger(args["max-comments"], 60),
      includeAuthorProfile: asBoolean(args["include-author-profile"], true),
      saveEvidence: asBoolean(args["save-evidence"], false),
    });
  } else if (command === "rank") {
    const topicBundle = await searchTopicBundle(config, {
      query: args.query,
      maxNotes: asInteger(args["max-notes"], 3),
      maxResults: asInteger(args["max-results"], 8),
      maxComments: asInteger(args["max-comments"], 60),
      includeAuthorProfile: asBoolean(args["include-author-profile"], true),
      saveEvidence: false,
    });
    result = rankTripOptions({
      query: args.query,
      topicBundle,
    });
  } else {
    throw new Error(`Unknown command: ${command}`);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
