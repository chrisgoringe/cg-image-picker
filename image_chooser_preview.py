from server import PromptServer
from nodes import PreviewImage
from comfy.model_management import InterruptProcessingException

from .image_chooser_server import MessageHolder, Cancelled
import torch
import random

class PreviewAndChoose(PreviewImage):
    RETURN_TYPES = ("IMAGE","LATENT","MASK","STRING","SEGS")
    RETURN_NAMES = ("images","latents","masks","selected","segs")
    FUNCTION = "func"
    CATEGORY = "image_chooser"
    INPUT_IS_LIST=True
    OUTPUT_NODE = False
    last_ic = {}
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "mode" : (["Always pause", "Repeat last selection", "Only pause if batch", "Progress first pick", "Pass through", "Take First n", "Take Last n"],{}),
				"count": ("INT", { "default": 1, "min": 1, "max": 999, "step": 1 }),
            },
            "optional": {"images": ("IMAGE", ), "latents": ("LATENT", ), "masks": ("MASK", ), "segs":("SEGS", ) },
            "hidden": {"prompt": "PROMPT", "extra_pnginfo": "EXTRA_PNGINFO", "id":"UNIQUE_ID"},
        }

    @classmethod
    def IS_CHANGED(cls, id, **kwargs):
        mode = kwargs.get("mode",["Always pause"])
        if (mode[0]!="Repeat last selection" or not id[0] in cls.last_ic): cls.last_ic[id[0]] = random.random()
        return cls.last_ic[id[0]]

    def func(self, id, **kwargs):
        # mode doesn't exist in subclass
        self.count = int(kwargs.pop('count', [1,])[0])
        mode = kwargs.pop('mode',["Always pause",])[0]
        if mode=="Repeat last selection":
            print("Here despite 'Repeat last selection' - treat as 'Always pause'")
            mode = "Always pause"
        if mode=="Always pause":
            # pretend it was Repeat last so that the prompt matches if that is selected next time.
            # UGH
            kwargs['prompt'][0][id[0]]['inputs']['mode'] = "Repeat last selection"
        id = id[0]
        if id not in MessageHolder.stash:
            MessageHolder.stash[id] = {}
        my_stash = MessageHolder.stash[id]

        DOING_SEGS = 'segs' in kwargs

        # enable stashing. If images is None, we are operating in read-from-stash mode
        if 'images' in kwargs:
            my_stash['images']  = kwargs['images']
            my_stash['latents'] = kwargs.get('latents', None)
            my_stash['masks']   = kwargs.get('masks', None)
        else:
            kwargs['images']  = my_stash.get('images', None)
            kwargs['latents'] = my_stash.get('latents', None)
            kwargs['masks']   = my_stash.get('masks', None)
            
        if (kwargs['images'] is None):
            return (None, None, None, "")
        
        # convert list to batch
        images_in         = torch.cat(kwargs.pop('images')) if not DOING_SEGS else list(i[0,...] for i in kwargs.pop('images'))
        latents_in        = kwargs.pop('latents', None)
        masks_in          = torch.cat(kwargs.get('masks')) if kwargs.get('masks', None) is not None else None
        segs_in           = kwargs.pop('segs', None)
        kwargs.pop('masks', None)
        latent_samples_in = torch.cat(list(l['samples'] for l in latents_in)) if latents_in is not None else None
        self.batch        = images_in.shape[0] if not DOING_SEGS else len(images_in)

        # any other parameters shouldn't be lists any more...
        for x in kwargs: kwargs[x] = kwargs[x][0]
 
        # call PreviewImage base
        ret = self.save_images(images=images_in, **kwargs)

        # send the images to view
        PromptServer.instance.send_sync("early-image-handler", {"id": id, "urls":ret['ui']['images']})

        # wait for selection
        try:
            is_block_condition = (mode == "Always pause" or mode == "Progress first pick" or self.batch > 1)
            is_blocking_mode = (mode not in ["Pass through", "Take First n", "Take Last n"])
            selections = MessageHolder.waitForMessage(id, asList=True) if (is_blocking_mode and is_block_condition) else [0]
        except Cancelled:
            raise InterruptProcessingException()
            #return (None, None,)
        
        if DOING_SEGS: 
            segs_out = (segs_in[0][0], list(segs_in[0][1][i] for i in selections if i>=0) )
            return(None, None, None, None, segs_out)
        
        return self.batch_up_selections(images_in=images_in, latent_samples_in=latent_samples_in, masks_in=masks_in, selections=selections, mode=mode)

    def tensor_bundle(self, tensor_in:torch.Tensor, picks):
        if tensor_in is not None and len(picks):
            batch = tensor_in.shape[0]
            return torch.cat(tuple([tensor_in[(x)%batch].unsqueeze_(0) for x in picks])).reshape([-1]+list(tensor_in.shape[1:]))
        else:
            return None
    
    def latent_bundle(self, latent_samples_in:torch.Tensor, picks):
        if (latent_samples_in is not None and len(picks)):
            return { "samples" : self.tensor_bundle(latent_samples_in, picks) }
        else:
            return None
    
    def batch_up_selections(self, images_in:torch.Tensor, latent_samples_in:torch.Tensor, masks_in:torch.Tensor, selections, mode):
        if (mode=="Pass through"):
            chosen = range(0, self.batch)
        elif (mode=="Take First n"):
            end = self.count if self.batch >= self.count else self.batch
            chosen = range(0, end)
        elif (mode=="Take Last n"):
            start = self.batch - self.count if self.batch - self.count >= 0 else 0
            chosen = range(start, self.batch)
        else:
            chosen = [x for x in selections if x>=0]

        return (self.tensor_bundle(images_in, chosen), self.latent_bundle(latent_samples_in, chosen), self.tensor_bundle(masks_in, chosen), ",".join(str(x) for x in chosen), None, )
    
class SimpleChooser(PreviewAndChoose):
    RETURN_TYPES = ("IMAGE","LATENT",)
    RETURN_NAMES = ("images","latents",)
    FUNCTION = "func"
    CATEGORY = "image_chooser"
    INPUT_IS_LIST=True
    OUTPUT_NODE = False
    last_ic = {}
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": { "images": ("IMAGE", ),   },
            "optional": { "latents": ("LATENT", ), },
            "hidden": {"prompt": "PROMPT", "extra_pnginfo": "EXTRA_PNGINFO", "id":"UNIQUE_ID"},
        }

    def func(self, **kwargs):
        return super().func(**kwargs)[0:2]


class PreviewAndChooseDouble(PreviewAndChoose):
    RETURN_TYPES = ("LATENT","LATENT",)
    RETURN_NAMES = ("positive","negative",)
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "images": ("IMAGE", ), 
                "latents": ("LATENT", ),
            },
            "hidden": {"prompt": "PROMPT", "extra_pnginfo": "EXTRA_PNGINFO", "id":"UNIQUE_ID"},
        } 

    def batch_up_selections(self, images_in, latent_samples_in, masks_in, selections:list, mode):
        divider = selections.index(-1)
        latents_out_good = self.latent_bundle(latent_samples_in, selections[:divider])
        latents_out_bad = self.latent_bundle(latent_samples_in, selections[divider+1:])
        return (latents_out_good, latents_out_bad,)