## 2026-03-26

### User Prompt
We will be building a web app that does 2 things; first simulates the physical phenomena of a lava lamp (we will use a simplifed form of the navier strokes for computation purposes and for demo puroses as we are demonstrating and NOT DOING RESEARCH) the formula will be precise so we can intentionally modify the fluid placement based on terms injection if intended; the second will be building the agentic AI wrapper that will be able to control the simulation which means all of the simulation control utilities that will be built on top of the core of physics simulation will be decorated as tools; concisely the agent will be able to control the fluid inside of lamps and will be able to control the three js environement to move the user, the user will be able to ask questions and the agentic system shall interact and answer through a classical chat popup/modal placed in a fixed layout on the ui and over all z indexes; for this i already initialized a next js project app router, i also installed react three fiber; more dependecies will come as i shall note the agentic system will be built using agents by cloudflare; NOTE THAT ALL OF MY PROMPTS SHOULD BE LOGGED IN PROMPTS.MD under root + summarize your answer into 3 lines so you log it too; just write to that file don't augment your context with it; CODING RULES YOU ARE ALLOWED TO TOUCH 1-2 FILES AT A TIME; DRY ARCHITECTURE; PHYSICS SIMULTION SHOULD ALL BE OOP; COMPONENTS SHOULD ONLY INCLUDE TSX CODE STATES AND TYPES SHOULD BE MOVED to .state and .types FILES UNDER SAME ROOT; SINCE THIS IS NOT UI HEAVY WE WILL BE USING 1 ROOT COMPONENTS DIRECTORIES AND CONTEXTS WITH NO STATE MANAGEMENT; DIGEST ALL OF THAT and reply with critique

### 3-Line Answer Summary
The product direction is coherent, but your constraints need a stricter boundary between simulation core, scene control, and agent tool layer or the codebase will tangle immediately.
Using simplified fluid dynamics is fine for a demo, but direct “term injection” needs explicit guardrails or the agent will create unstable, non-debuggable simulation states.
The file-organization rules are mostly workable, but forcing every component to externalize state/types and limiting edits to 1-2 files at a time will slow iteration unless we define a clear module scaffold first.

## 2026-03-26

### User Prompt
Clarifications: for the components that are functional we shall use an atomic design under suitable directories, the guardrails will be set to fractions so the simulation doesn't die it won't be terms injection as abstract mathematically but tweaking parameters to fit a different perspectice of the simulation (faster diffusion, faster buoyancy or slowed), by OOP i didn't mean hardcoding every piece of vision into OOP we will use ThreeJS utilities (no reinventing the wheel) and keep high level classes to be able to visualize the system as clear, again boundaries will be set only to the limits of collable functions no fundamental chanegs can be done the simulation; we will keep the command layer simplistic not adding a state management this won't be changed; add rules to CODING_RULES.MD; make a PLAN.MD and update AGENTS.md to use force reading and following on these,

### 3-Line Answer Summary
I translated your clarifications into repository rules that formalize the simulation, scene, and agent boundaries without over-constraining implementation details.
`CODING_RULES.MD` now captures atomic component structure, bounded parameter control, high-level OOP simulation design, no external state management, and prompt logging.
`PLAN.MD` defines phased execution, and `AGENTS.md` now makes reading and following `AGENTS.md`, `CODING_RULES.MD`, and `PLAN.MD` mandatory before work starts.
