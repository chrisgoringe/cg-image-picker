import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

import { hovering_cancel, node_is_chooser, flow_is_paused } from "./image_chooser_hud.js";
import { message_button, cancel_button, send_message_from_pausing_node, send_message } from "./image_chooser_messaging.js";

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
                    callback: () => {
                        send_message(-1,'__cancel__');
                        api.interrupt();
                    }
                });
            }
            return options;
        }

        // if we are reloading from another version, widget values might be broken...
        app.graph._nodes.forEach((node)=>{
            if (node.type==="Image Chooser" || node.type==="Latent Chooser") {
                node.widgets.forEach((w)=>{
                    if (w.type==="combo" && !w.options.values.includes(w.value)) w.value = w.options.values[0];
                })
            }
        })
    },
    async nodeCreated(node) {
        if (node?.comfyClass === "Image Chooser" || node?.comfyClass === "Latent Chooser" ) {
            const pk_widget = node.addWidget("combo", "choice", 1, () => {}, { values: [1,2,3,4,5,6,7,8] });
            const go_widget = message_button(node, "go", (node)=>{ 
                return pk_widget.value 
            });
            const cancel_widget = cancel_button(node);
            go_widget.serialize = false;
            pk_widget.serialize = false;  
            cancel_widget.serialize = false;
        }
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
                if (flow_is_paused()) {
                    const imageIndex = (this.imageIndex != null) ? this.imageIndex : this.overIndex;
                    const saveIndex = options.findIndex((o)=>{return (o && o.content==="Save Image")});
                    options.splice(saveIndex,0,
                        {
                            content: "Progress this image",
                            callback: () => { send_message_from_pausing_node(imageIndex+1); }
                        }
                    );
                }
            }
        }
    },
});

