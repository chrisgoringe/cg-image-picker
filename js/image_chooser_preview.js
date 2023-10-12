import { app } from "../../../scripts/app.js";

function display_preview_images(event) {
    const node = app.graph._nodes.find((node)=>{
        const match = node?.widgets?.find((w)=>{return  (w?.name==='id' && w?._value===event.detail.id);})
        if (match) return true;
        return false;
    });
    if (node) {
        node.selected = new Set();
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

function additionalDrawBackground(node, ctx) {
    node?.selected?.forEach((s) => {
        if (node.imageRects) {
            const rect = node.imageRects[s];
            const padding = 8;
            ctx.strokeStyle = "#8F8";
            ctx.lineWidth = 1;
            ctx.strokeRect(rect[0]+padding, rect[1]+padding, rect[2]-padding*2, rect[3]-padding*2);
        } 
    })
}

export { display_preview_images, additionalDrawBackground }