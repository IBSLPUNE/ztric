frappe.ui.form.on("Task", {
    refresh: function(frm) {
        update_depends_on_dates(frm);
    },

    depends_on_add: function(frm) {
        update_depends_on_dates(frm);
    }
});

// Child table handler
frappe.ui.form.on("Task Depends On", {
    task: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.task) {
            frappe.db.get_value("Task", row.task, ["exp_start_date", "exp_end_date"])
                .then(r => {
                    if (r && r.message) {
                        frappe.model.set_value(cdt, cdn, "custom_expected_start_date", r.message.exp_start_date);
                        frappe.model.set_value(cdt, cdn, "custom_expected_end_date", r.message.exp_end_date);
                    }
                });
        }
    }
});

// Helper function
function update_depends_on_dates(frm) {
    if (!frm.doc.depends_on) return;

    frm.doc.depends_on.forEach(row => {
        if (row.task) {
            frappe.db.get_value("Task", row.task, ["exp_start_date", "exp_end_date"])
                .then(r => {
                    if (r && r.message) {
                        frappe.model.set_value(row.doctype, row.name, "custom_expected_start_date", r.message.exp_start_date);
                        frappe.model.set_value(row.doctype, row.name, "custom_expected_end_date", r.message.exp_end_date);
                    }
                });
        }
    });
}

