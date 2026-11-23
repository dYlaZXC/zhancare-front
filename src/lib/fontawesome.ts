// FontAwesome Configuration
// Prevents FOUC (Flash of Unstyled Content) for FontAwesome icons

import { config, library } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { fas } from '@fortawesome/free-solid-svg-icons';

// Add all solid icons to the library to prevent "undefined" path errors
library.add(fas);

// Tell FontAwesome to skip adding the CSS automatically
// since we're importing it manually above
config.autoAddCss = false;

// Disable auto accessibility features to prevent render issues
config.autoA11y = false;
