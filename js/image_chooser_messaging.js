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

function send_cancel() {
    send_message(-1,'__cancel__');
    api.interrupt();
}

export { send_message_from_pausing_node, send_cancel, send_message }
