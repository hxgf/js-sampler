
# JS Code Samples
#### From J Youngblood with love ❤️

* I'm providing as much context as possible with descriptions and screenshots, but please get in touch if any of these samples need clarification.
* Because these code samples focus on JS, front-end samples include relevant markup, but no CSS. Styles are available upon request.

---
---

## Doorbot Video Download
### /doorbot-download

- Uses the Ring API and a library called Doorbot to download security videos from various Ring cameras
  - The Ring app only shows the last 3 months' worth of recorded videos in the app, but it's possible to access older videos...like we did when we busted our contractor stealing from us lol
- There's a little ES6 in here
- Runs locally from cli:  `node app.js`
- Kinda-hacky real-time feedback log of info as it's being processed

---
---

## OK Resale Scraper
### /okresale-scraper
- Client gave me a text list of IDs _(from a newspaper announcement)_ that I then put in a database and populated with scraped data from various public sources _(county assessor, Google geolocation, tax records, etc)_
- Database used for simple app that searches lists/filters text results, map with property markers, bookmark favorites _(not included with these samples, but available by request)_
- Quick & dirty implementation...I had a week to put the entire project together

---
---

## NRHA Profiles Demo
### /nrha-profiles-demo

- Example implementation of client's custom API service as a simple JS app in static HTML
- Makes an API request and renders Handlebars template into a div
   - Similar to how Vue can be implemented in the markup for an existing project, the client's customers _(potentially very novice developers)_ could copy/paste this code into their existing web sites
- Includes a small utility library _(js/profiles-utility.js)_ provides a couple handlebars helpers, abstraction methods for making requests to the api, map utilities, etc


---
---














## Clickbuild

- _Clickbuild_ is a custom project/content management system I've built and maintained since 2011. I started the codebases that include these samples in 2013 and **I add features _(/fix bugs, perform maintenance tasks)_ to this project on a weekly basis**

- Core Frameworks:
  - Node.js - 0.10.36
  - Express.js - 4.12
  - Ember.js - 1.8.1
  - jQuery - 2.1

- Because of its age, framework limitations, _(and for consistency's sake,)_ new code is written with "classic" JavaScript syntax and structures

- I've written A TON of abstraction functions for these codebases _(especially the back end API)_. Some are included with the samples, but please let me know if you're interested in seeing more of them

- Majority of UX/functionality designed by client, a homebuilder & former software developer
  - Specifically suited to client's needs, allowing him to run his business with as little administrative overhead as possible



### /clickbuild-project-marketing
- Mostly a CRUD-like data form, but with extra functionality
- New in 2019: drag & drop photo gallery manager _(upload, change order, edit captions, etc)_
- Also manages images that we use to make a printable marketing flyer
- Also also generates copy/paste code for client to use in various settings, such as:
  - HTML-formatted Craigslist ads
  - Web site description _(embedding photos & column formatting)_



### /clickbuild-project-progress
- Visually tracks progress of each phase of home construction
- "Currently/completed on day x of x", etc
- Shows if deadlines have been hit/missed
- Link to discussion/scheduling for every task
  - Staff can mark task as finished _(and trigger task completion routines/notifications)_
- Client-modifiable master templates for all phases and tasks, plus the ability to create one-off tasks as needed



### /clickbuild-discussion
- It's a ticketing system discussion screen
- People can leave comments, attach files, select recipients, etc
- Special functionality for staff to manage ticketing/scheduling functionality, added over the years as requested by client.
- Updated recently: Back end components include email & SMS notifications! Anyone can respond _(and attach files)_ via email
- Lots of little functionality in the background _(passive/active confirmation of message receipt, task completion, logging)_



### /clickbuild-closing-webcal
- Nothing too fancy going on here, just shuffling some data
- All scheduled closings compiled into ICS-formatted iCalendar for the client and his staff/trades to subscribe to
- I think a web calendar is a cool idea _(and perfect application)_ for data like this and it's not something I see too often...pretty cool


### /clickbuild-purchase-agreement
- Programmatically generates a PDF with data from a web form _(and other system data)_
- PDF is a legal document that can be updated as needed
- Client generates this and sends to his clients to sign digitally




---
---

## Ocean Mgmt Profiles
### /ocean-mgmt-profile

- Admin dashboard component that manages information for real estate developments
  - Client is a real estate developer with growing portfolio of properties
  - Web sites for each development get their data from these profiles and other data in the system
- The JS part: photo uploads _(suported by jQuery and Dropzone)_
- The majority of JS I've been writing for client projects is done along the same lines:
  - implementing business logic the quickest and easiest way possible
  - stitching together libraries and writing as little new code as possible

---
---

## Stereo Docs
### /docs-stereo
- This is pretty much a "hello world" from a Docusaurus React app, but I've modified their components a little _(mostly simplifying for my use case)_
- It's the _(work-in-progress)_ component for the home screen...hardly worth including, but I want to demonstrate that I'm familiar and comfortable working with React apps

---
---

