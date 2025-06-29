const clientId = "d6f964f061de4aaea35aaa1b5abd1e9d";
const redirectUri = "https://kkrishguptaa.github.io/tastebuds/auth";

const errHandler = (error) => {
  document.getElementById("loading").style.display = "none";
  document.getElementById("error").style.display = "block";

  const errText = document.getElementById("error-text");

  errText.innerText = error;
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    let code = urlParams.get("code");

    const codeVerifier = localStorage.getItem("code_verifier");

    const params = new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    const url = new URL("https://accounts.spotify.com/api/token");

    const payload = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    };

    const body = await fetch(url, payload);
    const response = await body.json();

    if (!body.ok) {
      throw new Error(
        `HTTP ${body.status}: ${response.error_description || response.error}`
      );
    }

    localStorage.setItem("access_token", response.access_token);

    document.getElementById("loading").style.display = "none";
    document.getElementById("success").style.display = "block";
  } catch (error) {
    errHandler(error.message || "An unexpected error occurred.");
  }
});
