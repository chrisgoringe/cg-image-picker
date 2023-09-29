import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

app.registerExtension({
	name: "cg.custom.image_chooser",
    async nodeCreated(node) {
        if (node?.comfyClass === "Image Chooser" || node?.comfyClass === "Latent Chooser" ) {
            node.widgets[0].value = Math.floor(Math.random() * 1000000);
            const pk_widget = node.addWidget("combo", "choice", 1, () => {}, { values: [1,2,3,4,5,6,7,8] });
            const go_widget = node.addWidget("button", "go", "", (w) => {
                const body = new FormData();
                body.append('selection',w.options.pk.value);
                if (node.widgets_values) {
                    body.append('id', node.widgets_values[0]);
                } else {
                    body.append('id', node.widgets[0].value);
                }
                api.fetchApi("/image_selection", { method: "POST", body, });
            }, {'pk':pk_widget});
            const cancel_widget = node.addWidget("button", "cancel", "", (w) => {
                document.getElementById("autoQueueCheckbox").checked = false;
                const body = new FormData();
                body.append('selection',w.options.pk.value);
                if (node.widgets_values) {
                    body.append('id', node.widgets_values[0]);
                } else {
                    body.append('id', node.widgets[0].value);
                }
                api.fetchApi("/image_selection", { method: "POST", body, });
                api.interrupt();                 
            });
            go_widget.serialize = false;
            pk_widget.serialize = false;  
            cancel_widget.serialize = false;
        }
    }
});

