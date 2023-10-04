import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";
import { $el } from "../../../scripts/ui.js";

function send_message(id, message) {
    const body = new FormData();
    body.append('message',message);
    body.append('id', id);
    api.fetchApi("/image_chooser_message", { method: "POST", body, });
}

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
                send_message(-1,'__cancel__');
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

app.registerExtension({
	name: "cg.custom.image_chooser",
    setup() {
        const draw = LGraphCanvas.prototype.draw;
        LGraphCanvas.prototype.draw = function() {
            hovering_cancel.setVisible(app.runningNodeId && node_is_chooser(app.graph._nodes_by_id[app.runningNodeId.toString()]));
            draw.apply(this,arguments);
        }
    },
    async nodeCreated(node) {
        if (node?.comfyClass === "Image Chooser" || node?.comfyClass === "Latent Chooser" ) {
            const clone = node.clone;
            node.clone = function () {
                var cloned = clone.apply(node);
                cloned.widgets[0].value = Math.floor(Math.random() * 10000000);
                return cloned;
            }
            node.widgets[0].value = Math.floor(Math.random() * 10000000);
            const pk_widget = node.addWidget("combo", "choice", 1, () => {}, { values: [1,2,3,4,5,6,7,8] });
            const go_widget = node.addWidget("button", "go", "", (w) => {
                if (app.runningNodeId===node.id.toString()) {
                    send_message(node.widgets[0].value, node.widgets[1].value);
                }
            });
            const cancel_widget = node.addWidget("button", "cancel", "", (w) => {
                if (app.runningNodeId===node.id.toString()) {
                    document.getElementById("autoQueueCheckbox").checked = false;
                    api.interrupt();  
                    send_message(node.widgets[0].value, '__cancel__');
                }
            });
            go_widget.serialize = false;
            pk_widget.serialize = false;  
            cancel_widget.serialize = false;
        }
        if (node?.comfyClass === "Multi Latent Chooser") {
            const clone = node.clone;
            node.clone = function () {
                var cloned = clone.apply(node);
                cloned.widgets[0].value = Math.floor(Math.random() * 10000000);
                return cloned;
            }
            node.widgets[0].value = Math.floor(Math.random() * 10000000);
            const go_widget = node.addWidget("button", "go", "", (w) => {
                if (app.runningNodeId===node.id.toString()) {
                    send_message(node.widgets[0].value, JSON.stringify(
                        {
                            positive : node.widgets[1].value,
                            negative : node.widgets[2].value,
                            mode     : node.widgets[3].value,
                        }
                    ))
                }
            });
            const cancel_widget = node.addWidget("button", "cancel", "", (w) => {
                if (app.runningNodeId===node.id.toString()) {
                    document.getElementById("autoQueueCheckbox").checked = false;
                    api.interrupt(); 
                    send_message(node.widgets[0].value, '__cancel__');        
                }
            });
            go_widget.serialize = false;
            cancel_widget.serialize = false;
        }
    }
});

