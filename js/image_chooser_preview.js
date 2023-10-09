import { app } from "../../../scripts/app.js";

function display_preview_images(event) {
    const node = app.graph._nodes.find((node)=>{
        const match = node?.widgets?.find((w)=>{return  (w?.name==='id' && w?._value===event.detail.id);})
        if (match) return true;
        return false;
    });
    if (node) {
        showImages(node, event.detail.urls);
    } else {
        console.log(`Image Chooser Preview - failed to find ${event.detail.id}`)
    }
}

function showImages(node, urls) {
    node.imgs = [];
    urls.forEach((u)=> {
        const img = new Image();
        node.imgs.push(img);
        img.onload = () => { app.graph.setDirtyCanvas(true); };
        img.src = `/view?filename=${encodeURIComponent(u.filename)}&type=temp&subfolder=${app.getPreviewFormatParam()}`
    })
    node.setSizeForImage?.();
}

export { display_preview_images }