const axios = require("axios");

async function fetchDirectoryContents(url, accessToken) {
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
}

async function fetchAndDisplayPomXml(repositoryName, accessToken, username, directoryPath = "") {
  const directoryUrl = `https://api.github.com/repos/${username}/${repositoryName}/contents/${directoryPath}`;
  const directoryContents = await fetchDirectoryContents(directoryUrl, accessToken);

  for (const item of directoryContents) {
    if (item.type === "dir") {
      await fetchAndDisplayPomXml(repositoryName, accessToken, username, `${directoryPath}${item.path}`);
    } else if (item.type === "file" && item.name.toLowerCase() === "pom.xml") {
      await displayPomXml(repositoryName, accessToken, item, directoryPath);
    }
  }
}

async function displayPomXml(repositoryName, accessToken, pomXmlFile, directoryPath) {
  try {
    const pomXmlResponse = await axios.get(pomXmlFile.url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (pomXmlResponse.status === 200) {
      const decodedContent = atob(pomXmlResponse.data.content);
      const dependencies = extractDependencies(decodedContent);

      const dependenciesContainer = document.getElementById("dependenciesContainer");
      const dependenciesElement = document.createElement("div");
      dependenciesElement.innerHTML = `<h3>Dependencies for ${repositoryName}/${directoryPath}/${pomXmlFile.name}</h3><p>${dependencies.join("<br>")}</p>`;
      dependenciesContainer.appendChild(dependenciesElement);
    } else {
      console.error("Failed to fetch pom.xml content:", pomXmlResponse.statusText);
    }
  } catch (error) {
    console.error("Error fetching pom.xml files:", error.message);
    const dependenciesContainer = document.getElementById("dependenciesContainer");
    const dependenciesElement = document.createElement("div");
    dependenciesElement.innerHTML = `<h2>No pom.xml in this repo</h2>`;
    dependenciesContainer.appendChild(dependenciesElement);
  }
}

function extractDependencies(xmlContent) {
  const includedTags = ["groupId", "artifactId", "packaging", "version"];
  const tags = xmlContent.match(/<\/?[a-zA-Z]+[^>]*>/g) || [];
  const filteredTags = tags.filter(tag => {
    const tagNameMatch = tag.match(/<\/?([a-zA-Z]+)/);
    const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : null;
    return includedTags.includes(tagName);
  });
  return filteredTags.map(tag => tag.replace(/<\/?[a-zA-Z]+>/g, "").replace(/\s+/g, "<br>"));
}

async function fetchAndDisplayDependencies(repositoryName, accessToken, username, directoryPath = "") {
  try {
    await fetchAndDisplayPomXml(repositoryName, accessToken, username, directoryPath);
  } catch (error) {
    console.error("Error fetching and displaying dependencies:", error.message);
  }
}

// Example usage:
fetchAndDisplayDependencies("myRepo", "myAccessToken", "myUsername");
