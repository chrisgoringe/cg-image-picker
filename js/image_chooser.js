import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

import { restart_from_here } from "./image_chooser_prompt.js";
import { hud, FlowState } from "./image_chooser_hud.js";
import { send_cancel, send_message, send_onstart, skip_next_restart_message } from "./image_chooser_messaging.js";
import { display_preview_images, additionalDrawBackground, click_is_in_image } from "./image_chooser_preview.js";

function progressButtonPressed() {
    const node = app.graph._nodes_by_id[this.node_id];
    if (node && FlowState.paused_here(node.id) && node?.selected?.size>0) {
        send_message(node.widgets[0].value, [...node.selected]); 
    }
    if (node && FlowState.idle() && node?.selected?.size>0) {
        skip_next_restart_message();
        restart_from_here(node.id).then(() => { send_message(node.widgets[0].value, [...node.selected]); });
    }
}

function cancelButtonPressed() { if (FlowState.running()) { send_cancel(); } }

/*
Comfy uses 'clicked' to make the button flash; so just disable that.
This *doesn't* stop the callback, it's totally cosmetic!
*/
function enable_disabling(button) {
    Object.defineProperty(button, 'clicked', {
        get : function() { return this._clicked; },
        set : function(v) { this._clicked = (v && this.name!=''); }
    })
}

app.registerExtension({
	name: "cg.custom.image_chooser",
    setup() {
        const draw = LGraphCanvas.prototype.draw;
        LGraphCanvas.prototype.draw = function() {
            if (hud.update()) {
                app.graph._nodes.forEach((node)=> { if (node.update) { node.update(); } })
            }
            draw.apply(this,arguments);
        }

        const original_api_interrupt = api.interrupt;
        api.interrupt = function () {
            if (FlowState.paused()) send_cancel();
            original_api_interrupt.apply(this, arguments);
        }

        function earlyImageHandler(event) {
            display_preview_images(event);
        }
        api.addEventListener("early-image-handler", earlyImageHandler);
        api.addEventListener("execution_start", send_onstart);
    },

    async nodeCreated(node) {
        if (node?.comfyClass === "Preview Chooser") {
            /* Don't allow imageIndex to be set - this stops images jumping to the front when clicked */
            Object.defineProperty(node, 'imageIndex', {
                get : function() { return null; },
                set : function( v ) { }
            })
            /* A property defining the top of the image when there is just one */
            Object.defineProperty(node, 'imagey', {
                get : function() { return this.widgets[this.widgets.length-1].last_y+LiteGraph.NODE_WIDGET_HEIGHT; }
            })

            /* Capture clicks */
            const org_onMouseDown = node.onMouseDown;
            node.onMouseDown = function( e, pos, canvas ) {
                if (e.isPrimary) {
                    const i = click_is_in_image(node, pos);
                    if (i>=0) { this.imageClicked(i); }
                }
                return (org_onMouseDown && org_onMouseDown.apply(this, arguments));
            }

            /* The buttons */
            node.cancel_button_widget = node.addWidget("button", "", "", cancelButtonPressed);
            node.send_button_widget = node.addWidget("button", "", "", progressButtonPressed);
            enable_disabling(node.cancel_button_widget)
            enable_disabling(node.send_button_widget)
        }
    },
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeType?.comfyClass==="Preview Chooser") {

            /* Code to draw the boxes around selected images */
            const onDrawBackground = nodeType.prototype.onDrawBackground;
            nodeType.prototype.onDrawBackground = function(ctx) {
                onDrawBackground.apply(this, arguments);
                additionalDrawBackground(this, ctx);
            }

            /* Code to handle clicks on images */
            nodeType.prototype.imageClicked = function (imageIndex) {
                if (this.selected.has(imageIndex)) this.selected.delete(imageIndex);
                else this.selected.add(imageIndex);
                this.update();
            }

            /* Update the node when the flow state changes - change button labels */
            const update = nodeType.prototype.update;
            nodeType.prototype.update = function() {
                if (update) update.apply(this,arguments);
                if (this.send_button_widget) {
                    this.send_button_widget.node_id = this.id;
                    if (FlowState.paused_here(this.id) && this.selected && this.selected.size>0) {
                        this.send_button_widget.name = (this.selected.size>1) ? "Progress selected images" : "Progress selected image";
                    } else if (FlowState.idle() && this.selected && this.selected.size>0) {
                        this.send_button_widget.name = (this.selected.size>1) ? "Progress selected images as restart" : "Progress selected image as restart";
                    } else {
                        this.send_button_widget.name = "";
                    }
                }
                if (this.cancel_button_widget) this.cancel_button_widget.name = FlowState.running() ? "Cancel current run" : "";
                this.setDirtyCanvas(true,true); 
            }
        }
    },
});

