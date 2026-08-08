/**
 * Shared YouTube Data API v3 lookup, extracted from nativeAiService's
 * getYouTubeRecommendations() so both the chatbot and the yoga-prescription
 * flow (auto-fetching an asana video when the doctor didn't supply one) can
 * reuse the same fetch + graceful-fallback behavior.
 */
const axios = require('axios');

/**
 * Fetch real videos for a pre-built search query. Falls back to a plain
 * YouTube search-results link when no API key is configured or the call
 * fails/returns nothing — never throws, always returns a usable result.
 *
 * @param {string} searchQuery - the exact query to send to YouTube
 * @param {string} [topicSummary] - human-readable topic for fallback copy (defaults to searchQuery)
 */
async function fetchYouTubeVideos(searchQuery, topicSummary) {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    const summary = topicSummary || searchQuery;
    console.log('[YouTube] Query:', searchQuery, '| API Key present:', !!YOUTUBE_API_KEY);

    if (YOUTUBE_API_KEY) {
        try {
            const ytResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    part: 'snippet',
                    q: searchQuery,
                    type: 'video',
                    order: 'viewCount',
                    maxResults: 3,
                    relevanceLanguage: 'en',
                    key: YOUTUBE_API_KEY
                }
            });

            const items = ytResponse.data?.items || [];
            if (items.length > 0) {
                const videos = items.map(item => ({
                    title: item.snippet.title,
                    description: item.snippet.description?.slice(0, 120) || '',
                    channel: item.snippet.channelTitle,
                    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
                    link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                    type: 'real'
                }));
                console.log('[YouTube] SUCCESS — Found', videos.length, 'real videos');
                return { videos, topicSummary: summary, searchQuery };
            }
        } catch (ytError) {
            console.error('YouTube API Error:', ytError.response?.data?.error?.message || ytError.message);
        }
    }

    console.log('[YouTube] API key missing or failed, using search URL fallback');
    return {
        videos: [
            {
                title: `Top videos for ${summary}`,
                description: `Watch the best-rated videos about ${summary}`,
                link: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}&sp=CAMSAhAB`,
                type: 'search',
                channel: 'YouTube Search'
            }
        ],
        topicSummary: summary,
        searchQuery
    };
}

module.exports = { fetchYouTubeVideos };
