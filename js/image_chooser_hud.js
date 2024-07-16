import { $el } from "../../scripts/ui.js";
import { app } from "../../scripts/app.js";

class HUD {
    // define style "constants"
    #VISIBLE_OPACITY = 0.8;
    #INVISIBLE_OPACITY = 0;

    // define side and offset placeholders and defaults
    #side = "left";
    #sideOffset = 10;

    constructor() {
        this.span = $el("span", { style: { color:"white" }, textContent: "" });
        this.hud = $el("div", {
            style: { 
                "position": "fixed", 
                "top":"10px", 
                "left": this.#sideOffset + "px", 
                "border":"thin solid #f66", 
                "padding":"8px", 
                "opacity": this.#VISIBLE_OPACITY,
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

    moveHorizontalPosition(newHorizontalOffset) {
        this.#sideOffset = newHorizontalOffset;

        this.hud.style[this.#side] = this.#sideOffset + "px";
    }

    moveVerticalPosition(newtop) {
        this.hud.style.top = `${newtop}px`;
    }

    setVisibility(newVisibility) {
        this.hud.style.opacity = newVisibility ? this.#VISIBLE_OPACITY : this.#INVISIBLE_OPACITY;
    }

    setSide(newSide) {
        this.#side = newSide;
        const oldSide = newSide === "left" ? "right" : "left";
        
        this.hud.style[newSide] = this.#sideOffset + "px";
        this.hud.style[oldSide] = "";
    }

    update() {
        if (app.runningNodeId==this.current_node_id) return false;

        this.current_node_id = app.runningNodeId;
        
        if (this.current_node_id) {
            this.class_of_current_node = app.graph?._nodes_by_id[app.runningNodeId.toString()]?.comfyClass;
            this.current_node_is_chooser = (this.class_of_current_node === "Preview Chooser Fabric" || 
                                            this.class_of_current_node === "Simple Chooser" ||
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