// Instagram Data Parser - Extract relevant media URLs for Voice DNA analysis

export interface ParsedInstagramPost {
  id: string;
  code: string;
  caption: string;
  hashtags: string[];
  timestamp: number;
  mediaType: 'video' | 'image' | 'carousel';
  mediaUrl: string; // 720p for videos, 1080p for images
  carouselMedia?: {
    type: 'video' | 'image';
    url: string;
  }[];
  likeCount: number;
  commentCount: number;
}

export function parseInstagramData(rawData: any): ParsedInstagramPost[] {
  const posts: ParsedInstagramPost[] = [];
  
  if (!rawData?.result?.edges) {
    return posts;
  }

  for (const edge of rawData.result.edges) {
    const node = edge.node;
    
    if (!node) continue;

    const post: ParsedInstagramPost = {
      id: node.pk || node.id,
      code: node.code,
      caption: node.caption?.text || '',
      hashtags: extractHashtags(node.caption?.text || ''),
      timestamp: node.taken_at,
      mediaType: getMediaType(node.media_type, node.product_type),
      mediaUrl: '',
      likeCount: node.like_count || 0,
      commentCount: node.comment_count || 0,
    };

    // Extract media URL based on type
    if (post.mediaType === 'video') {
      post.mediaUrl = extract720pVideoUrl(node.video_versions);
    } else if (post.mediaType === 'image') {
      post.mediaUrl = extract1080pImageUrl(node.image_versions2?.candidates);
    } else if (post.mediaType === 'carousel') {
      // Handle carousel posts
      post.mediaUrl = extract1080pImageUrl(node.image_versions2?.candidates) || '';
      post.carouselMedia = parseCarouselMedia(node.carousel_media);
    }

    if (post.mediaUrl || post.carouselMedia) {
      posts.push(post);
    }
  }

  return posts;
}

function getMediaType(mediaType: number, productType?: string): 'video' | 'image' | 'carousel' {
  if (productType === 'carousel_container' || mediaType === 8) {
    return 'carousel';
  }
  if (productType === 'clips' || mediaType === 2) {
    return 'video';
  }
  return 'image';
}

function extract720pVideoUrl(videoVersions: any[]): string {
  if (!videoVersions || videoVersions.length === 0) {
    return '';
  }

  // Find 720p video (width: 720, height: 1280)
  const video720p = videoVersions.find(
    (v) => v.width === 720 && v.height === 1280
  );

  if (video720p) {
    return video720p.url;
  }

  // Fallback to first video if 720p not found
  return videoVersions[0]?.url || '';
}

function extract1080pImageUrl(candidates: any[]): string {
  if (!candidates || candidates.length === 0) {
    return '';
  }

  // Find 1080p image (width: 1080, height: 1440 for portrait)
  // or (width: 1080, height: 1080 for square)
  const image1080p = candidates.find(
    (c) => c.width === 1080 && (c.height === 1440 || c.height === 1080)
  );

  if (image1080p) {
    return image1080p.url;
  }

  // Fallback to highest resolution available
  const sorted = [...candidates].sort((a, b) => (b.width * b.height) - (a.width * a.height));
  return sorted[0]?.url || '';
}

function parseCarouselMedia(carouselMedia: any[]): { type: 'video' | 'image'; url: string }[] {
  if (!carouselMedia || carouselMedia.length === 0) {
    return [];
  }

  return carouselMedia.map((item) => {
    const isVideo = item.media_type === 2 || item.video_versions;
    const type: 'video' | 'image' = isVideo ? 'video' : 'image';
    
    return {
      type,
      url: isVideo
        ? extract720pVideoUrl(item.video_versions)
        : extract1080pImageUrl(item.image_versions2?.candidates),
    };
  }).filter((item) => item.url);
}

function extractHashtags(text: string): string[] {
  if (!text) return [];
  
  const hashtagRegex = /#[\w\u0900-\u097F]+/g;
  const matches = text.match(hashtagRegex);
  
  return matches ? matches.map((tag) => tag.toLowerCase()) : [];
}

// Helper function to get clean caption without hashtags
export function getCleanCaption(caption: string): string {
  return caption.replace(/#[\w\u0900-\u097F]+/g, '').trim();
}
