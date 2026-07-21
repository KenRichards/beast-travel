# Travel Data

This directory is the local workspace for importing travel reservations into
BEAST Travel. Source documents and generated records can contain personal or
booking information, so every data directory below is excluded from Git except
for its `.gitkeep` placeholder.

## Directory layout

- `incoming/` — place reservation PDFs and exported reservation emails here.
  Importers will treat these files as read-only source material.
- `attachments/` — place reservation screenshots here. Like inbox documents,
  these files remain local and are not committed.
- `processed/` — future importers will write local normalized, intermediate
  data here after extracting reservation details.
- `reservations/` — future validated reservation records will be stored locally
  here in the structured format consumed by BEAST Travel.
- `cache/` — temporary importer data belongs here. Its contents remain local
  and can be regenerated.

## Future importer workflow

Importers will read source documents from `incoming/` and `attachments/`, use
`cache/` for disposable working data, write normalized output to `processed/`,
and promote validated records to `reservations/`. Importers should not modify
the original source documents.

The `.gitkeep` files preserve the directory layout in fresh clones, and this
README remains tracked. Do not force-add ignored source documents, generated
records, attachments, or cache files to Git.
