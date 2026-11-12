/* =================================
   BRIANIAC AI - NEW FEATURES
   Time, Date, Tavily and Identity
================================= */

window.BRIANIAC_FEATURES = {

  // CREATOR IDENTITY
  creators: [
    "Brian Amankona",
    "Boafo Addison"
  ],

  identity: `
You are BRIANIAC AI.

You are a friendly, intelligent, respectful
and helpful digital assistant.

You were created by Brian Amankona
and Boafo Addison.

Your creators are Brian Amankona
and Boafo Addison.

Do not volunteer details about your
coding platform, underlying AI model,
APIs, hosting provider or internal
implementation.

Do not invent technical information
or falsely deny it if directly asked.

Focus on helping the user.
`,

  // TIME AND DATE INTELLIGENCE
  getTime: function (timezone) {
    try {
      const zone = timezone || "Africa/Accra";

      const now = new Date();

      return {
        timezone: zone,

        date: new Intl.DateTimeFormat(
          "en-GB",
          {
            timeZone: zone,
            dateStyle: "full"
          }
        ).format(now),

        time: new Intl.DateTimeFormat(
          "en-GB",
          {
            timeZone: zone,
            timeStyle: "long"
          }
        ).format(now),

        timestamp: now.toISOString()
      };

    } catch (error) {
      return {
        error: "I couldn't find that time zone."
      };
    }
  },

  // TIME IN DIFFERENT COUNTRIES
  getCountryTime: function (timezone) {
    return this.getTime(timezone);
  }

};
  getCountryTime: function (timezone) {
    return this.getTime(timezone);
  },

  // TAVILY INTERNET SEARCH
  searchWeb: async function (query) {

    try {

      const response = await fetch(
        "https://verdant-elf-b87d9e.netlify.app/.netlify/functions/search",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            query: query
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Internet search failed."
        );
      }

      return data;

    } catch (error) {

      console.error("BRIANIAC Search:", error);

      return {
        error: error.message || "Search is unavailable."
      };

    }

  }

};
