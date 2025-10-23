# KL2PEN All-In-One Career Platform

# Getting Started
1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Clone the .env.sample to .env
4. Insert your Firebase and Gemini API Token in the .env file
5. Run the app
   ```bash
   npm run dev
   ```

# Overview of Technologies Used

| Category             | Technology / Tool             | Purpose                                                                 |
|----------------------|-------------------------------|-------------------------------------------------------------------------|
| **Frontend**         | React + Next.js               | Framework for building dynamic, fast, SEO-optimized user interfaces    |
|                      | Tailwind CSS                  | Utility-first CSS framework for responsive design                      |
|                      | shadcn/ui                     | Accessible UI component library based on Radix UI                      |
|                      | Next.js Server Actions        | Secure API layer for validating requests before reaching backend       |
| **Backend & Hosting**| Firebase Authentication       | User authentication and authorization                                  |
|                      | Firebase Firestore            | NoSQL database for storing user data and job listings                  |
|                      | Firebase Cloud Storage        | Storage for uploaded files like resumes                                |
|                      | Firebase App Hosting          | Hosting platform with built-in CI/CD via GitHub                        |
| **AI Integration**   | Gemini API via Firebase GenKit| AI-powered Career Swipe, Resume Analyzer, and AI Mock Interview  |
|                      | LangChain PDF Loader          | Extracts text from PDF resumes to feed into Gemini                     |
| **DevOps**           | GitHub + Firebase AppHosting  | Version control and continuous deployment automation                   |
| **Security**         | GCP Secret Manager            | Safely stores sensitive API tokens                                     |
| **Cloud**            | Cloud Run & Cloud Run Revision| Builds and deploys cloud-based services                                |


# Implementation
KL2PEN is built using a modern and scalable tech stack:

- **Firebase**: Handles authentication (Firebase Auth), file storage (Cloud Storage), data management (Firestore), and app hosting (App Hosting).
- **Gemini via Firebase GenKit**: Provides AI-powered services like resume analysis and career suggestions through a middleware approach.
- **React + Next.js**: Powers the frontend with dynamic routing and SSR for optimal performance.
- **Tailwind CSS & shadcn/ui**: Used for clean, responsive UI with accessible and consistent design components.
- **LangChain PDF Loader**: Extracts content from resumes and sends it to Gemini for intelligent analysis.
- **Next.js Server Actions**: Adds a security and validation layer before communicating with Firebase or Gemini.


# Innovation Part

KL2PEN is designed to close key gaps in existing job search platforms by offering features that are rarely or never provided by mainstream platforms, delivering an all-in-one solution. This makes our platform uniquely innovative and inclusive.

We support users at **every step of their job-seeking journey**, from discovery to preparation to application.

## Key Innovations

- **Job Swipe Interface**  
  A mobile-friendly, intuitive Tinder-like swiping interface for discovering job opportunities—available only on KL2PEN and Kabel, and not offered by most mainstream platforms.

- **AI Resume Commentor**  
  KL2PEN provides AI-powered resume feedback to all users, offering personalized and actionable suggestions to improve their resumes.

- **AI Mock Interview**  
  A simulation feature that helps users practice interviews and receive intelligent feedback, empowering them to prepare confidently. This is a unique offering not found on other mainstream platforms.

- **Real-Time AI Chatbox**  
  An interactive assistant that delivers instant answers, personalized advice, and career guidance to support users in real-time.

- **Industry Trends Insights**  
  KL2PEN equips users with data-driven insights into hiring trends and in-demand skills, helping them make informed career decisions and stay competitive.

# Challenges Faced

## Optimization Issues
We initially used the `fetch` JavaScript function to call the Gemini API directly. However, this approach quickly became messy and hard to maintain, especially when sharing the code across team members. To resolve this, we removed the direct API calls and replaced them with Firebase GenKit, which provides a ready-made and scalable solution. This decision significantly reduced our codebase—from nearly 500 lines to under 100—and improved maintainability and readability.

## Continuous Deployment
We also encountered difficulties setting up continuous deployment. Our goal was to automatically deploy the website whenever there were new commits to the `main` branch. Manually writing and testing a GitHub Actions workflow for CI/CD was time-consuming and prone to errors. To simplify the process, we switched to **Firebase AppHosting**, which offers automatic CI/CD integration with GitHub. This allowed us to deploy the site seamlessly without manual intervention, saving development time and effort.


