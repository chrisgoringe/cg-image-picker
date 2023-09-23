import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

app.registerExtension({
	name: "cg.custom.image_chooser",
    async nodeCreated(node) {
        if (node?.comfyClass === "Image Chooser") {
            const pk_widget = node.addWidget("combo", "image", 1, () => {}, { values: [1,2,3,4,5,6,7,8] });
            const go_widget = node.addWidget("button", "go", "", (w) => {
                const body = new FormData();
                body.append('id', w.id);
                body.append('selection',w.options.pk.value);
                api.fetchApi("/image_selection", {
                    method: "POST",
                    body,
                });
            }, {'pk':pk_widget, 'id':node.id});
            go_widget.serialize = false;
            pk_widget.serialize = false;        }
    }
});

