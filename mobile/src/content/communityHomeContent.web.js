/**
 * Web: community defaults — text-only, no bundled images.
 */

export const COMMUNITY_HOME_CONTENT = {
  eyebrow: "Our Community",
  title: "Loved by families, shared every day",
  subtitle: "Reels, recipes, and words from families who cook with Zeevan every day.",
  instagram: {
    handle: "zeevan",
    displayHandle: "@zeevan",
    followersLabel: "18.4k followers",
    followLabel: "Follow",
    url: "https://instagram.com/zeevan",
  },
  posts: [
    {
      id: "reel-golden-pour",
      type: "reel",
      tag: "Reel",
      views: "12.3k",
      likes: "1.2k",
      author: {
        name: "zeevan",
        subtitle: "The golden pour",
        avatar: "Z",
        brand: true,
      },
    },
    {
      id: "customer-ramesh",
      type: "customer",
      tag: "Customer",
      quote: "Tastes just like my grandmother's homemade ghee.",
      likes: "340",
      author: {
        name: "Ramesh Patel",
        subtitle: "Ahmedabad",
        avatar: "R",
        brand: false,
      },
    },
    {
      id: "reel-herd",
      type: "reel",
      tag: "Reel",
      views: "8.1k",
      likes: "980",
      author: {
        name: "zeevan",
        subtitle: "Meet our herd",
        avatar: "Z",
        brand: true,
      },
    },
    {
      id: "reel-recipe",
      type: "reel",
      tag: "Recipe",
      views: "5.6k",
      likes: "742",
      author: {
        name: "zeevan",
        subtitle: "Ghee dal tadka",
        avatar: "Z",
        brand: true,
      },
    },
    {
      id: "customer-priya",
      type: "customer",
      tag: "Customer",
      quote: "Pure aroma, real Bilona ghee. We've switched for good.",
      likes: "512",
      author: {
        name: "Priya Shah",
        subtitle: "Surat",
        avatar: "P",
        brand: false,
      },
    },
  ],
};

export const COMMUNITY_POST_IMAGE_FALLBACKS = {};

export function buildCommunitySectionDefaults() {
  return {
    enabled: true,
    eyebrow: COMMUNITY_HOME_CONTENT.eyebrow,
    title: COMMUNITY_HOME_CONTENT.title,
    subtitle: COMMUNITY_HOME_CONTENT.subtitle,
    instagram: { ...COMMUNITY_HOME_CONTENT.instagram },
    posts: COMMUNITY_HOME_CONTENT.posts.map((post, order) => ({
      id: post.id,
      order,
      enabled: true,
      type: post.type,
      tag: post.tag,
      imageUrl: "",
      views: post.views || "",
      likes: post.likes || "",
      quote: post.quote || "",
      author: { ...post.author },
    })),
  };
}

export function getCommunityPostImageFallback(_postId, _index = 0) {
  return null;
}
