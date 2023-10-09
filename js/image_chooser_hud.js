import { $el } from "../../../scripts/ui.js";
import { send_cancel } from "./image_chooser_messaging.js";

class HUD {

    constructor() {
        this.span = $el("span", { style: {}, textContent: "" });
        this.the_cancel_button = $el("button", {
            textContent: "Cancel",
            onclick: () => {send_cancel();},
            style: {  }
        })
        this.hud = $el("div", {
            style: { 
                "position": "fixed", 
                "top":"10px", 
                "left":"10px", 
                "border":"thin solid #f66", 
                "padding":"8px", 
                "opacity":0.8,
            }},
            [
                this.span, this.the_cancel_button
            ]
        )
        this.span.textContent = "Idle";
        this.the_cancel_button.style.display = "none";

        document.body.append(this.hud);
        this.current_node_id = undefined;
        this.class_of_current_node = null;
        this.current_node_is_chooser = false;
    }

    update() {
        if (app.runningNodeId==this.current_node_id) return;

        this.current_node_id = app.runningNodeId;
        
        if (this.current_node_id) {
            this.class_of_current_node = app.graph?._nodes_by_id[app.runningNodeId.toString()]?.comfyClass;
            this.current_node_is_chooser = (this.class_of_current_node === "Image Chooser" || 
                                            this.class_of_current_node === "Latent Chooser" || 
                                            this.class_of_current_node === "Multi Latent Chooser" ||
                                            this.class_of_current_node === "Preview Chooser");
            this.span.textContent = `${FlowState.state()} in ${this.class_of_current_node} (${this.current_node_id}) `;
            this.the_cancel_button.style.display = "inline";
        } else {
            this.class_of_current_node = undefined;
            this.current_node_is_chooser = false;
            this.span.textContent = "Idle";
            this.the_cancel_button.style.display = "none";
        }
    }
}

const hud = new HUD();

class FlowState {
    constructor(){}
    static idle() {
        return (!app.runningNodeId);
    }
    static paused() {
        return (hud.current_node_is_chooser);
    }
    static running() {
        return (app.runningNodeId>=0);
    }
    static here(node_id) {
        return (app.runningNodeId==node_id);
    }
    static state() {
        if (FlowState.paused()) return "Paused";
        if (FlowState.running()) return "Running";
        if (FlowState.idle()) return "Idle";
        return "?";
    }
}

export { hud, FlowState }