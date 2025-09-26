// This is my map to the how to collection see platfrom.js for better documentation of these mapper files


export function mapHowToFields(productionItem = {}, sourceItem, targetId = null, publishedDate = null) {
  return {
    ...productionItem,
    _id: targetId || sourceItem.linkedBlogId,
    title: sourceItem.title,
    author: sourceItem.author,
    mainCategory: sourceItem.mainCategory,
    timeToRead: parseInt(sourceItem.timeToRead, 10) || 0,
    coverImage: sourceItem.coverImage,
    featuredImage: sourceItem.featuredImage,
    excerpt: sourceItem.excerpt,
    meta: sourceItem.meta,
    lede: sourceItem.lede,
    bodyUpper: sourceItem.body,
    postContentLower: sourceItem.postContentLower,
    catSlug: sourceItem.catSlug,
    slug: sourceItem.slug,
    ogImage: sourceItem.ogImage,
    furtherReadingBlock: sourceItem.furtherReadingBlock,
    publishedDate: publishedDate ? new Date(publishedDate) : sourceItem.publishDate
  };
}
