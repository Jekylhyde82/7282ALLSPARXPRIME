#!/usr/bin/env python3
"""Validate the Universal Engine capability register without third-party dependencies.

Usage:
  python tools/validate_capability_register.py docs/architecture/capability-candidates.json
"""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

ID_RE = re.compile(r"^UE-CAP-[0-9]{6}$")
SCORE_KEYS = {
    "capability", "intelligence", "performance", "reliability", "security",
    "interoperability", "autonomy", "evolution", "value",
}
RELATION_KEYS = {"dependencies", "complements", "overlaps", "conflicts", "alternatives"}
APPROVAL_KEYS = (
    "approved_for_installation", "approved_for_execution",
    "approved_for_integration", "approved_for_spending",
)


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    if len(sys.argv) != 2:
        fail("provide exactly one candidate catalogue JSON path")
    path = Path(sys.argv[1])
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"cannot parse {path}: {exc}")

    candidates = data.get("candidates")
    if not isinstance(candidates, list):
        fail("candidates must be an array")

    ids = [item.get("candidate_id") for item in candidates]
    if any(not isinstance(value, str) or not ID_RE.fullmatch(value) for value in ids):
        fail("every candidate must have an immutable UE-CAP-NNNNNN ID")
    if len(ids) != len(set(ids)):
        fail("candidate IDs are not unique")

    id_set = set(ids)
    errors: list[str] = []
    for item in candidates:
        cid = item["candidate_id"]
        evaluation = item.get("evaluation", {})
        scores = evaluation.get("scores", {})
        if set(scores) != SCORE_KEYS:
            errors.append(f"{cid}: score keys do not match the nine evaluation dimensions")
        for key, value in scores.items():
            if value is not None and (not isinstance(value, (int, float)) or not 0 <= value <= 5):
                errors.append(f"{cid}: {key} score must be null or between 0 and 5")
        relationships = item.get("relationships", {})
        for relation in RELATION_KEYS:
            refs = relationships.get(relation, [])
            if not isinstance(refs, list):
                errors.append(f"{cid}: relationship {relation} must be an array")
                continue
            for ref in refs:
                if ref not in id_set:
                    errors.append(f"{cid}: {relation} references unknown ID {ref}")
        decision = item.get("decision", {})
        for key in APPROVAL_KEYS:
            if not isinstance(decision.get(key), bool):
                errors.append(f"{cid}: decision.{key} must be boolean")
        verification = item.get("verification", {})
        licence = verification.get("license", {})
        if licence.get("status") in (None, ""):
            errors.append(f"{cid}: licence verification state must be explicit")
        if item.get("lifecycle_state") not in {
            "Discovered", "Proposed", "Under Evaluation", "Approved",
            "Integrated", "Rejected", "Retired",
        }:
            errors.append(f"{cid}: unknown lifecycle state")

    next_sequence = data.get("next_candidate_sequence")
    if not isinstance(next_sequence, int) or next_sequence <= 0:
        errors.append("next_candidate_sequence must be a positive integer")
    elif ids and next_sequence <= max(int(value[-6:]) for value in ids):
        errors.append("next_candidate_sequence must exceed every allocated ID")

    model = data.get("integration_model", {})
    for group, refs in model.get("capability_groups", {}).items():
        for ref in refs:
            if ref not in id_set:
                errors.append(f"integration group {group} references unknown ID {ref}")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        raise SystemExit(1)

    print(
        "PASS: "
        f"{len(candidates)} candidates; {len(id_set)} unique IDs; "
        f"{len(model.get('capability_groups', {}))} capability groups; "
        f"next ID UE-CAP-{next_sequence:06d}"
    )


if __name__ == "__main__":
    main()
