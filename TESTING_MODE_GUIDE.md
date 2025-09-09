# Testing Mode Guide

## Overview
The testing mode adds prominent visual overlays to all slides to clearly indicate that the content is test data, preventing people from taking photos or videos thinking it's real content.

## Features
- **Top-right indicator**: Small pulsing "TESTING MODE" badge
- **Bottom banner**: Full-width warning banner with clear messaging
- **Animated elements**: Pulsing dots and animations to draw attention
- **High z-index**: Ensures overlays appear above all slide content

## How to Enable/Disable

### Method 1: Environment Variable (Recommended)
1. Open your `client/.env` file
2. Add or modify the line:
   ```
   REACT_APP_TESTING_MODE=true
   ```
3. Restart the React development server

### Method 2: Quick Toggle
- **Enable**: Set `REACT_APP_TESTING_MODE=true` in `client/.env`
- **Disable**: Set `REACT_APP_TESTING_MODE=false` or remove the line entirely

## Visual Elements

### Top-Right Indicator
- Red background with white text
- Pulsing animation
- Shows "TESTING MODE" and "Not Real Data"

### Bottom Banner
- Full-width red gradient banner
- Warning emoji and clear messaging
- "This is NOT real data - Do not take photos or videos"

## When to Use
- **During development and testing**
- **When demonstrating the system to stakeholders**
- **During user acceptance testing**
- **When showing the system to external parties**

## When to Disable
- **In production with real data**
- **When the system is live for actual use**
- **During final presentations with real content**

## Quick Commands

### Enable Testing Mode
```bash
# Add to client/.env
echo "REACT_APP_TESTING_MODE=true" >> client/.env
```

### Disable Testing Mode
```bash
# Remove from client/.env or set to false
echo "REACT_APP_TESTING_MODE=false" >> client/.env
```

## Notes
- The overlays are non-interactive (pointer-events: none)
- They don't interfere with slide functionality
- The overlays automatically appear/disappear based on the environment variable
- No code changes needed to toggle testing mode
