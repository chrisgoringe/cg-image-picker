from server import PromptServer
from nodes import PreviewImage

from .image_chooser_server import MessageHolder, Cancelled
import torch

class PreviewAndChoose(PreviewImage):
    RETURN_TYPES = ("IMAGE","LATENT",)
    RETURN_NAMES = ("images","latent",)
    FUNCTION = "func"
    CATEGORY = "utilities/control/_testing"
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "id" : ("LABEL", {"value":"__random__", "hidden":True}), 
                "mode" : (["Always pause", "Only pause if batch"],{}), 
                
            },
            "optional": {"images": ("IMAGE", ), "latents": ("LATENT", ), },
            "hidden": {"prompt": "PROMPT", "extra_pnginfo": "EXTRA_PNGINFO"},
        }

    def __init__(self):
        self.stashed = {}
        super().__init__()

    def IS_CHANGED(self, **kwargs):
        return float('nan')

    def func(self, **kwargs):
        # enable stashing. If images is None, we are operating in read-from-stash mode
        if 'images' in kwargs:
            self.stashed['images']  = kwargs['images']
            self.stashed['latents'] = kwargs['latents'] if 'latents' in kwargs else None
        else:
            kwargs['images']  = self.stashed['images']
            kwargs['latents'] = self.stashed['latents']

        # extract from inputs
        latent_samples_in = kwargs.pop("latents")['samples'] if 'latents' in kwargs else None
        images_in         = kwargs['images']
        batch             = images_in.shape[0]
        id                = kwargs.pop("id")
        mode              = kwargs.pop("mode")

        # call PreviewImage base
        ret = self.save_images(**kwargs)

        # send the images to view
        PromptServer.instance.send_sync("early-image-handler", {"id": id, "urls":ret['ui']['images']})

        # wait for selection
        try:
            selections = MessageHolder.waitForMessage(id, asList=True) if (mode=="Always pause" or batch>1) else [1]
        except Cancelled:
            return (None, None,)

        # batch up the output
        images_out = torch.cat(tuple([images_in[(x-1)%batch].unsqueeze_(0) for x in selections]))
        if len(images_out.shape)==3:
            images_out.unsqueeze_(0)
        if latent_samples_in is not None:
            latent_samples_out = torch.cat(tuple([latent_samples_in[(x-1)%batch].unsqueeze_(0) for x in selections]))
            if len(latent_samples_out.shape)==3:
                latent_samples_out.unsqueeze_(0)
            latents_out = { "samples" : latent_samples_out }
        else:
            latents_out = None

        return (images_out, latents_out,)