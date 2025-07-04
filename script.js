if (!window.localStorage.getItem("access_token")) {
  document.addEventListener("DOMContentLoaded", async () => {
    const generateRandomString = (length) => {
      const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      const values = crypto.getRandomValues(new Uint8Array(length));
      return values.reduce((acc, x) => acc + possible[x % possible.length], "");
    };

    const codeVerifier = generateRandomString(64);

    const sha256 = (plain) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(plain);
      return window.crypto.subtle.digest("SHA-256", data);
    };

    const base64encode = (input) => {
      return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
    };

    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    localStorage.setItem("code_verifier", codeVerifier);

    const url = new URL("https://accounts.spotify.com/authorize");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      show_dialog: true,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      scope: [
        "user-follow-read",
        "user-top-read",
        "user-read-recently-played",
        "user-library-read",
      ].join(" "),
    });

    url.search = params.toString();

    const loginLink = document.getElementById("login-link");

    if (loginLink) {
      loginLink.href = url.toString();
    }
  });
} else {
  document.addEventListener("DOMContentLoaded", () => {
    const loginLink = document.getElementById("login-link");

    loginLink.href = "./results";
  });
}
