import frappe
from frappe.utils import getdate, add_days

def on_task_before_save(doc, method=None):
    """Hook for Task before_save.

    Detect changes to Task.exp_end_date and shift dependent tasks accordingly.
    """

    # Skip if programmatically saving in recursion
    if getattr(frappe.flags, "skip_task_shift", False):
        return

    # Fetch old exp_end_date from DB (None if new)
    db_old_end = frappe.db.get_value("Task", doc.name, "exp_end_date")
    new_end = doc.exp_end_date

    if not db_old_end or not new_end:
        return

    try:
        old_date = getdate(db_old_end)
        new_date = getdate(new_end)
    except Exception:
        return  # invalid date -> skip

    delta_days = (new_date - old_date).days
    if delta_days == 0:
        return

    # Initialize visited tracker
    if not getattr(frappe.flags, "task_shift_visited", None):
        frappe.flags.task_shift_visited = set()

    frappe.flags.task_shift_visited.add(doc.name)

    # Start recursion
    shift_dependents_recursive(doc.name, delta_days, frappe.flags.task_shift_visited)


def shift_dependents_recursive(task_name, shift_days, visited):
    """Recursively shift all tasks that depend on task_name."""

    child_doctype = "Task Depends On"

    dependents = frappe.get_all(
        child_doctype,
        filters={"task": task_name},
        fields=["parent"]
    )

    for row in dependents:
        dependent = row.parent

        if dependent in visited:
            continue

        visited.add(dependent)

        try:
            dep_doc = frappe.get_doc("Task", dependent)
        except Exception:
            continue

        if dep_doc.get("exp_start_date"):
            dep_doc.exp_start_date = add_days(dep_doc.exp_start_date, shift_days)
        if dep_doc.get("exp_end_date"):
            dep_doc.exp_end_date = add_days(dep_doc.exp_end_date, shift_days)

        frappe.flags.skip_task_shift = True
        try:
            dep_doc.save(ignore_permissions=True)
        finally:
            frappe.flags.skip_task_shift = False

        # Recurse further
        shift_dependents_recursive(dependent, shift_days, visited)
