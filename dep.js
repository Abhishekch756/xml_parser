async function fetchAndDisplayDependencies(
  repositoryName,
  accessToken,
  username,
  directoryPath = ""
) {
  try {
    // Construct the URL for fetching contents of the specified directory
    const directoryUrl = `https://api.github.com/repos/${username}/${repositoryName}/contents/${directoryPath}`;

    // Fetch the contents of the specified directory
    const directoryResponse = await axios.get(directoryUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (directoryResponse.status === 200) {
      const directoryContents = directoryResponse.data;

      // Filter files named "pom.xml"
      const pomXmlFiles = directoryContents.filter(
        (item) => item.type === "file" && item.name.toLowerCase() === "pom.xml"
      );

      if (pomXmlFiles.length > 0) {
        // Create a container for dependencies
        const dependenciesContainer = document.getElementById(
          "dependenciesContainer"
        );

        // Display or process each pom.xml file
        for (const pomXmlFile of pomXmlFiles) {
          const pomXmlUrl = pomXmlFile.html_url;
          console.log("Found pom.xml file at:", pomXmlUrl);

          // Fetch and display the contents of pom.xml
          const pomXmlResponse = await axios.get(pomXmlFile.url, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (pomXmlResponse.status === 200) {
            const pomXmlContent = pomXmlResponse.data.content;
            const decodedContent = atob(pomXmlContent);

            // Handle the XML content as needed
            console.log("Contents of pom.xml:", decodedContent);

            // Create a new element for dependencies
            const dependenciesElement = document.createElement("div");

            // Define the tags to keep
            const includedTags = [
              "groupId",
              "artifactId",
              "packaging",
              "version",
            ];

            // Filter out all tags except the included ones
            const filteredContent = decodedContent.replace(
              /<\/?[a-zA-Z]+[^>]*>/g,
              (match) => {
                const tagNameMatch = match.match(/<\/?([a-zA-Z]+)/);
                const tagName = tagNameMatch
                  ? tagNameMatch[1].toLowerCase()
                  : null;

                // Include the tag if it's in the list of included tags, otherwise remove it
                return includedTags.includes(tagName) ? match : "";
              }
            );

            // Update the dependenciesElement
            dependenciesElement.innerHTML = `<h3>Dependencies for ${repositoryName}/${directoryPath}/${pomXmlFile.name}</h3><p>${filteredContent
              .replace(/<\/?[a-zA-Z]+>/g, " ")
              .replace(/\s+/g, "<br>")}</p>`;

            // Append the dependencies element to the container
            dependenciesContainer.appendChild(dependenciesElement);
          } else {
            console.error(
              "Failed to fetch pom.xml content:",
              pomXmlResponse.statusText
            );
          }
        }
      } else {
        // Log a message when no pom.xml files are found in the directory
        console.log(
          `No pom.xml files found in the directory: ${directoryPath}`
        );
      }

      // Recursively search in subdirectories
      for (const item of directoryContents) {
        if (item.type === "dir") {
          await fetchAndDisplayDependencies(
            repositoryName,
            accessToken,
            username,
            `${directoryPath}${item.path}`
          );
        }
      }
    } else {
      // Log an error message when unable to fetch contents of the directory
      console.error(
        `Failed to fetch contents of the directory: ${directoryPath}`,
        directoryResponse.statusText
      );
    }
  } catch (error) {
    // Log an error message
    console.error("Error fetching pom.xml files:", error.message);

    // Create a new element for message
    const dependenciesContainer = document.getElementById(
      "dependenciesContainer"
    );
    const dependenciesElement = document.createElement("div");
    dependenciesElement.innerHTML = `<h2>No pom.xml in this repo</h2>`;
    dependenciesContainer.appendChild(dependenciesElement)
  }
}