const axios = require("axios");
const fs = require("fs");
const passport = require("passport");

exports.login = (req, res) => {
  res.send('Login with GitHub: <a href="/auth/github">Login</a>');
};

exports.githubCallback = passport.authenticate("github", { failureRedirect: "/" }),
(req, res) => {
  res.redirect("/");
};


getUserRepositories = async (accessToken) => {
  try {
    const response = await axios.get("https://api.github.com/user/repos", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const repositories = response.data.map((repo) => {
      return {
        name: repo.name,
        url: repo.html_url, // Using html_url as the repository URL
      };
    });

    const username = response.data[0].owner.login; // Assuming the user has at least one repository

    return { repositories, username };
  } catch (error) {
    throw error;
  }
};

exports.home = async (req, res) => {
  if (req.isAuthenticated()) {
    const accessToken = req.user.token;

    try {
      const { repositories, username } =
        await getUserRepositories(accessToken);

      // Read the template file
      const template = fs.readFileSync("./public/index.html", "utf8");

      // Create HTML for logged-in user with hyperlinked repository names and URLs
      const repoListHtml = repositories
        .map(
          (repo) =>
            `<li><a href="#" onclick="fetchAndDisplayDependencies('${repo.name}', '${accessToken}', '${username}')">${repo.name}</a> </li>`
        )
        .join("");

      // Replace {repoListHtml} in the template with the actual content
      const renderedHtml = template.replace("{repoListHtml}", repoListHtml);

      res.send(renderedHtml);
    } catch (error) {
      console.error(
        "Error fetching user repositories:",
        error.response ? error.response.data : error.message
      );
      res.send("Error fetching user repositories.");
    }
  } else {
    res.send('Welcome! <a href="/auth/login"> Click to Login </a>');
  }
};