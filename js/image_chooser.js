import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

function send_message(id, message) {
    const body = new FormData();
    body.append('message',message);
    body.append('id', id);
    api.fetchApi("/image_chooser_message", { method: "POST", body, });
}

app.registerExtension({
	name: "cg.custom.image_chooser",
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

