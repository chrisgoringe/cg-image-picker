import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

import { restart_from_here } from "./image_chooser_prompt.js";
import { hud, FlowState } from "./image_chooser_hud.js";
import { send_cancel, send_message } from "./image_chooser_messaging.js";
import { display_preview_images, additionalDrawBackground } from "./image_chooser_preview.js";

app.registerExtension({
	name: "cg.custom.image_chooser",
    setup() {
        const draw = LGraphCanvas.prototype.draw;
        LGraphCanvas.prototype.draw = function() {
            hud.update();
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
            Object.defineProperty(node, 'imageIndex', {
                get : function() { return null; },
                set : function( v ) {}
            })
        }
    },
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeType?.comfyClass==="Preview Chooser") {
            const onDrawBackground = nodeType.prototype.onDrawBackground;
            nodeType.prototype.onDrawBackground = function(ctx) {
                onDrawBackground.apply(this, arguments);
                additionalDrawBackground(this, ctx);
            }

            const getExtraMenuOptions = nodeType.prototype.getExtraMenuOptions;
            nodeType.prototype.getExtraMenuOptions = function(_, options) {
                getExtraMenuOptions?.apply(this,arguments);
                var imageIndex = (this.imageIndex != null) ? this.imageIndex : this.overIndex;
                if (!imageIndex && this?.imgs?.length==1) imageIndex = 0;
                if ((FlowState.paused() && FlowState.here(this.id)) || 
                    (FlowState.idle()   && this?.imgs?.length>0)) {
                    if (imageIndex!=null) {
                        options.unshift(null);
                        if (this.selected.has(imageIndex)) {
                            options.unshift(
                                {
                                    content: "Unselect",
                                    callback: () => { this.selected.delete(imageIndex); this.setDirtyCanvas(true,true); }
                                },
                            )
                        }
                        if (!this.selected.has(imageIndex)) {
                            options.unshift (
                                {
                                    content: "Select",
                                    callback: () => { this.selected.add(imageIndex); this.setDirtyCanvas(true,true);  }
                                }
                            )
                        }
                        if ((this.selected.size > 0) && FlowState.paused_here(this.id)) {
                            options.unshift(
                                {
                                    content: (this.selected.size>1) ? "Progress selected images" : "Progress selected image",
                                    callback: () => { send_message(this.widgets[0].value, [...this.selected]);  }
                                },
                            )
                        }
                        if ((this.selected.size > 0) && FlowState.idle()) {
                            options.unshift(
                                {
                                    content: (this.selected.size>1) ? "Progress selected images (as restart)" : "Progress selected image (as restart)",
                                    callback: () => { restart_from_here(this.id).then(() => {send_message(this.widgets[0].value, [...this.selected])});  }
                                },
                            )
                        }
                        options.unshift(null);
                    }
                    options.unshift(
                        {
                            content: "Cancel this run",
                            callback: () => { send_cancel(); }
                        },
                        null,
                    );
                }
            }
        }
    },
});

