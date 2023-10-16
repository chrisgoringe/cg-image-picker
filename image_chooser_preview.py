from server import PromptServer
from nodes import PreviewImage

from .image_chooser_server import MessageHolder, Cancelled
import torch

class PreviewAndChoose(PreviewImage):
    RETURN_TYPES = ("IMAGE","LATENT",)
    RETURN_NAMES = ("images","latent",)
    FUNCTION = "func"
    CATEGORY = "image_chooser"
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                #"id" : ("LABEL", {"value":"__random__", "hidden":True}), 
                "mode" : (["Always pause", "Only pause if batch"],{}), 
                
            },
            "optional": {"images": ("IMAGE", ), "latents": ("LATENT", ), },
            "hidden": {"prompt": "PROMPT", "extra_pnginfo": "EXTRA_PNGINFO", "id":"UNIQUE_ID"},
        }

    def IS_CHANGED(self, **kwargs):
        return float('nan')

    def func(self, **kwargs):
        id = kwargs.pop("id")
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

        # extract from inputs
        latent_in         = kwargs.pop('latents', None)
        latent_samples_in = latent_in.get('samples',None) if latent_in else None
        images_in         = kwargs['images']
        self.batch        = images_in.shape[0]
        mode              = kwargs.pop("mode", "Always pause")

        # call PreviewImage base
        ret = self.save_images(**kwargs)

        # send the images to view
        PromptServer.instance.send_sync("early-image-handler", {"id": id, "urls":ret['ui']['images']})

        # wait for selection
        try:
            selections = MessageHolder.waitForMessage(id, asList=True) if (mode=="Always pause" or self.batch>1) else [0]
        except Cancelled:
            return (None, None,)
        
        return self.batch_up_selections(images_in, latent_samples_in, selections)
    
    def tensor_bundle(self, tensor_in, picks):
        return torch.cat(tuple([tensor_in[(x)%self.batch].unsqueeze_(0) for x in picks])).reshape([-1]+list(tensor_in.shape[1:]))
    
    def latent_bundle(self, latent_samples_in, picks):
        if (latent_samples_in is not None and len(picks)):
            return { "samples" : self.tensor_bundle(latent_samples_in, picks) }
        else:
            return None
    
    def batch_up_selections(self, images_in, latent_samples_in, selections):
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

    def batch_up_selections(self, images_in, latent_samples_in, selections:list):
        divider = selections.index(-1)
        latents_out_good = self.latent_bundle(latent_samples_in, selections[:divider])
        latents_out_bad = self.latent_bundle(latent_samples_in, selections[divider+1:])
        return (latents_out_good, latents_out_bad,)