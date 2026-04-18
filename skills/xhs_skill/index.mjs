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
} from "./lib/xhs-client.mjs";

const PLUGIN_ID = "xiaohongshu-browser";

function getPluginConfig(api) {
  return api?.config?.plugins?.entries?.[PLUGIN_ID]?.config ?? {};
}

function buildRuntimeConfig(api) {
  const cfg = getPluginConfig(api);
  return {
    authStatePath: cfg.authStatePath,
    browserChannel: cfg.browserChannel ?? "chrome",
    browserExecutablePath: cfg.browserExecutablePath,
    headless: cfg.headless ?? true,
    locale: cfg.locale ?? "zh-CN",
    timezoneId: cfg.timezoneId ?? "Asia/Shanghai",
    navigationTimeoutMs: cfg.navigationTimeoutMs ?? 45000,
    actionTimeoutMs: cfg.actionTimeoutMs ?? 10000,
    evidenceDir: cfg.evidenceDir,
    userAgent: cfg.userAgent,
  };
}

function toolErrorResponse(error) {
  return {
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  };
}

export default {
  id: PLUGIN_ID,
  name: "Xiaohongshu Browser",
  register(api) {
    api.registerTool({
      name: "xhs_check_auth",
      description: "Validate the configured Xiaohongshu auth state and report whether the session still appears logged in.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {},
      },
      async execute(_id, _params) {
        try {
          return await checkAuth(buildRuntimeConfig(api));
        } catch (error) {
          return toolErrorResponse(error);
        }
      },
    });

    api.registerTool({
      name: "xhs_get_article",
      description: "Open a Xiaohongshu note URL and extract article metadata, text, author information, and image URLs.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["url"],
        properties: {
          url: { type: "string" },
          saveEvidence: { type: "boolean" },
        },
      },
      async execute(_id, params) {
        try {
          return await getArticle(buildRuntimeConfig(api), params);
        } catch (error) {
          return toolErrorResponse(error);
        }
      },
    });

    api.registerTool({
      name: "xhs_get_comments",
      description: "Open a Xiaohongshu note URL, expand comment threads, and return normalized comments plus replies.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["url"],
        properties: {
          url: { type: "string" },
          maxComments: { type: "integer", minimum: 1, maximum: 500 },
          maxRepliesPerComment: { type: "integer", minimum: 0, maximum: 100 },
          scrollPasses: { type: "integer", minimum: 1, maximum: 50 },
          waitAfterScrollMs: { type: "integer", minimum: 100, maximum: 10000 },
          saveEvidence: { type: "boolean" },
        },
      },
      async execute(_id, params) {
        try {
          return await getComments(buildRuntimeConfig(api), params);
        } catch (error) {
          return toolErrorResponse(error);
        }
      },
    });

    api.registerTool({
      name: "xhs_get_note_bundle",
      description: "Fetch a Xiaohongshu note in one pass, returning article content, image URLs, and comments together.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["url"],
        properties: {
          url: { type: "string" },
          maxComments: { type: "integer", minimum: 1, maximum: 500 },
          maxRepliesPerComment: { type: "integer", minimum: 0, maximum: 100 },
          scrollPasses: { type: "integer", minimum: 1, maximum: 50 },
          waitAfterScrollMs: { type: "integer", minimum: 100, maximum: 10000 },
          saveEvidence: { type: "boolean" },
        },
      },
      async execute(_id, params) {
        try {
          return await getNoteBundle(buildRuntimeConfig(api), params);
        } catch (error) {
          return toolErrorResponse(error);
        }
      },
    });

    api.registerTool({
      name: "xhs_search_notes",
      description: "Search Xiaohongshu notes by keyword and return ranked note candidates with URLs, titles, authors, and cover images.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["query"],
        properties: {
          query: { type: "string" },
          maxResults: { type: "integer", minimum: 1, maximum: 30 },
          scrollPasses: { type: "integer", minimum: 1, maximum: 30 },
          waitAfterScrollMs: { type: "integer", minimum: 100, maximum: 10000 },
        },
      },
      async execute(_id, params) {
        try {
          return await searchNotes(buildRuntimeConfig(api), params);
        } catch (error) {
          return toolErrorResponse(error);
        }
      },
    });

    api.registerTool({
      name: "xhs_get_author_profile",
      description: "Fetch Xiaohongshu author profile signals for reputation scoring, either from a profile URL or a note URL.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          url: { type: "string" },
          noteUrl: { type: "string" },
        },
      },
      async execute(_id, params) {
        try {
          return await getAuthorProfile(buildRuntimeConfig(api), params);
        } catch (error) {
          return toolErrorResponse(error);
        }
      },
    });

    api.registerTool({
      name: "xhs_score_note_quality",
      description: "Score one Xiaohongshu note bundle for travel-planning quality, credibility, practical value, and commercial risk.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["query", "bundle"],
        properties: {
          query: { type: "string" },
          bundle: { type: "object" },
          authorProfile: { type: "object" },
        },
      },
      async execute(_id, params) {
        try {
          return scoreNoteQuality(params);
        } catch (error) {
          return toolErrorResponse(error);
        }
      },
    });

    api.registerTool({
      name: "xhs_search_topic_bundle",
      description: "Search Xiaohongshu for a topic, fetch top note bundles, attach author-profile signals, and score the results.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["query"],
        properties: {
          query: { type: "string" },
          maxNotes: { type: "integer", minimum: 1, maximum: 10 },
          maxResults: { type: "integer", minimum: 1, maximum: 30 },
          maxComments: { type: "integer", minimum: 1, maximum: 200 },
          includeAuthorProfile: { type: "boolean" },
          saveEvidence: { type: "boolean" },
        },
      },
      async execute(_id, params) {
        try {
          return await searchTopicBundle(buildRuntimeConfig(api), params);
        } catch (error) {
          return toolErrorResponse(error);
        }
      },
    });

    api.registerTool({
      name: "xhs_rank_trip_options",
      description: "Rank Xiaohongshu-derived trip options with a Bayes-style posterior over route archetypes and note evidence quality.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["query", "topicBundle"],
        properties: {
          query: { type: "string" },
          topicBundle: { type: "object" },
        },
      },
      async execute(_id, params) {
        try {
          return rankTripOptions(params);
        } catch (error) {
          return toolErrorResponse(error);
        }
      },
    });
  },
};
