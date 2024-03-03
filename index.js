import https from 'https';
import fs from 'fs';
import express, { response } from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
import xml2js from 'xml2js';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github';
import session from 'express-session';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const options = {
    key: fs.readFileSync(path.join(__dirname,'cert','key.pem')),
    cert: fs.readFileSync(path.join(__dirname,'cert','cert.pem'))
};
https.createServer(options, app).listen(5500, () => {
    console.log('Server running on https://localhost:5500');
});
// Set up session middleware
app.use(session({
    secret: 'your_secret_key',
    resave: true,
    saveUninitialized: true
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Configure GitHub OAuth strategy
passport.use(new GitHubStrategy({
    clientID: process.env.clientID,
    clientSecret: process.env.clientSecret,
    callbackURL: 'https://localhost:5500/auth/github/callback'
}, (accessToken, refreshToken, profile, done) => {

    profile.accessToken = accessToken;
    return done(null, profile);
}));

// Serialize user into the session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

app.get('/', (req, res) => {
    res.send('Home Page');
});

// Route for initiating GitHub OAuth authentication
app.get('/auth/github', passport.authenticate('github'));

// Route for GitHub OAuth callback
app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/profile');
    }
);

app.get('/profile',async (req, res) => {
    const ans=[];
    try {
        // Retrieve access token from user session
        const accessToken = req.user.accessToken;
         const username = req.user.username;
         console.log(username);
         const repositories = await getUserRepositories(username);
        // Make request to GitHub API to fetch user's repositories
        const response = await axios.get(`https://api.github.com/users/${username}/repos`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        const selectedRepository = await selectRepository(repositories);
        const pomXmlFiles = await fetchPomXmlFiles(selectedRepository);
        // console.log(pomXmlFiles);
        ans=  await parsePomXmlFiles(selectedRepository, pomXmlFiles);
    } catch (error) {
        console.log("error1");
        console.log(error);
    }
    res.json(ans);
});

async function getUserRepositories(username) {
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos`);
        if (!response.ok) {
            throw new Error(`Failed to fetch repositories: ${response.status} - ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error retrieving repositories:', error.message);
        throw error;
    }
}

async function selectRepository(repositories) {
    repositories.forEach((repo, index) => {
        console.log(`${index + 1}. ${repo.full_name}`);
    });
    const selectedRepoIndex =  Math.floor(Math.random() * (repositories.length)); // Enter the index of the repository you want to select
    return repositories[selectedRepoIndex];
}

async function fetchPomXmlFiles(repository) {
    try {
        console.log(repository.full_name);
        const response = await fetch(`https://api.github.com/repos/${repository.full_name}/contents`);
        if (!response.ok) {
            throw new Error(`Failed to fetch pom.xml files: ${response.status} - ${response.statusText}`);
        }
        const files = await response.json();
        const pomXmlFiles = files.filter(file => file.name.toLowerCase() === 'pom.xml');
        return pomXmlFiles;
    } catch (error) {
        console.error('Error fetching pom.xml files:', error.message);
        throw error;
    }
}

async function parsePomXmlFiles(repository, pomXmlFiles) {
    if(pomXmlFiles.length==0){
        console.log("No xml files");
        return;
    }
    for (const pomXmlFile of pomXmlFiles) {
        try {
            const response = await fetch(pomXmlFile.download_url);
            const xmlContent = await response.text();
            // console.log(xmlContent);
            const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(xmlContent);
        const files=[];
        // console.log(result.project.dependencies);
        const dependencies = result.project.dependencies[0].dependency.map(dep => ({
            groupId: dep.groupId[0],
            artifactId: dep.artifactId[0],
           version : dep.version ? dep.version[0] : 'Version not specified',
        }));
            dependencies.forEach(dependency => {
                let x=dependency.groupId + ":" + dependency.vesion;
                files.push(x);
                console.log(`${dependency.groupId}:${dependency.artifactId}- Version ${dependency.version} `);
            });
        } catch (error) {
            console.error(`Error parsing ${pomXmlFile.path}:`, error.message);
        }
    }
    return files;
}




