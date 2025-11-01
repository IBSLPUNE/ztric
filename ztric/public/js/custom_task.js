frappe.ui.form.on('Task', {
    refresh(frm) {
      // Render the Add Note UI
      if (frm.fields_dict.custom_notes_html) {
        render_notes_ui(frm);
      }
    }
  });
  
  // Core UI Rendering Function
  function render_notes_ui(frm) {
    const $wrapper = frm.fields_dict.custom_notes_html.$wrapper;
    $wrapper.empty();
  
    // Add the + New Note button
    const $button = $(`<div class="mb-3"><button class="btn btn-sm btn-primary">+ New Note</button></div>`);
    $wrapper.append($button);
  
    // Bind Add Note action
    $button.find('button').on('click', () => {
      frappe.prompt([
        {
          label: 'Note',
          fieldname: 'note',
          fieldtype: 'Small Text',
          reqd: true
        }
      ], (values) => {
        frappe.call({
          method: "run_doc_method",
          args: {
            docs: frm.doc,
            method: "add_note",
            args: {
              note: values.note
            }
          },
          callback: function (r) {
            if (!r.exc) {
              frappe.show_alert({ message: __('Note added'), indicator: 'green' });
              frm.reload_doc();
            }
          }
        });
      }, __('Add Note'));
    });
  
    // Render existing notes
    const notes = frm.doc.custom_note || [];
    if (!notes.length) {
      $wrapper.append(`<div class="text-muted mt-2">No notes yet.</div>`);
      return;
    }
  
    notes.reverse().forEach((n, idx) => {
      const dateStr = frappe.datetime.str_to_user(n.added_on || '');
      const username = frappe.user.full_name(n.added_by || '') || n.added_by || 'Unknown';
      const avatar = `<div class="avatar avatar-small"><div class="standard-image">${username[0]}</div></div>`;
  
      const html = `
        <div class="comment-box mb-3 p-2 border rounded">
          <div class="d-flex align-items-start">
            ${avatar}
            <div class="ms-2" style="flex:1;">
              <strong>${username}</strong><br>
              <span class="text-muted">${dateStr}</span>
              <p class="mt-2">${frappe.utils.escape_html(n.note)}</p>
            </div>
            <div class="ms-2">
              <a href="#" class="text-muted edit-note" data-idx="${idx}" title="Edit"><i class="fa fa-pencil"></i></a>
              <a href="#" class="text-muted ms-2 delete-note" data-idx="${idx}" title="Delete"><i class="fa fa-trash"></i></a>
            </div>
          </div>
        </div>
      `;
  
      $wrapper.append(html);
    });
  
    // Handle edit
    $wrapper.find('.edit-note').on('click', function (e) {
      e.preventDefault();
      const idx = $(this).data('idx');
      const note = frm.doc.custom_note[idx];
      frappe.prompt([
        {
          label: 'Note',
          fieldname: 'note',
          fieldtype: 'Small Text',
          reqd: true,
          default: note.note
        }
      ], (values) => {
        frappe.call({
          method: "ibsl_school.ibsl_school.custom_task.CustomTask.edit_note",
          args: {
            note_idx: idx,
            note: values.note,
            name: frm.doc.name
          },
          callback: function () {
            frm.reload_doc();
          }
        });
      }, __('Edit Note'));
    });
  
    // Handle delete
    $wrapper.find('.delete-note').on('click', function (e) {
      e.preventDefault();
      const idx = $(this).data('idx');
      frappe.confirm('Are you sure you want to delete this note?', () => {
        frappe.call({
          method: "ibsl_school.ibsl_school.custom_task.CustomTask.delete_note",
          args: {
            note_idx: idx,
            name: frm.doc.name
          },
          callback: function () {
            frm.reload_doc();
          }
        });
      });
    });
  }
  