# The Theta Tau - Theta Gamma Website

## Table of Contents

- [Team Behind This Project](#team-behind-this-project)
- [Progress Report](#progress-report)
    - [Features Accomplished](#features-accomplished)
    - [Major Tasks - To Be Done](#major-tasks-to-be-done)
    - [Minor Tasks - To Be Done](#minor-tasks-to-be-done)
    - [Known Issues/Bugs](#known-issues/bugs)
- [Domain Information](#domain-information)
- [Development Setup](#development-setup)
- [Contribution Guidelines](#contribution-guidelines)

Welcome to the new THT Website, reconstructed with Next.js, Supabase, and Tailwind CSS!

## Team Behind This Project

The THT Web Committee:

1. Kate McGraw
3. George Gilfond
4. Owen Willoughby
5. Sikananya Kuntanarumitkul
6. Tomi Bruno
7. Pear Seraypheap
10. Esben Sorensen
11. Shaun Gupte
   

Previous Developers:
1. Hariharan Chidambaram
2. Ethan Schenk
3. Luke Weaver
4. Isaac Diemer

## Progress Report

### Features Accomplished

- [x] Member Directory
- [x] Pledge Tracking
- [x] Sign On/Sign Out
- [x] Study Buddies
- [x] Protect Routes
- [x] Family Tree
- [x] Rush Page Revamp
### Major Tasks - To Be Done

- [ ] Action Required Bulletin Board
- [X] Complete Front-End Interaction (Admin feature that can initiate pledges, change roles if Regent, ...)
- [x] Class Archive
- [ ] Google Calendar Integration for Custom Event Tiles on Brother Dashboard

### Minor Tasks - To Be Done
- [x] Fix Formatting on Profile Tile When Majors Are Long
- [x] Update Majors on Member Directory Page
- [x] Update Pledge Requirement Due Date

### Known Issues/Bugs

- [ ] Pledge logic for NavBar is incorrect on profile page

## Domain Information

1. The website is currently deployed at https://thetatau-umich.org/
2. The website is deployed via Netlify and linked to the GitHub repository. Any changes merged into the `main` branch will automatically trigger a deployment.

## Development Setup

Follow these steps to set up the development environment:

1. Ensure Node.js (updated to the current version) is installed by checking `node -v`.
2. Check if npm (updated to the current version) is installed by checking `npm -v`.
3. Clone the repository onto the local machine: `git clone [url]`.
4. Navigate into the directory (`cd [directory_name]`) and install all dependencies via `npm install`.
5. Request an invitation to the Supabase Project from Hari/Kate.
6. Get the `.env` file (containing API keys) from Hari/Kate and place in the root directory. NOTE: This file is NOT on Github.
7. Launch the website locally using `npm run dev`. Verify setup by visiting http://localhost:3000/.

## Contribution Guidelines

Use the following process for making changes:

1. Check the current branch using `git branch`.
2. Keep branch up-to-date with `git pull`.
3. To implement changes, create a new branch using `git checkout -b [FEATURE_NAME]`.
4. Once changes are made:
    - Stage files with `git add [changed_files]`.
    - Create commit with `git commit -m "meaningful commit message"`.
    - Push changes to the remote repository with `git push --set-upstream origin [FEATURE_NAME]`.
5. If a branch is ready to be merged, open a Pull Request on Github.
6. Notify Kate for the merge approval.
7. Post-merge, the feature branch may be deleted. Repeat the process and generate a new branch for the next set of changes.

NOTE: Any changes merged to the main branch will be automatically built, cloned onto Hari's personal repo (via Github Actions), and deployed.

## Tech Stack Overview
- **Next.js** is a React framework that enables server-side rendering and static site generation, making it ideal for building highly optimized and performant web applications. If you aren't familiar with React, React is a library for web and native interfaces that allows you to build user interfaces out of individual pieces called components, which can be community components or custom components. Next.js simplifies development by offering built-in routing, which means that any file in the pages directory will automatically become a page on the website. For example, if you make a committees.js page in the pages directory, this will automatically be accessible at thetatau-umich.org/committees. It also allows us to use both typescript and javascript, which you will notice we use a mix of throughout our code base.
- **Tailwind CSS** is a utility-first CSS framework that allows developers to style their web applications directly in their HTML using predefined classes. It provides a highly customizable and efficient way to build responsive and consistent designs without writing custom CSS, making it popular for rapid development and maintaining design consistency across projects. Honestly it makes it so much easier to style the website and I think once you guys get used to it, you'll find it super useful. Just checkout any of the code, and look at where it says `className=''`. Any tailwind styling within this will be applied.
- **Supabase** is an open-source backend-as-a-service (BaaS) that provides real-time databases, authentication, and storage services, similar to Firebase but with a focus on using PostgreSQL as its core database. You can checkout examples of how we interact with Supabase in our code in the `auth.js` file. Make sure to import `supabase.js` in any file you want to use it. Supabase.js sets up the connection, using the key that you will have stored in the `.env` file.

  ## Supabase
  ### Tables
1. **Application_Answers**: Contains rushee responses to application questions.
2. **Application_Feedback**: Stores feedback comments from brothers about rushees.
3. **Application_Questions**: Stores the applications questions that rushees have to answer when they fill out the application. 
4. **Big Little Pairings** : This table keeps track of the uniqnames of all big little pairings.  Foreign key relation: littleuserid->public.Brothers.userid and biguserid->public.Brothers.userid, which basically just means that the uniqname of the little and of the big have to be names that exist in the Brothers table. This means that the little cannot be added as their big until they have been initiated!!!!! So basically, each time a pledge class gets initiated, you have to add all of the big little pairings to this table (you can do that directly in supabase or just on the frontend if your adminRole is dev). Keeping these up to date is important because they are displayed on the fam tree. 
5. **BrotherProfiles**: This is where we used to save all brothers information. IT IS NO LONGER ACTIVE. There is info including where they are from, their email, etc. This table is not currently active within our code base, and you should use the "Brothers" table for current up to date info.
6. **Brothers**: This is where we keep up to date info about brothers. The primary key is userid, which is their uniqname, and there is info including their pronouns, their major, their classes, their old classes, and more. The 
7. **Emails**: This table keeps track of brothers' emails. It is outdated, and not used in the code base, 
8. **Pledge_Info**: Contains information about when the pledge requirements are due and how many hours and interviews they need. Designed to only ever have one row in it with the current pledge semesters requirements. 
9. **Pledge_Requirements**: This has the pd and committee sign off requirements in it
10. **Pledge_SignOffs**: This has which pledges have completed which pd and committee sign offs. 
11. **Pledges**: This is the equivalent of the brothers table, but for pledges. New pledges need to be added each semester. At the end of the semester, they need to be initiated. There is a button on the admin page to assign role numbers and initiate pledges. This will automatically remove all of their pledging data and move their profiles to the brothers table. 
12. **Resources**: This has the resources that are displayed to brothers on it.
13. **Rush Events** : This is where we store the semesters rush events so that they display on the rush page. Updating this is super important in case rushees are getting info from our website. Below is an example of what this can look like when rush is not currently taking place. 
14. **RushInfo**: Manages application start and due dates, as well as active status for the current rush. The way that this is set up right now, there should only ever be one row in it which is kind of stupid but whatever.
15. **Rushees**: Stores data of individuals currently rushing, including reactions and applicant info (name, major, etc).
 
  ### admin Roles in Supabase
If you need to access any front end admin features, set your adminRole in the Brothers table to `dev`. This should give you access to anything you may need to do. It's basically so that you can test out the features that are developed for EBoard and if they get too lazy to do them, it is up to you to complete these responsibilities, which are outlined next.

Also, the following variables are used for different adminRoles throughout the code: 
`['regent', 'vice', 'scribe', 'treasurer', 'corsec', 'parents', 'academic'] or ['dev']`

## Action Required Each Semester
### Beginning of Each Semester
- Updating pledge stuff on front end
- There is a resources page under the brothers. Any admin can update the links, but it is up to you to ensure that they get updated. May need to bother different people to update them. It should at least have the following links up to date:
	- EBoard Feedback Form
	- FFF
	- Pledge Feedback Form
	- Attendance Form
	- Reimbursement Form
	- Any other forms that eboard, etc want here
- One more link that needs to be updated: Pledge feedback form on the brothers/pledgetracking page. 
- Rush dates need to be updated by head of rush so that the application is open at the appropriate times.


### End of Each Semester (AFTER Initiation)
Update EBoard. You can do this by updating adminRoles in supabase, or on the front end, which looks as follows: 
- Initiate Pledges: Highly recommend doing this one on the front end because it will clear all of their data and properly add them to the brothers database.
- Archive Classes: All you have to do is click this button and all brother classes in the `classes` column will be moved to the `archivedclasses` column. 
- Add Big Little parings to the `BigLittlePairings`. This can't be done until AFTER the pledges are initiated (see above)



