const token = localStorage.getItem("access_token");

if (!token) {
  window.location.href = "../";
}

const errHandler = (error) => {
  const errorMessage =
    typeof error === "string"
      ? error
      : error.message || JSON.stringify(error) || "Unknown error";

  if (errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
    localStorage.removeItem("access_token");
    location.reload();
    return;
  }

  document.getElementById("loading").style.display = "none";
  document.getElementById("error").style.display = "block";

  const errText = document.getElementById("error-text");
  errText.innerText = errorMessage;
};

document.addEventListener("DOMContentLoaded", async () => {
  const lastGenerated = localStorage.getItem("last_generated");
  const now = new Date().getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  let shouldFetchData = true;
  let timeRemaining = 0;

  if (lastGenerated) {
    const timeDifference = now - parseInt(lastGenerated);
    if (timeDifference < twentyFourHours) {
      shouldFetchData = false;
      timeRemaining = twentyFourHours - timeDifference;
    }
  }

  if (shouldFetchData) {
    const fetchSpotifyData = async (endpoint, limit = 50) => {
      const url = new URL(`https://api.spotify.com/v1/me/${endpoint}`);
      url.searchParams.set("limit", limit);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          location.reload();
          return;
        }
        throw new Error(`Spotify API error: ${response.status}`);
      }

      return response.json();
    };

    const formatTrack = (item, index, prefix) => {
      const track = item.track || item;
      return `${prefix} ${index + 1}: Track Name: "${
        track.name
      }" | Artist(s): [${track.artists
        .map((artist) => `"${artist.name}"`)
        .join(", ")}] | Album: "${track.album.name}" | Popularity Score: ${
        track.popularity
      }/100`;
    };

    const formatArtist = (item, index, prefix) => {
      return `${prefix} ${index + 1}: Artist Name: "${
        item.name
      }" | Genres: [${item.genres.join(", ")}] | Popularity Score: ${
        item.popularity
      }/100`;
    };

    const callAI = async (messages) => {
      const response = await fetch("https://ai.hackclub.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content
          .split("</think>")
          .pop()
          .trim();
      }
      return null;
    };

    try {
      const [topArtistsRes, topTracksRes, savedTracksRes, recentlyPlayedRes] =
        await Promise.all([
          fetchSpotifyData("top/artists?time_range=long_term", 8),
          fetchSpotifyData("top/tracks?time_range=short_term", 10),
          fetchSpotifyData("tracks", 15),
          fetchSpotifyData("player/recently-played", 50),
        ]);

      const selectedMusicData = [
        ...recentlyPlayedRes.items.map((item, index) =>
          formatTrack(item, index, "RECENTLY PLAYED")
        ),
        ...topTracksRes.items.map((item, index) =>
          formatTrack(item, index, "TOP TRACK")
        ),
        ...savedTracksRes.items.map((item, index) =>
          formatTrack(item, index, "SAVED TRACK")
        ),
        ...topArtistsRes.items.map((item, index) =>
          formatArtist(item, index, "TOP ARTIST")
        ),
      ];

      const vibePrompt = `Analyze this Spotify data and generate a witty one-liner about this user's music vibe with a rating out of 10. Focus heavily on RECENTLY PLAYED tracks:

${selectedMusicData.join("\n")}

Generate a clever couple of words that captures their musical essence (MAX 4 WORDS), and include a rating (X/10) at the end.

Examples:
- Depressed, need heart break therapy core 💔
- Barbie fell in golden glitter core ✨
- I love sad songs that make me cry 😢
- Married to Mozart 🎼

Format: {vibe} | ({X/10})

Don't give nothing more than what is asked, no extra text, no explanations, just the vibe and rating in the format above. Add an emoji that fits the vibe at the end. Vibe should be a short, catchy phrase that reflects their musical taste, and the rating should be a number from 1 to 10. The vibe should be unique and not generic, capturing the essence of their music preferences. The vibe should be related to pop culture, memes, or current trends, and should resonate with the user's personality and musical habits. Avoid using overly complex or technical terms, keep it simple and relatable. The vibe should be something that could be used as a catchy phrase or slogan for their music taste.
`;

      let musicVibe =
        "Your music taste is as mysterious as a hidden track. - Rating: 7/10";
      let musicWhy =
        "The data suggests you have eclectic preferences that defy easy categorization.";

      const vibeResult = await callAI([{ role: "user", content: vibePrompt }]);
      if (vibeResult) {
        musicVibe = vibeResult;

        const whyResult = await callAI([
          { role: "user", content: vibePrompt },
          { role: "assistant", content: musicVibe },
          {
            role: "user",
            content:
              "Now explain WHY this vibe and rating fit them. Analyze their data patterns, musical behaviors, and justify the rating score. Give a 1 sentence explanation.",
          },
        ]);

        if (whyResult) musicWhy = whyResult;
      }

      localStorage.setItem("music_vibe", musicVibe);
      localStorage.setItem("music_why", musicWhy);
      localStorage.setItem("last_generated", now.toString());

      const vibeElement = document.getElementById("music-vibe");
      const whyElement = document.getElementById("music-why");

      if (vibeElement) vibeElement.textContent = musicVibe;
      if (whyElement) whyElement.textContent = musicWhy;

      document.getElementById("loading").style.display = "none";
      document.getElementById("success").style.display = "block";

      const regenerateBtn = document.getElementById("regenerate-vibe");

      if (regenerateBtn) {
        regenerateBtn.style.display = "inline-block";
        regenerateBtn.disabled = true;
        regenerateBtn.textContent = "🔄 Available in 24h";
        regenerateBtn.style.opacity = "0.5";
        regenerateBtn.style.cursor = "not-allowed";
      }
    } catch (error) {
      errHandler(error);
    }
  } else {
    const savedVibe = localStorage.getItem("music_vibe");
    const savedWhy = localStorage.getItem("music_why");

    if (savedVibe || savedWhy) {
      document.getElementById("loading").style.display = "none";
      document.getElementById("success").style.display = "block";

      const vibeElement = document.getElementById("music-vibe");
      const whyElement = document.getElementById("music-why");

      if (vibeElement && savedVibe) vibeElement.textContent = savedVibe;
      if (whyElement && savedWhy) whyElement.textContent = savedWhy;

      const regenerateBtn = document.getElementById("regenerate-vibe");

      const formatTime = (ms) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
      };

      if (regenerateBtn && timeRemaining > 0) {
        regenerateBtn.style.display = "inline-block";
        regenerateBtn.disabled = true;
        regenerateBtn.textContent = `🔄 Available in ${formatTime(
          timeRemaining
        )}`;
        regenerateBtn.style.opacity = "0.5";
        regenerateBtn.style.cursor = "not-allowed";

        const updateCountdown = () => {
          const currentTime = new Date().getTime();
          const remaining =
            twentyFourHours - (currentTime - parseInt(lastGenerated));

          if (remaining <= 0) {
            regenerateBtn.disabled = false;
            regenerateBtn.textContent = "🔄 Regenerate Analysis";
            regenerateBtn.style.opacity = "1";
            regenerateBtn.style.cursor = "pointer";
            regenerateBtn.addEventListener("click", () => {
              localStorage.removeItem("last_generated");
              location.reload();
            });
          } else {
            regenerateBtn.textContent = `🔄 Available in ${formatTime(
              remaining
            )}`;
            setTimeout(updateCountdown, 60000);
          }
        };

        setTimeout(updateCountdown, 60000);
      }
    }
  }
});
