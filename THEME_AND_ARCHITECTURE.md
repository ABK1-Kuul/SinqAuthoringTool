# SINQ Authoring Tool - Theme and Architecture Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Overall Theme and Design Philosophy](#overall-theme-and-design-philosophy)
3. [Complete File and Folder Structure](#complete-file-and-folder-structure)
4. [Core Architecture](#core-architecture)
5. [Design System](#design-system)
6. [Component Documentation](#component-documentation)
7. [Styling Architecture](#styling-architecture)
8. [Layout and UI Patterns](#layout-and-ui-patterns)

---

## Project Overview

**SINQ Authoring Tool** is a web-based authoring interface for creating responsive, multi-device HTML5 e-learning content using the Adapt Framework. Built on Node.js, Backbone.js, and MongoDB, it provides a comprehensive content management system for educational course creation.

### Technology Stack
- **Backend**: Node.js, Express.js, MongoDB (Mongoose)
- **Frontend**: Backbone.js, RequireJS, Handlebars templates
- **Styling**: LESS (CSS preprocessor)
- **Build Tools**: Grunt
- **Key Libraries**: jQuery, Velocity.js (animations), Ace Editor, Selectize, Pikaday

---

## Overall Theme and Design Philosophy

### Visual Theme
SINQ Authoring Tool employs a **professional, clean, and modern interface** designed for content creators and educators. The design emphasizes:

- **Clarity and Focus**: Clean layouts that minimize distractions
- **Visual Hierarchy**: Clear separation between navigation, sidebar, and content areas
- **Consistency**: Unified design language across all modules
- **Accessibility**: High contrast ratios and readable typography
- **Responsive Design**: Adaptable to different screen sizes

### Design Principles

1. **Three-Panel Layout**: Fixed navigation bar, collapsible sidebar, and dynamic content pane
2. **Color-Coded Actions**: Semantic color usage (primary, secondary, alert, warning)
3. **Progressive Disclosure**: Information revealed as needed through modals and sidebars
4. **Smooth Transitions**: Velocity.js-powered animations for state changes
5. **Contextual Actions**: Actions available based on user permissions and current context

---

## Complete File and Folder Structure

```
adapt_authoring-1/
├── conf/                          # Configuration files
│   └── migrations.js              # Database migration configuration
│
├── frontend/                      # Frontend application code
│   └── src/
│       ├── core/                  # Core application framework
│       │   ├── app.js            # Application entry point and initialization
│       │   ├── assets/           # Core assets (logos, images)
│       │   ├── collections/     # Backbone collections
│       │   ├── config.js         # RequireJS configuration
│       │   ├── constants.js      # Application constants
│       │   ├── helpers.js        # Utility functions
│       │   ├── l10n.js           # Localization/internationalization
│       │   ├── less/             # Core LESS stylesheets
│       │   │   ├── app.less      # Main application styles
│       │   │   ├── buttons.less  # Button component styles
│       │   │   ├── colours.less  # Color variables and theme
│       │   │   ├── columns.less  # Column layout styles
│       │   │   ├── fonts.less    # Typography definitions
│       │   │   ├── forms.less    # Form input styles
│       │   │   ├── sharedStyles.less  # Reusable utility classes
│       │   │   ├── tables.less   # Table styles
│       │   │   └── tags.less     # Tag component styles
│       │   ├── models/           # Backbone models
│       │   ├── origin.js         # Core Origin framework object
│       │   ├── permissions.js    # Permission management
│       │   ├── router.js         # Application routing
│       │   └── views/            # Base view classes
│       │
│       ├── libraries/            # Third-party JavaScript libraries
│       │   ├── ace/             # Ace code editor
│       │   ├── backbone.js      # Backbone MVC framework
│       │   ├── backbone-forms.js  # Form handling
│       │   ├── font-awesome-4.5.0/  # Icon font library
│       │   ├── handlebars.js    # Template engine
│       │   ├── jquery.js        # jQuery library
│       │   ├── pikaday/         # Date picker
│       │   ├── selectize/       # Select dropdown component
│       │   ├── spectrum/        # Color picker
│       │   └── velocity.js      # Animation library
│       │
│       └── modules/             # Feature modules
│           ├── actions/         # Action buttons module
│           ├── assetManagement/ # Asset upload and management
│           ├── browserStorage/ # Browser storage utilities
│           ├── colorLabel/     # Color labeling system
│           ├── contentPane/    # Main content area component
│           ├── contextMenu/    # Right-click context menus
│           ├── editor/         # Course editor module
│           │   ├── article/    # Article editor
│           │   ├── block/      # Block editor
│           │   ├── component/  # Component editor
│           │   ├── config/     # Configuration editor
│           │   ├── contentObject/  # Content object editor
│           │   ├── course/     # Course editor
│           │   ├── extensions/ # Extensions editor
│           │   ├── global/    # Global editor utilities
│           │   ├── menuSettings/  # Menu settings editor
│           │   ├── selectTheme/  # Theme selection
│           │   └── themeEditor/   # Theme customization editor
│           ├── filters/         # Filter/search components
│           ├── frameworkImport/ # Framework import functionality
│           ├── globalMenu/     # Global menu component
│           ├── help/           # Help system
│           ├── location/       # Location/breadcrumb component
│           ├── modal/          # Modal dialog system
│           ├── navigation/     # Top navigation bar
│           ├── notify/         # Notification system
│           ├── options/        # Options/settings components
│           ├── pluginManagement/  # Plugin management
│           ├── projects/       # Project listing and management
│           ├── scaffold/       # Form scaffolding system
│           ├── sidebar/        # Left sidebar component
│           ├── user/          # User authentication and profile
│           └── userManagement/ # User administration
│
├── lib/                          # Backend library modules
│   ├── application.js           # Main application setup
│   ├── assetmanager.js          # Asset management logic
│   ├── auth.js                  # Authentication system
│   ├── bowermanager.js          # Bower package management
│   ├── configuration.js         # Configuration management
│   ├── contentmanager.js        # Content CRUD operations
│   ├── database.js              # Database connection and setup
│   ├── dml/                     # Data modeling layer
│   │   ├── mongoose/           # Mongoose ODM integration
│   │   └── schema/              # Database schemas
│   ├── filestorage.js           # File storage abstraction
│   ├── frameworkhelper.js       # Framework utilities
│   ├── helpers.js               # Backend utility functions
│   ├── logger.js                # Logging system
│   ├── mailer.js                # Email functionality
│   ├── outputmanager.js         # Output/publishing management
│   ├── permissions.js           # Permission checking
│   ├── pluginmanager.js         # Plugin system
│   ├── rest.js                  # REST API endpoints
│   ├── role/                    # Role definitions
│   ├── rolemanager.js           # Role management
│   ├── router.js                # Backend routing
│   ├── templates/               # Email templates
│   ├── tenantmanager.js         # Multi-tenancy support
│   └── usermanager.js           # User management
│
├── migrations/                   # Database migration scripts
│
├── plugins/                      # Plugin system
│   ├── auth/                    # Authentication plugins
│   ├── content/                 # Content type plugins
│   ├── filestorage/             # File storage plugins
│   └── output/                  # Output format plugins
│
├── routes/                       # Express route handlers
│   ├── config/                  # Configuration routes
│   ├── download/                # File download routes
│   ├── export/                   # Export routes
│   ├── import/                   # Import routes
│   ├── index/                    # Index/home routes
│   ├── lang/                     # Language/localization routes
│   ├── loading/                  # Loading page routes
│   ├── poll/                     # Polling routes
│   └── preview/                  # Preview routes
│
├── test/                         # Test files
│
├── Gruntfile.js                  # Grunt build configuration
├── index.js                      # Application entry point
├── install.js                    # Installation script
├── package.json                  # Node.js dependencies
├── server.js                     # Server startup script
└── upgrade.js                    # Upgrade script
```

---

## Core Architecture

### Application Initialization Flow

1. **Entry Point** (`server.js` → `index.js` → `lib/application.js`)
   - Server starts Express application
   - Database connection established
   - Middleware configured
   - Routes registered

2. **Frontend Loading** (`frontend/src/core/app.js`)
   - Libraries loaded (jQuery, Backbone, Handlebars, etc.)
   - Core modules initialized (Origin, Router, Helpers, Permissions, L10n, Constants)
   - Feature modules loaded
   - Plugins initialized
   - Session started

3. **Origin Framework** (`frontend/src/core/origin.js`)
   - Central event bus using Backbone.Events
   - Global state management
   - Loading overlay management
   - Window event handling (resize, focus/blur, keyboard)

### Key Architectural Patterns

#### 1. Module Pattern
Each module follows a consistent structure:
```
module/
├── index.js          # Module registration and event listeners
├── models/           # Backbone models
├── collections/      # Backbone collections
├── views/            # Backbone views
├── templates/        # Handlebars templates (.hbs)
└── less/             # Module-specific styles
```

#### 2. Event-Driven Architecture
- Uses Backbone.Events for decoupled communication
- Modules communicate via Origin event bus
- Example: `Origin.trigger('editor:contentObject', data)`

#### 3. View Composition
- Base view class: `OriginView` extends `Backbone.View`
- Views render Handlebars templates
- Views listen to Origin events for updates

---

## Design System

### Color Palette

The color system is defined in `frontend/src/core/less/colours.less` and uses LESS variables for easy theming.

#### Primary Colors
- **Primary Color** (`@primary-color`): `#34bee0` - Light blue
  - Used for: Primary buttons, links, active states
  - Hover: `darken(@primary-color, 5%)`

- **Secondary Color** (`@secondary-color`): `#00dd95` - Green
  - Used for: Secondary actions, success states, highlights
  - Hover: `darken(@secondary-color, 3%)`

- **Tertiary Color** (`@tertiary-color`): `#263944` - Dark blue
  - Used for: Sidebar background, dark UI elements
  - Hover: `lighten(@tertiary-color, 10%)`

- **Quaternary Color** (`@quaternary-color`): `#36cde8` - Cyan
  - Used for: Additional accent elements

#### Semantic Colors
- **Alert** (`@alert-color`): `#ff5567` - Red
  - Used for: Errors, destructive actions, warnings
- **Warning** (`@warning-color`): `#ffa08d` - Orange-red
  - Used for: Warning messages
- **Success** (`@success-color`): Same as `@secondary-color`
- **Info** (`@info-color`): `fade(@primary-color, 60%)` - Semi-transparent primary
- **Disabled** (`@disabled-color`): `#454545` - Gray

#### UI Layout Colors
- **Content Background** (`@ui-content-color`): `#f3fcfe` - Very light blue
- **Content Header** (`@ui-content-header-color`): `#e0e8f7` - Light blue-gray
- **Sidebar Background** (`@sidebar-color`): `@tertiary-color` (`#263944`)
- **Sidebar Text** (`@sidebar-text-color`): `@primary-color` (`#34bee0`)
- **Navigation Background**: `#2aa3ce` - Medium blue (with background image)

### Typography

Defined in `frontend/src/core/less/fonts.less`:

#### Font Families
- **Body Font**: `'Open Sans', sans-serif`
  - Weight: 400 (regular), 700 (bold)
  - Size: 13px (base)
  - Used for: Body text, inputs, buttons

- **Title Font**: `'Raleway', sans-serif`
  - Weight: 400 (regular), 700 (bold)
  - Used for: Headings (h1-h6), navigation, titles

#### Font Sizes
- Base: `13px`
- Headings: `15px` (h1)
- Sidebar: `110%` of base (`@sidebar-input-font-size`)

#### Font Weights
- Regular: `400`
- Bold: `700`

### Spacing System

- **Button Padding**: `10px 12px`
- **Form Group Margin**: `20px` bottom
- **Form Input Padding**: `11px 10px`
- **Sidebar Padding**: `30px 20px` (title), `18px 30px` (rows)
- **Content Margin**: `20px`
- **Border Radius**: `3px` (buttons), `2px` (inputs), `5px` (preview buttons)

### Layout Dimensions

- **Navigation Height**: `60px` (fixed top)
- **Sidebar Width**: `250px` (fixed left)
- **Content Area**: `calc(100vh - 61px)` height, `margin-left: 250px`, `margin-top: 60px`
- **Sidebar Action Buttons**: `200px` width, `50px` height

---

## Component Documentation

### Core Components

#### 1. Navigation (`modules/navigation/`)

**Purpose**: Top navigation bar providing global navigation and user controls.

**Structure**:
- `views/navigationView.js`: Backbone view managing navigation rendering
- `templates/navigation.hbs`: Handlebars template
- `less/navigation.less`: Navigation-specific styles

**Styling** (`navigation.less`):
- Fixed position at top (`position: fixed; top: 0`)
- Height: `60px`
- Background: `#2aa3ce` with background image (`top-bar-1080.jpg` / `top-bar-2560.jpg`)
- Border: `1px solid rgba(0,0,0,0.15)` bottom
- Font: Raleway, 15px
- Z-index: 500

**UI Behavior**:
- Left section: Product name and main navigation items
- Right section: User info and logout
- Items are clickable links triggering Origin events
- Hover effects: underline on text links
- Responsive background images based on viewport width

**Color Usage**:
- Text: `@navigation-text-color` (`@white`)
- Hover: `darken(@navigation-text-color, 2%)`

---

#### 2. Sidebar (`modules/sidebar/`)

**Purpose**: Left-side navigation panel providing contextual actions, filters, and navigation.

**Structure**:
- `views/sidebarView.js`: Main sidebar view with animation support
- `views/sidebarFilterView.js`: Filter/search component
- `templates/sidebar.hbs`: Main template
- `less/sidebar.less`: Comprehensive sidebar styles

**Styling** (`sidebar.less`):
- Fixed position: `top: 61px; left: 0px`
- Width: `250px`
- Height: `calc(100vh - 61px)`
- Background: `@sidebar-color` (`#263944` - dark blue)
- Overflow: `overflow-y: auto; overflow-x: hidden`
- Scrollable content area

**UI Behavior**:
- **Breadcrumb Navigation**: Animated breadcrumb bar at top (slides in/out)
- **Item Container**: Main content area for sidebar items
- **Fieldset Container**: Form fields and filters
- **Animation**: Uses Velocity.js for smooth transitions
  - Items fade in from left (`left: 10%; opacity: 0` → `opacity: 1`)
  - Breadcrumb slides (`top: -40px` → `top: 0px`)
- **Hideable**: Can be hidden via `sidebar-hide` class on `<html>`

**Color Usage**:
- Background: `@sidebar-color` (`#263944`)
- Text: `@sidebar-text-color` (`@primary-color` - `#34bee0`)
- Inputs: `@sidebar-input-color` (`#627178`), text `@white`
- Hover: `@sidebar-item-hover-color` (`lighten(@tertiary-color, 10%)`)
- Action buttons: `@button-secondary-color` (`#00dd95` - green)

**Key Features**:
- Action buttons: `200px` width, `50px` height, secondary color
- Dropdown menus for preview options
- Filter input with clear button
- Toggle switches for boolean settings
- Icon support (Font Awesome)

---

#### 3. Content Pane (`modules/contentPane/`)

**Purpose**: Main content area displaying views and forms.

**Structure**:
- `views/contentPaneView.js`: View manager with animation support
- `templates/contentPane.hbs`: Simple container template
- `less/contentPane.less`: Minimal styles (overflow management)

**Styling** (`contentPane.less`):
- Position: `relative`
- Overflow: `overflow-y: auto` (scrollable)
- Height: Dynamically calculated based on window height
- Margin: `margin-top: 60px; margin-left: 250px` (from `app.less`)

**UI Behavior**:
- **View Management**: `setView()` method replaces content with new Backbone view
- **Animation**: Fade in/out using Velocity.js (`opacity: 0` → `opacity: 1`, 500ms duration)
- **Scroll Tracking**: Emits `contentPane:scroll` events
- **Resize Handling**: Adjusts height on window resize
- **Empty State**: Can be emptied via `removeView()`

**Layout Integration**:
- Positioned to right of sidebar
- Below navigation bar
- Takes remaining viewport space

---

#### 4. Modal System (`modules/modal/`)

**Purpose**: Overlay dialogs for confirmations, forms, and information display.

**Structure**:
- `views/modalView.js`: Modal view with backdrop
- `models/modalModel.js`: Modal data model
- `templates/modal.hbs`: Modal template
- `less/modal.less`: Modal styles

**Styling Approach**:
- Full-screen overlay with semi-transparent backdrop
- Centered content area
- Z-index above other content
- Smooth fade-in animations

**UI Behavior**:
- Opens/closes via Origin events
- Backdrop click to close (optional)
- Escape key to close (optional)
- Supports different sizes and types

---

#### 5. Editor Module (`modules/editor/`)

**Purpose**: Comprehensive course editing interface with hierarchical content management.

**Structure**:
The editor is the most complex module, containing sub-modules for different content types:

- **contentObject/**: Menu and page structure editing
  - Visual tree representation
  - Drag-and-drop reordering
  - Context menus for actions
  - LESS files for each view type

- **article/**, **block/**, **component/**: Individual content type editors
  - Form-based editing
  - Preview functionality
  - Validation

- **themeEditor/**: Theme customization interface
  - Color pickers
  - Typography settings
  - Layout options

- **global/**: Shared editor utilities and views
  - Editor view container
  - Data loading helpers
  - Common templates

**Styling Approach**:
- Tree view with indentation for hierarchy
- Color-coded content types
- Drag handles and drop zones
- Contextual action buttons
- Preview panels

**UI Behavior**:
- Hierarchical navigation (Menu → Page → Article → Block → Component)
- Breadcrumb navigation in sidebar
- Drag-and-drop reordering
- Inline editing with forms
- Real-time preview
- Undo/redo support (where applicable)

---

#### 6. Asset Management (`modules/assetManagement/`)

**Purpose**: Upload, organize, and manage course assets (images, videos, documents).

**Structure**:
- Multiple views for different states (list, upload, preview, filters)
- Collection view for asset grid
- Modal views for upload and filtering
- Tag management system

**Styling Approach**:
- Grid layout for asset thumbnails
- Modal overlays for upload/filter
- Tag chips with color coding
- Preview pane with metadata

**UI Behavior**:
- Drag-and-drop upload
- Filter by type, tags, date
- Search functionality
- Preview on hover/click
- Bulk operations

---

#### 7. Projects Module (`modules/projects/`)

**Purpose**: Course listing, creation, and management.

**Structure**:
- `views/projectsView.js`: Main project list view
- Collection views for project cards
- Templates for project cards and list

**Styling Approach**:
- Card-based layout
- Project thumbnails
- Status indicators
- Action buttons per project

**UI Behavior**:
- Grid/list view toggle
- Filter and search
- Create new project
- Open/edit/delete actions
- Project status badges

---

#### 8. User Management (`modules/userManagement/`)

**Purpose**: User administration, roles, and permissions.

**Structure**:
- User list view
- User form views (create/edit)
- Role assignment
- Permission management

**Styling Approach**:
- Table layout for user list
- Form-based editing
- Role badges
- Permission checkboxes

**UI Behavior**:
- CRUD operations
- Role assignment dropdowns
- Permission matrix
- User search and filter

---

### Supporting Components

#### Actions Module (`modules/actions/`)
- Reusable action buttons
- Consistent button styling
- Icon support

#### Color Label (`modules/colorLabel/`)
- Color-coded labels for organization
- Popup color picker
- Predefined color palette

#### Context Menu (`modules/contextMenu/`)
- Right-click menus
- Contextual actions
- Animated appearance

#### Filters (`modules/filters/`)
- Typeahead search
- Autocomplete functionality
- Filter chips

#### Notify (`modules/notify/`)
- Toast notifications
- Success/error/info messages
- Auto-dismiss timers

#### Location (`modules/location/`)
- Breadcrumb navigation
- Current page indicator
- Navigation history

---

## Styling Architecture

### LESS Organization

The styling system uses LESS (Leaner Style Sheets) for preprocessing, organized hierarchically:

#### Core Styles (`frontend/src/core/less/`)

1. **`colours.less`**: Color variable definitions
   - All color variables centralized
   - Semantic naming convention
   - Easy theme customization

2. **`fonts.less`**: Typography system
   - Font family imports (Google Fonts)
   - Font size variables
   - Font weight definitions
   - Base typography rules

3. **`app.less`**: Main application styles
   - HTML/body base styles
   - App container layout
   - Loading overlay styles and animations
   - Error states

4. **`buttons.less`**: Button component system
   - Base button styles
   - Variants: primary, secondary, tertiary, quaternary
   - Hollow variants for each color
   - Semantic variants: warning, alert, disabled
   - Hover and focus states
   - Icon support within buttons

5. **`forms.less`**: Form input styles
   - Input, textarea, select styling
   - Focus states
   - Disabled states
   - Form group spacing
   - Field help text
   - File upload styling

6. **`tables.less`**: Table component styles
   - Table title bar
   - Row styling
   - Column layouts
   - Heading styles

7. **`sharedStyles.less`**: Utility classes
   - `.display-none`: Hide elements
   - `.visibility-hidden`: Hide but maintain space
   - `.no-select`: Prevent text selection
   - `.no-wrap`: Truncate with ellipsis
   - `.no-scroll`: Disable scrolling
   - `.truncate`: Text truncation
   - `.form-container-style`: Form page styling

8. **`tags.less`**: Tag component styles
   - Tag background and text colors
   - Tag spacing and layout

9. **`colourLabels.less`**: Color label system
   - Color-coded label styles
   - Label variants

10. **`columns.less`**: Column layout system
    - Multi-column layouts
    - Responsive column behavior

### Module-Specific Styles

Each module can have its own `less/` directory with module-specific styles:

- **Import Pattern**: Modules import core styles (`@import 'colours'`, etc.)
- **Scoped Styles**: Styles scoped to module class names
- **Component Styles**: Separate files for complex components

### Styling Patterns

#### 1. Variable-Based Theming
```less
@primary-color: #34bee0;
.button {
  background-color: @primary-color;
  &:hover {
    background-color: darken(@primary-color, 5%);
  }
}
```

#### 2. Semantic Color Usage
- Primary: Main actions
- Secondary: Success, positive actions
- Alert: Errors, destructive actions
- Warning: Cautionary messages
- Disabled: Inactive states

#### 3. Consistent Spacing
- Uses consistent padding/margin values
- Form groups: `20px` bottom margin
- Sidebar items: `30px` horizontal padding
- Buttons: `10px 12px` padding

#### 4. Transition Effects
- All interactive elements use `transition: all 0.3s`
- Smooth color changes on hover
- Opacity transitions for modals

#### 5. Responsive Design
- Fixed sidebar (250px) with content area adapting
- Navigation background images for different viewport widths
- Media queries for mobile considerations

---

## Layout and UI Patterns

### Three-Panel Layout

The application uses a fixed three-panel layout:

```
┌─────────────────────────────────────────┐
│         Navigation (60px)               │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │     Content Pane            │
│ (250px)  │     (flexible width)        │
│          │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

**Implementation**:
- Navigation: `position: fixed; top: 0; height: 60px`
- Sidebar: `position: fixed; top: 61px; width: 250px`
- Content: `margin-top: 60px; margin-left: 250px`

### Animation Patterns

#### 1. Fade Transitions
- Content pane views: `opacity: 0` → `opacity: 1` (500ms)
- Loading overlay: Fade out on load complete
- Modal appearance: Fade in with backdrop

#### 2. Slide Animations
- Sidebar breadcrumb: Slides down from `-40px` to `0px`
- Sidebar items: Slide in from left (`left: 10%` → `left: 0`)

#### 3. Velocity.js Usage
- Smooth, hardware-accelerated animations
- Used for: View transitions, sidebar animations, modal appearances

### Interaction Patterns

#### 1. Contextual Actions
- Actions appear based on selection
- Context menus on right-click
- Action buttons in sidebar

#### 2. Progressive Disclosure
- Modals for detailed forms
- Expandable sections
- Collapsible sidebars

#### 3. Visual Feedback
- Hover states on all interactive elements
- Active states for selected items
- Loading states during operations
- Success/error notifications

#### 4. Form Patterns
- Inline validation
- Field help text
- Required field indicators
- Error messages below fields

### Reusable UI Patterns

#### 1. Button Variants
```html
<button class="btn primary">Primary Action</button>
<button class="btn secondary">Secondary Action</button>
<button class="btn primary-hollow">Hollow Primary</button>
<button class="btn alert">Delete</button>
```

#### 2. Form Container
```html
<div class="form-container-style">
  <div class="inner">
    <!-- Form content -->
  </div>
</div>
```

#### 3. Sidebar Rows
```html
<div class="sidebar-row">
  <button>Action</button>
</div>
```

#### 4. Table Rows
```html
<div class="tb-row">
  <div class="tb-col-inner">Content</div>
</div>
```

#### 5. Loading States
```html
<div class="loading">
  <div class="loading-inner">
    <div class="loading-logo">...</div>
    <div class="loading-anim">...</div>
  </div>
</div>
```

---

## Design System Summary

### Color Roles
- **Primary Blue** (`#34bee0`): Main brand color, primary actions
- **Green** (`#00dd95`): Success, secondary actions, highlights
- **Dark Blue** (`#263944`): Sidebar, dark UI elements
- **Red** (`#ff5567`): Errors, destructive actions
- **Orange** (`#ffa08d`): Warnings

### Typography Hierarchy
1. **Titles**: Raleway, 15px, bold
2. **Body**: Open Sans, 13px, regular
3. **Sidebar**: Open Sans, 110% (14.3px)

### Spacing Scale
- Small: `4px`, `10px`
- Medium: `20px`, `30px`
- Large: `50px`, `60px`

### Component Sizes
- Buttons: `10px 12px` padding, `3px` border radius
- Sidebar: `250px` width
- Navigation: `60px` height
- Action buttons: `200px × 50px`

### Animation Timing
- Standard: `0.3s` (transitions)
- View changes: `500ms` (Velocity.js)
- Loading: `1.8s` (bounce animation cycle)

---

## Conclusion

SINQ Authoring Tool employs a **cohesive, professional design system** built on:

1. **Consistent Color Palette**: Semantic color usage throughout
2. **Clear Typography Hierarchy**: Raleway for titles, Open Sans for body
3. **Modular Architecture**: Reusable components and patterns
4. **Smooth Interactions**: Velocity.js-powered animations
5. **Accessible Design**: High contrast, readable fonts, clear hierarchy

The three-panel layout (Navigation, Sidebar, Content Pane) provides a **familiar, efficient workspace** for content creators, while the modular component system ensures **consistency and maintainability** across the application.

---

*Document generated for SINQ Authoring Tool v0.11.5*

