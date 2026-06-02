# -*- coding: utf-8 -*-
"""
Phase 2: reconcile the 143 legacy CEO issues with the v2 backlog (created in phase 1).
Strategy (user-approved):
  - Keep all DONE issues; re-parent them under the matching v2 epic (preserve as 'what's built').
  - Adopt v2-language stragglers (CEO-195 dup of our CEO-229 -> keep 195, delete 229; CEO-191 -> EP02).
  - Carry IN PROGRESS legacy forward (re-parent under matching v2 epic; never closed).
  - Park dead Gen-1 'To Do' tasks under a new 'Legado (v1)' archive epic + label legacy-v1.
  - Close the old legacy epics by emptying them (their kids move); legacy epics themselves get label legacy-v1
    and parked (epics can't be parented, so just labelled + left, off the v2 board).
  - SCRUM/CUG handled separately (project-level), reported not auto-deleted.

Everything reversible via phase2_ledger.json (records every change: {issue: {field: old->new}}).
Workflow has only To Do/In Progress/Done, so NO status changes are made to dead tasks (just label+reparent).

Usage:
  python3 phase2.py --dry-run
  python3 phase2.py
  python3 phase2.py --rollback
"""
import sys, os, json, time, base64, urllib.request, urllib.error, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
JIRA_URL = "https://grupo5ds.atlassian.net"
JIRA_USER = "ltog@cin.ufpe.br"
JIRA_TOKEN = os.environ.get("JIRA_API_TOKEN", "")
AUTH = base64.b64encode(f"{JIRA_USER}:{JIRA_TOKEN}".encode()).decode()
P2LEDGER = os.path.join(HERE, "phase2_ledger.json")
P1LEDGER = os.path.join(HERE, "created.json")
LEGACY_LABEL = "legacy-v1"

# v2 epic keys from phase-1 ledger (sid -> key)
def v2_epics():
    d = json.load(open(P1LEDGER, encoding="utf-8"))
    return {sid: rec["key"] for sid, rec in d.items() if rec["type"] == "epic"}

def api(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(JIRA_URL + path, data=data, method=method,
        headers={"Authorization": f"Basic {AUTH}", "Accept": "application/json", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read().decode(); return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        return e.code, {"ERROR": e.read().decode()[:400]}

def jql(q, fields="summary,issuetype,status,parent,labels"):
    out=[]; tok=None
    for _ in range(8):
        p={"jql":q,"maxResults":"100","fields":fields}
        if tok: p["nextPageToken"]=tok
        st,d = api("GET", f"/rest/api/3/search/jql?{urllib.parse.urlencode(p)}")
        out+=d.get("issues",[]); tok=d.get("nextPageToken")
        if not tok or d.get("isLast"): break
    return out

# ---- Map legacy epic -> v2 epic (sid) for re-parenting its DONE/IP children ----
EPIC_MAP = {
    "CEO-188": "EP01",   # Acesso e identidade
    "CEO-5":   "EP01",   # Tela de login
    "CEO-43":  "EP02",   # Gestão de Itens
    "CEO-132": "EP02",   # Product CRUD (empty)
    "CEO-9":   "EP02",   # Banco de Dados -> closest v2 home is catalog/estoque (DB setup)
    "CEO-17":  "EP04",   # Entrada e Saída -> pedidos/movimentação
    "CEO-19":  "EP05",   # Alertas de Escassez -> dashboards/alertas
    "CEO-18":  None,     # Tags de Itens -> no v2 home (out of scope) -> Legado
    "CEO-44":  "EP02",   # Integração de sistemas -> infra under catalog
    "CEO-203": None,     # Organização do Projeto -> keep as chores (Legado archive)
    "CEO-136": "EP01",   # Definir Stack (parentless done task group)
}
DONE = ("Done", "Concluído")

def load_led():
    return json.load(open(P2LEDGER, encoding="utf-8")) if os.path.exists(P2LEDGER) else {"actions": []}
def save_led(d): json.dump(d, open(P2LEDGER,"w",encoding="utf-8"), ensure_ascii=False, indent=2)

def reparent(key, new_parent, led, dry):
    st,cur = api("GET", f"/rest/api/3/issue/{key}?fields=parent")
    old = (cur.get("fields",{}).get("parent") or {}).get("key")
    if old == new_parent: return "noop"
    if dry: return f"DRY reparent {key}: {old} -> {new_parent}"
    st,r = api("PUT", f"/rest/api/3/issue/{key}", {"fields":{"parent":{"key":new_parent}}})
    if st in (200,204):
        led["actions"].append({"issue":key,"op":"reparent","old":old,"new":new_parent}); save_led(led)
        return f"reparent {key}: {old} -> {new_parent}"
    return f"FAIL reparent {key}: {st} {r}"

def add_label(key, label, led, dry):
    if dry: return f"DRY label {key} += {label}"
    st,r = api("PUT", f"/rest/api/3/issue/{key}", {"update":{"labels":[{"add":label}]}})
    if st in (200,204):
        led["actions"].append({"issue":key,"op":"label_add","label":label}); save_led(led)
        return f"label {key} += {label}"
    return f"FAIL label {key}: {st} {r}"

def main():
    dry = "--dry-run" in sys.argv
    if "--rollback" in sys.argv:
        led = load_led()
        print(f"=== ROLLBACK {len(led['actions'])} actions ===")
        for a in reversed(led["actions"]):
            if a["op"]=="reparent":
                if a["old"]:
                    api("PUT", f"/rest/api/3/issue/{a['issue']}", {"fields":{"parent":{"key":a['old']}}})
                print(f"  revert reparent {a['issue']} -> {a['old']}")
            elif a["op"]=="label_add":
                api("PUT", f"/rest/api/3/issue/{a['issue']}", {"update":{"labels":[{"remove":a['label']}]}})
                print(f"  remove label {a['issue']} -= {a['label']}")
            elif a["op"]=="create_epic":
                api("DELETE", f"/rest/api/3/issue/{a['key']}")
                print(f"  delete archive epic {a['key']}")
            elif a["op"]=="delete_dup":
                print(f"  NOTE: cannot un-delete {a['issue']} (was a phase-1 dup); recreate via sync.py if needed")
        save_led({"actions": []})
        print("Rollback done.")
        return

    if not JIRA_TOKEN: print("ERROR: no token"); sys.exit(1)
    led = load_led()
    EP = v2_epics()
    print("v2 epics:", EP, "\n")

    legacy = jql('project = CEO AND (labels != "backlog-v2" OR labels is EMPTY)')
    epics  = [i for i in legacy if i["fields"]["issuetype"]["name"]=="Epic"]
    nonep  = [i for i in legacy if i["fields"]["issuetype"]["name"]!="Epic"]

    # 1) Create the Legado (v1) archive epic
    arch_key = None
    for a in led["actions"]:
        if a["op"]=="create_epic": arch_key=a["key"]
    if not arch_key:
        if dry:
            arch_key="DRY-LEGADO"; print("DRY create archive epic 'Legado (v1) — arquivo'")
        else:
            st,r = api("POST","/rest/api/3/issue",{"fields":{
                "project":{"key":"CEO"},"issuetype":{"id":"10049"},
                "summary":"Legado (v1) — arquivo (não-MVP)",
                "labels":[LEGACY_LABEL]}})
            if st==201:
                arch_key=r["key"]; led["actions"].append({"op":"create_epic","key":arch_key}); save_led(led)
                print(f"created archive epic -> {arch_key}")
            else:
                print("FAIL create archive epic:", st, r); return

    # 2) Dedup: CEO-195 (active, v2-language) duplicates our CEO-229. Adopt 195, delete 229.
    dup229 = None
    p1 = json.load(open(P1LEDGER, encoding="utf-8"))
    if "US-EP02-01" in p1: dup229 = p1["US-EP02-01"]["key"]
    print(f"\n--- dedup CEO-195 vs {dup229} ---")
    print(" ", add_label("CEO-195", "backlog-v2", led, dry))
    print(" ", reparent("CEO-195", EP["EP02"], led, dry))
    if dup229 and not dry:
        # only delete if our created one is still there & is the empty dup
        st,_ = api("DELETE", f"/rest/api/3/issue/{dup229}")
        led["actions"].append({"op":"delete_dup","issue":dup229}); save_led(led)
        print(f"  deleted phase-1 dup {dup229} (CEO-195 adopted)")
    elif dry:
        print(f"  DRY delete phase-1 dup {dup229}")
    # CEO-191 -> EP02 adopt
    print(" ", add_label("CEO-191","backlog-v2",led,dry), "/", reparent("CEO-191", EP["EP02"], led, dry))

    # 3) Re-parent non-epic legacy issues
    print("\n--- re-parent legacy tasks/stories ---")
    moved_done=moved_ip=parked=0
    for i in nonep:
        key=i["key"]; st_name=i["fields"]["status"]["name"]
        if key in ("CEO-195","CEO-191"): continue
        old_parent=(i["fields"].get("parent") or {}).get("key")
        target_sid = EPIC_MAP.get(old_parent, "__none__")
        if st_name in DONE or st_name=="In Progress":
            # carry forward under matching v2 epic if known, else archive
            dest = EP.get(target_sid) if target_sid and target_sid!="__none__" and target_sid else None
            if not dest: dest = arch_key
            r=reparent(key, dest, led, dry)
            if "FAIL" not in r and "noop" not in r:
                (moved_done:=moved_done+1) if st_name in DONE else (moved_ip:=moved_ip+1)
            # done/IP keep their status; tag legacy origin only if archived
            if dest==arch_key: add_label(key, LEGACY_LABEL, led, dry)
        else:
            # To Do dead task -> archive epic + legacy-v1 label
            reparent(key, arch_key, led, dry)
            add_label(key, LEGACY_LABEL, led, dry)
            parked+=1
    print(f"  done carried: {moved_done}, in-progress carried: {moved_ip}, parked-to-archive: {parked}")

    # 4) Label the old legacy epics legacy-v1 (they stay, off v2 board)
    print("\n--- label legacy epics ---")
    for e in epics:
        print("  ", add_label(e["key"], LEGACY_LABEL, led, dry))

    save_led(led)
    print(f"\nPhase2 ledger: {len(led['actions'])} actions -> {P2LEDGER}")
    print(f"Archive epic: {arch_key}")

if __name__=="__main__":
    main()
