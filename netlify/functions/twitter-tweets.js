export async function handler(event, context) {
  try {
    const userId = event.queryStringParameters.userId;

    const res = await fetch(
      `https://api.twitterapi.io/twitter/user/last_tweets?userId=${userId}&includeReplies=false`,
      {
        headers: {
          "X-API-Key": "new1_c5693e3a0e8545babb1ec58996f5b3cf",
        },
      }
    );

    const data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}