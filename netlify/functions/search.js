exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "https://b-676boy.github.io",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: "Method not allowed."
      })
    };
  }

  try {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      throw new Error("Tavily key is not configured.");
    }

    const body = JSON.parse(event.body || "{}");
    const query = String(body.query || "").trim();

    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Please provide a search query."
        })
      };
    }

    if (query.length > 500) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Search query is too long."
        })
      };
    }

    const response = await fetch(
      "https://api.tavily.com/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: query,
          topic: "general",
          search_depth: "basic",
          max_results: 5,
          include_answer: true
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "The web search service could not complete the search."
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        answer: data.answer || "",
        results: (data.results || []).map(item => ({
          title: item.title,
          url: item.url,
          content: item.content,
          score: item.score
        }))
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "Search failed."
      })
    };
  }
};
