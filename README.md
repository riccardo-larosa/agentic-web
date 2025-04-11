# Agentic Web UI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The default Web UI for [Agentic](https://github.com/riccardo-larosa/agentic).**


## Quick Start

### Prerequisites

- [Agentic](https://github.com/riccardo-larosa/agentic)
- Node.js (v22.14.0+)
- pnpm (v10.6.2+) as package manager

### Configuration

Create a `.env` file in the project root and configure the following environment variables:

- `NEXT_PUBLIC_API_URL`: The URL of the Ant API.

It's always a good idea to start with the given example file, and edit the `.env` file with your own values:

```bash
cp .env.example .env
```

### Installation

**IMPORTANT: First, **start the Python server**, see [Agentic](https://github.com/riccardo-larosa/agentic) for more details.**

```bash

# Install dependencies
pnpm install

# Run the project in development mode
pnpm dev
```

Then open your browser and navigate to http://localhost:3000




## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

Special thanks to all the open source projects and contributors.
