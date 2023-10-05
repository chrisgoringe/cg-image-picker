import { app } from "../../../scripts/app.js";

/*
p.workflow.links has form [id, upnode, upnode_outlink, downnode, downnode_inlink, type]
*/
function links_with(p, node_id, include_up=true) {
    const links_with = [];
    p.workflow.links.forEach((l) => {
        if (l[1]===node_id && !links_with.includes(l[3])) links_with.push(l[3])
        if (include_up && l[3]===node_id && !links_with.includes(l[1])) links_with.push(l[1])
    });
    return links_with;
}

async function restart_from_here(here_id) {
    const p = structuredClone(await app.graphToPrompt());
    const keep = [here_id];
    const to_process = links_with(p, here_id, false);
    while(to_process.length>0) {
        const id = to_process.pop();
        keep.push(id);
        to_process.push( 
            links_with(p,id).filter((nid)=>{
                return !(keep.includes(nid) || to_process.includes(nid))
            }) 
        )
    }
    console.log(keep);
}

export { restart_from_here }