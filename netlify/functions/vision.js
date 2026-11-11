exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
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
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error("OpenRouter API key is not configured.");
    }

    const { image, prompt } = JSON.parse(event.body || "{}");

    if (!image || !image.startsWith("data:image/")) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Please provide an image." })
      };
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://b-676boy.github.io/brianiac-ai/",
          "X-Title": "BRIANIAC AI"
        },
        body: JSON.stringify({
          model: "allenai/molmo-2-8b:free",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt || "Describe this image in detail."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: image
                  }
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: data.error?.message || "The vision model request failed."
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "Something went wrong."
      })
    };
  }
};
