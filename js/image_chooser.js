import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

import { restart_from_here } from "./image_chooser_prompt.js";
import { hud, FlowState } from "./image_chooser_hud.js";
import { send_cancel, send_message } from "./image_chooser_messaging.js";
import { display_preview_images, additionalDrawBackground, click_is_in_image } from "./image_chooser_preview.js";

function buttonPressed() {
    if (FlowState.paused_here(this.node.id) && this.node?.selected?.size>0) {
        send_message(this.node.widgets[0].value, [...this.node.selected]); 
    }
    if (FlowState.idle() && this.node?.selected?.size>0) {
        restart_from_here(this.node.id).then(() => {send_message(this.node.widgets[0].value, [...this.node.selected])});
    }
}

app.registerExtension({
	name: "cg.custom.image_chooser",
    setup() {
        const draw = LGraphCanvas.prototype.draw;
        LGraphCanvas.prototype.draw = function() {
            if (hud.update()) {
                app.graph._nodes.forEach((node)=> {
                    if (node.send_button_widget) { node.send_button_widget.updateLabel(); }
                })
            }
            draw.apply(this,arguments);
        }

        const original_getCanvasMenuOptions = LGraphCanvas.prototype.getCanvasMenuOptions;
        LGraphCanvas.prototype.getCanvasMenuOptions = function () {
            const options = original_getCanvasMenuOptions.apply(this, arguments);
            if (FlowState.running()) {
                options.push(null); // divider
                options.push({
                    content: `Cancel current run`,
                    callback: () => { send_cancel(); }
                });
            }
            return options;
        }

        function earlyImageHandler(event) {
            display_preview_images(event);
        }
        api.addEventListener("early-image-handler", earlyImageHandler);
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

            /*
            node.buttonPressed = function() {
                if (FlowState.paused_here(this.node.id) && this.node?.selected?.size>0) {
                    send_message(this.node.widgets[0].value, [...this.node.selected]); 
                } else if (FlowState.idle() && this.node?.selected?.size>0) {
                    restart_from_here(this.node.id).then(() => {send_message(this.node.widgets[0].value, [...this.node.selected])});
                } 
            }*/

            /* The button */
            node.send_button_widget = node.addWidget("button", "", "", buttonPressed)
            node.send_button_widget.node = node;
            node.send_button_widget.updateLabel = function () {
                if (FlowState.paused_here(this.node.id) && this.node?.selected?.size>0) {
                    this.name = (this.node?.selected?.size>1) ? "Progress selected images" : "Progress selected image";
                } else if (FlowState.idle() && this.node?.selected?.size>0) {
                    this.name = (this.node?.selected?.size>1) ? "Progress selected images as restart" : "Progress selected image as restart";
                } else {
                    this.name = "";
                }
            }
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
                this.send_button_widget.updateLabel();
                this.setDirtyCanvas(true,true); 
            }
        }
    },
});

