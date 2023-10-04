import { $el } from "../../../scripts/ui.js";
import { api } from "../../../scripts/api.js";
import { send_message_from_pausing_node } from "./image_chooser_messaging.js";

var class_of_current_node;
function node_is_chooser(node) {
    class_of_current_node = node?.comfyClass;
    return (node?.comfyClass === "Image Chooser" || node?.comfyClass === "Latent Chooser" || node?.comfyClass === "Multi Latent Chooser");
}

const hovering_cancel = $el("div", {
    style: { 
        "position": "fixed", 
        "top":"100px", 
        "left":"100px", 
        "border":"thin solid #f66", 
        "visibility":"hidden", 
        "padding":"8px", 
        "opacity":0.5,
    }},
    [
        $el("span", { style: {}, textContent: "" }),
        $el("button", {
            textContent: "Cancel",
            onclick: () => {
                api.interrupt();
                send_message_from_pausing_node('__cancel__');
            },
            style: {  }
        })
    ]
)
hovering_cancel.isVisible = false;
hovering_cancel.setVisible = (visible) => {
    if (visible===hovering_cancel.isVisible) return;
    hovering_cancel.isVisible = visible;
    hovering_cancel.style.visibility = (visible) ? "visible" : "hidden";
    hovering_cancel.firstChild.textContent = `Paused in ${class_of_current_node} (${app.runningNodeId}) - `;
};
document.body.append(hovering_cancel);

function flow_is_paused() {
    return hovering_cancel.isVisible;
}

export { hovering_cancel, node_is_chooser, flow_is_paused }