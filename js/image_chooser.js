import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

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
                    const body = new FormData();
                    body.append('selection',w.options.pk.value);
                    body.append('id', node.widgets[0].value);
                    //node.widgets[0].value = Math.floor(Math.random() * 10000000);
                    api.fetchApi("/image_selection", { method: "POST", body, });
                }
            }, {'pk':pk_widget});
            const cancel_widget = node.addWidget("button", "cancel", "", (w) => {
                if (app.runningNodeId===node.id.toString()) {
                    document.getElementById("autoQueueCheckbox").checked = false;
                    const body = new FormData();
                    body.append('selection',0);
                    body.append('id', node.widgets[0].value);
                    //node.widgets[0].value = Math.floor(Math.random() * 10000000);
                    api.fetchApi("/image_selection", { method: "POST", body, });
                    api.interrupt();                 
                }
            });
            go_widget.serialize = false;
            pk_widget.serialize = false;  
            cancel_widget.serialize = false;
        }
    }
});

