# -*- coding: utf-8 -*-
"""
Push the corrected MoSCoW priority (field) + regenerated description (which embeds
"Prioridade (MoSCoW): X") to existing Jira stories whose priority changed away from Must.

Why this exists: sync.py is create-only/idempotent (it SKIPS issues that already exist),
so after re-classifying the backlog it cannot fix the descriptions/priority of issues
already on the board. This script is the update path. It reads the (now corrected)
backlog_data.py as the source of truth and only touches stories that are not Must,
matching them to live issues via created.json.

Idempotent: re-running PUTs the same body. Safe.

Usage:
  python3 update_priorities.py --dry-run   # show what would change, touch nothing
  python3 update_priorities.py             # apply
"""
import sys, os, time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import backlog_data as BD
import sync  # reuse api(), story_desc(), PRIO, load_ledger(), JIRA_TOKEN


def main():
    dry = "--dry-run" in sys.argv
    if not sync.JIRA_TOKEN and not dry:
        print("ERROR: JIRA_API_TOKEN not in env"); sys.exit(1)

    ledger = sync.load_ledger()
    # only stories that are NOT Must need correcting (Must already = High on the board)
    targets = [s for s in BD.STORIES if s[4] != "Must"]
    print(f"=== UPDATE PRIORITIES: {len(targets)} non-Must stories ===")

    ok = fail = skip = 0
    for (sid, epic, title, sentence, prio, pts, rfs, gherkin) in targets:
        rec = ledger.get(sid)
        if not rec:
            print(f"  {sid}: NOT IN LEDGER (skip)"); skip += 1; continue
        key = rec["key"]
        desc = sync.story_desc(sid, epic, sentence, prio, pts, rfs, gherkin)
        fields = {"description": desc, "priority": {"id": sync.PRIO[prio]}}
        if dry:
            print(f"  DRY {key} ({sid}): -> {prio} (P{sync.PRIO[prio]})"); continue
        st, resp = sync.api("PUT", f"/rest/api/3/issue/{key}", {"fields": fields})
        if st in (200, 204):
            print(f"  {key} ({sid}): updated -> {prio}"); ok += 1
        else:
            print(f"  {key} ({sid}): FAIL {st} {resp}"); fail += 1
        time.sleep(0.15)

    if not dry:
        print(f"\nDone: {ok} updated, {fail} failed, {skip} skipped.")


if __name__ == "__main__":
    main()
