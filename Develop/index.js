const fs = require("fs");
const axios = require("axios");
const inquirer = require("inquirer");
const puppeteer = require("puppeteer");
const genHTML = require("./generateHTML");


function init() {
    startPDFGenerator();
}

//Step 1:  takes in required information for GH Username and Color for PDF Rendering
async function startPDFGenerator () {

    let username = await inquirer.prompt({
        
        message: "Please put in the Github username you want to render a profile for:  ",
        name: "name"

    });
    
    let color = await inquirer.prompt({
        
        name: "color",
        message: "Using the cursor keys select the color you want to render the profile in:  ",
        type: "list",
        choices: ['green', 'pink', 'blue', 'red']
        
    });

//Step 2:  Connect to GH to query the specific username and the number of stars (handled later)


    let name = username.name;
    const queryUrl = `https://api.github.com/users/${name}`
    const repoStars = `https://api.github.com/users/${name}/starred`
    let GHFeed = await GHData(queryUrl, repoStars);

    GHFeed.color = validateColor(color.color);

    const html = genHTML.generateHTML(GHFeed);
    const filename = GHFeed.name;

    generatePDF(filename, html);
}

//Step 3:  Matching and mapping the GH results with objects listed per generateHTML.js

async function GHData (queryUrl, repoStars) {
    let feed = {};
    let data = await axios.get(queryUrl);
    let GHProfileData = await axios.get(repoStars); // call to get the stars 

    let GHStars = [];
    for (repo of GHProfileData.data) {
        GHStars.push(repo.GHStars_count);
    }

    feed.img = data.data.avatar_url;
    feed.name = data.data.name;
    feed.company = data.data.company;
    feed.location = data.data.location;
    feed.gitHubLink = data.data.html_url;
    feed.blogLink = data.data.blog;
    feed.bio = data.data.bio;
    feed.repNum = data.data.public_repos;
    feed.followerNum = data.data.followers;
    feed.followingNum = data.data.following;

// try and catch statement that knows how to handle the situation that the github user has no stars, and takes that situation to set the stars to 0
    
    try {
        feed.starsNum = GHStars.reduce((accum, current) => accum + current); 
    }
    catch (error) {
        feed.starsNum = 0;
    }
    
    return feed;
}

// function ties in the color list to the color list in provided generateHTML.js file
function validateColor(color) {

    if (genHTML.colors.hasOwnProperty(color)) {
        return color;
    }
    else {
        console.log("This color is not preset, choosing default color green");
        return 'green';
    }
}

// now we generate the PDF and send it go the results folder in the same directory
async function generatePDF(filename, html) {

    const client = await puppeteer.launch();
    const page = await client.newPage();

    await page.setContent(html);
    await page.pdf({path: `./results/${filename}.pdf`})
    await client.close()
    }


init();
