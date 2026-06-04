# -*- coding: utf-8 -*-
"""
Additive, idempotent sync of the canonical v2 backlog (docs/PO) into the Jira CEO project.
Phase 1 (this script): create 7 epics + 37 stories, fully reversible.
  - Everything tagged label 'backlog-v2'.
  - Idempotent: each issue carries a hidden marker [sid] in the summary; re-runs skip existing.
  - Writes created.json ledger: {sid: {key, type}} for later remap/rollback.

Usage:
  python3 sync.py --dry-run     # show what would be created, touch nothing
  python3 sync.py               # create epics then stories
  python3 sync.py --rollback    # delete every issue in created.json (undo phase 1)
"""
import sys, os, json, time, base64, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import backlog_data as BD

JIRA_URL = "https://grupo5ds.atlassian.net"
JIRA_USER = "ltog@cin.ufpe.br"
JIRA_TOKEN = os.environ.get("JIRA_API_TOKEN", "")  # injected by caller
PROJECT = "CEO"
T_EPIC, T_STORY = "10049", "10048"
SP_FIELD = "customfield_10016"       # Story point estimate
LABEL = "backlog-v2"
LEDGER = os.path.join(HERE, "created.json")

AUTH = base64.b64encode(f"{JIRA_USER}:{JIRA_TOKEN}".encode()).decode()

def api(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(JIRA_URL + path, data=data, method=method,
        headers={"Authorization": f"Basic {AUTH}", "Accept": "application/json",
                 "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        return e.code, {"ERROR": e.read().decode()[:600]}

def adf_from_text(blocks):
    """blocks: list of (kind, text). kind in {'h','p','code'}."""
    content = []
    for kind, text in blocks:
        if kind == "h":
            content.append({"type": "heading", "attrs": {"level": 3},
                            "content": [{"type": "text", "text": text}]})
        elif kind == "code":
            content.append({"type": "codeBlock", "attrs": {},
                            "content": [{"type": "text", "text": text}]})
        else:
            for line in text.split("\n"):
                content.append({"type": "paragraph",
                                "content": [{"type": "text", "text": line}]} if line
                               else {"type": "paragraph"})
    return {"type": "doc", "version": 1, "content": content}

def epic_desc(sid, body):
    return adf_from_text([("p", body), ("p", f"[{sid}] · origem: docs/PO/05-backlog · sincronizado por backlog-v2")])

def story_desc(sid, epic, sentence, prio, pts, rfs, gherkin):
    return adf_from_text([
        ("p", sentence),
        ("h", "Critérios de aceite (Gherkin)"),
        ("code", gherkin),
        ("h", "Metadados"),
        ("p", f"Prioridade (MoSCoW): {prio}  ·  Estimativa: {pts} SP  ·  RFs: {rfs}  ·  Épico: {epic}"),
        ("p", f"[{sid}] · origem: docs/PO/05-backlog/02-user-stories.md · backlog-v2"),
    ])

PRIO = {"Must": "2", "Should": "3", "Could": "4", "Wont": "5"}  # -> High/Medium/Low/Lowest

def load_ledger():
    if os.path.exists(LEDGER):
        return json.load(open(LEDGER, encoding="utf-8"))
    return {}

def save_ledger(d):
    json.dump(d, open(LEDGER, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

def find_existing(sid):
    """Return existing issue key if an issue with marker [sid] already exists (idempotency)."""
    jql = f'project = {PROJECT} AND summary ~ "\\"{sid}\\"" ORDER BY created DESC'
    import urllib.parse
    q = urllib.parse.urlencode({"jql": jql, "maxResults": "5", "fields": "summary"})
    st, d = api("GET", f"/rest/api/3/search/jql?{q}")
    for i in d.get("issues", []):
        if f"[{sid}]" in i["fields"]["summary"]:
            return i["key"]
    return None

def main():
    dry = "--dry-run" in sys.argv
    rollback = "--rollback" in sys.argv
    # --only=EP07[,EP03] limits creation to those epics (and their stories)
    only = None
    for a in sys.argv:
        if a.startswith("--only="):
            only = set(a.split("=", 1)[1].split(","))
    ledger = load_ledger()

    if rollback:
        print("=== ROLLBACK: deleting", len(ledger), "issues from ledger ===")
        # delete stories first then epics (children before parents)
        order = sorted(ledger.items(), key=lambda kv: 0 if kv[1]["type"] == "story" else 1)
        for sid, rec in order:
            st, _ = api("DELETE", f"/rest/api/3/issue/{rec['key']}")
            print(f"  delete {rec['key']} ({sid}): {st}")
        save_ledger({})
        print("Ledger cleared.")
        return

    if not JIRA_TOKEN:
        print("ERROR: JIRA_API_TOKEN not in env"); sys.exit(1)

    # ---- Phase 1a: epics ----
    print(f"=== EPICS ({len(BD.EPICS)}) ===")
    epic_keys = {}
    for sid, title, body in BD.EPICS:
        if only and sid not in only:
            continue
        if sid in ledger:
            epic_keys[sid] = ledger[sid]["key"]; print(f"  {sid}: ledger -> {ledger[sid]['key']} (skip)"); continue
        ex = find_existing(sid)
        if ex:
            epic_keys[sid] = ex; ledger[sid] = {"key": ex, "type": "epic"}
            print(f"  {sid}: exists -> {ex} (adopt)"); continue
        summary = f"{title}  [{sid}]"
        if dry:
            print(f"  DRY would create EPIC: {summary}"); epic_keys[sid] = f"DRY-{sid}"; continue
        body_fields = {"project": {"key": PROJECT}, "issuetype": {"id": T_EPIC},
                       "summary": summary, "description": epic_desc(sid, body), "labels": [LABEL]}
        st, resp = api("POST", "/rest/api/3/issue", {"fields": body_fields})
        if st == 201:
            epic_keys[sid] = resp["key"]; ledger[sid] = {"key": resp["key"], "type": "epic"}
            print(f"  {sid}: CREATED -> {resp['key']}")
            save_ledger(ledger)
        else:
            print(f"  {sid}: FAIL {st} {resp}");
        time.sleep(0.15)

    # ---- Phase 1b: stories ----
    print(f"\n=== STORIES ({len(BD.STORIES)}) ===")
    for (sid, epic, title, sentence, prio, pts, rfs, gherkin) in BD.STORIES:
        if only and epic not in only:
            continue
        if sid in ledger:
            print(f"  {sid}: ledger -> {ledger[sid]['key']} (skip)"); continue
        ex = find_existing(sid)
        if ex:
            ledger[sid] = {"key": ex, "type": "story"}; print(f"  {sid}: exists -> {ex} (adopt)"); continue
        parent = epic_keys.get(epic)
        summary = f"{sid} — {title}"
        if dry:
            print(f"  DRY would create STORY under {parent}: {summary} (P{PRIO[prio]} {pts}SP)"); continue
        fields = {"project": {"key": PROJECT}, "issuetype": {"id": T_STORY},
                  "summary": summary, "description": story_desc(sid, epic, sentence, prio, pts, rfs, gherkin),
                  "labels": [LABEL], "priority": {"id": PRIO[prio]}, SP_FIELD: float(pts)}
        if parent and not parent.startswith("DRY"):
            fields["parent"] = {"key": parent}
        st, resp = api("POST", "/rest/api/3/issue", {"fields": fields})
        if st == 201:
            ledger[sid] = {"key": resp["key"], "type": "story", "epic": epic}
            print(f"  {sid}: CREATED -> {resp['key']}  (parent {parent})")
            save_ledger(ledger)
        else:
            print(f"  {sid}: FAIL {st} {resp}")
        time.sleep(0.15)

    save_ledger(ledger)
    print(f"\nLedger: {len([k for k,v in ledger.items() if v['type']=='epic'])} epics, "
          f"{len([k for k,v in ledger.items() if v['type']=='story'])} stories -> {LEDGER}")

if __name__ == "__main__":
    main()
