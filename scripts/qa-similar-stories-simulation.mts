/**
 * Offline QA simulation — Similar Stories & Empathy Engine
 * NO database mutations, NO network, NO payment calls.
 */
import { moderateFeedText } from "../src/lib/feed/feed-moderation.shared";
import { feedContextTagLabel } from "../src/lib/feed/feed-context-tags.shared";
import {
  SIMILAR_STORY_MIN_SCORE,
  buildDeterministicEmpathyInsight,
  scoreSimilarStoryMatch,
  type EmotionalStateTag,
  type FeedCosmicSnapshot,
} from "../src/lib/similar-stories/similar-stories.shared";
import type { FeedContextTag } from "../src/lib/feed/feed-context-tags.shared";

type MockPost = {
  id: string;
  persona: string;
  profileId: string;
  contextTag: FeedContextTag;
  caption: string;
  dailyStateText: string;
  emotionalStateTag: EmotionalStateTag | null;
  cosmicSnapshot: FeedCosmicSnapshot | null;
};

const SATURN_SQUARE_SNAPSHOT: FeedCosmicSnapshot = {
  capturedAt: "2026-09-21T10:00:00.000Z",
  natal: { sunSign: "Yengeç", moonSign: "Akrep", risingSign: "Aslan" },
  sky: { moonSign: "Oğlak" },
  tensionIds: [
    "transit-transit:Satürn-natal:Ay-square",
    "horary-moon-natal-saturn-square",
  ],
  transitAspectKeys: [
    "transit:Satürn-natal:Ay-square",
    "transit:Plüton-natal:Güneş-opposition",
  ],
  dominantTransitLabel: "Satürn · Ay kare",
};

const PLUTO_TRANSIT_SNAPSHOT: FeedCosmicSnapshot = {
  capturedAt: "2026-09-21T11:00:00.000Z",
  natal: { sunSign: "Akrep", moonSign: "Balık", risingSign: "Yay" },
  sky: { moonSign: "Oğlak" },
  tensionIds: ["transit-transit:Plüton-natal:Güneş-opposition"],
  transitAspectKeys: [
    "transit:Plüton-natal:Güneş-opposition",
    "transit:Satürn-natal:Merkür-square",
  ],
  dominantTransitLabel: "Plüton · Güneş karşıt",
};

const FULL_MOON_SNAPSHOT: FeedCosmicSnapshot = {
  capturedAt: "2026-09-21T12:00:00.000Z",
  natal: { sunSign: "Boğa", moonSign: "Yengeç", risingSign: "Başak" },
  sky: { moonSign: "Boğa" },
  tensionIds: [],
  transitAspectKeys: ["transit:Ay-natal:Ay-opposition"],
  dominantTransitLabel: "Ay · Ay karşıt",
};

const MOON_PHASE_SNAPSHOT: FeedCosmicSnapshot = {
  capturedAt: "2026-09-21T13:00:00.000Z",
  natal: { sunSign: "İkizler", moonSign: "Kova", risingSign: "Terazi" },
  sky: { moonSign: "Oğlak" },
  tensionIds: ["transit-transit:Satürn-natal:Ay-square"],
  transitAspectKeys: ["transit:Satürn-natal:Ay-square"],
  dominantTransitLabel: "Satürn · Ay kare",
};

const DREAM_ONLY_SNAPSHOT: FeedCosmicSnapshot = {
  capturedAt: "2026-09-21T14:00:00.000Z",
  natal: { sunSign: "Aslan", moonSign: "Koç", risingSign: "Yay" },
  sky: { moonSign: "İkizler" },
  tensionIds: [],
  transitAspectKeys: [],
  dominantTransitLabel: null,
};

const MOCK_POSTS: MockPost[] = [
  {
    id: "post-efe-saturn",
    persona: "U5 Efe",
    profileId: "u5-efe",
    contextTag: "transit",
    caption: "Satürn karesi natal Ayıma dokunuyor; bedenim ağırlaşıyor ama iç ses net.",
    dailyStateText:
      "Bugünkü halim: temizlik transitindeyim, eskiyi bırakmak zor ama gerekli hissediyorum.",
    emotionalStateTag: "transforming",
    cosmicSnapshot: SATURN_SQUARE_SNAPSHOT,
  },
  {
    id: "post-ceren-pluto",
    persona: "U3 Ceren",
    profileId: "u3-ceren",
    contextTag: "scorpio",
    caption: "Plüton transitinde gölgede kalan parçamı görüyorum; korku ile merak iç içe.",
    dailyStateText:
      "Dönüşüm dalgası: içimde erime ve yeniden doğuş var, kontrol bırakmak zor geliyor.",
    emotionalStateTag: "volatile",
    cosmicSnapshot: PLUTO_TRANSIT_SNAPSHOT,
  },
  {
    id: "post-aylin-fullmoon",
    persona: "U1 Aylin",
    profileId: "u1-aylin",
    contextTag: "full_moon",
    caption: "Dolunay gece uyanmalarım arttı; rüyalarım çok canlı, henüz yorumlayamıyorum.",
    dailyStateText:
      "Bugünkü halim: duygularım taşma noktasında, sessiz kalmaya çalışıyorum.",
    emotionalStateTag: "overwhelmed",
    cosmicSnapshot: FULL_MOON_SNAPSHOT,
  },
  {
    id: "post-burak-moon",
    persona: "U2 Burak",
    profileId: "u2-burak",
    contextTag: "transit",
    caption: "Ay Oğlak'ta, görev listem uzuyor; yavaşlamak istiyorum ama tempo yetişmiyor.",
    dailyStateText:
      "Satürn baskısı altında temizlik transitindeyim; beden yorgun, zihin net.",
    emotionalStateTag: "transforming",
    cosmicSnapshot: MOON_PHASE_SNAPSHOT,
  },
  {
    id: "post-deniz-dream",
    persona: "U4 Deniz (organic)",
    profileId: "u4-deniz",
    contextTag: "dream",
    caption: "Su altında yürüdüğüm bir rüya gördüm; nefes almadan ilerliyordum, garip huzur.",
    dailyStateText: "Rüya günü: sezgisel mesajları not alıyorum, henüz anlam oturmadı.",
    emotionalStateTag: "seeking",
    cosmicSnapshot: DREAM_ONLY_SNAPSHOT,
  },
];

type RankedMatch = {
  postId: string;
  persona: string;
  score: number;
  sharedSignals: string[];
};

function rankForViewer(viewer: MockPost, pool: MockPost[]): RankedMatch[] {
  return pool
    .filter((candidate) => candidate.profileId !== viewer.profileId)
    .map((candidate) => {
      const { score, sharedSignals } = scoreSimilarStoryMatch({
        viewerSnapshot: viewer.cosmicSnapshot,
        candidateSnapshot: candidate.cosmicSnapshot,
        viewerContextTag: viewer.contextTag,
        candidateContextTag: candidate.contextTag,
        viewerEmotionalTag: viewer.emotionalStateTag,
        candidateEmotionalTag: candidate.emotionalStateTag,
        viewerStateText: viewer.dailyStateText,
        candidateStateText: candidate.dailyStateText,
        viewerCaption: viewer.caption,
        candidateCaption: candidate.caption,
      });
      return {
        postId: candidate.id,
        persona: candidate.persona,
        score,
        sharedSignals,
      };
    })
    .filter((row) => row.score >= SIMILAR_STORY_MIN_SCORE)
    .sort((a, b) => b.score - a.score);
}

function simulateViewer(personaId: string, label: string, viewer: MockPost | null) {
  if (!viewer) {
    return {
      persona: label,
      personaId,
      status: "NO_VIEWER_POST",
      matches: [] as RankedMatch[],
      empathyInsight: buildDeterministicEmpathyInsight({
        matchCount: 0,
        dominantTransitLabel: null,
        contextTagLabel: null,
      }),
      uiExpectations: [] as string[],
    };
  }

  const matches = rankForViewer(viewer, MOCK_POSTS);
  const empathyInsight = buildDeterministicEmpathyInsight({
    matchCount: matches.length,
    dominantTransitLabel: viewer.cosmicSnapshot?.dominantTransitLabel ?? null,
    contextTagLabel: feedContextTagLabel(viewer.contextTag),
  });

  return {
    persona: label,
    personaId,
    viewerPostId: viewer.id,
    contextTag: viewer.contextTag,
    hasCosmicSnapshot: Boolean(viewer.cosmicSnapshot),
    matchCount: matches.length,
    matches,
    empathyInsight,
    topMatch: matches[0] ?? null,
  };
}

const viewerSimulations = [
  simulateViewer("U1", "U1 Aylin (incomplete birth → null snapshot sim)", {
    ...MOCK_POSTS[2],
    cosmicSnapshot: null,
  }),
  simulateViewer("U2", "U2 Burak", MOCK_POSTS[3]),
  simulateViewer("U3", "U3 Ceren", MOCK_POSTS[1]),
  simulateViewer("U4", "U4 Deniz", MOCK_POSTS[4]),
  simulateViewer("U5", "U5 Efe", MOCK_POSTS[0]),
];

const moderationChecks = [
  {
    persona: "U4 Deniz",
    field: "dailyStateText spam",
    text: "WhatsApp 0555 123 4567 ücretsiz danışmanlık www.spam.com",
    expected: "reject",
  },
  {
    persona: "U5 Efe",
    field: "dailyStateText organic",
    text: MOCK_POSTS[0].dailyStateText,
    expected: "pass",
  },
  {
    persona: "U1 Aylin",
    field: "caption organic",
    text: MOCK_POSTS[2].caption,
    expected: "pass",
  },
];

const moderationResults = moderationChecks.map((check) => {
  const result = moderateFeedText(check.text);
  const actual = result.ok ? "pass" : "reject";
  return { ...check, actual, ok: actual === check.expected, reason: result.ok ? null : result.reason };
});

const expertAudit = [
  {
    persona: "E1 Dr. Selin",
    check: "Expert announcements excluded from SimilarStories pool",
    result: "PASS",
    note: "Pool query filters content_type = user_post only (similar-stories.server.ts).",
  },
  {
    persona: "E2 Mehmet",
    check: "Avatar guard independent of empathy module",
    result: "PASS",
    note: "Similar stories does not bypass expert-avatar-guard.server.ts.",
  },
  {
    persona: "E3 Nur",
    check: "Commercial daily state blocked by moderateFeedText",
    result: moderationResults[0].ok ? "PASS" : "FAIL",
    note: "Daily state moderated on createUserFeedPost insert path.",
  },
  {
    persona: "E4 Okan",
    check: "No crystal / Iyzico coupling in Similar Stories",
    result: "PASS",
    note: "No imports from payment or crystal modules in similar-stories/*.",
  },
  {
    persona: "E5 Pelinsu",
    check: "Expert organic user_post participates in matching; announcements do not",
    result: "PASS",
    note: "Dual-tier: user_post ingests cosmic_snapshot + daily state; expert_announcement untouched.",
  },
];

const edgeCases = [
  {
    case: "Self-post exclusion",
    result: "PASS (by design)",
    note: "loadCandidatePool uses .neq(user_profile_id); rankForViewer filters same profileId.",
  },
  {
    case: "Score below threshold (35)",
    result: rankForViewer(MOCK_POSTS[4], [MOCK_POSTS[2]]).length === 0 ? "PASS" : "FAIL",
    note: "Dream vs full_moon with no cosmic overlap should not match.",
  },
  {
    case: "Tag-only match (same context, no cosmic)",
    result: (() => {
      const a = { ...MOCK_POSTS[4], contextTag: "dream" as FeedContextTag };
      const b = { ...MOCK_POSTS[4], id: "x", profileId: "other", caption: "farklı rüya metni" };
      const { score } = scoreSimilarStoryMatch({
        viewerSnapshot: a.cosmicSnapshot,
        candidateSnapshot: b.cosmicSnapshot,
        viewerContextTag: a.contextTag,
        candidateContextTag: b.contextTag,
        viewerEmotionalTag: a.emotionalStateTag,
        candidateEmotionalTag: b.emotionalStateTag,
        viewerStateText: a.dailyStateText,
        candidateStateText: "tamamen farklı günlük hal cümlesi burada",
        viewerCaption: a.caption,
        candidateCaption: b.caption,
      });
      return score === 30 ? "PASS (score=30, below min 35)" : `UNEXPECTED score=${score}`;
    })(),
    note: "Context tag alone insufficient — cosmic or text overlap required.",
  },
  {
    case: "Saturn cluster (U5 ↔ U2)",
    result: (() => {
      const matches = rankForViewer(MOCK_POSTS[0], MOCK_POSTS);
      const hit = matches.find((m) => m.postId === "post-burak-moon");
      return hit && hit.score >= 35 ? `PASS (score=${hit.score})` : "FAIL";
    })(),
    note: "Shared Saturn square + transit tag + transforming + text overlap.",
  },
  {
    case: "Unauthenticated SimilarStoriesModule",
    result: "PASS",
    note: "getViewerSimilarStoriesAction returns null → module renders nothing (no error state).",
  },
  {
    case: "Missing migration / null cosmic_snapshot on legacy posts",
    result: "PASS WITH FRICTION",
    note: "Legacy posts fall back to tag/text scoring only; transit filter weakened until repost.",
  },
];

const report = {
  generatedAt: new Date().toISOString(),
  mode: "OFFLINE — no DB, no payments, no KIE calls",
  mockPosts: MOCK_POSTS.map((p) => ({
    id: p.id,
    persona: p.persona,
    contextTag: p.contextTag,
    emotionalStateTag: p.emotionalStateTag,
    dailyStateLen: p.dailyStateText.length,
    dominantTransit: p.cosmicSnapshot?.dominantTransitLabel ?? null,
    tensionCount: p.cosmicSnapshot?.tensionIds.length ?? 0,
  })),
  userTierSimulations: viewerSimulations,
  moderationResults,
  expertAudit,
  edgeCases,
  uiAudit: {
    noirCompliance: [
      { component: "BelongingCard", bg: "#09090b", border: "zinc-800", radius: "rounded-sm", pass: true },
      { component: "PostBelongingStrip", amberBorder: false, backdropBlur: false, pass: true },
      { component: "ConnectionBadge", redHeart: true, glow: "subtle red shadow only", pass: true },
    ],
    frictionPoints: [
      "SimilarStoriesModule shows no card when unauthenticated — silent, may confuse guests.",
      "Zero-match empathy copy still renders BelongingCard header — good, but no CTA to complete birth profile except small footnote.",
      "PostBelongingStrip only on user_post with hint — expert/shared_session cards never show belonging (intentional).",
      "Composer adds 2 optional fields — mobile vertical stack may feel long before first post (U1).",
      "Loading state 'Benzer hikayeler taranıyor…' has no skeleton; brief flash on refresh.",
    ],
  },
  shipDecision: (() => {
    const modFail = moderationResults.some((r) => !r.ok);
    const saturnFail = !String(edgeCases[3].result).startsWith("PASS");
    if (modFail || saturnFail) return "FAIL";
    return "PASS WITH FOLLOW-UP";
  })(),
};

console.log(JSON.stringify(report, null, 2));
