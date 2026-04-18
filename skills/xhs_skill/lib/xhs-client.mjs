import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const DEFAULT_COMMENT_OPTIONS = {
  maxComments: 100,
  maxRepliesPerComment: 20,
  scrollPasses: 12,
  waitAfterScrollMs: 1200,
};

const DEFAULT_SEARCH_OPTIONS = {
  maxResults: 12,
  scrollPasses: 10,
  waitAfterScrollMs: 1200,
};

const NOTE_URL_RE = /^https?:\/\/(?:www\.)?xiaohongshu\.com\//i;
const SEARCH_URL = "https://www.xiaohongshu.com/search_result";
const TRAVEL_KEYWORDS = ["攻略", "行程", "路线", "预算", "交通", "火车", "酒店", "机票", "签证", "景点", "避坑", "预约"];
const TRAVEL_FOCUS_KEYWORDS = ["旅行", "旅游", "攻略", "自由行", "打卡", "路线", "探店", "酒店", "民宿", "徒步"];
const NEGATIVE_COMMENT_KEYWORDS = ["踩雷", "避雷", "不推荐", "过时", "不准", "广告", "劝退", "排队", "贵", "坑"];
const POSITIVE_COMMENT_KEYWORDS = ["有用", "收藏", "谢谢", "真实", "推荐", "靠谱", "实用", "已去", "亲测", "详细"];
const COMMERCIAL_RISK_KEYWORDS = ["合作", "广告", "赞助", "折扣", "团购", "链接", "下单", "咨询", "私信"];
const SWISS_ROUTE_TEMPLATES = [
  {
    id: "scenic-first-timer",
    label: "Scenic First Timer",
    priorKeywords: ["攻略", "第一次", "自由行", "经典", "必去"],
    evidenceKeywords: ["苏黎世", "卢塞恩", "因特拉肯", "少女峰", "采尔马特", "琉森"],
    route: ["苏黎世", "卢塞恩", "因特拉肯", "少女峰", "采尔马特"],
  },
  {
    id: "budget-rail",
    label: "Budget Rail",
    priorKeywords: ["预算", "穷游", "省钱", "火车", "通票"],
    evidenceKeywords: ["火车", "通票", "伯尔尼", "卢塞恩", "因特拉肯", "住宿"],
    route: ["苏黎世", "伯尔尼", "因特拉肯", "卢塞恩"],
  },
  {
    id: "alpine-photo",
    label: "Alpine Photo",
    priorKeywords: ["拍照", "出片", "雪山", "湖景", "徒步"],
    evidenceKeywords: ["格林德瓦", "劳特布龙嫩", "少女峰", "采尔马特", "马特洪峰", "因特拉肯"],
    route: ["因特拉肯", "格林德瓦", "劳特布龙嫩", "少女峰", "采尔马特"],
  },
  {
    id: "city-culture",
    label: "City Culture",
    priorKeywords: ["城市", "文化", "博物馆", "轻松", "休闲"],
    evidenceKeywords: ["苏黎世", "日内瓦", "洛桑", "蒙特勒", "伯尔尼"],
    route: ["苏黎世", "伯尔尼", "洛桑", "蒙特勒", "日内瓦"],
  },
];

function assertConfig(config) {
  if (!config?.authStatePath) {
    throw new Error("Missing plugin config: authStatePath");
  }
}

function resolveMaybeRelative(filePath) {
  if (!filePath) {
    return filePath;
  }
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

async function ensureFileExists(filePath) {
  await fs.access(filePath);
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.-]/g, "");
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseChineseCount(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const text = cleanText(value);
  if (!text) {
    return null;
  }
  const match = text.match(/(\d+(?:\.\d+)?)(万|千)?/);
  if (!match) {
    return toNumber(text);
  }
  const base = Number(match[1]);
  if (!Number.isFinite(base)) {
    return null;
  }
  if (match[2] === "万") {
    return Math.round(base * 10000);
  }
  if (match[2] === "千") {
    return Math.round(base * 1000);
  }
  return Math.round(base);
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function pickFirst(obj, keys) {
  if (!obj || typeof obj !== "object") {
    return undefined;
  }
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }
  return undefined;
}

function cleanText(value) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).replace(/\s+/g, " ").trim();
}

function containsAny(text, keywords) {
  const normalized = cleanText(text);
  if (!normalized) {
    return false;
  }
  return keywords.some((keyword) => normalized.includes(keyword));
}

function keywordCount(text, keywords) {
  const normalized = cleanText(text);
  if (!normalized) {
    return 0;
  }
  return keywords.reduce((count, keyword) => count + (normalized.includes(keyword) ? 1 : 0), 0);
}

function dedupeStrings(values) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const normalized = cleanText(value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function dedupeBy(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(item);
  }
  return out;
}

function parseNoteId(url) {
  const match = String(url).match(/\/explore\/([^/?#]+)/i) ?? String(url).match(/\/discovery\/item\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

function normalizeImageEntries(values) {
  const out = [];
  const visit = (entry) => {
    if (!entry) {
      return;
    }
    if (typeof entry === "string") {
      out.push({ url: entry });
      return;
    }
    if (typeof entry !== "object") {
      return;
    }
    const directUrl = pickFirst(entry, [
      "url",
      "src",
      "imageUrl",
      "image_url",
      "urlDefault",
      "masterUrl",
      "origin",
    ]);
    if (directUrl) {
      out.push({ url: directUrl, alt: cleanText(entry.alt) || undefined });
    }
    for (const key of ["urlList", "url_list", "infoList", "info_list", "images", "imageList", "variants"]) {
      for (const nested of toArray(entry[key])) {
        visit(nested);
      }
    }
  };
  for (const value of toArray(values)) {
    visit(value);
  }
  return dedupeBy(
    out.filter((item) => item.url),
    (item) => item.url,
  );
}

function normalizeAuthor(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const name = cleanText(pickFirst(value, ["nickname", "name", "userName", "username", "displayName"]));
  const profileUrl = pickFirst(value, ["profileUrl", "profile_url", "url", "userPage"]);
  const avatarUrl = pickFirst(value, ["avatar", "avatarUrl", "avatar_url", "image", "photo"]);
  if (!name && !profileUrl && !avatarUrl) {
    return null;
  }
  return {
    name: name || null,
    profileUrl: profileUrl || null,
    avatarUrl: avatarUrl || null,
  };
}

function scoreNoteCandidate(note) {
  let score = 0;
  if (note.title) {
    score += 4;
  }
  if (note.text) {
    score += 4;
  }
  if (note.images?.length) {
    score += Math.min(note.images.length, 5);
  }
  if (note.author?.name) {
    score += 2;
  }
  if (note.noteId) {
    score += 2;
  }
  return score;
}

function looksLikeCommentObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const content = pickFirst(value, ["content", "text", "comment", "commentText"]);
  const user = pickFirst(value, ["userInfo", "user_info", "user", "author"]);
  return Boolean(content || (user && typeof user === "object"));
}

function normalizeCommentObject(value) {
  if (!looksLikeCommentObject(value)) {
    return null;
  }
  const content = cleanText(pickFirst(value, ["content", "text", "comment", "commentText"]));
  const author = normalizeAuthor(pickFirst(value, ["userInfo", "user_info", "user", "author"]));
  const commentId = pickFirst(value, ["commentId", "comment_id", "id"]);
  const createTime = pickFirst(value, ["createTime", "create_time", "time"]);
  const likeCount = toNumber(pickFirst(value, ["likeCount", "like_count", "likes", "liked_count"]));
  const rawReplies = [
    ...toArray(value.subComments),
    ...toArray(value.sub_comments),
    ...toArray(value.replies),
  ];

  if (!content && !author?.name) {
    return null;
  }

  return {
    commentId: commentId || null,
    content: content || null,
    author,
    createTime: createTime || null,
    likeCount,
    replies: rawReplies
      .map((reply) => normalizeCommentObject(reply))
      .filter(Boolean),
  };
}

function walkJson(value, visit, state = { seen: new WeakSet(), nodes: 0 }) {
  if (!value || typeof value !== "object") {
    return;
  }
  if (state.seen.has(value)) {
    return;
  }
  state.seen.add(value);
  state.nodes += 1;
  if (state.nodes > 4000) {
    return;
  }
  visit(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      walkJson(item, visit, state);
    }
    return;
  }
  for (const nested of Object.values(value)) {
    walkJson(nested, visit, state);
  }
}

function normalizeNoteCandidate(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const card = value.note_card && typeof value.note_card === "object" ? value.note_card : value;
  const user = pickFirst(card, ["user", "author", "userInfo", "user_info"]);
  const textParts = dedupeStrings([
    pickFirst(card, ["desc", "description", "content", "text"]),
    ...toArray(card.descList),
    ...toArray(card.paragraphs),
  ]);

  const images = normalizeImageEntries([
    ...toArray(card.imageList),
    ...toArray(card.image_list),
    ...toArray(card.images),
  ]);

  const note = {
    noteId: pickFirst(card, ["noteId", "note_id", "id"]) || null,
    title: cleanText(pickFirst(card, ["title", "noteTitle"])) || null,
    text: textParts.join("\n\n") || null,
    images,
    author: normalizeAuthor(user),
    stats: {
      likeCount: toNumber(pickFirst(card, ["liked_count", "likeCount", "likes"])),
      commentCount: toNumber(pickFirst(card, ["comment_count", "commentCount"])),
      collectCount: toNumber(pickFirst(card, ["collected_count", "collectCount"])),
      shareCount: toNumber(pickFirst(card, ["share_count", "shareCount"])),
    },
  };

  if (!note.title && !note.text && !note.images.length) {
    return null;
  }
  return note;
}

function extractBestNoteFromPayloads(payloads) {
  const candidates = [];
  for (const payload of payloads) {
    walkJson(payload.json, (value) => {
      const candidate = normalizeNoteCandidate(value);
      if (candidate) {
        candidates.push(candidate);
      }
    });
  }
  const deduped = dedupeBy(candidates, (item) => [item.noteId, item.title, item.text].filter(Boolean).join("|"));
  deduped.sort((a, b) => scoreNoteCandidate(b) - scoreNoteCandidate(a));
  return deduped[0] ?? null;
}

function extractCommentsFromPayloads(payloads) {
  const comments = [];
  for (const payload of payloads) {
    walkJson(payload.json, (value) => {
      if (!Array.isArray(value)) {
        return;
      }
      for (const item of value) {
        const comment = normalizeCommentObject(item);
        if (comment) {
          comments.push(comment);
        }
      }
    });
  }
  return dedupeComments(comments);
}

function flattenReplies(replies, maxRepliesPerComment) {
  return replies.slice(0, maxRepliesPerComment).map((reply) => ({
    commentId: reply.commentId,
    content: reply.content,
    author: reply.author,
    createTime: reply.createTime,
    likeCount: reply.likeCount,
  }));
}

function dedupeComments(comments) {
  return dedupeBy(comments, (comment) =>
    [
      comment.commentId,
      comment.author?.name,
      comment.content,
      comment.createTime,
    ]
      .filter(Boolean)
      .join("|"),
  );
}

async function saveEvidence(config, page, prefix) {
  if (!config.evidenceDir) {
    return null;
  }
  const evidenceDir = resolveMaybeRelative(config.evidenceDir);
  await fs.mkdir(evidenceDir, { recursive: true });
  const slug = `${prefix}-${Date.now()}`;
  const htmlPath = path.join(evidenceDir, `${slug}.html`);
  const screenshotPath = path.join(evidenceDir, `${slug}.png`);
  await fs.writeFile(htmlPath, await page.content(), "utf8");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return { htmlPath, screenshotPath };
}

function buildCollector(page) {
  const payloads = [];
  const handler = async (response) => {
    try {
      const responseUrl = response.url();
      if (!/xiaohongshu\.com/i.test(responseUrl)) {
        return;
      }
      const contentType = response.headers()["content-type"] ?? "";
      if (!contentType.includes("json")) {
        return;
      }
      if (!/(comment|note|feed|explore|api)/i.test(responseUrl)) {
        return;
      }
      const json = await response.json();
      payloads.push({
        url: responseUrl,
        status: response.status(),
        json,
      });
      if (payloads.length > 50) {
        payloads.shift();
      }
    } catch {
      // Ignore non-JSON or transient parsing failures.
    }
  };
  page.on("response", handler);
  return {
    payloads,
    dispose() {
      page.off("response", handler);
    },
  };
}

async function launchContext(config) {
  assertConfig(config);
  const authStatePath = resolveMaybeRelative(config.authStatePath);
  await ensureFileExists(authStatePath);

  const launchOptions = {
    channel: config.browserChannel === "chromium" ? undefined : config.browserChannel,
    headless: Boolean(config.headless),
  };
  if (config.browserExecutablePath) {
    launchOptions.executablePath = resolveMaybeRelative(config.browserExecutablePath);
  }

  const browser = await chromium.launch(launchOptions);
  const contextOptions = {
    storageState: authStatePath,
    locale: config.locale ?? "zh-CN",
    timezoneId: config.timezoneId ?? "Asia/Shanghai",
    viewport: { width: 1440, height: 1200 },
  };
  if (config.userAgent) {
    contextOptions.userAgent = config.userAgent;
  }

  const context = await browser.newContext(contextOptions);
  context.setDefaultNavigationTimeout(config.navigationTimeoutMs ?? 45000);
  context.setDefaultTimeout(config.actionTimeoutMs ?? 10000);
  return { browser, context };
}

async function withNotePage(config, url, work) {
  if (!NOTE_URL_RE.test(url)) {
    throw new Error("Only Xiaohongshu URLs are supported.");
  }

  return withXhsPage(config, url, work);
}

async function withXhsPage(config, url, work) {
  const { browser, context } = await launchContext(config);
  const page = await context.newPage();
  const collector = buildCollector(page);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1800);
    return await work({ page, collector, context });
  } finally {
    collector.dispose();
    await context.close();
    await browser.close();
  }
}

async function extractArticleFromDom(page) {
  return page.evaluate(() => {
    const textOf = (selectors) => {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        const text = element?.textContent?.replace(/\s+/g, " ").trim();
        if (text) {
          return text;
        }
      }
      return "";
    };

    const attrOf = (selectors, attr) => {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        const value = element?.getAttribute(attr)?.trim();
        if (value) {
          return value;
        }
      }
      return "";
    };

    const metaContent = (key) =>
      document.querySelector(`meta[property="${key}"], meta[name="${key}"]`)?.getAttribute("content")?.trim() ?? "";

    const paragraphs = [...document.querySelectorAll("article p, [class*='note'] p, [class*='content'] p")]
      .map((node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "")
      .filter(Boolean);

    const images = [...document.querySelectorAll("img")]
      .map((img) => ({
        url: img.currentSrc || img.src || "",
        alt: img.alt || "",
      }))
      .filter((item) => item.url && !item.url.startsWith("data:"));

    const authorName =
      textOf([
        "[class*='author'] [class*='name']",
        "[class*='user'] [class*='name']",
        "a[href*='/user/']",
      ]) || metaContent("article:author");

    const authorAvatar = attrOf([
      "[class*='author'] img",
      "[class*='user'] img",
    ], "src");

    return {
      url: location.href,
      noteId: (location.pathname.match(/\/explore\/([^/?#]+)/i) || [])[1] || null,
      title:
        textOf([
          "h1",
          "[class*='title']",
          "[class*='note-title']",
        ]) || metaContent("og:title") || document.title,
      text:
        paragraphs.join("\n\n") ||
        textOf([
          "article",
          "[class*='note-content']",
          "[class*='content']",
        ]) ||
        metaContent("description"),
      images,
      author: {
        name: authorName || null,
        profileUrl: document.querySelector("a[href*='/user/']")?.href ?? null,
        avatarUrl: authorAvatar || null,
      },
      meta: {
        pageTitle: document.title,
        ogTitle: metaContent("og:title"),
        description: metaContent("description"),
        ogImage: metaContent("og:image"),
      },
    };
  });
}

async function extractCommentsFromDom(page) {
  return page.evaluate(() => {
    const candidates = [...document.querySelectorAll("[class*='comment'], [class*='Comment']")];
    const comments = [];
    const seen = new Set();

    for (const element of candidates) {
      const text = element.textContent?.replace(/\s+/g, " ").trim() ?? "";
      if (!text || text.length < 4) {
        continue;
      }
      const author =
        element.querySelector("[class*='author'], [class*='name'], a[href*='/user/']")?.textContent?.replace(/\s+/g, " ").trim() ??
        "";
      const key = `${author}|${text}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      comments.push({
        commentId: element.getAttribute("data-id") || null,
        content: text,
        author: author ? { name: author } : null,
        createTime: null,
        likeCount: null,
        replies: [],
      });
    }

    return comments;
  });
}

async function openNotesTabIfPresent(page) {
  await page.evaluate(() => {
    const candidates = [...document.querySelectorAll("button, div, span, a")]
      .filter((element) => {
        const text = element.textContent?.replace(/\s+/g, " ").trim() ?? "";
        return text === "笔记" || text === "综合";
      });
    const notesTab = candidates.find((element) => (element.textContent ?? "").includes("笔记"));
    notesTab?.click();
  });
  await page.waitForTimeout(800);
}

async function extractSearchResultsFromDom(page) {
  return page.evaluate(() => {
    const cards = [];
    const seen = new Set();

    const pickMetric = (container, names) => {
      const text = container?.textContent?.replace(/\s+/g, " ").trim() ?? "";
      for (const name of names) {
        const regex = new RegExp(`${name}\\s*(\\d+(?:\\.\\d+)?(?:万|千)?)`);
        const match = text.match(regex);
        if (match) {
          return match[1];
        }
      }
      return "";
    };

    for (const anchor of document.querySelectorAll('a[href*="/explore/"]')) {
      const href = anchor.href;
      if (!href || seen.has(href)) {
        continue;
      }
      seen.add(href);
      const container = anchor.closest("section, article, div") ?? anchor;
      const titleNode =
        container.querySelector("h1, h2, h3, h4, [class*='title'], [class*='Title'], [class*='desc'], [class*='Desc']") ??
        anchor;
      const title = titleNode?.textContent?.replace(/\s+/g, " ").trim() ?? "";
      const coverImg = container.querySelector("img");
      const authorNode =
        container.querySelector('a[href*="/user/"], [class*="author"], [class*="user"], [class*="name"]');
      const rawText = container.textContent?.replace(/\s+/g, " ").trim() ?? "";
      cards.push({
        url: href,
        noteId: (href.match(/\/explore\/([^/?#]+)/) || [])[1] || null,
        title,
        coverImage: coverImg?.currentSrc || coverImg?.src || null,
        authorName: authorNode?.textContent?.replace(/\s+/g, " ").trim() ?? null,
        likeText: pickMetric(container, ["赞", "点赞"]),
        commentText: pickMetric(container, ["评论"]),
        saveText: pickMetric(container, ["收藏"]),
        excerpt: rawText.slice(0, 240),
      });
    }

    return cards;
  });
}

async function searchNotesDom(config, params) {
  const options = { ...DEFAULT_SEARCH_OPTIONS, ...params };
  const target = `${SEARCH_URL}?keyword=${encodeURIComponent(params.query)}&source=web_explore_feed`;

  return withXhsPage(config, target, async ({ page }) => {
    await openNotesTabIfPresent(page);
    const collectPass = async () => {
      const results = [];
      for (let pass = 0; pass < options.scrollPasses; pass += 1) {
        const batch = await extractSearchResultsFromDom(page);
        results.push(...batch);
        if (dedupeBy(results, (item) => item.url).length >= options.maxResults) {
          break;
        }
        await page.evaluate(() => window.scrollBy(0, Math.max(window.innerHeight * 0.9, 1000)));
        await page.waitForTimeout(options.waitAfterScrollMs);
      }
      return dedupeBy(results, (item) => item.url);
    };

    let unique = await collectPass();
    if (!unique.length) {
      await page.waitForTimeout(Math.max(options.waitAfterScrollMs * 2, 2500));
      await openNotesTabIfPresent(page);
      unique = await collectPass();
    }

    unique = unique.slice(0, options.maxResults);
    return {
      ok: true,
      query: params.query,
      searchUrl: page.url(),
      notes: unique.map((item, index) => ({
        rank: index + 1,
        url: item.url,
        noteId: item.noteId,
        title: item.title || null,
        coverImage: item.coverImage,
        authorName: item.authorName,
        excerpt: item.excerpt || null,
        stats: {
          likeCount: parseChineseCount(item.likeText),
          commentCount: parseChineseCount(item.commentText),
          saveCount: parseChineseCount(item.saveText),
        },
      })),
    };
  });
}

async function extractAuthorProfileFromDom(page) {
  return page.evaluate(() => {
    const textOf = (selectors) => {
      for (const selector of selectors) {
        const text = document.querySelector(selector)?.textContent?.replace(/\s+/g, " ").trim();
        if (text) {
          return text;
        }
      }
      return "";
    };

    const links = Array.from(document.querySelectorAll('a[href*="/explore/"]')).slice(0, 12);
    const recentNotes = links.map((anchor) => ({
      url: anchor.href,
      title:
        anchor.querySelector("h1, h2, h3, h4, [class*='title'], [class*='Title']")?.textContent?.replace(/\s+/g, " ").trim() ||
        anchor.textContent?.replace(/\s+/g, " ").trim() ||
        "",
    }));

    const statsText = document.body?.innerText ?? "";
    const findMetric = (label) => {
      const regex = new RegExp(`${label}\\s*(\\d+(?:\\.\\d+)?(?:万|千)?)`);
      return statsText.match(regex)?.[1] ?? "";
    };

    return {
      url: location.href,
      name: textOf(["h1", "[class*='name']", "[class*='nickname']"]) || null,
      bio: textOf(["[class*='desc']", "[class*='bio']", "[class*='introduction']"]) || null,
      avatarUrl: document.querySelector("img")?.currentSrc || document.querySelector("img")?.src || null,
      stats: {
        followerText: findMetric("粉丝"),
        fanText: findMetric("粉丝"),
        followingText: findMetric("关注"),
        likeCollectText: findMetric("获赞与收藏"),
      },
      recentNotes,
    };
  });
}

async function expandComments(page, options) {
  const labels = ["展开更多回复", "查看更多回复", "查看更多", "展开", "更多回复", "全部评论"];
  for (let pass = 0; pass < options.scrollPasses; pass += 1) {
    await page.evaluate((texts) => {
      const clickable = [...document.querySelectorAll("button, div, span, a")]
        .filter((element) => {
          const text = element.textContent?.replace(/\s+/g, " ").trim() ?? "";
          return text && texts.some((candidate) => text.includes(candidate));
        })
        .slice(0, 8);
      for (const element of clickable) {
        element.click();
      }
      window.scrollBy(0, Math.max(window.innerHeight * 0.85, 900));
    }, labels);
    await page.waitForTimeout(options.waitAfterScrollMs);
  }
}

function mergeArticleData(domArticle, networkArticle, url) {
  const mergedImages = dedupeBy(
    [
      ...toArray(networkArticle?.images),
      ...toArray(domArticle?.images),
      ...(domArticle?.meta?.ogImage ? [{ url: domArticle.meta.ogImage }] : []),
    ].filter(Boolean),
    (item) => item.url,
  );

  return {
    url: domArticle?.url || url,
    noteId: networkArticle?.noteId || domArticle?.noteId || parseNoteId(url),
    title: networkArticle?.title || domArticle?.title || null,
    text: networkArticle?.text || domArticle?.text || null,
    images: mergedImages,
    author: networkArticle?.author || domArticle?.author || null,
    stats: networkArticle?.stats || null,
    meta: domArticle?.meta || null,
  };
}

function normalizeCommentsForOutput(comments, maxComments, maxRepliesPerComment) {
  return comments.slice(0, maxComments).map((comment) => ({
    commentId: comment.commentId,
    content: comment.content,
    author: comment.author,
    createTime: comment.createTime,
    likeCount: comment.likeCount,
    replies: flattenReplies(comment.replies ?? [], maxRepliesPerComment),
  }));
}

function safeScore(value) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    return 0;
  }
  return Math.max(0, Math.min(1, normalized));
}

function scoreCommercialRisk(text) {
  return safeScore(keywordCount(text, COMMERCIAL_RISK_KEYWORDS) / 4);
}

function scoreCommentSupport(comments) {
  if (!comments?.length) {
    return 0.45;
  }
  const joined = comments
    .map((comment) => `${comment.content ?? ""} ${(comment.replies ?? []).map((reply) => reply.content ?? "").join(" ")}`)
    .join(" ");
  const pos = keywordCount(joined, POSITIVE_COMMENT_KEYWORDS);
  const neg = keywordCount(joined, NEGATIVE_COMMENT_KEYWORDS);
  return safeScore(0.5 + (pos - neg) / Math.max(comments.length * 2, 8));
}

function scorePracticality(article) {
  const text = `${article?.title ?? ""} ${article?.text ?? ""}`;
  const utility = keywordCount(text, TRAVEL_KEYWORDS);
  const lengthSignal = Math.min(cleanText(article?.text).length / 1200, 1);
  return safeScore(0.2 + utility / 8 + lengthSignal * 0.35);
}

function scoreFreshness(article, comments) {
  const text = `${article?.title ?? ""} ${article?.text ?? ""} ${comments.map((item) => item.createTime ?? "").join(" ")}`;
  if (/2026|2025/.test(text)) {
    return 0.85;
  }
  if (/2024/.test(text)) {
    return 0.7;
  }
  return 0.55;
}

function scoreVisualEvidence(article) {
  const imageCount = article?.images?.length ?? 0;
  return safeScore(Math.min(imageCount, 8) / 8);
}

function scoreEngagement(article, comments) {
  const likes = article?.stats?.likeCount ?? 0;
  const commentCount = article?.stats?.commentCount ?? comments.length ?? 0;
  const saves = article?.stats?.collectCount ?? 0;
  const signal = likes / 3000 + saves / 1800 + commentCount / 120;
  return safeScore(signal);
}

function scoreAuthorCredibility(authorProfile, article) {
  const recentTitles = toArray(authorProfile?.recentNotes).map((item) => item.title).join(" ");
  const topicFocus = keywordCount(recentTitles, TRAVEL_FOCUS_KEYWORDS);
  const followerCount = parseChineseCount(authorProfile?.stats?.fanText ?? authorProfile?.stats?.followerText) ?? 0;
  const articleAuthorName = cleanText(article?.author?.name);
  let score = 0.35;
  if (topicFocus >= 3) {
    score += 0.25;
  } else if (topicFocus >= 1) {
    score += 0.12;
  }
  if (followerCount >= 10000) {
    score += 0.2;
  } else if (followerCount >= 1000) {
    score += 0.1;
  }
  if (authorProfile?.bio && containsAny(authorProfile.bio, TRAVEL_FOCUS_KEYWORDS)) {
    score += 0.15;
  }
  if (articleAuthorName && authorProfile?.name && articleAuthorName === cleanText(authorProfile.name)) {
    score += 0.05;
  }
  return safeScore(score);
}

function scoreRelevance(query, article) {
  const keywords = dedupeStrings(cleanText(query).split(/[\s,，、/]+/g)).filter((item) => item.length >= 2);
  if (!keywords.length) {
    return 0.6;
  }
  const haystack = `${article?.title ?? ""} ${article?.text ?? ""}`;
  const matched = keywords.filter((keyword) => haystack.includes(keyword)).length;
  return safeScore(matched / keywords.length);
}

function summarizeQuality(subscores) {
  const weighted =
    subscores.relevance * 0.18 +
    subscores.practicality * 0.2 +
    subscores.authorCredibility * 0.18 +
    subscores.commentSupport * 0.14 +
    subscores.freshness * 0.12 +
    subscores.visualEvidence * 0.08 +
    subscores.engagement * 0.1 -
    subscores.commercialRisk * 0.1;
  return safeScore(weighted);
}

function inferNoteInsight(article) {
  const text = `${article?.title ?? ""} ${article?.text ?? ""}`;
  const flags = [];
  if (containsAny(text, ["火车", "通票", "SBB"])) {
    flags.push("rail");
  }
  if (containsAny(text, ["预算", "省钱", "平价", "穷游"])) {
    flags.push("budget");
  }
  if (containsAny(text, ["拍照", "出片", "机位", "雪山", "湖景"])) {
    flags.push("photo");
  }
  if (containsAny(text, ["轻松", "亲子", "老人", "慢游"])) {
    flags.push("relaxed");
  }
  return flags;
}

function buildPosterior(prior, likelihoods) {
  let score = Math.max(prior, 0.01);
  for (const likelihood of likelihoods) {
    score *= Math.max(likelihood, 0.05);
  }
  return score;
}

function normalizePosteriorRows(rows) {
  const total = rows.reduce((sum, row) => sum + row.posteriorRaw, 0) || 1;
  return rows
    .map((row) => ({
      ...row,
      posterior: Number((row.posteriorRaw / total).toFixed(4)),
    }))
    .sort((a, b) => b.posterior - a.posterior);
}

function detectUnavailablePage(pageUrl, pageTitle, article) {
  const url = cleanText(pageUrl);
  const title = cleanText(pageTitle || article?.meta?.pageTitle);
  const articleTitle = cleanText(article?.title);
  return (
    url.includes("/404") ||
    title.includes("页面不见了") ||
    title.includes("无法浏览") ||
    articleTitle === "瑞士自由行攻略"
  );
}

export async function checkAuth(config) {
  const authStatePath = resolveMaybeRelative(config.authStatePath);
  await ensureFileExists(authStatePath);
  return withNotePage(config, "https://www.xiaohongshu.com/explore", async ({ page }) => {
    const state = await page.evaluate(() => {
      const bodyText = document.body?.innerText ?? "";
      const loginMarkers = ["立即登录", "扫码登录", "登录后"];
      const hasLoginPrompt = loginMarkers.some((marker) => bodyText.includes(marker));
      return {
        finalUrl: location.href,
        title: document.title,
        hasLoginPrompt,
      };
    });
    return {
      ok: true,
      authStatePath,
      loggedIn: !state.hasLoginPrompt,
      page: state,
    };
  });
}

export async function getArticle(config, params) {
  return withNotePage(config, params.url, async ({ page, collector }) => {
    const domArticle = await extractArticleFromDom(page);
    const networkArticle = extractBestNoteFromPayloads(collector.payloads);
    const article = mergeArticleData(domArticle, networkArticle, params.url);
    const unavailable = detectUnavailablePage(page.url(), domArticle?.meta?.pageTitle, article);
    const evidence = params.saveEvidence ? await saveEvidence(config, page, "xhs-article") : null;
    return {
      ok: true,
      article,
      diagnostics: {
        payloadCount: collector.payloads.length,
        finalUrl: page.url(),
        unavailable,
      },
      evidence,
    };
  });
}

export async function getComments(config, params) {
  const options = {
    ...DEFAULT_COMMENT_OPTIONS,
    ...params,
  };

  return withNotePage(config, params.url, async ({ page, collector }) => {
    await expandComments(page, options);
    const networkComments = extractCommentsFromPayloads(collector.payloads);
    const domComments = await extractCommentsFromDom(page);
    const merged = dedupeComments([...networkComments, ...domComments]);
    const comments = normalizeCommentsForOutput(
      merged,
      options.maxComments,
      options.maxRepliesPerComment,
    );
    const evidence = params.saveEvidence ? await saveEvidence(config, page, "xhs-comments") : null;

    return {
      ok: true,
      url: page.url(),
      noteId: parseNoteId(page.url()) || parseNoteId(params.url),
      comments,
      diagnostics: {
        payloadCount: collector.payloads.length,
        networkCommentCount: networkComments.length,
        domCommentCount: domComments.length,
      },
      evidence,
    };
  });
}

export async function getNoteBundle(config, params) {
  const options = {
    ...DEFAULT_COMMENT_OPTIONS,
    ...params,
  };

  return withNotePage(config, params.url, async ({ page, collector }) => {
    await expandComments(page, options);
    const domArticle = await extractArticleFromDom(page);
    const networkArticle = extractBestNoteFromPayloads(collector.payloads);
    const article = mergeArticleData(domArticle, networkArticle, params.url);

    const networkComments = extractCommentsFromPayloads(collector.payloads);
    const domComments = await extractCommentsFromDom(page);
    const mergedComments = dedupeComments([...networkComments, ...domComments]);
    const comments = normalizeCommentsForOutput(
      mergedComments,
      options.maxComments,
      options.maxRepliesPerComment,
    );
    const unavailable = detectUnavailablePage(page.url(), domArticle?.meta?.pageTitle, article);
    const evidence = params.saveEvidence ? await saveEvidence(config, page, "xhs-bundle") : null;

    return {
      ok: true,
      article,
      comments,
      diagnostics: {
        payloadCount: collector.payloads.length,
        networkCommentCount: networkComments.length,
        domCommentCount: domComments.length,
        finalUrl: page.url(),
        unavailable,
      },
      evidence,
    };
  });
}

export async function searchNotes(config, params) {
  if (!cleanText(params?.query)) {
    throw new Error("searchNotes requires a non-empty query");
  }
  return searchNotesDom(config, params);
}

export async function getAuthorProfile(config, params) {
  let profileUrl = cleanText(params?.url);
  if (!profileUrl && params?.noteUrl) {
    const articleResult = await getArticle(config, { url: params.noteUrl });
    profileUrl = cleanText(articleResult?.article?.author?.profileUrl);
  }
  if (!profileUrl) {
    throw new Error("getAuthorProfile requires either url or noteUrl");
  }

  return withXhsPage(config, profileUrl, async ({ page }) => {
    const profile = await extractAuthorProfileFromDom(page);
    const travelFocusScore = safeScore(keywordCount(
      `${profile.bio ?? ""} ${toArray(profile.recentNotes).map((item) => item.title).join(" ")}`,
      TRAVEL_FOCUS_KEYWORDS,
    ) / 5);

    return {
      ok: true,
      author: {
        ...profile,
        stats: {
          followerCount: parseChineseCount(profile.stats?.followerText ?? profile.stats?.fanText),
          followingCount: parseChineseCount(profile.stats?.followingText),
          likeCollectCount: parseChineseCount(profile.stats?.likeCollectText),
          raw: profile.stats,
        },
        travelFocusScore,
      },
    };
  });
}

export function scoreNoteQuality(params) {
  const article = params?.bundle?.article ?? params?.article;
  const comments = toArray(params?.bundle?.comments ?? params?.comments);
  const authorProfile = params?.authorProfile?.author ?? params?.authorProfile ?? null;
  if (!article) {
    throw new Error("scoreNoteQuality requires article or bundle.article");
  }

  const subscores = {
    relevance: scoreRelevance(params?.query ?? "", article),
    practicality: scorePracticality(article),
    authorCredibility: scoreAuthorCredibility(authorProfile, article),
    commentSupport: scoreCommentSupport(comments),
    freshness: scoreFreshness(article, comments),
    visualEvidence: scoreVisualEvidence(article),
    engagement: scoreEngagement(article, comments),
    commercialRisk: scoreCommercialRisk(`${article.title ?? ""} ${article.text ?? ""}`),
  };

  const totalScore = summarizeQuality(subscores);
  return {
    ok: true,
    noteId: article.noteId,
    totalScore,
    trustLevel: totalScore >= 0.75 ? "high" : totalScore >= 0.55 ? "medium" : "low",
    insights: inferNoteInsight(article),
    subscores,
  };
}

export async function searchTopicBundle(config, params) {
  const maxNotes = Math.max(1, Math.min(Number(params?.maxNotes) || 5, 10));
  const retryScrollPasses = Number.isFinite(Number(params?.scrollPasses))
    ? Math.max(Number(params.scrollPasses), 12)
    : 12;
  const retryWaitMs = Number.isFinite(Number(params?.waitAfterScrollMs))
    ? Math.max(Number(params.waitAfterScrollMs), 1800)
    : 1800;
  let searchResult = await searchNotes(config, {
    query: params.query,
    maxResults: Math.max(maxNotes, Number(params?.maxResults) || maxNotes),
    scrollPasses: params.scrollPasses,
    waitAfterScrollMs: params.waitAfterScrollMs,
  });
  if (!searchResult.notes.length) {
    searchResult = await searchNotes(config, {
      query: params.query,
      maxResults: Math.max(maxNotes, Number(params?.maxResults) || maxNotes),
      scrollPasses: retryScrollPasses,
      waitAfterScrollMs: retryWaitMs,
    });
  }

  const bundles = [];
  for (const note of searchResult.notes) {
    if (bundles.filter((item) => item.bundle?.ok && !item.bundle?.diagnostics?.unavailable).length >= maxNotes) {
      break;
    }
    try {
      const bundle = await getNoteBundle(config, {
        url: note.url,
        maxComments: params.maxComments ?? 60,
        maxRepliesPerComment: params.maxRepliesPerComment ?? 15,
        scrollPasses: params.commentScrollPasses ?? 8,
        waitAfterScrollMs: params.commentWaitAfterScrollMs ?? 1200,
        saveEvidence: params.saveEvidence,
      });
      if (bundle.diagnostics?.unavailable) {
        bundles.push({
          searchHit: note,
          skipped: true,
          reason: "note_unavailable",
          bundle,
        });
        continue;
      }
      let authorProfile = null;
      if (params.includeAuthorProfile !== false && bundle.article?.author?.profileUrl) {
        try {
          authorProfile = await getAuthorProfile(config, { url: bundle.article.author.profileUrl });
        } catch {
          authorProfile = null;
        }
      }
      const quality = scoreNoteQuality({
        query: params.query,
        bundle,
        authorProfile,
      });
      bundles.push({
        searchHit: note,
        bundle,
        authorProfile,
        quality,
      });
    } catch (error) {
      bundles.push({
        searchHit: note,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    ok: true,
    query: params.query,
    search: searchResult,
    notes: bundles,
  };
}

export function rankTripOptions(params) {
  const query = cleanText(params?.query);
  const notes = toArray(params?.topicBundle?.notes ?? params?.notes).filter(
    (item) => item?.bundle?.article && !item?.bundle?.diagnostics?.unavailable && !item?.skipped,
  );
  if (!query || !notes.length) {
    throw new Error("rankTripOptions requires query and topicBundle/notes with bundle.article");
  }

  const rankedNotes = notes
    .map((item) => ({
      noteId: item.bundle.article.noteId,
      url: item.bundle.article.url,
      title: item.bundle.article.title,
      totalScore: item.quality?.totalScore ?? 0,
      trustLevel: item.quality?.trustLevel ?? "low",
      authorName: item.bundle.article.author?.name ?? null,
      insights: item.quality?.insights ?? [],
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  const joinedEvidence = notes
    .map((item) => `${item.bundle.article.title ?? ""} ${item.bundle.article.text ?? ""} ${(item.bundle.comments ?? []).map((comment) => comment.content ?? "").join(" ")}`)
    .join(" ");

  const archetypes = normalizePosteriorRows(
    SWISS_ROUTE_TEMPLATES.map((template) => {
      const prior = containsAny(query, template.priorKeywords) ? 0.45 : 0.25;
      const evidenceHits = keywordCount(joinedEvidence, template.evidenceKeywords);
      const evidenceScore = safeScore(evidenceHits / Math.max(template.evidenceKeywords.length, 4));
      const noteSupport = safeScore(
        notes.reduce((sum, item) => {
          const text = `${item.bundle.article.title ?? ""} ${item.bundle.article.text ?? ""}`;
          return sum + (containsAny(text, template.evidenceKeywords) ? item.quality?.totalScore ?? 0 : 0);
        }, 0) / Math.max(notes.length, 1),
      );
      return {
        id: template.id,
        label: template.label,
        route: template.route,
        posteriorRaw: buildPosterior(prior, [evidenceScore, noteSupport || 0.2]),
        evidenceScore: Number(evidenceScore.toFixed(4)),
        noteSupport: Number(noteSupport.toFixed(4)),
      };
    }),
  );

  const best = archetypes[0];
  return {
    ok: true,
    query,
    bestPlan: best
      ? {
          id: best.id,
          label: best.label,
          posterior: best.posterior,
          route: best.route,
          why: [
            `Posterior ${best.posterior} based on query prior and note-evidence support`,
            `Evidence keyword score ${best.evidenceScore}`,
            `Average trusted-note support ${best.noteSupport}`,
          ],
        }
      : null,
    plans: archetypes,
    rankedNotes,
  };
}
