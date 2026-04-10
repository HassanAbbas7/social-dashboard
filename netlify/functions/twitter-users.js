export async function handler(event, context) {
  try {
    const ids = event.queryStringParameters.userIds;

    const res = await fetch(
      `https://api.twitterapi.io/twitter/user/batch_info_by_ids?userIds=${ids}`,
      {
        headers: {
          "X-API-Key": process.env.TWITTER_API,
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