# Escape the Game — Level Editor

A browser-based level editor for the Steam game **Escape the Game** (2016). Temporarily hosted at: https://escape-the-game.ericbs.dev

Runs 100% locally. It's simply a UI to generate a file in the specific format that ETG expects.

> [!NOTE]
> This project was created fully using AI and is provided AS-IS. Don't expect it to be maintained.

## How to run it (Windows)

Open powershell or terminal and paste these commands:

```powershell
winget install Git.Git
git clone https://github.com/ericbstie/escape-the-game-editor.git
winget install jdx.mise
mise run editor
start http://localhost:3000
```

Please understand what you're running and don't trust me, nor anyone else, that tells you to run commands you don't understand.
I encourage you to read the documentation for [mise](https://mise.jdx.dev) and chat with AI about the commands to ensure you
understand the commands before running them.

## Showcase

![The editor](docs/editor.png)
![A level made with the editor, running in the game](docs/screenshot.png)
