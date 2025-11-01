import frappe
from frappe.utils import now
from erpnext.projects.doctype.task.task import Task
from frappe.model.document import Document

class CustomTask(Task):
    @frappe.whitelist()
    def add_note(self, note: str):
        self.append("custom_note", {
            "note": note,
            "added_by": frappe.session.user,
            "added_on": now()
        })
        self.save()
        return {"note": note, "added_by": frappe.session.user, "added_on": now()}

    @frappe.whitelist()
    def edit_note(self, note_idx: int, note: str):
        try:
            self.custom_note[note_idx].note = note
            self.save()
        except IndexError:
            frappe.throw("Invalid note index")
        return {"note": note}

    @frappe.whitelist()
    def delete_note(self, note_idx: int):
        try:
            self.custom_note.pop(note_idx)
            self.save()
        except IndexError:
            frappe.throw("Invalid note index")
        return {"deleted": True}
