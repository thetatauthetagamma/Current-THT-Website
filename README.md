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
3. Lily Collins
4. Owen Willoughby
5. Luke Weaver
6. Pear Seraypheap
7. Piper Blum
8. Shu Adhya
9. Esben Sorensen
10. Isaac Diemer
   

Previous Developers:
1. Hariharan Chidambaram
2. Ethan Schenk

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
- [ ] Complete Front-End Interaction (Admin feature that can initiate pledges, change roles if Regent, ...)
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
2. Netlify has been used to link the personal Github of HariChidam to THT Organization for deployment. 

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
