// Import mapping functions for each content type.
// These transform the staging item into a format suitable for the live collection.
// note Import703 colection name is legacy issue as I imported the content from the blog app.
// Tip when you export your blog collection create your new collection first
// So you can control the colletion name then import your current content into
// Your Staging / produciton collection first and push to the target colletcion
// If you have a lot of content you can do this usign make.com or n8n and this function: https://youtu.be/PZvbsIbrmV0


import { mapArticleFields } from './article';
import { mapHowToFields } from './howTo';
import { mapPlatformFields } from './platform';

/**
 * Configuration map for each content type.
 * Each key is a unique contentTypeId used to route logic in the publishing system.
 */
export const contentTypeConfigs = {
  // === Article Configuration ===
  '6351213f-8fd6-4a00-9f90-e7c40b6e3236': {
    name: 'Article',                                 // Human-readable name (used in logs/messages)
    stagingCollection: 'blogStaging',                // Collection used for drafting/editing content
    productionCollection: 'Import703',               // Final live collection used on the front end
    linkedIdField: 'linkedBlogId',                   // Field in staging collection that stores the linked live item ID
    urlFieldKey: 'link-betterblog-title',            // Field used to store the front-end URL (used for routing/navigation)
    mapper: mapArticleFields                         // Function that maps staging fields to live format
  },

  // === How-To Configuration ===
  '5cd80feb-c4b9-463a-893e-1e4f0030864f': {
    name: 'How To',
    stagingCollection: 'blogStaging',
    productionCollection: 'HowTos',
    linkedIdField: 'linkedBlogId',
    urlFieldKey: 'link-how-tos-title',
    mapper: mapHowToFields
  },

  // === Platform Tools & Tech Configuration ===
  'fbe8ff20-1f74-4da7-ad7e-fb0da7051d5b': {
    name: 'Platform Tools Tech',
    stagingCollection: 'blogStaging',
    productionCollection: 'ToolsOrTechnology',
    linkedIdField: 'linkedBlogId',
    urlFieldKey: 'link-platforms-tools-tech-title',
    mapper: mapPlatformFields
  }
};
