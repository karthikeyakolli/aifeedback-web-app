import type { Post, Product } from '../types';

/**
 * Extracts a structured Product profile from a community post/review.
 */
export function extractProductFromPost(post: Post): Product {
  // Extract Name and Tagline from title (e.g. "ReflectTask: Keyboard-first daily task planner...")
  let name = post.title;
  let tagline = post.title;

  if (post.title.includes(':')) {
    const parts = post.title.split(':');
    name = parts[0].trim();
    tagline = parts.slice(1).join(':').trim();
  } else if (post.title.includes(' - ')) {
    const parts = post.title.split(' - ');
    name = parts[0].trim();
    tagline = parts.slice(1).join(' - ').trim();
  }

  // Extract feature bullet points from description
  const featureMatches = post.description.match(/^[ \t]*[-*•]\s+(.+)$/gm);
  const features = featureMatches
    ? featureMatches.map((m) => m.replace(/^[ \t]*[-*•]\s+/, '').trim()).slice(0, 5)
    : [];

  return {
    id: post.id,
    name,
    tagline,
    description: post.description,
    category: post.category,
    productUrl: post.productUrl,
    author: post.author,
    discussionCount: 1,
    totalReviews: post.commentsCount,
    upvotesCount: post.upvotesCount,
    tags: post.tags || [],
    features,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

/**
 * Extracts distinct products from a list of community posts.
 */
export function extractProductsFromPosts(posts: Post[]): Product[] {
  const productMap = new Map<string, Product>();

  for (const post of posts) {
    // Posts with productUrl or postType === 'product_review' or idea_critique
    const prod = extractProductFromPost(post);
    const key = prod.name.toLowerCase();

    if (productMap.has(key)) {
      const existing = productMap.get(key)!;
      existing.discussionCount += 1;
      existing.totalReviews += post.commentsCount;
      existing.upvotesCount += post.upvotesCount;
    } else {
      productMap.set(key, prod);
    }
  }

  return Array.from(productMap.values());
}

