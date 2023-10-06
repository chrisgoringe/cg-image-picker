import { $el } from "../../../scripts/ui.js";
import { send_cancel } from "./image_chooser_messaging.js";

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
        "opacity":0.8,
    }},
    [
        $el("span", { style: {}, textContent: "" }),
        $el("button", {
            textContent: "Cancel",
            onclick: () => {send_cancel();},
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

class FlowState {
    constructor(){}
    static idle() {
        return (!app.runningNodeId);
    }
    static paused() {
        return hovering_cancel.isVisible;
    }
    static running() {
        return (app.runningNodeId>=0);
    }
    static here(node_id) {
        return (app.runningNodeId==node_id);
    }
}

export { hovering_cancel, node_is_chooser, FlowState }