from server import PromptServer
from nodes import PreviewImage
from comfy.model_management import InterruptProcessingException

from .image_chooser_server import MessageHolder, Cancelled
import torch

class PreviewAndChoose(PreviewImage):
    RETURN_TYPES = ("IMAGE","LATENT",)
    RETURN_NAMES = ("images","latent",)
    FUNCTION = "func"
    CATEGORY = "image_chooser"
    INPUT_IS_LIST=True
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "mode" : (["Always pause", "Only pause if batch", "Progress first pick", "Pass through", "Take First n", "Take Last n"],{}),
				"count": ("INT", { "default": 1, "min": 1, "max": 999, "step": 1 }),
            },
            "optional": {"images": ("IMAGE", ), "latents": ("LATENT", ), },
            "hidden": {"prompt": "PROMPT", "extra_pnginfo": "EXTRA_PNGINFO", "id":"UNIQUE_ID"},
        }

    def IS_CHANGED(self, **kwargs):
        return float('nan')

    def func(self, id, **kwargs):
        # mode doesn't exist in subclass
        self.count = int(kwargs.pop('count', [1,])[0])
        mode = kwargs.pop('mode',["Always pause",])[0]
        id = id[0]
        if id not in MessageHolder.stash:
            MessageHolder.stash[id] = {}
        my_stash = MessageHolder.stash[id]

        # enable stashing. If images is None, we are operating in read-from-stash mode
        if 'images' in kwargs:
            my_stash['images']  = kwargs['images']
            my_stash['latents'] = kwargs.get('latents', None)
        else:
            kwargs['images']  = my_stash.get('images', None)
            kwargs['latents'] = my_stash.get('latents', None)
            
        if (kwargs['images'] is None):
            return (None, None,)
        
        # convert list to batch
        images_in         = torch.cat(kwargs.pop('images'))
        latents_in        = kwargs.pop('latents', None)
        latent_samples_in = torch.cat(list(l['samples'] for l in latents_in)) if latents_in is not None else None
        self.batch        = images_in.shape[0]

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
        
        return self.batch_up_selections(images_in, latent_samples_in, selections, mode)

    def tensor_bundle(self, tensor_in:torch.Tensor, picks):
        return torch.cat(tuple([tensor_in[(x)%self.batch].unsqueeze_(0) for x in picks])).reshape([-1]+list(tensor_in.shape[1:]))
    
    def latent_bundle(self, latent_samples_in:torch.Tensor, picks):
        if (latent_samples_in is not None and len(picks)):
            return { "samples" : self.tensor_bundle(latent_samples_in, picks) }
        else:
            return None
    
    def batch_up_selections(self, images_in:torch.Tensor, latent_samples_in:torch.Tensor, selections, mode):
        if (mode=="Pass through"):
            return (self.tensor_bundle(images_in, range(0, self.batch)), self.latent_bundle(latent_samples_in, range(0, self.batch)),)
        elif (mode=="Take First n"):
            end = self.count if self.batch >= self.count else self.batch
            return (self.tensor_bundle(images_in, range(0, end)), self.latent_bundle(latent_samples_in, range(0, end)),)
        elif (mode=="Take Last n"):
            start = self.batch - self.count if self.batch - self.count >= 0 else 0
            return (self.tensor_bundle(images_in, range(start, self.batch)), self.latent_bundle(latent_samples_in, range(start, self.batch)),)
        good = [x for x in selections if x>=0]
        images_out = self.tensor_bundle(images_in, good)
        latents_out = self.latent_bundle(latent_samples_in, good)
        return (images_out, latents_out,)
    
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

    def batch_up_selections(self, images_in, latent_samples_in, selections:list, mode):
        divider = selections.index(-1)
        latents_out_good = self.latent_bundle(latent_samples_in, selections[:divider])
        latents_out_bad = self.latent_bundle(latent_samples_in, selections[divider+1:])
        return (latents_out_good, latents_out_bad,)