## Rebloom

This is an open-ended problem with lots of latitude for creativity.

Some core elements we really want to see:
1. Rebloom metadata should be stored in a normalised form (e.g. a `rebloom_original_id` column on the original `blooms` table, or a `reblooms` table which just associates between blooms and reblooms). There should not be a `rebloomed_count` column or similar - this information should be computed using joins.
2. Some kind of consideration given to whether a rebloom has content. Maybe a rebloom has its own content separate from the original bloom. Maybe a rebloom copies the original content. Maybe a rebloom has null content but inherits content based on being a rebloom.
3. GETting reblooms should be handled the same was as blooms are, with extra metadata. e.g. for GETting blooms, there shouldn't be a new endpoint, the existing endpoint should just return objects with more fields.
4. Reblooms should be visually distinct in the UI, and make clear both the original sender and the rebloomer.
5. Reblooms should show up in both the home timeline and in the rebloomer's profile timeline.
6. Some kind of consideration for the timeline ordering - reblooms can show up at the original post time, or the rebloom time, but a reasonable choice should be made here.
7. If there's a "rebloomed by X users" indicator, ideally it would be easy to see who.

We don't super care about the specifics of the UI (the existing app has a pretty janky barebones UI), but showing data clearly is good.

See https://github.com/CodeYourFuture/Module-Legacy-Code/pull/94 for a reasonable sample implementation.

### Problems to look out for

1. Schema design that leads to duplicate data, or race conditions (e.g. separate rows indicating the original ID of a rebloom, and a count of reblooms of a bloom). Instead, we want normalised data and to join to get counts.
2. Not including SQL schema changes in the PR (which means that you couldn't run things locally). This can either be from edits to the original `CREATE TABLE` statement, or a migration-style `ALTER TABLE ADD COLUMN` statement - we don't teach data migrations, so not knowing how to do these is reasonable.

### General problems to look out for

1. Reformatting unaffected lines.
2. Including other changes in the same branch.

### Running the stack locally

This feature is really useful to experiment with the UX of. Steps to run locally are:
1. Make sure you have docker installed and running, and python3 installed.
2. Check out the PR (`gh pr checkout 94`).
3. In one terminal tab: `cd backend && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt && python3 main.py`
4. In another terminal tab: `cd db && rm -rf pg_data && ./run.sh`. Wait until it logs "database system is ready to accept connections".
5. In another terminal tab: `cd backend && . .venv/bin/activate && ../db/create-schema.sh && python3 populate.py`
6. In another terminal tab: `cd front-end && python3 -m http.server`

You can then navigate to the frontend on http://localhost:8000/ and log in as `sample` / `sosecret`.
