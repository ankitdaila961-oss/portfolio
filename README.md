# Portfolio Website & Backend

This project contains a modern portfolio website with a simulated backend for demonstration, and a real Node.js backend server design.

## Features

-   **Premium Aesthetics**: Glassmorphism design, smooth animations, and responsive layout.
-   **Interactive Elements**: Typing effect, scroll reveal, and functional contact form simulation.
-   **Backend Design**: A `server.js` file included to demonstrate how a real backend would handle form submissions.

## How to Run

### 1. Portfolio (Frontend)
Simply open `index.html` in your web browser. The contact form is set up to simulate a succesful submission visually (it waits 2 seconds and shows a success message).

### 2. Backend Server (Optional)
If you want to run the actual backend server:
1.  Open a terminal in this folder.
2.  Run `npm install` to install dependencies (express, cors, body-parser).
3.  Run `node server.js`.
4.  The server will start on `http://localhost:3000`.

*Note: To connect the frontend to this real backend, you would need to uncomment the fetch code in `script.js` (currently set to simulation mode).*
