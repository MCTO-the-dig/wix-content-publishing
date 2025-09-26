/**
 * Maps a staging item (draft content) into the structure required for the
 * live/production collection: "ToolsOrTechnology".
 *
 * This function supports both inserting new content and updating existing items.
 * It is used by the publisher system (publisher.web.js) when publishing "Platform Tools Tech" items.
 *
 * @param {Object} productionItem - The existing live item (if updating), or empty object.
 * @param {Object} sourceItem - The item from the staging collection.
 * @param {string|null} targetId - Optional ID to assign (usually staging item's _id or linked ID).
 * @param {Date|null} publishedDate - Optional publish date to override (used for inserts).
 * @returns {Object} - A complete object ready for insert/update into the live collection.
 */

export function mapPlatformFields(productionItem = {}, sourceItem, targetId = null, publishedDate = null) {
    return {
        // Use existing live data as base, then overwrite with staging data
        ...productionItem,

        // Set ID: use provided targetId, fallback to linkedBlogId (for updates)
        _id: targetId || sourceItem.linkedBlogId,

        // Basic metadata
        title: sourceItem.title,
        author: sourceItem.author,
        mainCategory: sourceItem.mainCategory,
        timeToRead: parseInt(sourceItem.timeToRead, 10) || 0,

        // Images
        coverImage: sourceItem.coverImage,
        featuredImage: sourceItem.featuredImage,
        ogImage: sourceItem.ogImage,

        // Content fields
        excerpt: sourceItem.excerpt,
        lede: sourceItem.lede,
        bodyUpper: sourceItem.body,
        postContentLower: sourceItem.postContentLower,

        // Slugs and URLs
        slug: sourceItem.slug,
        catSlug: sourceItem.catSlug,

        // Product metadata
        tried: sourceItem.tried,
        productWebsite: sourceItem.productWebsite,
        productName: sourceItem.prodName,
        affiliateLink: sourceItem.affiliateLink,

        // Related content
        furtherReadingBlock: sourceItem.furtherReadingBlock,

        // NOTE: `impactAreasAi` is handled separately in publisher.web.js
        // impactArea: sourceItem.impactAreasAi,

        // Publishing date (used for filtering/sorting)
        publishedDate: publishedDate ? new Date(publishedDate) : sourceItem.publishDate
    };
}
