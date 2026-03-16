# Firebase Functions Setup Guide

## Step 1: Initialize Firebase (if not already done)
Run this in your project root:
```
npx firebase init functions
```
- Select "Use an existing project"
- Choose "esc1-11586"
- Use JavaScript
- Say yes to ESLint (optional)
- Install dependencies: yes

## Step 2: Set IONOS Email Configuration
After initialization, run:
```
npx firebase functions:config:set ionos.smtp_host="smtp.ionos.co.uk" ionos.smtp_port="587" ionos.smtp_user="escape@spiritsbarandgames.com" ionos.smtp_pass="BugelMerlin123!!!"
```

## Step 3: Deploy the Function
```
npx firebase deploy --only functions:sendEscapePhoto
```

## Step 4: Test It!
Fill out the admin form with a customer email and post a team - the email should send automatically!
