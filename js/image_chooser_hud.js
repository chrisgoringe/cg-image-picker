import { $el } from "../../scripts/ui.js";

class HUD {
    constructor() {
        this.span = $el("span", { style: {}, textContent: "" });
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
                this.span
            ]
        )
        this.span.textContent = "Idle";

        document.body.append(this.hud);
        this.current_node_id = undefined;
        this.class_of_current_node = null;
        this.current_node_is_chooser = false;
    }

    move(newtop) {
        this.hud.style.top = `${newtop}px`;
        this.hud.style.opacity = newtop>=0 ? 0.8 : 0;
    }

    update() {
        if (app.runningNodeId==this.current_node_id) return false;

        this.current_node_id = app.runningNodeId;
        
        if (this.current_node_id) {
            this.class_of_current_node = app.graph?._nodes_by_id[app.runningNodeId.toString()]?.comfyClass;
            this.current_node_is_chooser = (this.class_of_current_node === "Preview Chooser Fabric" || 
                                            this.class_of_current_node === "Preview Chooser");
            this.span.textContent = `${FlowState.state()} in ${this.class_of_current_node} (${this.current_node_id}) `;
        } else {
            this.class_of_current_node = undefined;
            this.current_node_is_chooser = false;
            this.span.textContent = "Idle";
        }
        return true;
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
    static paused_here(node_id) {
        return (FlowState.paused() && FlowState.here(node_id))
    }
    static running() {
        return (!FlowState.idle());
    }
    static here(node_id) {
        return (app.runningNodeId==node_id);
    }
    static state() {
        if (FlowState.paused()) return "Paused";
        if (FlowState.running()) return "Running";
        return "Idle";
    }
    static cancelling = false;
}

export { hud, FlowState }