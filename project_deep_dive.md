# SINQ Authoring Tool — Architectural & Technical Deep Dive

The SINQ Authoring Tool is a local desktop application packaged as a portable Windows executable. It wraps the **Adapt Authoring Engine** (Node.js, Express) and a local database instance (**MongoDB**) inside an **Electron** wrapper, providing a zero-configuration, secure, and user-friendly desktop experience for creating eLearning courses using the Adapt Framework.

---

## 1. High-Level Architecture

The project is structured as a dual-process system (Electron Main process + local child server processes) communicating over HTTP and IPC (Inter-Process Communication).

```mermaid
graph TD
    %% Electron Shell
    subgraph Electron ["Electron Desktop Shell"]
        Main["Main Process (main.js)"]
        Preload["Preload Script (preload.js)"]
        Renderer["Renderer (BrowserWindow)"]
        Wizard["Setup Wizard (Window)"]
    end

    %% Spawning Databases and Express
    subgraph BackendServices ["Backend Services"]
        ExpressApp["Express App (lib/application.js)"]
        Router["Router Registry (lib/rest.js)"]
        ContentMgr["Content Manager (lib/contentmanager.js)"]
        OutputMgr["Output Manager (lib/outputmanager.js)"]
        MongoProcess["mongod.exe (Child Process)"]
    end

    %% Storage and Build Systems
    subgraph Filesystem ["Local Filesystem Storage"]
        UserData["%APPDATA% / User Data Folder"]
        DBDir["MongoDB Data Directory"]
        TempDir["Temp Output / Tenant Builds"]
    end

    %% Client App
    subgraph FrontendSPA ["Frontend SPA Client (Backbone.js)"]
        ClientApp["Backbone Router (router.js)"]
        ClientModels["Backbone Models & Collections"]
        ClientViews["Backbone Views / Forms"]
    end

    %% Relationships
    Main -->|Spawns & Monitors| MongoProcess
    Main -->|Configures & Runs| ExpressApp
    MongoProcess -->|Reads/Writes| DBDir
    ExpressApp -->|Mongoose DB Driver| MongoProcess
    Renderer -->|HTTPS Request / localhost:3000| ExpressApp
    Renderer -->|Security Context| Preload
    Preload -->|IPC Channel Bridge| Main
    ExpressApp -->|Precompiled Assets| Renderer
    ClientViews --> ClientModels
    ClientModels -->|API Requests| Router
    ContentMgr -->|CRUD Schema Mappings| MongoProcess
    OutputMgr -->|Spawns Grunt Build| TempDir
    Wizard -->|Setup Configuration via IPC| Main
```

### 1.1 Process Model & Roles
1. **Electron Main Process (`electron/main.js`)**:
   - Acts as the main application coordinator and lifecycle manager.
   - Performs environment pre-flight diagnostics (validating Git, Node, paths).
   - Resolves paths dynamically for dev mode vs. packaged production state.
   - Spawns, monitors, and stops the local MongoDB instance.
   - Boots up the Node/Express backend application.
   - Configures window attributes, enforces Content Security Policies (CSP), and handles IPC interfaces.
2. **Express Backend Application (`lib/application.js`)**:
   - A singleton wrapper (`Origin` class inheriting from `EventEmitter`) managing the HTTP server.
   - Dynamically registers all middleware, route folders, and content plugins.
   - Orchestrates core subsystems: content management, file storage, asset organization, user management, and compilation.
3. **Local MongoDB Database**:
   - Spawns as a background child process of the main process on the standard port `27017`.
   - Data is stored locally within the user's AppData directory, meaning no global installations are required.
4. **Backbone.js Single Page Application (SPA)**:
   - Run inside the Electron Renderer window.
   - Uses RequireJS (AMD loader) for client dependency management, Backbone.js for MVC structuring, and Handlebars for pre-compiled DOM templating.

---

## 2. Core Subsystems & Schema Management

### 2.1 The Dynamic Schema System
Unlike traditional hard-coded Mongoose schemas, SINQ uses a metadata-driven dynamic schema setup.
- **Location**: Each content plugin (e.g., [plugins/content/course](file:///c:/SINQ_authoring_desktop/adapt_authoring-1/plugins/content/course/)) includes a `model.schema` JSON file.
- **Structure**: Uses the standard JSON Schema (Draft-04) extended with custom editor attributes:
  - `inputType` (e.g., `Text`, `TextArea`, `Checkbox`, `DisplayTitle`, `Asset`): Dictates which form input control represents this field in the authoring tool UI.
  - `translatable`: Flags that this field requires support in localized translation configurations.
  - `editorOnly`: Signals that the property is solely for layout metadata and must not be packaged inside the compiled framework outputs.
- **Mapping**: `lib/database.js` reads these files and calls its Mongoose driver driver `lib/dml/mongoose/index.js` to compile Mongoose models on the fly during the bootstrap phase.

### 2.2 Adapt Course Hierarchy Collections
The tool represents an eLearning course as a hierarchical tree stored across six primary collections:
1. `course`: The root node representing the entire eLearning project.
2. `config`: Global configuration values (such as defaults for menus, themes, navigation rules, and screen reader configurations).
3. `contentobject`: Represents structural containers. These map directly to:
   - **Menus**: High-level structural categories containing sub-menus or pages.
   - **Pages**: Content layouts containing articles.
4. `article`: Structural layouts belonging to pages. They host one or more columns or blocks.
5. `block`: Layout rows inside articles. They split the screen space (e.g., left, right, or full) and act as placeholders for components.
6. `component`: The final leaf nodes. These are interactive elements (such as text, media, MCQs, accordions, and slider blocks) placed within blocks.

```
[Course Root]
    └── [Config]
    └── [ContentObject - Menu]
             └── [ContentObject - Page]
                      └── [Article]
                               └── [Block] (Left Column)  ── [Component - Text]
                               └── [Block] (Right Column) ── [Component - Media]
```

### 2.3 Subsystem Pipeline & CRUD Hooks
Backend subsystems (managed by `lib/contentmanager.js`) inherit from the base `ContentPlugin` class. This class abstracts common database transactions, handles multi-tenancy bounds, validates user permissions, and provides **Content Hooks** (`addContentHook`).

Key application hooks include:
- **Pre-Update Hook on Course (Theme/Style changes)**: Detects changes to `themeSettings` or `customStyle` and fires a `rebuildCourse` event to invalidate pre-compiled cache outputs.
- **Pre-Create/Pre-Destroy Hooks on Components**: Detects when a component type is added or removed from a course for the first time. If the component's presence list changes, a framework rebuild is flagged.
- **Post-Update Hooks on Layouts**: Automatically updates the `updatedAt` and `updatedBy` timestamps of the parent `course` model when any sub-element (article, block, or component) changes.

---

## 3. Lifecycle & Execution Flows

### 3.1 Boot Sequence and Onboarding

```mermaid
sequenceDiagram
    autonumber
    participant App as Electron Main (main.js)
    participant env as check-env.js
    participant mongo as mongodb.js (Service)
    participant Express as application.js (Origin)
    participant Wizard as Setup Wizard
    participant DB as MongoDB Instance

    App->>env: Run preflight check
    env-->>App: Success (Node version, Git paths, directories OK)
    App->>mongo: startMongo()
    mongo->>mongo: Remove stale locks
    mongo->>DB: Spawn mongod.exe
    DB-->>mongo: Listening on port 27017
    App->>App: Load config.json
    alt Config missing / installed === false
        App->>Wizard: Open Setup Wizard
        Wizard->>Wizard: Collect credentials, port, SMTP config
        Wizard->>App: Send configuration payload (IPC)
        App->>Express: Start minimal backend
        App->>DB: Apply database migrations & seed master tenant
        App->>env: Download Adapt Framework via Git clone to temp/
        App->>App: Update config.json with installed=true
    end
    App->>Express: runBackendStack()
    Express->>Express: Preload core subsystems (Rest, ContentMgr, etc.)
    Express->>DB: Connect mongoose to localhost:27017
    Express->>Express: Start HTTP Server on Port 3000
    App->>App: Open BrowserWindow (http://localhost:3000)
```

### 3.2 Course Compilation & Publishing Flow
When a user clicks "Preview" or "Publish" for a course, the tool runs a compilation process that writes JSON layouts and triggers the Adapt build pipeline:

```mermaid
graph TD
    Start([User triggers compilation]) --> FetchJSON[Fetch full course JSON tree database]
    FetchJSON --> ValidateJSON[Validate layout structure via outputHelpers.js]
    ValidateJSON --> ThemeMenu[Identify and apply theme/menu templates]
    ThemeMenu --> WriteAssets[Copy media assets to course assets directory]
    WriteAssets --> WriteMetadata[Write metadata JSON outputs to BUILD_FOLDER/course/]
    WriteMetadata --> RunGrunt[Spawn child process: npx grunt server-build]
    
    subgraph BuildEngine ["Adapt Framework Grunt Build"]
        RunGrunt --> GruntBuild[Compile CSS/JS/HTML assets]
    end

    GruntBuild --> Decision{Mode?}
    Decision -->|Preview| Serve[Serve built course inside sandboxed iframe on port 3000]
    Decision -->|Publish| Archive[Compress build directory into ZIP using archiver]
    Archive --> Download[Provide download stream link to user]
```

---

## 4. Client-Side (SPA) Architecture

The frontend is an optimized Backbone.js client application styled with Less and bundled via RequireJS.

### 4.1 Client Routing & View Management
- **Entry Module ([frontend/src/core/app.js](file:///c:/SINQ_authoring_desktop/adapt_authoring-1/frontend/src/core/app.js))**:
  Loads standard Javascript polyfills, vendor libraries (Backbone, jQuery), registers precompiled templates, initializes the l10n module (localization), and starts the user session model.
- **Router ([frontend/src/core/router.js](file:///c:/SINQ_authoring_desktop/adapt_authoring-1/frontend/src/core/router.js))**:
  Provides a wildcard mapping `':module(/*route1)(/*route2)...'` which parses route states to `handleRoute()`.
- **View Destruction**:
  To prevent memory leaks and zombie event handlers common in Backbone SPAs, the router fires `Origin.removeViews()` on every page navigation. Views listen to this event to safely remove themselves from the DOM and tear down event listeners.

### 4.2 Frontend Modules
Organized inside `frontend/src/modules/`, each workspace component runs as a self-contained AMD module:
- `editor`: Handles the graphical course builder interface (drag-and-drop hierarchy modifications for articles, blocks, and components).
- `assetManagement`: Integrates file uploads, metadata tag filtering, and preview engines for media.
- `scaffold`: Manages core structural layouts of the screen wrapper (navigation bars, sidebars, context menus, and notification modals).

---

## 5. Development & Build Pipelines

### 5.1 The Grunt Pipeline (`Gruntfile.js`)
All frontend compilation, bundling, and optimization tasks are executed via Grunt:
- **`generate-lang-json`**: Merges server-side language properties with component language attributes, producing centralized, optimized localization JSON bundles.
- **`copy`**: Moves static font icons, CSS layouts, and libraries (like the Ace editor) to `frontend/build/`.
- **`less`**: Transpiles source `.less` files from the core modules and plugins into a single, minified `adapt.css` stylesheet.
- **`handlebars`**: Compiles Handlebars templates (`.hbs`) into unified, optimized JS template functions inside `frontend/src/templates/templates.js`.
- **`requirejs`**: Bundles all AMD module paths defined in `frontend/src/core/config.js` into a single file `frontend/build/js/origin.js`.
- **`babel`**: Transpiles the final RequireJS bundle into cross-compatible ES5 code.

### 5.2 Development Tooling & Autoreload
When launched via `npm run dev` in a development environment:
1. `cross-env` configures local environment variables.
2. The frontend is built in development mode (`grunt build:dev`), generating source maps and preserving debugger comments.
3. The Electron application starts with `--dev`. This automatically enables development features:
   - **DevTools**: Automatically toggles the Chrome DevTools panel.
   - **Main Process Auto-Reload**: Using the `electron-reload` package, changes to main process or backend service files prompt a clean application reload.
   - **Renderer Auto-Reload**: Watches the `frontend/src` and `frontend/build` directories. When changes are made, it refreshes the window without restarting the underlying backend server or database process.
