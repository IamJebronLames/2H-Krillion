# Deep Dive

A Krillion-style rare-answer trivia game that runs on your own questions. No build step and no dependencies: plain HTML, CSS and JavaScript.

## How it plays

Each question names a category ("Name a web browser"). You type one answer before the timer runs out. Any answer in your list is accepted, and rarer answers are worth more.

| Tier | Points | Depth |
| --- | --- | --- |
| Plankton | 10 | 100 m |
| Too Clever | 15 | 150 m |
| Schooler | 30 | 300 m |
| Rare | 60 | 600 m |
| Deep Cut | 85 | 850 m |
| One in a Krillion | 100 | 1,000 m |

One point is 10 m. Seven perfect answers reach 7,000 m. After each question you see the tier, points and depth for your answer, then every accepted answer.

## Settings

On the start screen you can change the number of questions per dive, the seconds per question, and switch on a daily set, where everyone using the same question bank gets the same questions on a given day.

## Adding questions

Press **Edit questions**. Write one answer per line as `answer, alias, alias | tier`, with tier 1 (most obvious) to 6 (rarest). Questions are saved in your browser. Use **Export JSON** to download them and **Import JSON** to load them on another device.

To change the built-in samples for everyone, edit the `SAMPLE` array at the top of `app.js`.

## Run it

Open `index.html` in a browser.

## Put it on GitHub Pages

1. Create a repository and upload these four files (`index.html`, `style.css`, `app.js`, `README.md`).
2. In the repository, go to **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, and save.
4. After a minute your game is live at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

## Credit

Inspired by [Krillion](https://krillion.io/) by kp. This is an unofficial fan project and is not affiliated with it.
