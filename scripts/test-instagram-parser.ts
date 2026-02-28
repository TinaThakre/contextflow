// Test script to parse Instagram data and display extracted media URLs

import * as fs from 'fs';
import * as path from 'path';
import { parseInstagramData } from '../src/lib/instagram-parser';

const jsonPath = path.join(process.cwd(), 'vedika_insta_copy.json');
const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const posts = parseInstagramData(rawData);

console.log(`\n📊 Parsed ${posts.length} Instagram posts\n`);

posts.forEach((post, index) => {
  console.log(`\n--- Post ${index + 1} ---`);
  console.log(`ID: ${post.id}`);
  console.log(`Code: ${post.code}`);
  console.log(`Type: ${post.mediaType}`);
  console.log(`Caption: ${post.caption.substring(0, 100)}...`);
  console.log(`Hashtags: ${post.hashtags.join(', ')}`);
  console.log(`Likes: ${post.likeCount} | Comments: ${post.commentCount}`);
  console.log(`Media URL: ${post.mediaUrl.substring(0, 80)}...`);
  
  if (post.carouselMedia && post.carouselMedia.length > 0) {
    console.log(`Carousel Items: ${post.carouselMedia.length}`);
    post.carouselMedia.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.type}: ${item.url.substring(0, 60)}...`);
    });
  }
});

// Save parsed data to a clean JSON file
const outputPath = path.join(process.cwd(), 'parsed_instagram_data.json');
fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2));
console.log(`\n✅ Saved parsed data to: ${outputPath}\n`);
