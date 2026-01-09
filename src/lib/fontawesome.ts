// FontAwesome Configuration
// Prevents FOUC (Flash of Unstyled Content) for FontAwesome icons

import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';

// Tell FontAwesome to skip adding the CSS automatically
// since we're importing it manually above
config.autoAddCss = false;
