import { app } from "../../../scripts/app.js";

function display_preview_images(event) {
    const node = app.graph._nodes_by_id[event.detail.id];
    if (node) {
        node.selected = new Set();
        node.anti_selected = new Set();
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

function drawRect(node, s, ctx) {
    const padding = 8;
    var rect;
    if (node.imageRects) {
        rect = node.imageRects[s];
    } else {
        const y = node.imagey;
        rect = [padding,y+padding,node.size[0]-2*padding,node.size[1]-y-2*padding];
    }
    ctx.strokeRect(rect[0]+padding, rect[1]+padding, rect[2]-padding*2, rect[3]-padding*2);
}

function additionalDrawBackground(node, ctx) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#8F8";
    node?.selected?.forEach((s) => { drawRect(node,s, ctx) })
    ctx.strokeStyle = "#F88";
    node?.anti_selected?.forEach((s) => { drawRect(node,s, ctx) })
}

function click_is_in_image(node, pos) {
    if (node.imgs?.length>1) {
        for (var i = 0; i<node.imageRects.length; i++) {
            const dx = pos[0] - node.imageRects[i][0];
            const dy = pos[1] - node.imageRects[i][1];
            if ( dx > 0 && dx < node.imageRects[i][2] &&
                dy > 0 && dy < node.imageRects[i][3] ) {
                    return i;
                }
        }
    } else if (node.imgs?.length==1) {
        if (pos[1]>node.imagey) return 0;
    }
    return -1;
}

export { display_preview_images, additionalDrawBackground, click_is_in_image }