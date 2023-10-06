import { app } from "../../../scripts/app.js";
import { restart_from_here } from "./image_chooser_prompt.js";

import { hovering_cancel, node_is_chooser, FlowState } from "./image_chooser_hud.js";
import { message_button, cancel_button, send_message_from_pausing_node, send_cancel, send_message } from "./image_chooser_messaging.js";
import { Logger } from "./logger.js";

app.registerExtension({
	name: "cg.custom.image_chooser",
    setup() {
        const draw = LGraphCanvas.prototype.draw;
        LGraphCanvas.prototype.draw = function() {
            hovering_cancel.setVisible(app.runningNodeId && node_is_chooser(app.graph._nodes_by_id[app.runningNodeId.toString()]));
            draw.apply(this,arguments);
        }

        const original_getCanvasMenuOptions = LGraphCanvas.prototype.getCanvasMenuOptions;
        LGraphCanvas.prototype.getCanvasMenuOptions = function () {
            const options = original_getCanvasMenuOptions.apply(this, arguments);
            if (app.runningNodeId) {
                options.push(null); // divider
                options.push({
                    content: `Cancel current run`,
                    callback: () => { send_cancel(); }
                });
            }
            return options;
        }

        // if we are reloading from another version, widget values might be broken...
        app.graph._nodes.forEach((node)=>{
            if (node.type==="Image Chooser" || node.type==="Latent Chooser") {
                node.widgets.forEach((w)=>{
                    if (w.type==="combo" && !w.options.values.includes(w.value)) w.value = w.options.values[0];
                    if (w.name==="choice" && !/[1-9]/.test(w.value)) w.value = "1";  // choice must contain a number>0
                })
            }
        })
    },
    async nodeCreated(node) {
        if (node?.comfyClass === "Multi Latent Chooser") {
            const go_widget = message_button(node, "go", (node)=>{ 
                return {
                    positive : node.widgets[1].value,
                    negative : node.widgets[2].value,
                    mode     : node.widgets[3].value,
                }
            });
            const cancel_widget = cancel_button(node);
            go_widget.serialize = false;
            cancel_widget.serialize = false;
        }
    },
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeType?.comfyClass==="Preview for Image Chooser") {
            const getExtraMenuOptions = nodeType.prototype.getExtraMenuOptions;
            nodeType.prototype.getExtraMenuOptions = function(_, options) {
                getExtraMenuOptions?.apply(this,arguments);
                const imageIndex = (this.imageIndex != null) ? this.imageIndex : this.overIndex;
                if (FlowState.paused()) {
                    if (imageIndex!=null) {
                        options.unshift(
                            {
                                content: "Progress this image",
                                callback: () => { 
                                    send_message_from_pausing_node(imageIndex+1); 
                                }
                            },
                            null,
                        )
                    }
                    options.unshift(
                        {
                            content: "Cancel this run",
                            callback: () => { 
                                send_cancel(); 
                            }
                        },
                        null,
                    );
                }
                if (FlowState.idle() && imageIndex!=null) { 
                    options.unshift(
                        {
                            content: "Progress this image (as restart)",
                            callback: () => { 
                                restart_from_here(this.id, true).then(() => {send_message(-1, imageIndex+1)});
                            }
                        },
                        null,
                    )
                }
            }
        }

        if (nodeType?.comfyClass === "Image Chooser" || nodeType?.comfyClass === "Latent Chooser") {
            nodeType.prototype.isChooser = true;
            const getExtraMenuOptions = nodeType.prototype.getExtraMenuOptions;
            nodeType.prototype.getExtraMenuOptions = function(_, options) {
                getExtraMenuOptions?.apply(this,arguments);
                if (FlowState.idle()) {  // && this.hasBeenExecutedAtLeastOnce
                    options.push(
                        {
                            content: "Restart from here",
                            callback: async () => {
                                Logger.trace("Restart from here", arguments, this);
                                restart_from_here(this.id).then(() => {send_message(this.widgets[0].value, this.widgets[1].value)});
                            }
                        },
                        null,
                    )
                }
                if (FlowState.here(this.id)) {
                    options.push(
                        {
                            content: "Go",
                            callback: async () => {
                                Logger.trace("Go", arguments, this);
                                send_message(this.widgets[0].value, this.widgets[1].value);
                            }
                        },
                        {
                            content: "Cancel",
                            callback: async () => {
                                Logger.trace("cancel", arguments, this);
                                send_cancel();
                            }
                        },
                        null,
                    )
                }
            }
        }
    },
});

