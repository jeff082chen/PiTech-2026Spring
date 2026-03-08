Developer Handoff Document: Family Policing Simulator

1. Project Overview

Project Name: From Child Welfare to Family Policing (Interactive Simulator)
Partner Organization: The Bronx Defenders
Objective: To transform complex, fragmented research regarding the "Family Policing" system into an accessible, interactive "choose-your-own-adventure" web application. The goal is to educate the public and policymakers on how the current system disproportionately targets marginalized communities and often confuses poverty with neglect.

2. Tech Stack & Architecture

Framework: React (Functional Components & Hooks)

Styling: Tailwind CSS (Utility-first CSS framework for rapid UI development)

Icons: lucide-react (SVG icons)

Architecture Type: Single Page Application (SPA) - No routing library (like react-router) is currently used to keep the MVP lightweight.

3. State Management (React useState)

The entire application flow is controlled by three primary state variables located in the App component:

currentView (String): Toggles between 'landing' (the initial data dashboard) and 'flow' (the interactive story).

currentNodeId (String): Tracks the user's current position within the decision tree. It maps directly to keys in the STORY_NODES object. Initializes at 'start'.

showFactModal (Boolean): Controls the visibility of the "System Reality" pop-up modal.

4. Core Data Structure: STORY_NODES

The application logic is Data-Driven. The decision tree is not hardcoded into the React JSX; instead, it reads from a constant JSON object named STORY_NODES.

This is the most critical part for content expansion. To add or edit the story, you only need to modify this object.

Node Schema:

[node_id_string]: {
  id: 'node_id_string', // Must match the key
  title: 'String', // Headline displayed in the UI
  description: 'String', // The narrative context
  icon: <IconComponent />, // Lucide React icon element
  fact: { // (OPTIONAL) The "Model B" qualitative data popup
    title: 'String', 
    content: 'String'
  },
  choices: [ // Array of possible paths
    { 
      text: 'String', // Button text
      nextNodeId: 'target_node_id' // Must match an existing node ID
    }
  ]
}


5. UI/UX Layout & View Transitions

View A: The Landing Page (currentView === 'landing')

Purpose: To break the user's preconceived notions using hard data before they enter the simulation.

Layout:

Hero Section: High-impact typography stating the project premise.

Data Cards Grid: A 3-column grid displaying key statistics (e.g., 23% population vs. 41% court cases, >95% neglect vs. abuse).

Call to Action (CTA): The "Enter the System" button.

Transition: Clicking the CTA fires startExperience(), changing currentView to 'flow' and ensuring currentNodeId is 'start'.

View B: The Interactive Flow (currentView === 'flow')

Purpose: The core "choose-your-own-adventure" engine.

Layout:

Header: Contains the app title and a "Back to Home" button (resets app state).

Main Card (Top half): Displays the current node's icon, title, and description.

"System Reality" Trigger: If the current node object contains a fact property, a pulsing button appears in the top right of the card. Clicking it sets showFactModal to true.

Choices Container (Bottom half): Maps through the node.choices array, rendering buttons.

Transition: Clicking a choice button triggers handleChoice(nextNodeId), which updates currentNodeId, sets showFactModal to false (in case it was open), and scrolls the window to the top.

View C: The Fact Modal (Conditional Overlay)

Purpose: To inject qualitative research (Model B) directly into the user's journey without cluttering the main narrative.

Layout: A fixed, full-screen semi-transparent backdrop (backdrop-blur) centering a white card with the fact.title and fact.content.

UX Features: Can be closed by clicking the "X", clicking the "Understood" button, or clicking the backdrop overlay.

6. Future Expansion & Roadmap

For the next phase of development, consider the following enhancements:

Extract Data Source: Move the STORY_NODES object into a separate JSON file or a CMS (Content Management System) like Sanity or Contentful. This allows non-developers (researchers, designers) to update the narrative without touching the codebase.

State Management Library: If the app grows to include user tracking (e.g., "how many users chose path A vs path B"), consider implementing Redux or Zustand, or utilizing React Context.

Analytics Integration: Add Google Analytics or Mixpanel event tracking to the handleChoice function to gather data on where users tend to drop off or which paths they take most frequently.

Advanced Animations: Integrate framer-motion for smoother page transitions, card sliding effects, and micro-interactions to make the storytelling more immersive.

Expand the Foster Care Node: Based on the original flowchart, the "Foster Care" end-state can be expanded into its own sub-tree (Kinship vs. Residential vs. Specialized). You can simply add these new nodes to STORY_NODES and link them up.