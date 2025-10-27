# Local Build & NPX Usage

This guide walks through building `@azure-devops/mcp` from source, verifying the output, and wiring the local build up so that `npx @azure-devops/mcp` launches your copy from anywhere on this machine.

---

## 1. Prerequisites

- macOS, Linux, or WSL with a POSIX‑compatible shell
- Node.js **20.x** or newer (`node -v`)
- npm **10.x** or newer (`npm -v`, bundled with Node 20)
- Optional: [`corepack enable`](https://nodejs.org/api/corepack.html#enable) to keep `npm`/`npx` pinned

> If you use `nvm` or a similar tool, make sure you run the commands below from a shell where Node 20 is active.

---

## 2. Install Dependencies

From the repository root:

```bash
npm install
```

This runs the `preinstall` hook (ensures the public npm registry) and pulls both runtime and development dependencies. Re-run this command whenever `package.json` changes.

---

## 3. Build the Project

```bash
# Optionally start clean
npm run clean

# Compile TypeScript, stamp the current package version, and mark binaries executable
npm run build
```

What happens during `npm run build`:

1. `prebuild` writes `src/version.ts` with the current package version and formats it with Prettier.
2. `tsc` compiles everything under `src/` to `dist/`.
3. `shx chmod +x dist/*.js` ensures generated entry points are executable.

The distributable artifacts live under `dist/`. The CLI entry point exposed to `npx` is `dist/index.js`, published as the binary `mcp-server-azuredevops`.

---

## 4. Verify Locally

Run the TypeScript compiler in watch mode or execute automated tests if you need extra assurance:

```bash
# Strict type check without emitting JS
npm run validate-tools

# Run the Jest suite
npm test
```

Both are optional but recommended after significant changes.

---

## 5. Wire Up `npx` to Your Local Build

`npx` will use a globally linked package when it exists, so we register this repo with `npm link`. This keeps the global package pointing at your working copy and picks up new builds automatically.

```bash
# From the repo root, after building:
npm link
```

This creates a symlink from your global npm directory (see `npm config get prefix`) to this project. The binary name that becomes globally available is `mcp-server-azuredevops`.

> If you hit permission errors on macOS/Linux, ensure your npm prefix is under your home directory (e.g. `npm config set prefix "$HOME/.npm-global"`), update your `PATH`, re-open the terminal, and re-run `npm link`.

### Confirm the Link

```bash
npx --no-install @azure-devops/mcp --help
```

- `--no-install` guarantees `npx` will fail rather than downloading from npm, ensuring you are using the linked build.
- The command should print the CLI usage banner from your compiled `dist/index.js`.

Whenever you change the source:

```bash
npm run build
# The linked global package now reflects your latest build
```

To remove the link later:

```bash
npm unlink --global @azure-devops/mcp
```

---

## 6. Use the Local Build from Any Project

With the global link in place you can invoke the MCP server from any directory:

```bash
# Example: run against the "contoso" org from an arbitrary folder
npx --no-install @azure-devops/mcp contoso
```

If you maintain an `mcp.json` (or similar configuration) in another project, point it at the `npx` command for portability. Example `mcp.json` snippet:

```jsonc
{
  "clients": [
    {
      "name": "ado",
      "command": "npx",
      "args": ["--no-install", "@azure-devops/mcp", "contoso"]
    }
  ]
}
```

Because the package is linked globally, the MCP server resolves to your local build without hitting the npm registry.

---

## 7. Alternative: Pack & Install (Immutable Snapshot)

If you prefer a frozen snapshot instead of a live link:

```bash
npm run build
npm pack        # Produces ./azure-devops-mcp-<version>.tgz
npm install -g ./azure-devops-mcp-<version>.tgz
```

`npx @azure-devops/mcp` now launches the packed version. Re-run the sequence with a new tarball anytime you want to refresh the global install. Remove it with:

```bash
npm uninstall -g @azure-devops/mcp
```

---

## 8. Troubleshooting

- **`npx` still downloads from npm**  
  Make sure you pass `--no-install`, confirm `npm link` succeeded (`npm ls -g @azure-devops/mcp`), and ensure your `PATH` includes the global npm bin directory.

- **`module not found` at runtime**  
  Confirm `npm install` succeeded and `dist/` contains compiled files. Re-run `npm run build`.

- **Authentication failures**  
  Follow the steps in `docs/GETTINGSTARTED.md` to set up tokens and environment variables; the local build behaves identically to the published package.

- **Need to debug TypeScript sources**  
  Use `npm run watch` for incremental builds and run `node --inspect dist/index.js ...` as needed.

---

## 9. Next Steps

- Explore the CLI entry point at `src/index.ts` to understand the available tools.
- Update `docs/` or your downstream `mcp.json` configurations to match your environment.
- Consider adding automated tests to cover any new tools you introduce before rebuilding.

