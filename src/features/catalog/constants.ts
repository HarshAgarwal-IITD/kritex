/**
 * The storefront fetches a whole category in one request (~30 products today; the API caps `limit` at 100)
 * and pages it client-side (ProductGrid, 12 per page). Switch to server paging once a category outgrows this.
 */
export const LIST_LIMIT = 100;
