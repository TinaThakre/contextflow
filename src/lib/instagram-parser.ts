/**
 * Instagram Data Parser
 *
 * Transforms raw RapidAPI scrape responses (vedika_insta.json format)
 * into a clean, normalized structure for the Voice DNA pipeline.
 *
 * Handles three media types: image, video (reels/clips), carousel.
 * Preserves all media URLs for backup/reference.
 */

// ─── Public Types ────────────────────────────────────────────────

export interface ParsedInstagramPost {
  id: string;
  code: string;
  /** Canonical post URL, e.g. https://www.instagram.com/p/{code}/ */
  postUrl: string;
  caption: string;
  hashtags: string[];
  timestamp: number;
  mediaType: 'video' | 'image' | 'carousel';
  mediaUrl: string;
  carouselMedia?: CarouselItem[];
  likeCount: number;
  commentCount: number;
}

export interface CarouselItem {
  type: 'video' | 'image';
  url: string;
}

// ─── Main Parser ─────────────────────────────────────────────────

/**
 * Parse a raw RapidAPI Instagram response into normalized posts.
 *
 * Accepted shapes:
 *   { result: { edges: [{ node }] } }   ← standard scraper format
 *   { data: { edges: [{ node }] } }     ← alternate wrapper
 *   [{ node }]                          ← bare edge array
 */
export function parseInstagramData(rawData: unknown): ParsedInstagramPost[] {
  const edges = extractEdges(rawData);
  if (edges.length === 0) return [];

  const posts: ParsedInstagramPost[] = [];

  for (const edge of edges) {
    const node = edge?.node ?? edge; // support both { node: {...} } and flat
    if (!node) continue;

    const mediaType = resolveMediaType(node.media_type, node.product_type);
    const mediaUrl = resolveMediaUrl(node, mediaType);

    // Accept posts even without media — captions still carry voice signal
    const code: string = node.code ?? '';
    const post: ParsedInstagramPost = {
      id: String(node.pk ?? node.id ?? ''),
      code,
      postUrl: code ? `https://www.instagram.com/p/${code}/` : '',
      caption: node.caption?.text ?? '',
      hashtags: extractHashtags(node.caption?.text ?? ''),
      timestamp: node.taken_at ?? 0,
      mediaType,
      mediaUrl,
      likeCount: node.like_count ?? 0,
      commentCount: node.comment_count ?? 0,
    };

    if (mediaType === 'carousel') {
      post.carouselMedia = parseCarouselMedia(node.carousel_media);
    }

    posts.push(post);
  }

  return posts;
}

// ─── Edge Extraction ────────────────────────────────────────────

function extractEdges(raw: unknown): any[] {
  if (!raw || typeof raw !== 'object') return [];
  const obj = raw as Record<string, any>;

  // { result: { edges: [...] } }
  if (Array.isArray(obj.result?.edges)) return obj.result.edges;
  // { data: { edges: [...] } }
  if (Array.isArray(obj.data?.edges)) return obj.data.edges;
  // { edges: [...] }
  if (Array.isArray(obj.edges)) return obj.edges;
  // bare array of nodes / edges
  if (Array.isArray(raw)) return raw;

  return [];
}

// ─── Media Type Resolution ──────────────────────────────────────

function resolveMediaType(
  mediaType?: number,
  productType?: string,
): 'video' | 'image' | 'carousel' {
  if (productType === 'carousel_container' || mediaType === 8) return 'carousel';
  if (productType === 'clips' || mediaType === 2) return 'video';
  return 'image';
}

// ─── Media URL Extraction ───────────────────────────────────────

function resolveMediaUrl(node: any, mediaType: string): string {
  switch (mediaType) {
    case 'video':
      return extractBestVideoUrl(node.video_versions);
    case 'carousel':
      // Use cover image for the carousel
      return extractBestImageUrl(node.image_versions2?.candidates);
    default:
      return extractBestImageUrl(node.image_versions2?.candidates);
  }
}

function extractBestVideoUrl(videoVersions: any[] | undefined | null): string {
  if (!videoVersions || videoVersions.length === 0) return '';

  // Prefer 720p (width 720, height 1280)
  const v720 = videoVersions.find(
    (v: any) => v.width === 720 && v.height === 1280,
  );
  if (v720?.url) return v720.url;

  // Fallback: first available
  return videoVersions[0]?.url ?? '';
}

function extractBestImageUrl(candidates: any[] | undefined | null): string {
  if (!candidates || candidates.length === 0) return '';

  // Prefer 1080-wide (portrait 1080×1440 or square 1080×1080)
  const img1080 = candidates.find(
    (c: any) => c.width === 1080 && (c.height === 1440 || c.height === 1080),
  );
  if (img1080?.url) return img1080.url;

  // Fallback: highest resolution
  const sorted = [...candidates].sort(
    (a, b) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0),
  );
  return sorted[0]?.url ?? '';
}

// ─── Carousel Parsing ───────────────────────────────────────────

function parseCarouselMedia(items: any[] | undefined | null): CarouselItem[] {
  if (!items || items.length === 0) return [];

  return items
    .map((item: any) => {
      const isVideo = item.media_type === 2 || !!item.video_versions;
      return {
        type: (isVideo ? 'video' : 'image') as 'video' | 'image',
        url: isVideo
          ? extractBestVideoUrl(item.video_versions)
          : extractBestImageUrl(item.image_versions2?.candidates),
      };
    })
    .filter((item): item is CarouselItem => !!item.url);
}

// ─── Text Helpers ───────────────────────────────────────────────

/**
 * Extract hashtags from caption text.
 * Supports Latin, Devanagari (Hindi/Marathi), and common Unicode scripts.
 */
function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#[\w\u0900-\u097F]+/g);
  return matches ? matches.map((tag) => tag.toLowerCase()) : [];
}

/** Strip hashtags and filler dots/newlines from caption text. */
export function getCleanCaption(caption: string): string {
  return caption
    .replace(/#[\w\u0900-\u097F]+/g, '')  // remove hashtags
    .replace(/(\.\s*){3,}/g, ' ')          // collapse filler dots
    .replace(/\n{2,}/g, '\n')             // collapse repeated newlines
    .trim();
}
