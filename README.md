# LED Display System

A modern React TypeScript application for managing and displaying image slides on an LED display.

## Features

- **Image Slideshow**: Display a customizable slideshow of images with caption support
- **Admin Interface**: Easily manage your slides with a user-friendly interface
- **In-browser Image Creation**: Generate demo images directly in the browser without needing external files
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Theme Support**: Choose from multiple themes with DaisyUI integration
- **Type Safety**: Built with TypeScript for better development experience and fewer bugs

## Technology Stack

- React 18
- TypeScript
- TailwindCSS for styling
- DaisyUI for UI components
- React Router for navigation
- React Context API for state management
- Canvas API for image generation

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd led-display-react
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

### Home Page

The home page displays the active slides in a slideshow format. If there are no active slides, it will prompt you to create one in the admin interface.

### Admin Page

The admin page allows you to:
- Create new image slides
- Edit existing slides
- Delete slides
- Preview slides before saving
- Toggle slide activation status

### Settings Page

The settings page lets you customize:
- Application theme
- Slideshow transition speed
- Auto-play settings

## Project Structure

```
led-display-react/
├── public/
│   ├── images/      # Public image assets
│   └── index.html   # HTML template
├── src/
│   ├── components/  # Reusable UI components
│   ├── contexts/    # React Context providers
│   ├── hooks/       # Custom React hooks
│   ├── pages/       # Page components
│   ├── types/       # TypeScript type definitions
│   ├── utils/       # Utility functions
│   ├── App.tsx      # Main App component
│   └── index.tsx    # Application entry point
└── README.md        # This file
```

## Development

### Adding a New Slide Type

1. Define the new slide type in `src/types/index.ts`
2. Update the slide context to handle the new type
3. Create a renderer component for the new slide type
4. Add the UI for creating/editing the new slide type

### Adding New Features

The application is structured to make it easy to add new features:

- Add new pages by creating a component in the `pages` directory and adding a route in `App.tsx`
- Add new UI components in the `components` directory
- Add new business logic in custom hooks or context providers

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- DaisyUI for the beautiful UI components
- TailwindCSS for the utility-first CSS framework
- React team for the amazing framework
