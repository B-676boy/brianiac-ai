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
  // WORLDWIDE TIME AND DATE INTELLIGENCE

  getTime: function (timezone) {

    try {

      const zone = timezone || "Africa/Accra";
      const now = new Date();

      const date = new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone: zone,
          dateStyle: "full"
        }
      ).format(now);

      const time = new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone: zone,
          timeStyle: "long"
        }
      ).format(now);

      const parts = new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone: zone,
          timeZoneName: "long"
        }
      ).formatToParts(now);

      const timezoneName = parts.find(
        p => p.type === "timeZoneName"
      )?.value || zone;

      return {
        timezone: zone,
        timezoneName: timezoneName,
        date: date,
        time: time,
        timestamp: now.toISOString()
      };

    } catch (error) {

      return {
        error: "Invalid or unsupported time zone."
      };

    }

  },

  // GET TIME IN ANOTHER LOCATION

  getCountryTime: function (timezone) {

    return this.getTime(timezone);

  },

  // CALCULATE TIME DIFFERENCE BETWEEN LOCATIONS

  getTimeDifference: function (zone1, zone2) {

    try {

      const now = new Date();

      function getOffset(zone) {

        const parts = new Intl.DateTimeFormat(
          "en-US",
          {
            timeZone: zone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23"
          }
        ).formatToParts(now);

        const values = {};

        parts.forEach(part => {
          values[part.type] = Number(part.value);
        });

        const localTime = Date.UTC(
          values.year,
          values.month - 1,
          values.day,
          values.hour,
          values.minute,
          values.second
        );

        return (localTime - now.getTime()) / 60000;

      }

      const difference =
        getOffset(zone2) - getOffset(zone1);

      return {
        firstTimezone: zone1,
        secondTimezone: zone2,
        differenceMinutes: difference,
        differenceHours: difference / 60
      };

    } catch (error) {

      return {
        error: "Could not compare these time zones."
      };

    }

  },
  // RECOGNISE COUNTRIES AND THEIR TIME ZONES

  getTimeForCountry: function (countryName, timezoneName) {

    try {

      if (!window.ct) {
        return {
          error: "Time-zone database is unavailable."
        };
      }

      const countries = Object.values(
        window.ct.getAllCountries()
      );

      const country = countries.find(
        item =>
          item.name.toLowerCase() ===
          countryName.trim().toLowerCase()
      );

      if (!country) {
        return {
          error: "I couldn't identify that country."
        };
      }

      const timezones = country.timezones || [];

      // Countries with multiple time zones

      if (timezones.length > 1 && !timezoneName) {
        return {
          country: country.name,
          multipleTimezones: true,
          availableTimezones: timezones,
          message:
            "Please specify a city or region so I can give you the correct local time."
        };
      }

      const selectedTimezone =
        timezoneName || timezones[0];

      if (!timezones.includes(selectedTimezone)) {
        return {
          error: "That time zone does not belong to this country."
        };
      }

      return {
        country: country.name,
        ...this.getTime(selectedTimezone)
      };

    } catch (error) {

      return {
        error: "Unable to retrieve the country's time."
      };

    }

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
