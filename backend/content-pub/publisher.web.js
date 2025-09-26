import wixData from 'wix-data';
import { webMethod, Permissions } from 'wix-web-module';
import { contentTypeConfigs } from './contentTypeConfigs';

/**
 * This is the main publishing function responsible for pushing content from the staging
 * collection to the live (production) collection.
 *
 * It handles:
 * - Insert (new publish)
 * - Update (republish)
 * - Writing back URL and metadata to staging
 * - Syncing lightweight content for fast front-end rendering
 */
export const publishOrUpdateContent = webMethod(Permissions.Admin, async (stagingItemId, contentTypeId) => {
    try {
        const config = contentTypeConfigs[contentTypeId];
        if (!config) {
            throw new Error(`No config found for content type ID: ${contentTypeId}`);
        }

        const sourceItem = await wixData.get(config.stagingCollection, stagingItemId);
        if (!sourceItem) {
            throw new Error(`Staging item ${stagingItemId} not found in ${config.stagingCollection}`);
        }

        let action = '';

        // === UPDATE EXISTING LIVE ITEM ===
        if (sourceItem[config.linkedIdField]) {
            let productionItem = await wixData.get(config.productionCollection, sourceItem[config.linkedIdField]);
            productionItem = config.mapper(productionItem, sourceItem);

            await wixData.update(config.productionCollection, productionItem, { suppressAuth: true });

            // Custom logic for "Platform Tools Tech"
            if (
                config.name === "Platform Tools Tech" &&
                Array.isArray(sourceItem.impactAreasAi)
            ) {
                await updateImpactAreasForPlatform(stagingItemId, sourceItem.impactAreasAi);
            }

            await setFrontEndUrlOnStaging(config, stagingItemId, sourceItem[config.linkedIdField]);
            await syncLiteContent(sourceItem);

            action = 'updated';

        } else {
            // === INSERT NEW ITEM INTO LIVE COLLECTION ===
            const publishedDate = new Date();
            const newItem = config.mapper({}, sourceItem, sourceItem._id, publishedDate);

            const inserted = await wixData.insert(config.productionCollection, newItem, { suppressAuth: true });

            await wixData.update(config.stagingCollection, {
                ...sourceItem,
                _id: stagingItemId,
                isLive: true,
                [config.linkedIdField]: inserted._id,
                publishDate: publishedDate
            });

            if (
                config.name === "Platform Tools Tech" &&
                Array.isArray(sourceItem.impactAreasAi)
            ) {
                await updateImpactAreasForPlatform(stagingItemId, sourceItem.impactAreasAi);
            }

            await setFrontEndUrlOnStaging(config, stagingItemId, inserted._id);

            // Re-fetch updated staging item with frontEndUrl set
            const newSourceItem = await wixData.get(config.stagingCollection, stagingItemId);
            await syncLiteContent(newSourceItem);

            action = 'inserted';
        }

        return `${config.name} content successfully ${action} from staging item ${stagingItemId}.`;

    } catch (err) {
        console.error('Content publish error:', err);
        throw new Error(`Failed to publish or update content: ${err.message}`);
    }
});


// =================================================================================
// INTERNAL HELPER FUNCTIONS
// =================================================================================

/**
 * Generates and injects an HTML block of impact areas for "Platform Tools Tech".
 * This function can be adapted for other content types as needed.
 */
async function updateImpactAreasForPlatform(itemId, impactAreasArray) {
    if (!Array.isArray(impactAreasArray) || impactAreasArray.length === 0) {
        console.log("No impact areas to update.");
        return;
    }

    try {
        const results = await wixData.query('impactArea')
            .hasSome('_id', impactAreasArray)
            .find();

        const names = results.items.map(item => item.title);
        const existingItem = await wixData.get('ToolsOrTechnology', itemId);

        const htmlBlock = `<ul>\n${names.map(name => `<li>${name}</li>`).join('\n')}\n</ul>`;
        existingItem.impactAreaBlock = htmlBlock;

        await wixData.update('ToolsOrTechnology', existingItem, { suppressAuth: true });
        console.log("Injected impact area HTML block into:", itemId);

    } catch (err) {
        console.error("Error generating impact area block:", err);
    }
}


/**
 * Writes the front-end URL and publish metadata back to the staging item.
 * This supports preview links and admin visibility.
 */
async function setFrontEndUrlOnStaging(config, stagingItemId, productionItemId) {
    try {
        const liveItem = await wixData.get(config.productionCollection, productionItemId);
        const sourceItem = await wixData.get(config.stagingCollection, stagingItemId);

        const url = liveItem[config.urlFieldKey];
        if (!url) {
            console.warn(`URL field "${config.urlFieldKey}" not found on live item.`);
            return;
        }

        const frontEndUrl = `https://www.digitisingevents.com${url}`;

        await wixData.update(config.stagingCollection, {
            ...sourceItem,
            _id: stagingItemId,
            lastPushLive: new Date(),
            linkedBlogId: liveItem._id,
            frontEndUrl
        });

        console.log(`Front-end URL written back to staging item ${stagingItemId}: ${frontEndUrl}`);
    } catch (err) {
        console.error(`Failed to write front-end URL to staging:`, err);
    }
}


/**
 * Syncs a lightweight version of the content to the `liteContentList` collection.
 * This collection powers fast-loading cards, homepages, and lists.
 */
async function syncLiteContent(sourceItem) {
    if (!sourceItem || !sourceItem._id) {
        console.warn("syncLiteContent: Invalid source item");
        return;
    }

    // === Get readable main category label ===
    if (sourceItem.mainCategory) {
        const mainCategoryId = typeof sourceItem.mainCategory === "string"
            ? sourceItem.mainCategory
            : sourceItem.mainCategory._id;

        try {
            const refCat = await wixData.get("Import957", mainCategoryId);
            if (refCat?.label) {
                sourceItem.mainCategoryLabel = refCat.label;
            }
        } catch (err) {
            console.warn(`Error fetching mainCategory: ${mainCategoryId}`, err);
        }
    }

    // === Get readable content type label ===
    if (sourceItem.contentType) {
        const contentTypeId = typeof sourceItem.contentType === "string"
            ? sourceItem.contentType
            : sourceItem.contentType._id;

        try {
            const refContentType = await wixData.get("ContentType", contentTypeId);
            if (refContentType?.label) {
                sourceItem.contentTypeLabel = refContentType.label;
            }
        } catch (err) {
            console.warn(`Error fetching contentType: ${contentTypeId}`, err);
        }
    }

    // === Strip domain from frontEndUrl for relative use ===
    if (sourceItem.frontEndUrl) {
        sourceItem.liveRelUrl = sourceItem.frontEndUrl.replace('https://www.digitisingevents.com', '');
    }

    // === Build and save the lite content item ===
    const liteItem = {
        _id: sourceItem._id,
        title: sourceItem.title,
        excerpt: sourceItem.excerpt,
        mainCategoryLabel: sourceItem.mainCategoryLabel,
        mainCategoryId: typeof sourceItem.mainCategory === "string"
            ? sourceItem.mainCategory
            : sourceItem.mainCategory?._id || null,
        catSlug: sourceItem.catSlug,
        contentTypeLabel: sourceItem.contentTypeLabel,
        contentTypeId: typeof sourceItem.contentType === "string"
            ? sourceItem.contentType
            : sourceItem.contentType?._id || null,
        featured: sourceItem.featured || false,
        liveRelUrl: sourceItem.liveRelUrl,
        featuredImage: sourceItem.featuredImage || null
    };

    try {
        await wixData.save("liteContentList", liteItem, { suppressAuth: true });
        console.log(`Lite content synced: ${liteItem._id}`);
    } catch (err) {
        console.error("Error syncing to liteContent:", err);
    }
}
