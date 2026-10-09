import { communityHandler, CommunityError } from '../../_lib/community.js';

// Community storage is intentionally separate from vendor-menu extraction.
// A menu lookup must use a dedicated, rate-limited provider implementation.
export default communityHandler(['POST'], async () => {
  throw new CommunityError(501, 'Live menu lookup is not enabled on this community backend. Keep using the pinned source menus or connect a dedicated menu provider.');
});
