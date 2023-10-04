import { api } from "../../../scripts/api.js";

function send_message_from_pausing_node(message) {
    const id = app.graph._nodes_by_id[app.runningNodeId.toString()].widgets[0].value;
    send_message(id, message);
}

function send_message(id, message) {
    const body = new FormData();
    body.append('message',message);
    body.append('id', id);
    api.fetchApi("/image_chooser_message", { method: "POST", body, });
}

function message_button(node, label, make_value) {
    return node.addWidget("button", label, "", () => {
        if (app.runningNodeId===node.id.toString()) {
            send_message(node.widgets[0].value, make_value(node))
        };
    });
}

function cancel_button(node) {
    return message_button(node, "cancel", (node) => {
        document.getElementById("autoQueueCheckbox").checked = false;
        api.interrupt();
        return '__cancel__';
    })
}

export { send_message, send_message_from_pausing_node, message_button, cancel_button }